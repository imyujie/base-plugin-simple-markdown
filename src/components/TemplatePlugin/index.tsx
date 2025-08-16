import {
  realmPlugin,
  addComposerChild$,
  createRootEditorSubscription$,
  insertMarkdown$ 
} from '@mdxeditor/editor';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import React, { useEffect, useState, useCallback } from 'react';
import { templates } from './templates';

export const INSERT_TEMPLATE_COMMAND: LexicalCommand<string> = createCommand();

const CommandMenu = () => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = useCallback((markdown: string) => {
    editor.dispatchCommand(INSERT_TEMPLATE_COMMAND, markdown);
    setIsOpen(false);
  }, [editor]);

  const handleCommand = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && selection.isCollapsed()) {
      const node = selection.anchor.getNode();
      const offset = selection.anchor.offset;
      const text = node.getTextContent().substring(0, offset);
      if (text.endsWith('=')) {
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
        handleCommand();
      });
    });
  }, [editor, handleCommand]);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % templates.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + templates.length) % templates.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (selectedIndex !== -1) {
            handleSelect(templates[selectedIndex].markdown);
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
      {templates.map((template, index) => (
        <div
          key={template.name}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect(template.markdown)}
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
          {template.name}
        </div>
      ))}
    </div>
  ) : null;
};

export const templatePlugin = realmPlugin({
  init: (realm) => {
    realm.pub(addComposerChild$, CommandMenu);

    realm.pub(createRootEditorSubscription$, (editor) => {
      const unregisterCommand = editor.registerCommand(
        INSERT_TEMPLATE_COMMAND,
        (payload: string) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.deleteCharacter(true);
            realm.pub(insertMarkdown$, payload);
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