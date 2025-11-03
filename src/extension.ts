// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { InlineEditorProvider } from './InlineEditorProvider';
import { InlinePracticeController } from './InlinePracticeController';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "colmak-prac" is now active!');

	const sidebarProvider = new SidebarProvider(context.extensionUri);
	
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'colmakPractice.sidebar',
			sidebarProvider
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('colmak-prac.resetPractice', () => {
			sidebarProvider.resetPractice();
		})
	);

	// Register inline editor command
	context.subscriptions.push(
		vscode.commands.registerCommand('colmak-prac.openInlineEditor', () => {
			InlineEditorProvider.createOrShow(context.extensionUri);
		})
	);

	// Register inline practice command
	const inlineController = new InlinePracticeController();
	context.subscriptions.push(inlineController);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('colmak-prac.startInlinePractice', () => {
			inlineController.startPractice();
		})
	);
}
	
// This method is called when your extension is deactivated
export function deactivate() {}
