import * as vscode from 'vscode';

export function saveModelResponse(modelResponse: any) {
  var path = require('path');
  const workbenchConfig = vscode.workspace.getConfiguration('worldspider');
  const folders = vscode.workspace.workspaceFolders;
  if(!folders) {
    return;
  }
  const rootPath = folders[0].uri.fsPath;
  const savePath = workbenchConfig.get('savePath');
  const fs = require('fs');
  const filePath = path.join(rootPath, savePath);
  // check if file exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
  fs.readFile(filePath, 'utf8', function (err: any, data: any) {
    if (err) {throw err;}
    var json = JSON.parse(data);
    json.push(modelResponse);
    fs.writeFile(filePath, JSON.stringify(json), function (err: any) {
      if (err) {throw err;}
      // console.log('Saved to ' + filePath);
    });
  }
  );
}