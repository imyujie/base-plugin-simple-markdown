import { realmPlugin, addLexicalNode$, addExportVisitor$, createRootEditorSubscription$ } from '@mdxeditor/editor';
import { $isTextNode, TextNode } from 'lexical';
import { $createDateNode, DateNode, $isDateNode } from './DateNode';
import { LexicalDateVisitor } from './LexicalVisitor';

const DATE_REGEX = /\b(\d{2})?(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])\b/;
const STRICT_DATE_REGEX = /^\b(\d{2})?(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])\b$/;

function dateTransform(node: TextNode): void {
  if (!node.isSimpleText()) {
    return;
  }

  const text = node.getTextContent();
  const match = text.match(DATE_REGEX);

  if (match && match.index !== undefined) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    let targetNode: TextNode;
    if (startIndex === 0) {
      [targetNode] = node.splitText(endIndex);
    } else {
      const parts = node.splitText(startIndex, endIndex);
      targetNode = parts[1];
    }

    const dateNode = $createDateNode(match[0]);
    targetNode.replace(dateNode);
  }
}

function dateNodeTransform(node: DateNode): void {
  const text = node.getTextContent();
  if (!STRICT_DATE_REGEX.test(text)) {
    const textNode = new TextNode(text);
    node.replace(textNode);
  }
}

export const tooltipPlugin = realmPlugin({
  init: (realm) => {
    realm.pub(addLexicalNode$, DateNode);
    realm.pub(addExportVisitor$, LexicalDateVisitor);
    realm.pub(createRootEditorSubscription$, (editor) => {
      const unregister = editor.registerNodeTransform(TextNode, (node) => {
        if ($isTextNode(node)) {
          dateTransform(node);
        }
      });
      const unregisterDate = editor.registerNodeTransform(DateNode, (node) => {
        if ($isDateNode(node)) {
          dateNodeTransform(node);
        }
      });

      return () => {
        unregister();
        unregisterDate();
      };
    });
  },
});