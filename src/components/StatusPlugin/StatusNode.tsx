import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import React from 'react';

const statusDisplay = {
  'in-progress': {
    label: '进展正常',
    color: 'rgb(0, 144, 74)',
  },
  'at-risk': {
    label: '有风险',
    color: 'rgba(180, 83, 9, 1)',
  },
  'off-track': {
    label: '进度滞后',
    color: 'rgba(185, 28, 28, 1)',
  },
  'not-updated': {
    label: '未更新',
    color: 'rgba(55, 65, 81, 1)',
  },
};

type StatusType = keyof typeof statusDisplay;

function StatusComponent({ status }: { status: StatusType }) {
  const { label, color } = statusDisplay[status];
  return (
    <span
      style={{
        color,
        fontSize: '13px',
        fontWeight: 400,
      }}
    >
      {label}
    </span>
  );
}

function convertStatusElement(domNode: HTMLElement): DOMConversionOutput | null {
  const status = domNode.getAttribute('data-lexical-status') as StatusType;
  if (status) {
    const node = $createStatusNode(status);
    return {
      node,
      after: () => {
        return [];
      },
    };
  }
  return null;
}

export type SerializedStatusNode = Spread<
  {
    status: StatusType;
    type: 'status';
    version: 1;
  },
  SerializedLexicalNode
>;

export class StatusNode extends DecoratorNode<React.ReactNode> {
  __status: StatusType;

  static getType(): string {
    return 'status';
  }

  static clone(node: StatusNode): StatusNode {
    return new StatusNode(node.__status, node.__key);
  }

  constructor(status: StatusType, key?: NodeKey) {
    super(key);
    this.__status = status;
  }

  getStatus(): StatusType {
    return this.__status;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-status', this.__status);
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-status', this.__status);
    const text = document.createTextNode(this.getTextContent());
    element.appendChild(text);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-status')) {
          return null;
        }
        return {
          conversion: convertStatusElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedStatusNode): StatusNode {
    const node = $createStatusNode(serializedNode.status);
    return node;
  }

  exportJSON(): SerializedStatusNode {
    return {
      status: this.__status,
      type: 'status',
      version: 1,
    };
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return false;
  }

  canBeEmpty(): boolean {
    return false;
  }

  getTextContent(): string {
    return statusDisplay[this.__status].label;
  }

  decorate(): React.ReactNode {
    return <StatusComponent status={this.__status} />;
  }
}

export function $createStatusNode(status: StatusType): StatusNode {
  return new StatusNode(status);
}

export function $isStatusNode(node: LexicalNode | null | undefined): node is StatusNode {
  const isStatus = node instanceof StatusNode;
  return isStatus;
}