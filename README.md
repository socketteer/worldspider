# worldspider

## Requirements

vscode 1.74.0 or later.

You will need an OpenAI API key.

## Instructions

Install using the command `code --install-extension worldspider-0.0.2.vsix`.

After installing, set `worldspider.apiKey` to your OpenAI API key.

### Generating text

To generate continuations from the caret, press `Alt+D`. To generate infills, select the text you want to replace and press `Alt+Shift+D`.

Use arrow keys to scroll through completions and hit enter to append the selected completion to the prompt, or click a completion to append it. 

If you close the completions dropdown, you can reopen it with `Alt+S`.

To show the previous batch of completions, press `Alt+Left`. To show the next batch of completions, press `Alt+Right`.

### Token logprobs

To view token logprobs, hover over model-generated text. If `worldspider.generation.echo` is set to `true`, you can also hover over the prompt to view token logprobs. 

You can also highlight text and press `Alt+P` to view token logprobs without generating completions.

## Keybindings

You can change any keybindings by going to `File > Preferences > Keyboard Shortcuts` and searching for `worldspider`.

## Customizations

If you find the completion dropdown too small, you can change the size of the dropdown by setting `editor.suggestLineHeight` to larger number of lines (16 is default).

If you have Copilot enabled at the same time as Worldspider, you will also get inline Copilot suggestions, which does not interfere with Worldspider's functionality but may be confusing.
