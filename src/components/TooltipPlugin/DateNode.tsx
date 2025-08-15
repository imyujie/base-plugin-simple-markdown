import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
} from 'lexical';
import { TextNode } from 'lexical';

let tooltip: HTMLDivElement | null = null;

const showTooltip = (target: HTMLElement, text: string) => {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'black';
    tooltip.style.color = 'white';
    tooltip.style.padding = '0.2em 0.4em';
    tooltip.style.borderRadius = '0.3em';
    tooltip.style.fontSize = '0.6em';
    tooltip.style.fontWeight = '200';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.transition = 'opacity 0.2s';
    document.body.appendChild(tooltip);
  }
  const rect = target.getBoundingClientRect();
  tooltip.style.opacity = '1';
  tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
  tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight}px`;
  tooltip.textContent = text;
};

const hideTooltip = () => {
  if (tooltip) {
    tooltip.style.opacity = '0';
  }
};

const getDayOfWeek = (dateString: string): string => {
  if (dateString.length !== 4) {
    return '日期格式无效';
  }
  const month = parseInt(dateString.substring(0, 2), 10);
  const day = parseInt(dateString.substring(2, 4), 10);

  if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return '日期格式无效';
  }

  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, month - 1, day);

  if (date.getMonth() !== month - 1) {
    return '日期不存在';
  }

  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[date.getDay()];
}

export type SerializedDateNode = Spread<
  {
    type: 'date';
    version: 1;
  },
  SerializedTextNode
>;

function convertDateElement(domNode: HTMLElement): DOMConversionOutput | null {
  const date = domNode.getAttribute('data-lexical-date');
  if (date) {
    const node = $createDateNode(date);
    return { node };
  }
  return null;
}

export class DateNode extends TextNode {
  static getType(): string {
    return 'date';
  }

  static clone(node: DateNode): DateNode {
    return new DateNode(node.__text, node.__key);
  }

  constructor(text: string, key?: NodeKey) {
    super(text, key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = '#888';
    element.style.fontWeight = 'regular';
    element.setAttribute('data-lexical-date', this.__text);

    element.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        showTooltip(target, getDayOfWeek(this.__text));
      }
    });

    element.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    return element;
  }

  static importJSON(serializedNode: SerializedDateNode): DateNode {
    const node = $createDateNode(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedDateNode {
    return {
      ...super.exportJSON(),
      type: 'date',
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-date')) {
          return null;
        }
        return {
          conversion: convertDateElement,
          priority: 1,
        };
      },
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-date', this.__text);
    element.textContent = this.__text;
    return { element };
  }
}

export function $createDateNode(text: string): DateNode {
  return new DateNode(text);
}

export function $isDateNode(node: LexicalNode | null | undefined): node is DateNode {
  return node instanceof DateNode;
}