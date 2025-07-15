
'use client';

import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
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
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background border rounded-md shadow-lg p-1 flex items-center gap-1"
        >
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={cn({'bg-muted': editor.isActive('bold')})}>
                <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn({'bg-muted': editor.isActive('italic')})}>
                <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn({'bg-muted': editor.isActive('underline')})}>
                <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={setLink} className={cn({'bg-muted': editor.isActive('link')})}>
                <LinkIcon className="h-4 w-4" />
            </Button>
             <div className="h-6 border-l mx-1" />
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn({'bg-muted': editor.isActive('heading', { level: 1 })})}>
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn({'bg-muted': editor.isActive('heading', { level: 2 })})}>
                <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn({'bg-muted': editor.isActive('heading', { level: 3 })})}>
                <Heading3 className="h-4 w-4" />
            </Button>
        </BubbleMenu>
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
                // Disable other starter kit features if not needed to keep it clean
                bulletList: false,
                orderedList: false,
                codeBlock: false,
                blockquote: false,
                horizontalRule: false,
            }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image.configure({ inline: false, allowBase64: true }),
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !disabled,
        editorProps: {
            attributes: {
                class: cn(
                    "min-h-[250px] w-full bg-background p-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none",
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
