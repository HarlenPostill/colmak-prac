import * as vscode from 'vscode';

export class InlineEditorProvider {
	private static currentPanel: vscode.WebviewPanel | undefined;
	private static readonly viewType = 'colmakPractice.inlineEditor';

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it
		if (InlineEditorProvider.currentPanel) {
			InlineEditorProvider.currentPanel.reveal(column);
			return;
		}

		// Otherwise, create a new panel
		const panel = vscode.window.createWebviewPanel(
			InlineEditorProvider.viewType,
			'Colemak Typing Practice',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		InlineEditorProvider.currentPanel = panel;

		panel.webview.html = this._getHtmlForWebview(panel.webview);

		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.type) {
					case 'info':
						vscode.window.showInformationMessage(message.message);
						break;
				}
			}
		);

		panel.onDidDispose(() => {
			InlineEditorProvider.currentPanel = undefined;
		});
	}

	private static _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Colemak Practice</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 100vh;
			padding: 40px 20px;
		}

		.container {
			max-width: 900px;
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 30px;
		}

		.header {
			text-align: center;
		}

		.header h1 {
			font-size: 32px;
			margin-bottom: 10px;
			color: var(--vscode-foreground);
		}

		.header p {
			font-size: 14px;
			color: var(--vscode-descriptionForeground);
		}

		.settings {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 15px;
		}

		label {
			font-size: 14px;
			color: var(--vscode-descriptionForeground);
		}

		select {
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			padding: 8px 12px;
			border-radius: 2px;
			font-size: 14px;
			cursor: pointer;
		}

		.practice-area {
			display: flex;
			flex-direction: column;
			gap: 25px;
		}

		.words-display {
			background-color: var(--vscode-editor-background);
			border: 2px solid var(--vscode-panel-border);
			padding: 30px;
			border-radius: 6px;
			font-family: 'Courier New', monospace;
			font-size: 24px;
			line-height: 2;
			min-height: 200px;
			text-align: center;
		}

		.word {
			display: inline-block;
			margin: 0 12px 10px 0;
		}

		.letter {
			display: inline-block;
		}

		.letter.correct {
			color: var(--vscode-terminal-ansiGreen);
		}

		.letter.incorrect {
			color: var(--vscode-terminal-ansiRed);
			background-color: var(--vscode-inputValidation-errorBackground);
		}

		.letter.current {
			background-color: var(--vscode-editor-findMatchHighlightBackground);
			border-bottom: 3px solid var(--vscode-focusBorder);
		}

		.input-area {
			display: flex;
			flex-direction: column;
			gap: 12px;
			align-items: center;
		}

		input[type="text"] {
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 2px solid var(--vscode-input-border);
			padding: 15px 20px;
			border-radius: 4px;
			font-size: 20px;
			font-family: 'Courier New', monospace;
			width: 100%;
			max-width: 600px;
			text-align: center;
		}

		input[type="text"]:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
			box-shadow: 0 0 0 1px var(--vscode-focusBorder);
		}

		.hint {
			font-size: 13px;
			color: var(--vscode-descriptionForeground);
			font-style: italic;
		}

		.stats {
			display: flex;
			justify-content: center;
			gap: 40px;
			font-size: 14px;
		}

		.stat-item {
			display: flex;
			flex-direction: column;
			gap: 6px;
			align-items: center;
		}

		.stat-label {
			font-weight: 600;
			color: var(--vscode-descriptionForeground);
		}

		.stat-value {
			color: var(--vscode-foreground);
			font-size: 20px;
			font-weight: bold;
		}

		.results {
			background-color: var(--vscode-notifications-background);
			border: 2px solid var(--vscode-notifications-border);
			padding: 40px;
			border-radius: 8px;
			text-align: center;
		}

		.results h2 {
			font-size: 28px;
			margin-bottom: 25px;
			color: var(--vscode-terminal-ansiGreen);
		}

		.results-stats {
			display: flex;
			flex-direction: column;
			gap: 20px;
			margin-top: 25px;
		}

		.result-item {
			display: flex;
			justify-content: space-between;
			font-size: 18px;
			padding: 10px 0;
			border-bottom: 1px solid var(--vscode-panel-border);
		}

		.result-item:last-child {
			border-bottom: none;
		}

		button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 12px 24px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 15px;
			margin-top: 20px;
			font-weight: 600;
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>⌨️ Colemak Typing Practice</h1>
			<p>Level 1: Practice with letters [a, r, s, t, n, e, i, o]</p>
		</div>

		<div class="settings">
			<label for="wordCount">Number of Words:</label>
			<select id="wordCount">
				<option value="10">10 words</option>
				<option value="20">20 words</option>
				<option value="30" selected>30 words</option>
				<option value="50">50 words</option>
				<option value="100">100 words</option>
			</select>
		</div>

		<div class="practice-area" id="practiceArea">
			<div class="words-display" id="wordsDisplay"></div>
			
			<div class="input-area">
				<input 
					type="text" 
					id="typingInput" 
					placeholder="Start typing... (Press SPACE to move to next word)"
					autocomplete="off"
					spellcheck="false"
				/>
				<div class="hint">Press ESC to reset • Press SPACE for next word</div>
			</div>

			<div class="stats">
				<div class="stat-item">
					<span class="stat-label">Progress</span>
					<span class="stat-value" id="progress">0/30</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Time</span>
					<span class="stat-value" id="timer">0s</span>
				</div>
			</div>
		</div>

		<div class="results" id="results" style="display: none;">
			<h2>🎉 Practice Complete!</h2>
			<div class="results-stats">
				<div class="result-item">
					<span>Words Per Minute:</span>
					<strong id="wpm">0</strong>
				</div>
				<div class="result-item">
					<span>Accuracy:</span>
					<strong id="accuracy">100%</strong>
				</div>
				<div class="result-item">
					<span>Total Time:</span>
					<strong id="totalTime">0s</strong>
				</div>
			</div>
			<button onclick="reset()">Practice Again</button>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		const level1Words = [
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

		let words = [];
		let currentWordIndex = 0;
		let currentLetterIndex = 0;
		let startTime = null;
		let timerInterval = null;
		let totalTyped = 0;
		let totalErrors = 0;
		let finished = false;
		let typedLetters = [];

		function generateWords(count) {
			const shuffled = [...level1Words].sort(() => Math.random() - 0.5);
			return shuffled.slice(0, count);
		}

		function renderWords() {
			const display = document.getElementById('wordsDisplay');
			display.innerHTML = words.map((word, wordIdx) => {
				return '<span class="word">' + 
					word.split('').map((letter, letterIdx) => {
						let className = 'letter';
						
						if (wordIdx < currentWordIndex) {
							className += ' correct';
						} else if (wordIdx === currentWordIndex) {
							if (letterIdx < typedLetters.length) {
								if (typedLetters[letterIdx] === letter) {
									className += ' correct';
								} else {
									className += ' incorrect';
								}
							} else if (letterIdx === typedLetters.length) {
								className += ' current';
							}
						}
						
						return \`<span class="\${className}">\${letter}</span>\`;
					}).join('') + 
				'</span>';
			}).join(' ');
		}

		function updateProgress() {
			document.getElementById('progress').textContent = 
				\`\${currentWordIndex}/\${words.length}\`;
		}

		function startTimer() {
			if (!startTime) {
				startTime = Date.now();
				timerInterval = setInterval(() => {
					const elapsed = Math.floor((Date.now() - startTime) / 1000);
					document.getElementById('timer').textContent = \`\${elapsed}s\`;
				}, 1000);
			}
		}

		function stopTimer() {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}

		function calculateWPM() {
			const timeInMinutes = (Date.now() - startTime) / 60000;
			return Math.round(currentWordIndex / timeInMinutes);
		}

		function calculateAccuracy() {
			if (totalTyped === 0) return 100;
			return Math.round(((totalTyped - totalErrors) / totalTyped) * 100);
		}

		function showResults() {
			finished = true;
			stopTimer();
			
			const totalTime = Math.floor((Date.now() - startTime) / 1000);
			const wpm = calculateWPM();
			const accuracy = calculateAccuracy();

			document.getElementById('wpm').textContent = wpm;
			document.getElementById('accuracy').textContent = accuracy + '%';
			document.getElementById('totalTime').textContent = totalTime + 's';
			
			document.getElementById('practiceArea').style.display = 'none';
			document.getElementById('results').style.display = 'block';

			vscode.postMessage({
				type: 'info',
				message: \`Practice complete! WPM: \${wpm}, Accuracy: \${accuracy}%\`
			});
		}

		function reset() {
			finished = false;
			currentWordIndex = 0;
			currentLetterIndex = 0;
			typedLetters = [];
			startTime = null;
			totalTyped = 0;
			totalErrors = 0;
			
			stopTimer();
			
			const wordCount = parseInt(document.getElementById('wordCount').value);
			words = generateWords(wordCount);
			
			document.getElementById('typingInput').value = '';
			document.getElementById('typingInput').disabled = false;
			document.getElementById('timer').textContent = '0s';
			document.getElementById('wordCount').disabled = false;
			
			renderWords();
			updateProgress();
			
			document.getElementById('practiceArea').style.display = 'flex';
			document.getElementById('results').style.display = 'none';
			
			document.getElementById('typingInput').focus();
		}

		document.getElementById('typingInput').addEventListener('input', (e) => {
			if (finished) return;

			const input = e.target.value;
			const currentWord = words[currentWordIndex];
			
			startTimer();

			typedLetters = input.split('');
			currentLetterIndex = typedLetters.length;

			if (typedLetters.length > 0) {
				const lastTypedChar = typedLetters[typedLetters.length - 1];
				const expectedChar = currentWord[typedLetters.length - 1];
				
				totalTyped++;
				if (lastTypedChar !== expectedChar) {
					totalErrors++;
				}
			}

			renderWords();
		});

		document.getElementById('typingInput').addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				reset();
				e.preventDefault();
			} else if (e.key === ' ') {
				e.preventDefault();
				
				const input = e.target.value;
				
				if (input.length > 0) {
					currentWordIndex++;
					currentLetterIndex = 0;
					typedLetters = [];
					e.target.value = '';
					
					updateProgress();

					if (currentWordIndex >= words.length) {
						showResults();
					} else {
						renderWords();
					}
				}
			}
		});

		document.getElementById('wordCount').addEventListener('change', reset);

		window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'reset') {
				reset();
			}
		});

		reset();
	</script>
</body>
</html>`;
	}
}
