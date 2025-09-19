import { $isStatusNode, StatusNode, StatusType } from './StatusNode';
import type { LexicalExportVisitor, MdastImportVisitor } from '@mdxeditor/editor';
import type { Text } from 'mdast';
import { $createStatusNode } from './StatusNode';
import { $isElementNode } from 'lexical';
import { statusOptions } from './statusOptions';

export const STATUS_KEYWORD_MAP: Record<string, StatusType> = statusOptions.reduce((acc, option) => {
  acc[option.label] = option.value as StatusType;
  return acc;
}, {} as Record<string, StatusType>);


export const LexicalStatusVisitor: LexicalExportVisitor<StatusNode, Text> = {
  testLexicalNode: $isStatusNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    actions.addAndStepInto('text', { value: lexicalNode.getTextContent() });
  },
};

export const MdastStatusVisitor: MdastImportVisitor<Text> = {
  testNode: (node) => {
    if (node.type !== 'text') {
      return false;
    }
    return Object.keys(STATUS_KEYWORD_MAP).includes(node.value)
  },
  visitNode: ({ mdastNode, lexicalParent }) => {
    const statusType = STATUS_KEYWORD_MAP[mdastNode.value as keyof typeof STATUS_KEYWORD_MAP];
    if (statusType) {
      const statusNode = $createStatusNode(statusType);
      if ($isElementNode(lexicalParent)) {
        lexicalParent.append(statusNode);
      }
    }
  },
};