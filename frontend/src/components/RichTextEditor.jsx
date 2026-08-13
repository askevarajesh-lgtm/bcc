import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Button, Tooltip, Input } from 'antd';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Highlighter,
  Code
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const getButtonStyle = (isActive) => ({
    background: isActive ? 'var(--bg-secondary)' : 'transparent',
    color: isActive ? '#0073AA' : 'var(--text-secondary)',
    border: 'none',
    boxShadow: 'none'
  });

  return (
    <div style={{ 
      display: 'flex', 
      gap: 4, 
      padding: '8px', 
      flexWrap: 'wrap'
    }}>
      <Tooltip title="Bold">
        <Button size="small" icon={<Bold size={14} />} style={getButtonStyle(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} />
      </Tooltip>
      <Tooltip title="Italic">
        <Button size="small" icon={<Italic size={14} />} style={getButtonStyle(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} />
      </Tooltip>
      <Tooltip title="Strikethrough">
        <Button size="small" icon={<Strikethrough size={14} />} style={getButtonStyle(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} />
      </Tooltip>
      <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
      
      <Tooltip title="Heading 1">
        <Button size="small" icon={<Heading1 size={14} />} style={getButtonStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
      </Tooltip>
      <Tooltip title="Heading 2">
        <Button size="small" icon={<Heading2 size={14} />} style={getButtonStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      </Tooltip>
      <Tooltip title="Heading 3">
        <Button size="small" icon={<Heading3 size={14} />} style={getButtonStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      </Tooltip>
      <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />
      
      <Tooltip title="Bullet List">
        <Button size="small" icon={<List size={14} />} style={getButtonStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      </Tooltip>
      <Tooltip title="Ordered List">
        <Button size="small" icon={<ListOrdered size={14} />} style={getButtonStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      </Tooltip>
      <Tooltip title="Blockquote">
        <Button size="small" icon={<Quote size={14} />} style={getButtonStyle(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      </Tooltip>
      <div style={{ width: 1, background: 'var(--border-color)', margin: '0 4px' }} />

      <Tooltip title="Highlight">
        <Button size="small" icon={<Highlighter size={14} />} style={getButtonStyle(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()} />
      </Tooltip>

      <div style={{ flex: 1 }} />

      <Tooltip title="Undo">
        <Button size="small" icon={<Undo size={14} />} style={getButtonStyle(false)} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
      </Tooltip>
      <Tooltip title="Redo">
        <Button size="small" icon={<Redo size={14} />} style={getButtonStyle(false)} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
      </Tooltip>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
        style: 'min-height: 300px; padding: 16px; font-family: inherit; font-size: 14px; background: var(--bg-secondary); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;',
        placeholder: placeholder || 'Start writing...',
      },
    },
  });

  // Sync external value changes (e.g. when opening a new page in the drawer)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !isHtmlMode) {
      editor.commands.setContent(value);
    }
  }, [value, editor, isHtmlMode]);

  if (!isMounted) return null;

  return (
    <div style={{ 
      border: '1px solid var(--border-color)', 
      borderRadius: 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ flex: 1, opacity: isHtmlMode ? 0.5 : 1, pointerEvents: isHtmlMode ? 'none' : 'auto' }}>
          <MenuBar editor={editor} />
        </div>
        <div style={{ padding: '0 8px', borderLeft: '1px solid var(--border-color)' }}>
          <Tooltip title={isHtmlMode ? "Switch to Visual Editor" : "View HTML Source Code"}>
            <Button size="small" icon={<Code size={14} />} onClick={() => setIsHtmlMode(!isHtmlMode)} style={{ background: isHtmlMode ? 'var(--bg-secondary)' : 'transparent', color: isHtmlMode ? '#0073AA' : 'var(--text-secondary)', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isHtmlMode ? "Code Mode" : "Code"}
            </Button>
          </Tooltip>
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 600 }}>
        {isHtmlMode ? (
          <Input.TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ minHeight: 300, padding: 16, fontFamily: 'monospace', fontSize: 13, border: 'none', borderRadius: 0, resize: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p {
          margin-bottom: 0.5em;
          margin-top: 0;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 700;
        }
        .ProseMirror ul {
          padding-left: 20px;
          list-style-type: disc;
        }
        .ProseMirror ol {
          padding-left: 20px;
          list-style-type: decimal;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--border-color);
          padding-left: 1rem;
          margin-left: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
