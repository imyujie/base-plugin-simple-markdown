import { $isStatusNode, StatusNode } from './StatusNode';
import type { LexicalExportVisitor, MdastImportVisitor } from '@mdxeditor/editor';
import type { Text } from 'mdast';
import { $createStatusNode } from './StatusNode';
import { $isElementNode } from 'lexical';

export const STATUS_KEYWORD_MAP: Record<string, 'in-progress' | 'at-risk' | 'off-track' | 'not-updated'> = {
  '进展正常': 'in-progress',
  '有风险': 'at-risk',
  '进度滞后': 'off-track',
  '未更新': 'not-updated'
};

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