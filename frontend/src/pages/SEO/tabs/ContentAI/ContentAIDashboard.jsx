import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import LiveScoreSidebar from './components/LiveScoreSidebar';
import IntelligencePanels from './components/IntelligencePanels';
import './ContentAI.css';

const ContentAIDashboard = () => {
  const [activeTab, setActiveTab] = useState('keywords');
  const [seoScore, setSeoScore] = useState(85);
  const [readability, setReadability] = useState(72);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ HTMLAttributes: { class: 'highlight-keyword' } }),
      TextStyle,
      Color,
    ],
    content: `
      <h2>How to Optimize Your Content</h2>
      <p>This is a demonstration of the TipTap editor integration for the new Content AI Intelligence Platform.</p>
    `,
    onUpdate: ({ editor }) => {
      // In production: Run debounced analysis against the SEO Quality Engine
      // setSeoScore(calculateScore(editor.getText()));
    },
  });

  return (
    <div className="content-ai-dashboard">
      <div className="dashboard-header">
        <h2>Content Intelligence Editor</h2>
        <div className="header-actions">
          <button className="btn-secondary">Version History</button>
          <button className="btn-primary">Publish</button>
        </div>
      </div>
      
      <div className="dashboard-body split-layout">
        <div className="editor-panel">
          <div className="editor-toolbar">
            {/* Toolbar buttons (Bold, Italic, H1, H2, etc.) */}
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'active' : ''}>B</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          </div>
          <EditorContent editor={editor} className="tiptap-editor" />
        </div>

        <div className="intelligence-panel">
          <LiveScoreSidebar seoScore={seoScore} readability={readability} />
          
          <div className="tabs-container">
            <div className="tabs-header">
              <span className={activeTab === 'keywords' ? 'active' : ''} onClick={() => setActiveTab('keywords')}>Keywords</span>
              <span className={activeTab === 'competitors' ? 'active' : ''} onClick={() => setActiveTab('competitors')}>Competitors</span>
              <span className={activeTab === 'serp' ? 'active' : ''} onClick={() => setActiveTab('serp')}>SERP</span>
            </div>
            <div className="tabs-content">
              <IntelligencePanels activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAIDashboard;
