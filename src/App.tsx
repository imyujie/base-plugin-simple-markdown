import './App.css';
import { bitable, FieldType, IOpenSegment, ITextField, IOpenSegmentType } from "@lark-base-open/js-sdk";
import { useState, useEffect, useRef, useCallback } from 'react';
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

export default function App() {
  const [selectedCellContent, setSelectedCellContent] = useState<string>('');
  const [isTextCell, setIsTextCell] = useState<boolean>(false);
  const editorRef = useRef<MDXEditorMethods>(null);

  const debouncedUpdateCell = useRef(debounce(async (content: string) => {
    const selection = await bitable.base.getSelection();
    if (selection && selection.recordId && selection.fieldId && selection.tableId) {
      const table = await bitable.base.getTableById(selection.tableId);
      await table.setCellValue(selection.fieldId, selection.recordId, content);
    }
  }, 500)).current;

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
            setSelectedCellContent(cellValue);
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
            contentEditableClassName="markdown-editor"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              linkPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
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
          请选择一个多行文本单元格
        </div>
      )}
    </main>
  )
}