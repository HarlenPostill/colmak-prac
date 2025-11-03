# colmak-prac

colmak-prac is a small VS Code extension that helps you practice the Colemak keyboard layout while you code. It provides a sidebar for guided practice and an inline practice mode you can start from an editor.

## Features

- Sidebar "Typing Practice" webview with lessons and progress controls.
- Inline practice mode that opens an editor-like practice area so you can practice without leaving your workspace.
- Commands to start practice and reset progress.
- Optional keybinding to quickly start inline practice: Ctrl+Shift+K (Windows/Linux) or Cmd+Shift+K (macOS).

## Quick Start

- Open the Command Palette (Ctrl/Cmd+Shift+P) and run:
  - "Colemak: Start Inline Practice" to begin an inline session.
  - "Reset Typing Practice" to clear progress.
- Or press the keybinding: Ctrl+Shift+K (Windows/Linux) or Cmd+Shift+K (macOS) when the editor has focus.
- Use the "Colemak Practice" activity bar icon to open the sidebar view for lessons and settings.

## Commands

Provided commands (also listed in package.json):
- `colmak-prac.startInlinePractice` — Start an inline typing practice session.
- `colmak-prac.resetPractice` — Reset the current practice progress.
- `colmak-prac.openInlineEditor` — Open the inline practice editor (used internally / by the extension).

## Requirements

- Visual Studio Code (matching the engine version in package.json).
- No external dependencies are required.

## Extension Settings

This extension does not add configuration settings by default. Future versions may expose lesson/feedback settings.

## Known Issues

- Progress syncing across machines is not supported.
- The extension relies on VS Code webviews for the sidebar; some environments with restricted webviews may affect the UI.

## Release Notes

### 1.0.0
- Initial release: Sidebar practice view + inline practice mode and basic commands.

## Contributing & Issues

- If you find bugs or want to request features, please open an issue in the repository where this extension is hosted.
- Include VS Code version and steps to reproduce when reporting bugs.

Enjoy practicing Colemak!
## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
