const { Configuration, OpenAIApi } = require("openai");
import * as vscode from 'vscode';
import { saveModelResponse } from './logging';


export async function callModel(prompt: string, suffix: string, infill: boolean) {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const model = workbenchConfig.get('generation.model');
  const numCompletions = workbenchConfig.get('generation.numCompletions');
  const temperature = workbenchConfig.get('generation.temperature');
  const maxTokens = workbenchConfig.get('generation.maxTokens');
  const topP = workbenchConfig.get('generation.topP');
  const frequencyPenalty = workbenchConfig.get('generation.frequencyPenalty');
  const presencePenalty = workbenchConfig.get('generation.presencePenalty');
  const log = workbenchConfig.get('log');
  const apiKey = workbenchConfig.get('apiKey');

  // console.log('prompt: ' + prompt);
  // console.log('suffix: ' + suffix);

  if(!apiKey) {
    vscode.window.showErrorMessage("No API key set. Please set the 'worldspider.apiKey' setting.");
    return;
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
      n: numCompletions,
      temperature: temperature,
    });
    if(log) {
      saveModelResponse(response.data);
    }
    return response;
  } catch (error) {
    console.log(error);
    vscode.window.showErrorMessage("model call failed");
    return;
  }
}

export async function getModelResponseText(prompt: string, suffix: string, infill: boolean) {
  const response = await callModel(prompt, suffix, infill);
  if(!response) {
    return [];
  }
  const textOptions = response.data.choices.map((choice: { text: any; }) => choice.text);
  console.log(textOptions);
  return textOptions;
}