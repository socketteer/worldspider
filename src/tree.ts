import * as vscode from 'vscode';


export interface Tree {
  [id: string]: TreeNode;
}

export interface TreeNode {
  parentId: string | null;
  text: string;
  childrenIds: string[];
}

export function getAncestry(nodeId: string, tree: Tree) {
  let ancestry = [nodeId];
  let node = tree[nodeId];
  while(node.parentId) {
    ancestry.push(node.parentId);
    node = tree[node.parentId];
  }
  // reverse array
  ancestry.reverse();
  return ancestry;
}

export function getAncestryTextArray(nodeId: string, tree: Tree) {
  const ancestry = getAncestry(nodeId, tree);
  let ancestryText = [];
  for(let i = ancestry.length - 1; i >= 0; i--) {
    ancestryText.push(tree[ancestry[i]].text);
  }
  return ancestryText;
}

export function getAncestryTextOffsets(nodeId: string, tree: Tree) {
  const ancestry = getAncestry(nodeId, tree);
  let ancestryTextOffsets = {};
  let offset = 0;
  for(let i = ancestry.length - 1; i >= 0; i--) {
    ancestryTextOffsets[ancestry[i]] = offset;
    offset += tree[ancestry[i]].text.length;
  }
  return ancestryTextOffsets;
}

export function createNode(parentId: string | null, text: string, tree: Tree) {
  const nodeId = Math.random().toString(36).substring(7);
  tree[nodeId] = {
    parentId,
    text,
    childrenIds: [],
  };
  if(parentId) {
    tree[parentId].childrenIds.push(nodeId);
  }
  return nodeId;
}

export class WSTreeItem extends vscode.TreeItem {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly contextValue: string = 'treeItem'
  ) {
    super(label, collapsibleState);
  }
}

export class NodeProvider implements vscode.TreeDataProvider<WSTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<WSTreeItem | undefined | null | void> = new vscode.EventEmitter<WSTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<WSTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private tree: Tree) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WSTreeItem): WSTreeItem {
    return element;
  }

  getTreeItemById(id: string): WSTreeItem {
    return new WSTreeItem(id, this.tree[id].text, vscode.TreeItemCollapsibleState.Collapsed);
  }

  getChildren(element?: WSTreeItem): Thenable<WSTreeItem[]> {
    if (!element) {
      // get root nodes
      const rootNodes = Object.keys(this.tree).filter((nodeId) => {
        return this.tree[nodeId].parentId === null;
      });
      return Promise.resolve(rootNodes.map((nodeId) => {
        return new WSTreeItem(nodeId, this.tree[nodeId].text, vscode.TreeItemCollapsibleState.Collapsed);
      }));
    } else {
      // get children of element
      const children = this.tree[element.id].childrenIds;
      return Promise.resolve(children.map((nodeId) => {
        return new WSTreeItem(nodeId, this.tree[nodeId].text, vscode.TreeItemCollapsibleState.Collapsed);
      }));
    }
  }
}