# worldspider

## Requirements

vscode 1.74.0 or later.

You will need an OpenAI API key.

## Instructions

Install using the command `code --install-extension worldspider-0.0.2.vsix`.

After installing, set `worldspider.apiKey` to your OpenAI API key.

### Generating text

To generate completions from the caret, press `Alt+D`. To generate infills, select the text you want to replace and press `Alt+Shift+D`.

Use arrow keys to scroll through completions and hit enter to append one to the prompt, or click a completion to append it. 

If you close the dropdown, you can reopen the same completion list with `Alt+S` as long as you haven't generated any new ones.

To show the previous batch of completions, press `Alt+Left`. To show the next batch of completions, press `Alt+Right`.

### Token logprobs

To view token logprobs, hover over model-generated text. If `worldspider.generation.echo` is set to `true`, you can also hover over the prompt to view token logprobs. You can also highlight text and press `Alt+P` to view token logprobs without generating completions.

## Commands

- `worldspider.getContinuations`: Generate completions from the caret. Default keybinding is `Alt+D`.
- `worldspider.getInfills`: Generate infills from the selected text. Default keybinding is `Alt+Shift+D`.
- `worldspider.scorePrompt`: Get logprobs of selected text without generating completions. Default keybinding is `Alt+P`.
- `worldspider.showCompletions`: Show the completion dropdown. Default keybinding is `Alt+S`.
- `worldspider.prevCompletions`: Show the previous batch of completions. Default keybinding is `Alt+Left`.
- `worldspider.nextCompletions`: Show the next batch of completions. Default keybinding is `Alt+Right`.
- `worldspider.copyCompletions`: Copy model response info to the clipboard. Default keybinding is `Alt+C`.
- `worldspider.copyCompletionsText`: Save model response info to a file. Default keybinding is `Alt+Shift+C`.

You can change any of these keybindings by going to `File > Preferences > Keyboard Shortcuts` and searching for `worldspider`.

## Settings

Generation settings:
- `worldspider.generation.model`: Name of the model to use. `code-davinci-002` is the default.
- `worldspider.generation.numCompletions`: Number of completions to generate.
- `worldspider.generation.maxTokens`: Maximum number of tokens to generate.
- `worldspider.generation.temperature`: Temperature of the model. Higher values will result in more random completions.
- `worldspider.generation.topP`: Percentage of the probability mass to sample from.
- `worldspider.generation.frequencyPenalty`: Frequency penalty.
- `worldspider.generation.presencePenalty`: Presence penalty.
- `worldspider.generation.logprobs`: Number of counterfactual logprobs to return per token.
- `worldspider.generation.echo`: Whether to return the prompt logprobs.
- `worldspider.generation.prefixLength`: Maximum length of the prefix prompt in characters.
- `worldspider.generation.suffixLength`: Maximum length of the suffix prompt (for infills) in characters.

Other settings:
- `worldspider.apiKey`: Your OpenAI API key.
- `worldspider.log`: Whether to log model responses to a file.
- `worldspider.savePath`: Path to save model responses to.

## Customizations

If you find the completion dropdown too small, you can change the size of the dropdown by setting `editor.suggestLineHeight` to larger number of lines, such as 32 (16 is default).

If you have Copilot enabled at the same time as Worldspider, you will also get inline Copilot suggestions, which does not interfere with Worldspider's functionality but may be confusing.
