import * as vscode from 'vscode';

export class InlinePracticeController implements vscode.Disposable {
	private disposables: vscode.Disposable[] = [];
	private decorationType: vscode.TextEditorDecorationType;
	private correctDecorationType: vscode.TextEditorDecorationType;
	private incorrectDecorationType: vscode.TextEditorDecorationType;
	private currentDecorationType: vscode.TextEditorDecorationType;
	private statusBarItem: vscode.StatusBarItem;
	private isActive = false;
	private words: string[] = [];
	private currentWordIndex = 0;
	private typedText = '';
	private startTime: number | null = null;
	private totalTyped = 0;
	private totalErrors = 0;
	private practiceRange: vscode.Range | null = null;
	private originalContent: string = '';

	private readonly level1Words = [
		'rest', 'nest', 'test', 'sent', 'rent', 'tens', 'nets', 'tans', 'ants',
		'seat', 'sear', 'near', 'neat', 'tear', 'rate', 'sate', 'nears', 'tears',
		'rotate', 'senate', 'eason', 'train', 'strain', 'retain', 'attire',
		'nose', 'rose', 'stone', 'tones', 'noter', 'snore', 'store', 'aeons',
		'irons', 'inter', 'insert', 'senior', 'rinse', 'resin', 'siren',
		'inert', 'sitter', 'trite', 'onset', 'notes', 'arsons', 'reason',
		'treason', 'senator', 'senorita', 'instate', 'satire', 'attain',
		'air', 'are', 'art', 'ate', 'ear', 'eat', 'era', 'ion', 'ire', 'its',
		'net', 'nit', 'not', 'oar', 'oat', 'one', 'ore', 'ran', 'rat', 'reo',
		'roe', 'rot', 'sat', 'sea', 'set', 'sin', 'sir', 'sit', 'son', 'sot',
		'tan', 'tar', 'tea', 'ten', 'tie', 'tin', 'toe', 'ton', 'eon'
	];

	constructor() {
		// Create decoration types
		this.decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.wordHighlightBackground'),
			border: '1px solid',
			borderColor: new vscode.ThemeColor('editorInfo.border')
		});

		this.correctDecorationType = vscode.window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('terminal.ansiGreen')
		});

		this.incorrectDecorationType = vscode.window.createTextEditorDecorationType({
			color: new vscode.ThemeColor('terminal.ansiRed'),
			backgroundColor: new vscode.ThemeColor('inputValidation.errorBackground')
		});

		this.currentDecorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
            borderWidth: '0 0 2px 0',
            borderStyle: 'solid',
			borderColor: new vscode.ThemeColor('focusBorder')
		});

		// Create status bar item
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.disposables.push(this.statusBarItem);

		// Listen to text document changes
		this.disposables.push(
			vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this)
		);

		// Listen to editor changes
		this.disposables.push(
			vscode.window.onDidChangeActiveTextEditor(() => {
				if (this.isActive) {
					this.cancel();
				}
			})
		);
	}

	public async startPractice() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}

		if (this.isActive) {
			this.cancel();
			return;
		}

		// Get word count from user
		const wordCount = await vscode.window.showQuickPick(
			['10', '20', '30', '50', '100'],
			{ placeHolder: 'Select number of words to practice' }
		);

		if (!wordCount) {
			return;
		}

		this.isActive = true;
		this.words = this.generateWords(parseInt(wordCount));
		this.currentWordIndex = 0;
		this.typedText = '';
		this.startTime = null;
		this.totalTyped = 0;
		this.totalErrors = 0;

		const position = editor.selection.active;
		const wordsText = this.words.join(' ');

		// Store original content
		this.originalContent = '';

		// Insert practice words with comment marker
		await editor.edit(editBuilder => {
			editBuilder.insert(position, `// Colemak Practice: Type the words below (Press ESC to cancel)\n// ${wordsText}\n`);
		});

		// Calculate range for the practice area
		const startLine = position.line;
		const endLine = position.line + 1;
		this.practiceRange = new vscode.Range(
			new vscode.Position(startLine, 0),
			new vscode.Position(endLine, wordsText.length + 3)
		);

		// Set decoration
		editor.setDecorations(this.decorationType, [this.practiceRange]);

		// Update status bar
		this.updateStatusBar();

		// Show instructions
		vscode.window.showInformationMessage(
			'Colemak Practice started! Type the words. Press SPACE for next word, ESC to cancel.',
			'Cancel'
		).then(selection => {
			if (selection === 'Cancel') {
				this.cancel();
			}
		});
	}

	private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
		if (!this.isActive || event.contentChanges.length === 0) {
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (!editor || event.document !== editor.document) {
			return;
		}

		// Check for ESC key (document won't change, but we handle in key handler)
		// Handle typing
		for (const change of event.contentChanges) {
			const text = change.text;

			// Start timer on first input
			if (!this.startTime && text.length > 0) {
				this.startTime = Date.now();
			}

			// Handle space key - move to next word
			if (text === ' ') {
				this.moveToNextWord(editor);
				return;
			}

			// Handle backspace
			if (text === '' && change.rangeLength > 0) {
				this.typedText = this.typedText.slice(0, -1);
				this.updateDecorations(editor);
				this.updateStatusBar();
				return;
			}

			// Handle regular typing
			if (text.length === 1 && text !== '\n') {
				this.typedText += text;
				const currentWord = this.words[this.currentWordIndex];
				const expectedChar = currentWord[this.typedText.length - 1];

				this.totalTyped++;
				if (text !== expectedChar) {
					this.totalErrors++;
				}

				this.updateDecorations(editor);
				this.updateStatusBar();
			}
		}
	}

	private moveToNextWord(editor: vscode.TextEditor) {
		if (this.typedText.length > 0) {
			this.currentWordIndex++;
			this.typedText = '';

			this.updateDecorations(editor);
			this.updateStatusBar();

			// Check if practice is complete
			if (this.currentWordIndex >= this.words.length) {
				this.complete();
			}
		}
	}

	private updateDecorations(editor: vscode.TextEditor) {
		if (!this.practiceRange) {
			return;
		}

		const correctRanges: vscode.Range[] = [];
		const incorrectRanges: vscode.Range[] = [];
		const currentRanges: vscode.Range[] = [];

		const line = this.practiceRange.start.line + 1;
		let charOffset = 3; // "// " prefix

		const currentWord = this.words[this.currentWordIndex];
		const allWords = this.words.join(' ');

		// Calculate positions for completed words
		for (let i = 0; i < this.currentWordIndex; i++) {
			const word = this.words[i];
			const range = new vscode.Range(
				new vscode.Position(line, charOffset),
				new vscode.Position(line, charOffset + word.length)
			);
			correctRanges.push(range);
			charOffset += word.length + 1; // +1 for space
		}

		// Calculate positions for current word being typed
		for (let i = 0; i < this.typedText.length; i++) {
			const char = this.typedText[i];
			const expectedChar = currentWord[i];
			const range = new vscode.Range(
				new vscode.Position(line, charOffset + i),
				new vscode.Position(line, charOffset + i + 1)
			);

			if (char === expectedChar) {
				correctRanges.push(range);
			} else {
				incorrectRanges.push(range);
			}
		}

		// Highlight current character to type
		if (this.typedText.length < currentWord.length) {
			const range = new vscode.Range(
				new vscode.Position(line, charOffset + this.typedText.length),
				new vscode.Position(line, charOffset + this.typedText.length + 1)
			);
			currentRanges.push(range);
		}

		editor.setDecorations(this.correctDecorationType, correctRanges);
		editor.setDecorations(this.incorrectDecorationType, incorrectRanges);
		editor.setDecorations(this.currentDecorationType, currentRanges);
	}

	private updateStatusBar() {
		const progress = `${this.currentWordIndex}/${this.words.length}`;
		const time = this.startTime 
			? `${Math.floor((Date.now() - this.startTime) / 1000)}s`
			: '0s';
		
		this.statusBarItem.text = `$(keyboard) Colemak Practice: ${progress} | ${time}`;
		this.statusBarItem.show();
	}

	private complete() {
		if (!this.startTime) {
			this.cancel();
			return;
		}

		const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
		const timeInMinutes = (Date.now() - this.startTime) / 60000;
		const wpm = Math.round(this.words.length / timeInMinutes);
		const accuracy = this.totalTyped > 0
			? Math.round(((this.totalTyped - this.totalErrors) / this.totalTyped) * 100)
			: 100;

		vscode.window.showInformationMessage(
			`🎉 Practice Complete! WPM: ${wpm} | Accuracy: ${accuracy}% | Time: ${totalTime}s`
		);

		this.cleanup();
	}

	public cancel() {
		this.cleanup();
		vscode.window.showInformationMessage('Practice cancelled');
	}

	private cleanup() {
		const editor = vscode.window.activeTextEditor;
		if (editor && this.practiceRange) {
			// Remove practice text
			editor.edit(editBuilder => {
				if (this.practiceRange) {
					editBuilder.delete(new vscode.Range(
						this.practiceRange.start,
						new vscode.Position(this.practiceRange.end.line + 1, 0)
					));
				}
			});

			// Clear decorations
			editor.setDecorations(this.decorationType, []);
			editor.setDecorations(this.correctDecorationType, []);
			editor.setDecorations(this.incorrectDecorationType, []);
			editor.setDecorations(this.currentDecorationType, []);
		}

		this.isActive = false;
		this.practiceRange = null;
		this.statusBarItem.hide();
	}

	private generateWords(count: number): string[] {
		const shuffled = [...this.level1Words].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	public dispose() {
		this.cleanup();
		this.disposables.forEach(d => d.dispose());
		this.decorationType.dispose();
		this.correctDecorationType.dispose();
		this.incorrectDecorationType.dispose();
		this.currentDecorationType.dispose();
	}
}
