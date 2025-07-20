
'use client';

import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, ImageIcon,
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Palette, AlignLeft, AlignCenter, AlignRight, Pilcrow, List, ListOrdered, Quote, Code, Table as TableIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Dropcursor from '@tiptap/extension-dropcursor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { Markdown } from 'tiptap-markdown';


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

    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Inter';

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
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().setParagraph().run()} className={cn({'bg-background': editor.isActive('paragraph')})}>
                <Pilcrow className="h-4 w-4" />
            </Button>
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
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn({'bg-background': editor.isActive('bulletList')})}>
                <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn({'bg-background': editor.isActive('orderedList')})}>
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={cn({'bg-background': editor.isActive('blockquote')})}>
                <Quote className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={cn({'bg-background': editor.isActive('codeBlock')})}>
                <Code className="h-4 w-4" />
            </Button>
             <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                <TableIcon className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1" />
            <Select value={currentFont} onValueChange={value => editor.chain().focus().setFontFamily(value).run()}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
            </Select>
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
                heading: { 
                    levels: [1, 2, 3, 4, 5, 6], 
                    HTMLAttributes: { class: 'font-bold' } 
                },
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
                blockquote: true,
                bold: true,
                code: true,
                codeBlock: true,
                italic: true,
                strike: true,
            }),
            Markdown,
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                  class: 'rounded-lg shadow-md mx-auto',
                },
            }).extend({
                addOptions() {
                    return {
                        ...this.parent?.(),
                        allowBase64: true,
                    }
                },
            }),
            Placeholder.configure({ placeholder }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Dropcursor.configure({
                color: '#4094F7',
                width: 2,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
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
             {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-foreground text-background p-1 rounded-md flex gap-1 items-center">
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()} className={cn("hover:bg-background/20 text-sm", { 'bg-background/20': editor.isActive('bold') })}>
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('italic') })}>
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('underline') })}>
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                    <div className="h-5 border-l border-background/50 mx-1" />
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 1}) })}>H1</Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 2}) })}>H2</Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 3}) })}>H3</Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 4}) })}>H4</Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 5}) })}>H5</Button>
                    <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} className={cn("hover:bg-background/20 text-sm",{ 'bg-background/20': editor.isActive('heading', { level: 6}) })}>H6</Button>
                </BubbleMenu>
            )}
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
