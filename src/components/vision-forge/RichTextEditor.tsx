
'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Palette, Pilcrow, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Surface } from "@/components/ui/surface";
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';

const ToolbarButton = ({ onClick, children, isActive = false, title }: { onClick: React.MouseEventHandler<HTMLButtonElement>, children: React.ReactNode, isActive?: boolean, title?: string }) => (
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

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
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

    if (!editor) {
        return null;
    }

    return (
        <Surface className="p-1 flex items-center gap-1 flex-wrap border-b rounded-b-none">
            <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive('link')}><LinkIcon className="h-4 w-4" /></ToolbarButton>
            
            <div className="h-6 border-l mx-1" />

            <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}><Heading3 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Heading 4" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} isActive={editor.isActive('heading', { level: 4 })}><Heading4 className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')}><Pilcrow className="h-4 w-4" /></ToolbarButton>

             <div className="h-6 border-l mx-1" />

            <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}><AlignLeft className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}><AlignCenter className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton title="Align Right" onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}><AlignRight className="h-4 w-4" /></ToolbarButton>
            
            <div className="h-6 border-l mx-1" />
            
            <div className="flex items-center">
                <input
                    type="color"
                    onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                    value={editor.getAttributes('textStyle').color || '#000000'}
                    className="w-8 h-8 p-1 border-none bg-transparent cursor-pointer"
                    title="Text Color"
                />
            </div>
        </Surface>
    );
};


interface RichTextEditorProps {
    value: string;
    onChange: (richText: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, disabled, placeholder = "Start writing..." }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image.configure({ inline: false, allowBase64: true }),
            Placeholder.configure({ placeholder }),
            TextStyle,
            Color,
            FontFamily,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !disabled,
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[250px] w-full bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none",
                    "prose dark:prose-invert max-w-full"
                ),
            },
        },
    });
    
    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
