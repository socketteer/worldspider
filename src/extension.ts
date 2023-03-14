// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { getModelResponse, ModelResponse, ModelCompletion, LogprobsObject } from './callModel';
import { getCurrentContext, getSelectionInfo } from './document';
import { Tree, TreeNode, WSTreeItem, getAncestry, getAncestryTextArray, getAncestryTextOffsets, createNode, NodeProvider } from './tree';
// import { probToColor } from './utils';

interface InsertedHistoryItem {
	startPosition: number;
	endPosition: number;
	prefix: string;
	echo: boolean;
	modelCompletion: ModelCompletion;
	decoration: vscode.TextEditorDecorationType | undefined;
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	vscode.window.showInformationMessage('worldspider is active');

	console.log('Congratulations, your extension "worldspider" is now active!');

	let wsconsole = vscode.window.createOutputChannel("worldspider");

	let history: ModelResponse[] = [];
	let currentHistoryIndex = 0;
	let insertedHistory: InsertedHistoryItem[] = [];
	// let tree = {
	// 	"root": {
	// 		"text": vscode.window.activeTextEditor?.document.getText(),
	// 		"childrenIds": [],
	// 		"parentId": null,
	// 	}
	// };
	let tree: Tree = {
		"root": {
			"text": vscode.window.activeTextEditor?.document.getText() || "",
			"childrenIds": ["child1"],
			"parentId": null,
		},
		"child1": {
			"text": "child1 text",
			"childrenIds": [],
			"parentId": "root",
		}
	};

	let activeNodeId = "root";

	const nodeProvider = new NodeProvider(tree);

	vscode.window.registerTreeDataProvider('worldtree', nodeProvider);
	const treeView = vscode.window.createTreeView('worldtree', { treeDataProvider: nodeProvider });
	// vscode.commands.registerCommand('worldtree.refresh', () => NodeProvider.refresh());
	vscode.commands.registerCommand('worldtree.createChild', (treeItem: WSTreeItem) => {
		console.log(treeItem.id);
		const text = "new node";
		createNode(treeItem.id, text, tree);
		vscode.window.showInformationMessage(`Created child node ${text} for node ${treeItem.id}`);
		// const newId = createNode(nodeId, text, tree);
		nodeProvider.refresh();
		// wait for tree to update
		setTimeout(() => {
			treeView.reveal(nodeProvider.getTreeItemById(treeItem.id), {select: true, focus: true, expand: true});
		}, 1000);
	});

	// listen to document changes
	vscode.workspace.onDidChangeTextDocument((event) => {
		console.log('onDidChangeTextDocument', event);
		// update tree with new text
		if(event.contentChanges.length > 0) {

		}
	});

	// colors text in the editor in a range
	function colorText(startPosition: number, endPosition: number, color: string) {
		if(!vscode.window.activeTextEditor || !startPosition || !endPosition) {
			return;
		}
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: color,
			// isWholeLine: true,
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});
		const range = new vscode.Range(vscode.window.activeTextEditor.document.positionAt(startPosition), vscode.window.activeTextEditor?.document.positionAt(endPosition));
		
		vscode.window.activeTextEditor.setDecorations(decorationType, [range]);

		return decorationType;
	}

	

	function afterInsertText(position: number, completionIndex: number, text: string) {
		const prompt = history[currentHistoryIndex].prompt;
		const startPosition = history[currentHistoryIndex].echo ? position - prompt.length : position;
		const endPosition = position + text.length;
		const decoration = colorText(startPosition, endPosition, 'rgba(0, 0, 0, 0.3)');
		insertedHistory.push({
			startPosition: startPosition,
			endPosition: endPosition,
			prefix: prompt,
			echo: history[currentHistoryIndex].echo,
			modelCompletion: history[currentHistoryIndex].choices[completionIndex],
			decoration: decoration,
		});
	}

	function removeTextDecoration(decoration: vscode.TextEditorDecorationType | undefined) {
		if(decoration) {
			decoration.dispose();
		}
	}

	// function getDecorationText(decoration: vscode.TextEditorDecorationType | undefined) {
	// 	if(!decoration) {
	// 		return '';
	// 	}
	// 	const decorations = vscode.window.activeTextEditor
	// }

	let afterInsertTextDisposable = vscode.commands.registerCommand('worldspider.afterInsertText', afterInsertText);

	let registerCompletionItemsProvider = vscode.languages.registerCompletionItemProvider(
		'*', 
		{
			provideCompletionItems(document, position, token, context) {
				// console.log(history[currentHistoryIndex]);
				const completionItems = history[currentHistoryIndex].choices.map((response: ModelCompletion) => {
					const text = response.text;
					const completionItem = new vscode.CompletionItem(text);
					completionItem.insertText = text;
					completionItem.keepWhitespace = true;
					completionItem.documentation = text;
					completionItem.range = new vscode.Range(position, position); // to prevent trying to overwrite the previous word
					
					const absolutePosition = document.offsetAt(position);
					// when text is inserted, call afterInsertText
					completionItem.command = {
						command: 'worldspider.afterInsertText',
						title: 'afterInsertText',
						arguments: [absolutePosition, response.index, text]
					};

					return completionItem;
				});
				return completionItems;
			}
		}
	);//, ...triggers);

	let registerHoverProvider = vscode.languages.registerHoverProvider(
		'*',
		{
			provideHover(document, position, token) {
				const absolutePosition = document.offsetAt(position);

				// Take the most recent element of InsertedHistory 
				// where startPosition <= absolutePosition <= endPosition
				const insertedHistoryElement = insertedHistory.filter((element: InsertedHistoryItem) => {
					return element.startPosition <= absolutePosition && element.endPosition >= absolutePosition;
				}).pop();

				if (!insertedHistoryElement) {
					return;
				}

				const modelCompletion = insertedHistoryElement.modelCompletion;
				const logprobs = modelCompletion.logprobs;

				if (!logprobs) {
					return;
				}

				const localOffsets = logprobs.text_offset.map((offset: number) => {
					return insertedHistoryElement.echo ? offset : offset - insertedHistoryElement.prefix.length;
				});

				// get offset between absolutePosition and startPosition
				const offset = absolutePosition - insertedHistoryElement.startPosition;

				// find the first index in localOffsets where offset >= localOffset
				const index = localOffsets.findIndex((localOffset: number) => {
					return offset <= localOffset;
				}) - 1;

				const hoverToken = logprobs.tokens[index];

				// check if word at hovered position contains the token 
				// or if the token contains the hovered word
				const hoverWord = document.getText(document.getWordRangeAtPosition(position));
				if (!hoverToken.includes(hoverWord) && !hoverWord.includes(hoverToken)) {
					return;
				}

				const hoverTokenLogprob = logprobs.token_logprobs[index];
				const hoverTokenProb = Math.exp(hoverTokenLogprob) * 100;
				const hoverTokenAlternatives = logprobs.top_logprobs ? logprobs.top_logprobs[index] : undefined;
				// const color = probToColor(hoverTokenProb);

				// const markDownString = new vscode.MarkdownString(`<strong>${hoverToken}</strong>: <span style="color: ${color};">${hoverTokenLogprob.toPrecision(4)}</span> | ${hoverTokenProb.toPrecision(4)}%`);
				// const markDownString = new vscode.MarkdownString(`<strong>'${hoverToken}'</strong>: ${hoverTokenLogprob.toPrecision(4)} | ${hoverTokenProb.toPrecision(4)}%`);
				const markDownString = new vscode.MarkdownString();
				markDownString.isTrusted = true;
				markDownString.supportHtml = true;


				if(hoverTokenAlternatives) {
					// append markdown table header
					markDownString.appendMarkdown(`\n\n| Token | Logprob | Prob`);
					markDownString.appendMarkdown(`\n| --- | --- | --- |`);	

					const sortedTokenAlternatives = [];

					for (const key in hoverTokenAlternatives) {
						sortedTokenAlternatives.push([key, hoverTokenAlternatives[key]]);
					}

					sortedTokenAlternatives.sort((a, b) => {
						return b[1] - a[1];
					});

					sortedTokenAlternatives.forEach((tokenAlternative: any) => {
						const token = tokenAlternative[0];
						const logprob = tokenAlternative[1];
						const prob = Math.exp(logprob) * 100;
						// append row of markdown table
						markDownString.appendMarkdown(`\n| '${token}' | ${logprob.toPrecision(4)} | ${prob.toPrecision(4)}% |`);
					});
				}

				markDownString.appendMarkdown(`\n\n| Sampled | Logprob | Prob`);
				markDownString.appendMarkdown(`\n| --- | --- | --- |`);
				
				markDownString.appendMarkdown(`\n| '${hoverToken}' | ${hoverTokenLogprob.toPrecision(4)} | ${hoverTokenProb.toPrecision(4)}% |`);
				
				return new vscode.Hover(markDownString);
			}
		}
	);


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
			const modelResponse = await getModelResponse(prefix, suffix, infill);
			progress.report({ increment: 100 });
			// append to history
			if (modelResponse) {
				wsconsole.appendLine(JSON.stringify(modelResponse));
				history.push(modelResponse);
				currentHistoryIndex = history.length - 1;
				vscode.commands.executeCommand('editor.action.triggerSuggest');	
			}
		});
	}

	let getContinuations = vscode.commands.registerCommand('worldspider.getContinuations', () => {
		handleGetModelCompletions(false);
	});

	let getInfills = vscode.commands.registerCommand('worldspider.getInfills', () => {
		handleGetModelCompletions(true);
	});

	let scorePrompt = vscode.commands.registerCommand('worldspider.scorePrompt', () => {
		const { selectedText, selectedStartOffset, selectedEndOffset } = getSelectionInfo();
		if (selectedText) {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Window,
				cancellable: false,
				title: 'Getting prompt logprobs...'
			}, async (progress) => {
				progress.report({ increment: 0 });
				const modelResponse = await getModelResponse(selectedText, '', false, true);
				progress.report({ increment: 100 });
				vscode.window.showInformationMessage(`Added prompt logprob information`);
				if(modelResponse) {
					wsconsole.appendLine(JSON.stringify(modelResponse));
					const decoration = colorText(selectedStartOffset, selectedEndOffset, 'rgba(0, 0, 0, 0.3)');
					insertedHistory.push({
						startPosition: selectedStartOffset,
						endPosition: selectedEndOffset,
						prefix: selectedText,
						echo: true,
						modelCompletion: modelResponse.choices[0],
						decoration: decoration
					});
				}
			});
		}
	});
				


	let copyCompletions = vscode.commands.registerCommand('worldspider.copyCompletions', () => {
		vscode.env.clipboard.writeText(JSON.stringify(history[currentHistoryIndex]));
		vscode.window.showInformationMessage('Copied model completions to clipboard');
	});

	let copyCompletionsText = vscode.commands.registerCommand('worldspider.copyCompletionsText', () => {
		const completionsTextList = history[currentHistoryIndex].choices.map((choice: { text: string; }) => choice.text);
		const completionsText = JSON.stringify(completionsTextList);
		vscode.env.clipboard.writeText(completionsText);
		vscode.window.showInformationMessage('Copied completions text to clipboard');
	});

	let prevCompletions = vscode.commands.registerCommand('worldspider.prevCompletions', () => {
		if (currentHistoryIndex > 0) {
			currentHistoryIndex--;
			vscode.commands.executeCommand('editor.action.triggerSuggest');
		}
	});

	let nextCompletions = vscode.commands.registerCommand('worldspider.nextCompletions', () => {
		if (currentHistoryIndex < history.length - 1) {
			currentHistoryIndex++;
			vscode.commands.executeCommand('editor.action.triggerSuggest');
		}
	});


	context.subscriptions.push(registerCompletionItemsProvider);
	context.subscriptions.push(showCompletions);
	context.subscriptions.push(getContinuations);
	context.subscriptions.push(getInfills);
	context.subscriptions.push(copyCompletions);
	context.subscriptions.push(copyCompletionsText);
	context.subscriptions.push(prevCompletions);
	context.subscriptions.push(nextCompletions);
	context.subscriptions.push(afterInsertTextDisposable);
	context.subscriptions.push(scorePrompt);

}

// This method is called when your extension is deactivated
export function deactivate() {}
