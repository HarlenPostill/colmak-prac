import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'info':
					vscode.window.showInformationMessage(data.message);
					break;
			}
		});
	}

	public resetPractice() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'reset' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
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
			padding: 20px;
			color: var(--vscode-foreground);
		}

		.container {
			display: flex;
			flex-direction: column;
			gap: 20px;
		}

		.settings {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		label {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}

		select {
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			padding: 6px;
			border-radius: 2px;
			font-size: 13px;
			cursor: pointer;
		}

		.practice-area {
			display: flex;
			flex-direction: column;
			gap: 15px;
			margin-top: 10px;
		}

		.words-display {
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			padding: 15px;
			border-radius: 4px;
			font-family: 'Courier New', monospace;
			font-size: 16px;
			line-height: 1.8;
			min-height: 120px;
			word-wrap: break-word;
		}

		.word {
			display: inline-block;
			margin-right: 8px;
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
			border-bottom: 2px solid var(--vscode-focusBorder);
		}

		.input-area {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		input[type="text"] {
			background-color: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			padding: 10px;
			border-radius: 2px;
			font-size: 14px;
			font-family: 'Courier New', monospace;
		}

		input[type="text"]:focus {
			outline: 1px solid var(--vscode-focusBorder);
			border-color: var(--vscode-focusBorder);
		}

		.stats {
			display: flex;
			justify-content: space-between;
			gap: 10px;
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}

		.stat-item {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.stat-label {
			font-weight: 600;
		}

		.stat-value {
			color: var(--vscode-foreground);
			font-size: 14px;
		}

		.results {
			background-color: var(--vscode-notifications-background);
			border: 1px solid var(--vscode-notifications-border);
			padding: 20px;
			border-radius: 4px;
			text-align: center;
		}

		.results h2 {
			font-size: 18px;
			margin-bottom: 15px;
			color: var(--vscode-terminal-ansiGreen);
		}

		.results-stats {
			display: flex;
			flex-direction: column;
			gap: 12px;
			margin-top: 15px;
		}

		.result-item {
			display: flex;
			justify-content: space-between;
			font-size: 14px;
		}

		button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 10px;
			border-radius: 2px;
			cursor: pointer;
			font-size: 13px;
			margin-top: 10px;
		}

		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}

		.hint {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			font-style: italic;
			margin-top: 5px;
		}

		.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	</style>
</head>
<body>
	<div class="container">
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

		// Level 1 word bank (only uses: a, r, s, t, n, e, i, o)
        const level1Words = [
            "anoestri", "arsonite", "notaries", "notarise", "rosinate", "senorita",
            "anestri", "antsier", "aroints", "atoners", "atonies", "erasion", "instore", "nastier", "norites", "oariest", "oestrin", "orients", "osteria", "otaries", "otarine", "ratines", "rations", "resiant", "retains", "retinas",
            "airest", "antres", "aorist", "ariose", "arisen", "aristo", "aroint", "arseno", "arsine", "arsino", "arties", "artsie", "astern", "astone", "atoner", "atones", "estrin", "inerts", "insert", "instar",
            "aeons", "aeros", "aesir", "airns", "airts", "anise", "antes", "antis", "antre", "arent", "arets", "ariot", "arise", "arose", "arson", "artis", "aster", "astir", "atone", "earns",
            "aeon", "aero", "aine", "ains", "aint", "airn", "airs", "airt", "aits", "anes", "anis", "ante", "anti", "ants", "ares", "aret", "aris", "arse", "arti", "arts",
            "aes", "ain", "air", "ais", "ait", "ane", "ani", "ant", "are", "ars", "art", "ate", "ats", "ean", "ear", "eas", "eat", "ens", "eon", "era",
            "ae", "ai", "an", "ar", "as", "at", "ea", "en", "eo", "er", "es", "et", "in", "io", "is", "it", "na", "ne", "no", "oe"
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
							// Completed word - all correct
							className += ' correct';
						} else if (wordIdx === currentWordIndex) {
							if (letterIdx < typedLetters.length) {
								// Typed letter in current word
								if (typedLetters[letterIdx] === letter) {
									className += ' correct';
								} else {
									className += ' incorrect';
								}
							} else if (letterIdx === typedLetters.length) {
								// Current letter to type
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

		// Input handling
		document.getElementById('typingInput').addEventListener('input', (e) => {
			if (finished) return;

			const input = e.target.value;
			const currentWord = words[currentWordIndex];
			
			startTimer();

			// Update typed letters array
			typedLetters = input.split('');
			currentLetterIndex = typedLetters.length;

			// Count errors
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

		// Keyboard shortcuts
		document.getElementById('typingInput').addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				reset();
				e.preventDefault();
			} else if (e.key === ' ') {
				e.preventDefault();
				
				const input = e.target.value;
				const currentWord = words[currentWordIndex];
				
				// Only move to next word if we've typed at least something
				if (input.length > 0) {
					currentWordIndex++;
					currentLetterIndex = 0;
					typedLetters = [];
					e.target.value = '';
					
					updateProgress();

					// Check if all words are complete
					if (currentWordIndex >= words.length) {
						showResults();
					} else {
						renderWords();
					}
				}
			}
		});

		// Word count change
		document.getElementById('wordCount').addEventListener('change', reset);

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'reset') {
				reset();
			}
		});

		// Initialize
		reset();
	</script>
</body>
</html>`;
	}
}
