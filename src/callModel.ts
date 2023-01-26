const { Configuration, OpenAIApi } = require("openai");
import * as vscode from 'vscode';
import { saveModelResponse } from './logging';

export interface LogprobsObject {
  tokens: string[];
  token_logprobs: number[];
  top_logprobs: any[] | null;
  text_offset: number[];
}

export interface ModelCompletion {
  text: string;
  index: number;
  logprobs: LogprobsObject | null;
  finish_reason: string;
}

export interface ModelResponse {
  choices: ModelCompletion[];
  id: string;
  model: string;
  object: string;
  created: number;
  prompt: string;
  suffix: string | null;
  echo: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}

function removePromptsFromCompletions (completions: ModelCompletion[], prompt: string) {
  return completions.map((completion) => {
    const text = completion.text;
    const textWithoutPrompt = text.replace(prompt, '');
    return {
      ...completion,
      text: textWithoutPrompt,
    };
  });
}

export async function getModelResponse(prompt: string, suffix: string, infill: boolean, scorePromptOnly: boolean = false): Promise<ModelResponse | null> {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const model = workbenchConfig.get('generation.model');
  const numCompletions = scorePromptOnly ? 1 : workbenchConfig.get('generation.numCompletions');
  const temperature = workbenchConfig.get('generation.temperature');
  const maxTokens = scorePromptOnly ? 0 : workbenchConfig.get('generation.maxTokens');
  const topP = workbenchConfig.get('generation.topP');
  const frequencyPenalty = workbenchConfig.get('generation.frequencyPenalty');
  const presencePenalty = workbenchConfig.get('generation.presencePenalty');
  const logprobs = workbenchConfig.get('generation.logprobs');
  const echo = scorePromptOnly ? true : workbenchConfig.get('generation.echo');
  const log = workbenchConfig.get('log');
  const apiKey = workbenchConfig.get('apiKey');

  if(!apiKey) {
    vscode.window.showErrorMessage("No API key set. Please set the 'worldspider.apiKey' setting.");
    return null;
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: model,
      prompt: prompt,
      suffix: infill ? suffix : null,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      logprobs: logprobs,
      echo: echo,
      n: numCompletions,
      temperature: temperature,
    });
    const responseObject = {
      ...response.data,
      choices: echo ? removePromptsFromCompletions(response.data.choices, prompt) : response.data.choices,
      prompt: prompt,
      suffix: infill ? suffix : null,
      echo: echo,
    };
    if(log) {
      saveModelResponse(responseObject);
    }
    return responseObject;
  } catch (error) {
    console.log(error);
    vscode.window.showErrorMessage("model call failed");
    return null;
  }
}