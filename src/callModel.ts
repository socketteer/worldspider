const { Configuration, OpenAIApi } = require("openai");
import * as vscode from 'vscode';
import { saveModelResponse } from './logging';


export async function callModel(prompt: string) {
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const model = workbenchConfig.get('generation.model');
  const numCompletions = workbenchConfig.get('generation.numCompletions');
  const temperature = workbenchConfig.get('generation.temperature');
  const maxTokens = workbenchConfig.get('generation.maxTokens');
  const log = workbenchConfig.get('log');
  const apiKey = workbenchConfig.get('apiKey');

  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);
  const response = await openai.createCompletion({
    model: model,
    prompt: prompt,
    max_tokens: maxTokens,
    n: numCompletions,
    temperature: temperature,
  });
  if(log) {
    saveModelResponse(response.data);
  }
  return response;
}

export async function getModelResponseText(prompt: string) {
  const response = await callModel(prompt);
  const textOptions = response.data.choices.map((choice: { text: any; }) => choice.text);
  console.log(textOptions);
  return textOptions;
}