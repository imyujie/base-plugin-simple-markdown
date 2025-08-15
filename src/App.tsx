import './App.css';
import { bitable, FieldType, IOpenSegment, ITextField, IOpenSegmentType } from "@lark-base-open/js-sdk";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash.debounce';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { textReplacePlugin } from './components/TextReplacePlugin';
import { tooltipPlugin } from './components/TooltipPlugin';

const markdownToSegments = (markdown: string): IOpenSegment[] => {
  markdown = markdown.replace(/ +$/gm, '');
  const segments: IOpenSegment[] = [];
  // This regex finds [text](url) with non-greedy matching for the text part.
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    // Add the text part before the link
    if (match.index > lastIndex) {
      segments.push({
        type: IOpenSegmentType.Text,
        text: markdown.substring(lastIndex, match.index),
      });
    }
    // Add the link part, and trim whitespace from the URL
    segments.push({
      type: IOpenSegmentType.Url,
      text: match[1].replace(/\\([\[\]])/g, '$1'),
      link: match[2].trim(),
    });
    lastIndex = linkRegex.lastIndex;
  }

  // Add the remaining text after the last link
  if (lastIndex < markdown.length) {
    segments.push({
      type: IOpenSegmentType.Text,
      text: markdown.substring(lastIndex),
    });
  }

  // If markdown is empty, we should return an empty text segment to clear the cell
  if (markdown.length === 0) {
      return [{ type: IOpenSegmentType.Text, text: '' }];
  }

  return segments;
};

export default function App() {
  const { t } = useTranslation();
  const [selectedCellContent, setSelectedCellContent] = useState<string>('');
  const [isTextCell, setIsTextCell] = useState<boolean>(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  const debouncedUpdateCell = useRef(debounce(async (markdown: string) => {
    const selection = await bitable.base.getSelection();
    if (selection && selection.recordId && selection.fieldId && selection.tableId) {
      const table = await bitable.base.getTableById(selection.tableId);
      const segments = markdownToSegments(markdown);
      await table.setCellValue(selection.fieldId, selection.recordId, segments);
    }
  }, 1000)).current;

  useEffect(() => {
    const handleSelectionChange = async () => {
      try {
        const selection = await bitable.base.getSelection();
        if (selection && selection.recordId && selection.fieldId && selection.tableId) {
          const table = await bitable.base.getTableById(selection.tableId);
          const field = await table.getField(selection.fieldId);
          const fieldType = await field.getType();
          let cellValue = '';
          if (fieldType === FieldType.Text) {
            const textField = await table.getField<ITextField>(selection.fieldId);
            const segments: IOpenSegment[] = await textField.getValue(selection.recordId);
            cellValue = (segments || []).map((segment: IOpenSegment) => {
              if ('type' in segment) {
                switch (segment.type) {
                  case IOpenSegmentType.Text:
                    return segment.text;
                  case IOpenSegmentType.Url:
                    return `[${segment.text}](${segment.link})`;
                  case IOpenSegmentType.Mention:
                    // console.log(segment)
                    if (segment.mentionType === 'User') {
                      return `@${segment.name}`;
                    } else if (segment.mentionType === 'Doc'
                      || segment.mentionType === 'Docx'
                      || segment.mentionType === 'Sheet'
                      || segment.mentionType === 'Bitable'
                    ) {
                      // console.log(segment.link)
                      return `[${segment.text}](${segment.link})`;
                    }
                  default:
                    return segment.text || '';
                }
              }
              return '';
            }).join('');
          } else {
            const rawValue = await table.getCellValue(selection.fieldId, selection.recordId);
            cellValue = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
          }
          const isText = fieldType === FieldType.Text;
          setIsTextCell(isText);

          if (isText) {
            // console.log("is Text：", cellValue);
            setSelectedCellContent(cellValue.replace(/ +$/gm, ''));
          } else {
            setIsTextCell(false);
            setSelectedCellContent('');
          }
        } else {
          setIsTextCell(false);
          setSelectedCellContent('');
        }
      } catch (error) {
        console.error('Error handling selection change:', error);
      }
    };

    handleSelectionChange();

    const unsubscribe = bitable.base.onSelectionChange(handleSelectionChange);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isTextCell && editorRef.current) {
      editorRef.current.setMarkdown(selectedCellContent);
    }
  }, [selectedCellContent, isTextCell]);

  const handleEditorChange = useCallback((markdown: string) => {
    markdown = markdown.replace(/&#x20;\n/g, '\n');
    debouncedUpdateCell(markdown);
  }, [debouncedUpdateCell]);

  return (
    <main className="main">
      {isTextCell ? (
        <div className="markdown-editor-container">
          <MDXEditor
            ref={editorRef}
            markdown={selectedCellContent}
            onChange={handleEditorChange}
            placeholder={t('clickToInput')}
            contentEditableClassName="markdown-editor"
            plugins={[
              tooltipPlugin(),
              headingsPlugin(),
              listsPlugin(),
              linkPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              textReplacePlugin(),
            ]}
          />
        </div>
      ) : (
        <div className="placeholder" style={{
          display: 'flex',
          justifyContent: 'center',
          height: '100%',
          alignItems: 'center',
          textAlign: 'center',
          color: 'gray'
        }}>
          {t('selectTextCell')}
        </div>
      )}
    </main>
  )
}