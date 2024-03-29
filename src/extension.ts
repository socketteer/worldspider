// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { getModelResponse, ModelResponse, ModelCompletion, modelOperation } from './callModel';
import { getCurrentContext, getSelectionInfo } from './document';
// import { probToColor } from './utils';

interface InsertedHistoryItem {
	startPosition: number;
	endPosition: number;
	prefix: string;
	echo: boolean;
	modelCompletion: ModelCompletion;
}


export function removeMetaTokensFromPrompt(prompt: string): string {
	// Strip comments, i.e. the tokens and everything between them
	// Also strip a trailing newline after the comment,
	// so a commented line doesn't leave an extra newline in the prompt 
	prompt = prompt.replace(/<\|BEGINCOMMENT\|>.*?<\|ENDCOMMENT\|>\n?/g, "");
	
	// Strip everything before the <|start|> token.
	// If there is a newline directly after the start token, also strip it
	prompt = prompt.replace(/^.*<\|start\|>\n?/, "");

	// Strip everything after the <|end|> token
	prompt = prompt.replace(/<\|end\|>.*$/, "");

	// Strip any other kind of token
	prompt = prompt.replace(/<\|.*?\|>/g, "");

	return prompt;
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

	function afterInsertText(position: number, completionIndex: number, text: string) {
		const prompt = history[currentHistoryIndex].prompt;
		insertedHistory.push({
			startPosition: history[currentHistoryIndex].echo ? position - prompt.length : position,
			endPosition: position + text.length,
			prefix: prompt,
			echo: history[currentHistoryIndex].echo,
			modelCompletion: history[currentHistoryIndex].choices[completionIndex],
		});
		const workbenchConfig = vscode.workspace.getConfiguration('worldspider');

		if (!workbenchConfig.get('highlightModelText')) {
			return;
		}
		// create decoration for the inserted text
		const decoration = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(0, 0, 0, 0.1)',
			borderRadius: '3px',
			border: '1px solid rgba(0, 0, 0, 0.4)',
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
		});
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const startPosition = editor.document.positionAt(position);
		const endPosition = editor.document.positionAt(position + text.length);
		const range = new vscode.Range(startPosition, endPosition);
		editor.setDecorations(decoration, [range]);
	}

	let afterInsertTextDisposable = vscode.commands.registerCommand('worldspider.afterInsertText', afterInsertText);

	let registerCompletionItemsProvider = vscode.languages.registerCompletionItemProvider(
		'*', 
		{
			provideCompletionItems(document, position, token, context) {
				console.log(history[currentHistoryIndex]);
				const completionItems = history[currentHistoryIndex].choices.map((response: { text: string; }, i: any) => {
					const text = response.text;
					const completionItem = new vscode.CompletionItem(text);
					completionItem.insertText = text;
					completionItem.keepWhitespace = true;
					completionItem.documentation = text;
					completionItem.kind = vscode.CompletionItemKind.Text;
					completionItem.range = new vscode.Range(position, position); // to prevent trying to overwrite the previous word
					
					const absolutePosition = document.offsetAt(position);
					// when text is inserted, call afterInsertText
					completionItem.command = {
						command: 'worldspider.afterInsertText',
						title: 'afterInsertText',
						arguments: [absolutePosition, i, text]
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
						// markDownString.appendMarkdown(`<div><strong>'${token}'</strong>: <span style="text-align: right;">${logprob.toPrecision(4)} | ${prob.toPrecision(4)}%</span></div>`);
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


	async function handleGetModelCompletions(callModelFunction: Function) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			cancellable: false,
			title: 'Generating...'
		}, async (progress) => {
			progress.report({ increment: 0 });
			const modelResponse = await callModelFunction();
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
		let { prefix, suffix } = getCurrentContext();
    prefix = removeMetaTokensFromPrompt(prefix);
		suffix = removeMetaTokensFromPrompt(suffix); 
		handleGetModelCompletions(() => getModelResponse(prefix, null));
	});

	let getInfills = vscode.commands.registerCommand('worldspider.getInfills', () => {
		let { prefix, suffix } = getCurrentContext();
    prefix = removeMetaTokensFromPrompt(prefix);
		suffix = removeMetaTokensFromPrompt(suffix); 
		handleGetModelCompletions(() => getModelResponse(prefix, suffix));
	});

	let customOp = vscode.commands.registerCommand('worldspider.customOp', () => {
		let { prefix, suffix } = getCurrentContext();
    prefix = removeMetaTokensFromPrompt(prefix);
		suffix = removeMetaTokensFromPrompt(suffix); 
		const { selectedText } = getSelectionInfo();
		if(!selectedText) {
			vscode.window.showInformationMessage(`No text selected`);
			return;
		}
		handleGetModelCompletions(() => modelOperation(prefix, suffix, selectedText));
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
				const modelResponse = await getModelResponse(selectedText, '', true);
				progress.report({ increment: 100 });
				vscode.window.showInformationMessage(`Added prompt logprob information`);
				if(modelResponse) {
					wsconsole.appendLine(JSON.stringify(modelResponse));
					insertedHistory.push({
						startPosition: selectedStartOffset,
						endPosition: selectedEndOffset,
						prefix: selectedText,
						echo: true,
						modelCompletion: modelResponse.choices[0],
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
	context.subscriptions.push(customOp);
	context.subscriptions.push(copyCompletions);
	context.subscriptions.push(copyCompletionsText);
	context.subscriptions.push(prevCompletions);
	context.subscriptions.push(nextCompletions);
	context.subscriptions.push(afterInsertTextDisposable);
	context.subscriptions.push(scorePrompt);

}

// This method is called when your extension is deactivated
export function deactivate() {}
