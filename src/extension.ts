// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { getModelResponseText } from './callModel';
import { getCurrentContext } from './document';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	vscode.window.showInformationMessage('worldspider is active');

	console.log('Congratulations, your extension "worldspider" is now active!');

	let modelSuggestions: any[] = [];

	let registerCompletionItemsProvider = vscode.languages.registerCompletionItemProvider(
		'*', 
		{
				provideCompletionItems(document, position, token, context) {
						const completionItems = modelSuggestions.map((text, i) => {
								const completionItem = new vscode.CompletionItem(text);
								completionItem.insertText = text;
								completionItem.keepWhitespace = true;
								completionItem.documentation = text;
								completionItem.range = new vscode.Range(position, position); // to prevent trying to overwrite the previous word
								return completionItem;
						});
						return completionItems;
				}
		}
	);//, ...triggers);

	let showCompletions = vscode.commands.registerCommand('worldspider.showCompletions', () => {
			vscode.commands.executeCommand('editor.action.triggerSuggest');
	});

	async function handleGetModelCompletions(infill: boolean = false) {
		const { prefix, suffix } = getCurrentContext();
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Generating...'
		}, async (progress) => {
			progress.report({ increment: 0 });
			const responseTextArray = await getModelResponseText(prefix, suffix, infill);
			progress.report({ increment: 100 });
			modelSuggestions = responseTextArray;
			vscode.commands.executeCommand('editor.action.triggerSuggest');	
		});
	}

	let getModelCompletions = vscode.commands.registerCommand('worldspider.getModelCompletions', () => {
		handleGetModelCompletions(false);
	});

	let getModelInfillCompletions = vscode.commands.registerCommand('worldspider.getModelInfillCompletions', () => {
		handleGetModelCompletions(true);
	});

	context.subscriptions.push(registerCompletionItemsProvider);
	context.subscriptions.push(showCompletions);
	context.subscriptions.push(getModelCompletions);
	context.subscriptions.push(getModelInfillCompletions);

}

// This method is called when your extension is deactivated
export function deactivate() {}
