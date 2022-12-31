interface ITreeNode {
  id: string;
  text: string;
  replying_to: string;
  username: string;
  children: ITreeNode[];
}

function TreeNode(
  id: string,
  text: string,
  replying_to: string,
  username: string
): ITreeNode {
  this.id = id;
  this.text = text;
  this.replying_to = replying_to;
  this.username = username;
  this.children = [];

  return this;
}

interface IPost {
  date: string;
  text: string;
  author: string;
  username: string;
  name: string;
  profile_pic: string;
  id: string;
  photo_url: string;
  replying_to: string;
}

export const createTree = (rows: IPost[]) => {
  const visited = new Set();
  let adjList: Record<string, string[]> = {};

  for (const { id, replying_to } of rows.sort(
    (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)
  )) {
    if (!replying_to) {
      adjList[id] = [];
    } else if (adjList[replying_to]) {
      adjList[replying_to].push(id);
    } else {
      adjList[replying_to] = [id];
    }
  }

  const res = [];

  const dfs = (parent: ITreeNode, children: string[]) => {
    if (!adjList[parent.id]) return;
    for (const child of children) {
      if (!visited.has(child)) {
        const childAsNum = parseInt(child, 10);
        const node = TreeNode(
          rows[childAsNum].id,
          rows[childAsNum].text,
          rows[childAsNum].replying_to,
          rows[childAsNum].username
        );
        visited.add(child);
        dfs(node, adjList[child]);
        parent.children.push(node);
      }
    }
  };

  for (const parent of Object.keys(adjList)) {
    if (!visited.has(parent)) {
      const parentAsNum = parseInt(parent, 10);
      const node = TreeNode(
        rows[parentAsNum].id,
        rows[parentAsNum].text,
        rows[parentAsNum].replying_to,
        rows[parentAsNum].username
      );
      dfs(node, adjList[parent]);
      res.push(node);
    }
  }

  return res;
};
