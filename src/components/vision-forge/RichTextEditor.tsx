
'use client';

import { useEditor, EditorContent, BubbleMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, 
    Heading1, Heading2, Heading3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Surface } from "@/components/ui/surface";

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

interface RichTextEditorProps {
    value: string;
    onChange: (richText: string) => void;
    disabled?: boolean;
}

export function RichTextEditor({ value, onChange, disabled }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
            }),
            Image.configure({
                inline: false,
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder: 'Write your article here...',
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
                    "min-h-[400px] w-full bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none",
                    "prose dark:prose-invert max-w-full"
                ),
            },
        },
    });

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
        <div className="relative border rounded-lg">
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <Surface className="p-1 flex items-center gap-1">
                        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive('link')}><LinkIcon className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></ToolbarButton>
                        <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}><Heading3 className="h-4 w-4" /></ToolbarButton>
                    </Surface>
                </BubbleMenu>
            )}
            <EditorContent editor={editor} />
        </div>
    );
}
