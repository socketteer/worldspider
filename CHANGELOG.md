# Change Log

All notable changes to the "worldspider" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.3] - 2023-01-25

-   Added `worldspider.copyCompletions` command to copy model response to the clipboard.
-   Added `worldspider.copyCompletionsText` command to copy model response text to the clipboard.
-   Added `worldspider.prevCompletions` command to show the previous batch of completions.
-   Added `worldspider.nextCompletions` command to show the next batch of completions.
-   Added `worldspider.scorePrompt` command to score prompt logprobs without generating completions.
-   Added `worldspider.generation.logprobs` setting to retrieve log probabilities.
-   Added `worldspider.generation.echo` setting to control whether prompt logprobs are returned by the model.
-   Hovering over a completion now shows token probabilities.
-   Model responses are logged to `worldspider` output channel.

## [0.0.2] - 2023-01-23

### Added

- Added `worldspider.getInfills` command to generate infills from the selected text.
