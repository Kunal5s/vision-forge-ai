
'use client';

import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon,
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Palette, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';


const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) {
                    editor.chain().focus().setImage({ src }).run();
                }
            };
            reader.readAsDataURL(file);
        }
    }, [editor]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    if (!editor) {
        return null;
    }

    return (
        <div
            className="border-b bg-muted/50 p-2 flex items-center gap-1 flex-wrap"
        >
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={cn({'bg-background': editor.isActive('bold')})}>
                <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn({'bg-background': editor.isActive('italic')})}>
                <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn({'bg-background': editor.isActive('underline')})}>
                <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={setLink} className={cn({'bg-background': editor.isActive('link')})}>
                <LinkIcon className="h-4 w-4" />
            </Button>
             <Button variant="ghost" size="sm" onClick={handleImageClick}>
                <ImageIcon className="h-4 w-4" />
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <div className="h-6 border-l mx-1" />
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn({'bg-background': editor.isActive('heading', { level: 1 })})}>
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn({'bg-background': editor.isActive('heading', { level: 2 })})}>
                <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn({'bg-background': editor.isActive('heading', { level: 3 })})}>
                <Heading3 className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1" />
             <Button variant="ghost" size="sm" asChild>
                <label className="flex items-center gap-1 cursor-pointer">
                    <Palette className="h-4 w-4"/>
                    <input
                        type="color"
                        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="w-0 h-0 p-0 border-0 overflow-hidden"
                    />
                </label>
             </Button>
             <div className="h-6 border-l mx-1" />
             <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={cn({'bg-background': editor.isActive({ textAlign: 'left' })})}>
                <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={cn({'bg-background': editor.isActive({ textAlign: 'center' })})}>
                <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={cn({'bg-background': editor.isActive({ textAlign: 'right' })})}>
                <AlignRight className="h-4 w-4" />
            </Button>
        </div>
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
                bulletList: { keepMarks: true, keepAttributes: true },
                orderedList: { keepMarks: true, keepAttributes: true },
                codeBlock: false,
                blockquote: true,
                horizontalRule: true,
            }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image.configure({ inline: false, allowBase64: true }),
            Placeholder.configure({ placeholder }),
            FontFamily,
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
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
                    "min-h-[250px] w-full bg-background p-4 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none",
                    "prose dark:prose-invert max-w-full"
                ),
            },
        },
    });
    
    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
