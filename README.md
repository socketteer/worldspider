# worldspider

## Requirements

vscode 1.74.0 or later.

You will need an OpenAI API key.

## Instructions

Install using the command `code --install-extension worldspider-0.0.2.vsix`.

After installing, set `worldspider.apiKey` to your OpenAI API key.

### Generating text

To generate completions from the caret, press `Alt+D` (You can change this keybinding in the keybindings editor by changing the command `worldspider.getModelCompletions`).

Then use arrow keys to scroll through completions and hit enter to append one to the prompt, or click a completion to append it. 

If you close the dropdown, you can reopen the same completion list with `Alt+S` as long as you haven't generated any new ones.

To generate infills, select the text you want to replace and press `Alt+Shift+D`.

### Customizations

If you find the completion dropdown too small, you can change the size of the dropdown by setting `editor.suggestLineHeight` to larger number of lines, such as 32 (16 is default).

If you have Copilot enabled at the same time as Worldspider, you will also get inline Copilot suggestions, which does not interfere with Worldspider but may be confusing.

## Commands

- `worldspider.getModelCompletions`: Generate completions from the caret. Default keybinding is `Alt+D`.
- `worldspider.getModelInfillCompletions`: Generate infills from the selected text. Default keybinding is `Alt+Shift+D`.
- `worldspider.showCompletions`: Show the completion dropdown. Default keybinding is `Alt+S`.

## Configuration

Currently, the following generation parameters are supported:
- `worldspider.generation.model`: Name of the model to use. `code-davinci-002` is the default.
- `worldspider.generation.numCompletions`: Number of completions to generate.
- `worldspider.generation.maxTokens`: Maximum number of tokens to generate.
- `worldspider.generation.temperature`: Temperature of the model. Higher values will result in more random completions.
- `worldspider.generation.topP`: Percentage of the probability mass to sample from.
- `worldspider.generation.frequencyPenalty`: Frequency penalty.
- `worldspider.generation.presencePenalty`: Presence penalty.
- `worldspider.generation.prefixLength`: Maximum length of the prefix prompt in characters.
- `worldspider.generation.suffixLength`: Maximum length of the suffix prompt (for infills) in characters.

If you set `worldspider.log` to `true`, the extension will save model responses to a path specified by `worldspider.savePath`.