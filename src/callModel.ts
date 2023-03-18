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

export async function getModelResponse(prompt: string, suffix: string | null, scorePromptOnly: boolean = false): Promise<ModelResponse | null> {
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

  const chat = model === 'gpt-3.5-turbo' || model === 'gpt-4';

  if(!apiKey) {
    vscode.window.showErrorMessage("No API key set. Please set the 'worldspider.apiKey' setting.");
    return null;
  }

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  const request = {
    model: model,
    // prompt: prompt,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    n: numCompletions,
    temperature: temperature,
    ...(!chat && {logprobs: logprobs}),
    ...(!chat && {echo: echo}),
    ...(!chat && {suffix: suffix}),
    ...(chat && { messages: [{ role: "assistant", content: prompt }] }),
    ...(!chat && { prompt }),
  };

  try {      
    const response = chat ? await openai.createChatCompletion(request) : await openai.createCompletion(request);

    // if chat, change the format of the response from choices[i].message.content to choices[i].text

    const choices = response.data.choices.map((choice: any) => {
      if(chat) {
        return {
          ...choice,
          text: " " + choice.message.content, // TODO remove this space and find less hacky way to fix the issue
        };
      } else {
        return choice;
      }
    });
    
    const responseObject = {
      ...response.data,
      choices: echo ? removePromptsFromCompletions(choices, prompt) : choices,
      prompt: prompt,
      suffix: suffix,
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


export async function modelOperation(prefix:string, suffix: string, selectedText: string ) {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');

  const apiKey = workbenchConfig.get('apiKey');
  const instruction = workbenchConfig.get('generation.customInstruction');
  const model = workbenchConfig.get('generation.customOpModel');

  const messages = [
    { role: "system", content: instruction },
    { role: "user", content: selectedText }
  ];

  const request = {
    model: model,
    max_tokens: 200,
    n: 3,
    temperature: 1.2,
    messages: messages,
  };

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  // console.log(request);

  try {
    const response = await openai.createChatCompletion(request);

    const choices = response.data.choices.map((choice: any) => {
      return {
        ...choice,
        text: choice.message.content,
      };
    });

    console.log(choices);

    const responseObject = {
      ...response.data,
      choices: choices,
      prefix: prefix,
      suffix: suffix,
    };

    return responseObject;
  }
  catch (error) {
    console.log(error);
    vscode.window.showErrorMessage("model call failed");
    return null;
  }
}