import * as vscode from 'vscode';


export function getCurrentContext() {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const prefixLength = workbenchConfig.get('generation.prefixLength');
  const suffixLength = workbenchConfig.get('generation.suffixLength');
  // const prefixLength = 100;
  // const suffixLength = 100;
  let editor = vscode.window.activeTextEditor;
  if(!editor) {
    return {prefix: '', suffix: ''};
  }
  let context = editor.document.getText();
  // get last prefixLength characters of prefix
  let currentContextPrefix = context.slice(0, editor.document.offsetAt(editor.selection.start)).slice(-<number>prefixLength);
  // get first suffixLength characters of suffix
  let currentContextSuffix = context.slice(editor.document.offsetAt(editor.selection.end)).slice(0, <number>suffixLength);
  return {prefix: currentContextPrefix, suffix: currentContextSuffix};
}