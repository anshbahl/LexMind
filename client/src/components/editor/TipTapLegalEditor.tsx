import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignJustify,
  AlignLeft,
  AlignCenter,
  ListOrdered,
  Heading1,
  Heading2,
  FileCheck,
  Check,
  X,
  Printer,
  Copy,
  Download,
  Scale,
  Sparkles,
} from 'lucide-react';
import { diffWords } from 'diff';
import { Case } from '../../types';

interface TipTapLegalEditorProps {
  caseData: Case;
  suggestedClause: string | null;
  onAcceptSuggestedClause: () => void;
  onRejectSuggestedClause: () => void;
  onSelectionChange?: (selectedText: string) => void;
}

export const TipTapLegalEditor: React.FC<TipTapLegalEditorProps> = ({
  caseData,
  suggestedClause,
  onAcceptSuggestedClause,
  onRejectSuggestedClause,
  onSelectionChange,
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const initialContent = `
<h1>IN THE ${caseData.court_forum.toUpperCase()}</h1>
<p style="text-align: center;"><strong>${caseData.case_type} JURISDICTION</strong></p>
<p style="text-align: center;">${caseData.case_type === 'CRIMINAL' ? 'BAIL APPLN. NO. [____] OF 2026' : caseData.case_type === 'COMMERCIAL' ? 'CS (COMM) NO. [____] OF 2026' : 'W.P. (C) NO. [____] OF 2026'}</p>

<p><strong>IN THE MATTER OF:</strong><br/>
${caseData.client_name.toUpperCase()} ...PETITIONER / APPLICANT<br/>
<br/>
<strong>VERSUS</strong><br/>
<br/>
${caseData.opposing_party.toUpperCase()} ...RESPONDENT / DEFENDANT</p>

<h2>MOST RESPECTFULLY SHOWETH:</h2>

<p>1. That the Petitioner / Applicant has approached this Hon'ble Court seeking urgent judicial intervention and protective orders under applicable provisions of Indian law.</p>

<p>2. That the facts giving rise to the present controversy demonstrate an arbitrary, high-handed, and legally untenable approach adopted by the opposing party, causing grave prejudice and irreparable injury to the Applicant.</p>

<h2>GROUNDS:</h2>

<p>A. Because the actions of the Respondent run contrary to settled propositions of law and violate basic tenets of natural justice.</p>

<p>B. Because the balance of convenience lies entirely in favor of the Petitioner, and no harm or prejudice will be caused to the other side if interim protection is accorded.</p>

<h2>PRAYER:</h2>

<p>Wherefore, in the light of the facts and grounds stated hereinabove, it is most respectfully prayed that This Hon'ble Court may graciously be pleased to:</p>
<p>(a) Grant ad-interim ex-parte protection / stay during the pendency of the present petition;</p>
<p>(b) Pass any other or further order(s) as this Hon'ble Court may deem fit and proper in the interest of justice.</p>
`;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'justify',
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: 'Draft your legal petition, application, or written statement here...',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-legal-editor prose prose-slate max-w-none focus:outline-none min-h-[600px] p-8',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const selected = editor.state.doc.textBetween(from, to, ' ');
      onSelectionChange?.(selected);
    },
  });

  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  // Insert AI suggestion into editor
  const handleInsertSuggestion = () => {
    if (!suggestedClause) return;
    editor.chain().focus().insertContent(`<p>${suggestedClause.replace(/\n\n/g, '</p><p>')}</p>`).run();
    onAcceptSuggestedClause();
  };

  // Quick insertion helpers for legal templates
  const insertCauseTitle = () => {
    const template = `
<h1>IN THE ${caseData.court_forum.toUpperCase()}</h1>
<p style="text-align: center;"><strong>CAUSE TITLE</strong></p>
<p><strong>${caseData.client_name.toUpperCase()}</strong> ...PLAINTIFF / PETITIONER<br/>
VERSUS<br/>
<strong>${caseData.opposing_party.toUpperCase()}</strong> ...DEFENDANT / RESPONDENT</p>
<h2>MOST RESPECTFULLY SHOWETH:</h2>
`;
    editor.chain().focus().insertContent(template).run();
  };

  const insertVerificationClause = () => {
    const verification = `
<h2>VERIFICATION:</h2>
<p>I, <strong>${caseData.client_name}</strong>, do hereby verify on solemn affirmation at New Delhi on this day of 2026, that the contents of paragraphs 1 to [___] of the accompanying petition are true and correct to my knowledge derived from official records, and nothing material has been concealed therefrom.</p>
<p style="text-align: right;"><strong>DEPONENT</strong></p>
`;
    editor.chain().focus().insertContent(verification).run();
  };

  const handleCopyAll = () => {
    const text = editor.getText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Render Visual Diff for Suggested Clause
  const renderDiff = () => {
    if (!suggestedClause) return null;
    const diff = diffWords('', suggestedClause);

    return (
      <div className="mb-4 p-4 rounded-lg bg-emerald-50/70 border border-emerald-300 shadow-sm animate-in fade-in duration-150">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="font-semibold text-xs text-emerald-900 tracking-wide uppercase">
              AI Co-Counsel Suggestion Ready for Integration
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInsertSuggestion}
              className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept & Insert</span>
            </button>
            <button
              onClick={onRejectSuggestedClause}
              className="px-3 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-red-200 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </div>

        <div className="font-serif text-xs leading-relaxed max-h-48 overflow-y-auto p-3 bg-white rounded border border-emerald-200 text-charcoal-800 whitespace-pre-wrap select-text">
          {diff.map((part, index) => (
            <span
              key={index}
              className={part.added ? 'bg-emerald-100 text-emerald-950 font-medium px-0.5 rounded' : ''}
            >
              {part.value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* 1. Legal Formatting Toolbar */}
      <div className="p-2 border-b border-charcoal-200 bg-canvas/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 text-xs font-semibold ${
              editor.isActive('heading', { level: 1 }) ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Heading 1 (Court Title)"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 text-xs font-semibold ${
              editor.isActive('heading', { level: 2 }) ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Heading 2 (Grounds / Prayer)"
          >
            H2
          </button>

          <span className="w-px h-4 bg-charcoal-300 mx-1" />

          {/* Inline Styles */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive('bold') ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive('italic') ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Italic (Statutory names & citations)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive('underline') ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Underline (Court prayer & headings)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-charcoal-300 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Justify (Standard Legal Pleading Alignment)"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Center (Headings & Captions)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-charcoal-300 mx-1" />

          {/* Numbered Paragraphs */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-charcoal-200 ${
              editor.isActive('orderedList') ? 'bg-navy-900 text-white' : 'text-charcoal-700'
            }`}
            title="Numbered Legal Paragraphs"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-charcoal-300 mx-1" />

          {/* Quick Legal Templates */}
          <button
            onClick={insertCauseTitle}
            className="px-2 py-1 text-[11px] font-medium text-navy-900 bg-white hover:bg-charcoal-100 rounded border border-charcoal-200"
            title="Insert Standard Court Header & Cause Title"
          >
            + Cause Title
          </button>
          <button
            onClick={insertVerificationClause}
            className="px-2 py-1 text-[11px] font-medium text-navy-900 bg-white hover:bg-charcoal-100 rounded border border-charcoal-200"
            title="Insert Indian Legal Deponent Verification Affidavit"
          >
            + Verification
          </button>
        </div>

        {/* Right side document actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyAll}
            className="p-1.5 rounded text-charcoal-600 hover:text-navy-900 hover:bg-charcoal-200 text-xs inline-flex items-center gap-1"
            title="Copy entire document text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 rounded text-charcoal-600 hover:text-navy-900 hover:bg-charcoal-200 text-xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Editor Canvas Sheet */}
      <div className="flex-1 overflow-y-auto p-6 bg-canvas/30">
        <div className="max-w-3xl mx-auto">
          {/* Diff preview banner if suggestion exists */}
          {renderDiff()}

          {/* The High-Contrast Editorial Legal Paper Sheet */}
          <div className="bg-white rounded-lg shadow-editor border border-charcoal-200/80 min-h-[750px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* 3. Editor Status Bar */}
      <div className="p-2.5 px-4 border-t border-charcoal-200 bg-canvas text-xs text-charcoal-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono">{wordCount} words</span>
          <span>•</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 350))} pages</span>
          <span>•</span>
          <span className="text-navy-900 font-medium">Standard A4 Legal Spacing (1.8x)</span>
        </div>
        <div className="flex items-center gap-2 text-charcoal-400">
          <Scale className="w-3.5 h-3.5 text-gold-500" />
          <span className="italic">Newsreader Editorial Typeface</span>
        </div>
      </div>
    </div>
  );
};
