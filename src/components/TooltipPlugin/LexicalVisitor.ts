import { $isDateNode, DateNode } from './DateNode'
import type { LexicalExportVisitor } from '@mdxeditor/editor'
import type { Text } from 'mdast'

export const LexicalDateVisitor: LexicalExportVisitor<DateNode, Text> = {
  testLexicalNode: $isDateNode,
  visitLexicalNode: ({ lexicalNode, mdastParent, actions }) => {
    actions.addAndStepInto('text', { value: lexicalNode.getTextContent() })
  }
}