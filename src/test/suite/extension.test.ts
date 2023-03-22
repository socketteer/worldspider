import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as worldspider from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Prompt Strip Test: Blockcomment', () => {
		
		assert.strictEqual(
			worldspider.removeMetaTokensFromPrompt(
				"<|BEGINCOMMENT|>Some Comment<|ENDCOMMENT|>The Prompt"
			),
			"The Prompt"
		);
	});

	test('Prompt Strip Test: Start and End Token', () => {
		assert.strictEqual(
			worldspider.removeMetaTokensFromPrompt(
				"Preamble<|start|>\nThe Prompt<|end|>Addendum"
			),
			"The Prompt"
		);
	});

	test('Prompt Strip Test: Arbitrary Token', () => {
		assert.strictEqual(
			worldspider.removeMetaTokensFromPrompt(
				"The <|some_token|>Prompt"
			),
			"The Prompt"
		);
	});

});
