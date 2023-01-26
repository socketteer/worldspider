import * as vscode from 'vscode';


export function getCurrentContext() {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const prefixLength = workbenchConfig.get('generation.prefixLength');
  const suffixLength = workbenchConfig.get('generation.suffixLength');
  let editor = vscode.window.activeTextEditor;
  if(!editor) {
    return {prefix: '', suffix: ''};
  }
  let context = editor.document.getText();
  let currentContextPrefix = context.slice(0, editor.document.offsetAt(editor.selection.start)).slice(-<number>prefixLength);
  let currentContextSuffix = context.slice(editor.document.offsetAt(editor.selection.end)).slice(0, <number>suffixLength);
  return {prefix: currentContextPrefix, suffix: currentContextSuffix};
}

export function getSelectionInfo() {
  // returns currently selected text and absolute position in the document of the selection
  let editor = vscode.window.activeTextEditor;
  if(!editor) {
    return {prefix: '', suffix: ''};
  }
  let selectedText = editor.document.getText(editor.selection);
  let selectedStart = editor.selection.start;
  let selectedEnd = editor.selection.end;
  let selectedStartOffset = editor.document.offsetAt(selectedStart);
  let selectedEndOffset = editor.document.offsetAt(selectedEnd);
  return {selectedText, selectedStart, selectedEnd, selectedStartOffset, selectedEndOffset};
}