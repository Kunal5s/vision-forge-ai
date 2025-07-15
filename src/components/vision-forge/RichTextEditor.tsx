
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon, 
    List, ListOrdered, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ToolbarButton = ({ onClick, children, isActive = false, title }: { onClick: () => void, children: React.ReactNode, isActive?: boolean, title?: string }) => (
    <Button
        type="button"
        onClick={onClick}
        variant={isActive ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        title={title}
    >
        {children}
    </Button>
);

const EditorToolbar = ({ editor, simpleToolbar }: { editor: Editor | null, simpleToolbar?: boolean }) => {
    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    if (!editor) return null;

    if (simpleToolbar) {
        return (
             <div className="border border-input rounded-t-md p-1 flex flex-wrap items-center gap-1">
                <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
                <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive('link')}><LinkIcon className="h-4 w-4" /></ToolbarButton>
            </div>
        )
    }

    return (
        <div className="border border-input rounded-t-md p-1 flex flex-wrap items-center gap-1">
            <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive('link')}><LinkIcon className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}><Heading3 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Image" onClick={addImage}><ImageIcon className="h-4 w-4" /></ToolbarButton>
        </div>
    );
};


interface RichTextEditorProps {
    value: string;
    onChange: (richText: string) => void;
    disabled?: boolean;
    simpleToolbar?: boolean;
}

export function RichTextEditor({ value, onChange, disabled, simpleToolbar }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            Image.configure({
                inline: false,
            }),
            Placeholder.configure({
                placeholder: simpleToolbar ? 'Write your conclusion...' : 'Start writing your article...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !disabled,
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[150px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "prose dark:prose-invert max-w-full"
                ),
            },
        },
    });

    return (
        <div className="mt-2">
            <EditorToolbar editor={editor} simpleToolbar={simpleToolbar} />
            <EditorContent editor={editor} />
        </div>
    );
}
