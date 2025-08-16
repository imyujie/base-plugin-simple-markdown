import {
  realmPlugin,
  addLexicalNode$,
  addExportVisitor$,
  createRootEditorSubscription$,
  addImportVisitor$,
  addComposerChild$,
} from '@mdxeditor/editor';
import { $isStatusNode, StatusNode } from './StatusNode';
import { LexicalStatusVisitor, MdastStatusVisitor, STATUS_KEYWORD_MAP } from './LexicalVisitor';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
  TextNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { useEffect, useState, useCallback } from 'react';
import { $createStatusNode } from './StatusNode';

export const INSERT_STATUS_COMMAND: LexicalCommand<string> = createCommand();



const statusOptions = [
    { value: 'in-progress', label: '进展正常' },
    { value: 'at-risk', label: '有风险' },
    { value: 'off-track', label: '进度滞后' },
    { value: 'not-updated', label: '未更新' },
];

const CommandMenu = () => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = useCallback((status: string) => {
    editor.dispatchCommand(INSERT_STATUS_COMMAND, status);
    setIsOpen(false);
  }, [editor]);

  const handleSlashCommand = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && selection.isCollapsed()) {
      const node = selection.anchor.getNode();
      const offset = selection.anchor.offset;
      const text = node.getTextContent().substring(0, offset);
      if (text.endsWith('/')) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setMenuPosition({ top: rect.bottom + 5, left: rect.left });
        }
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
    return false;
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleSlashCommand();
      });
    });
  }, [editor, handleSlashCommand]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % statusOptions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + statusOptions.length) % statusOptions.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (selectedIndex !== -1) {
            handleSelect(statusOptions[selectedIndex].value);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isOpen, selectedIndex, handleSelect]);

  return isOpen && menuPosition ? (
    <div
      style={{
        position: 'fixed',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        padding: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      {statusOptions.map((option, index) => (
        <div
          key={option.value}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect(option.value)}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 400,
            color: selectedIndex === index ? '#000' : '#888',
            background: selectedIndex === index ? '#eee' : 'transparent'
          }}
        >
          {option.label}
        </div>
      ))}
    </div>
  ) : null;
};

export const statusPlugin = realmPlugin({
  init: (realm) => {
    realm.pub(addLexicalNode$, StatusNode);
    realm.pub(addExportVisitor$, LexicalStatusVisitor);
    realm.pub(addImportVisitor$, MdastStatusVisitor);
    realm.pub(addComposerChild$, CommandMenu);

    realm.pub(createRootEditorSubscription$, (editor) => {
      editor.registerNodeTransform(TextNode, (node: TextNode) => {
        const text = node.getTextContent();
        const keywords = Object.keys(STATUS_KEYWORD_MAP);
        const keywordRegex = new RegExp(keywords.join('|'), 'g');
        const parts = text.split(keywordRegex);
        if (parts.length === 1) {
          return;
        }
        const newNodes = [];
        let lastIndex = 0;
        text.replace(keywordRegex, (match, offset) => {
          const prevText = text.substring(lastIndex, offset);
          if (prevText) {
            newNodes.push($createTextNode(prevText));
          }
          newNodes.push($createStatusNode(STATUS_KEYWORD_MAP[match as keyof typeof STATUS_KEYWORD_MAP]));
          lastIndex = offset + match.length;
          return match;
        });
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
          newNodes.push($createTextNode(remainingText));
        }
        node.replace(newNodes[0]);
        for (let i = 1; i < newNodes.length; i++) {
          newNodes[i-1].insertAfter(newNodes[i]);
        }
      });
      const unregisterCommand = editor.registerCommand(
        INSERT_STATUS_COMMAND,
        (payload: string) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.deleteCharacter(true);
            const statusNode = $createStatusNode(payload as any);
            selection.insertNodes([statusNode]);
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      );

      return () => {
        unregisterCommand();
      };
    });
  },
});