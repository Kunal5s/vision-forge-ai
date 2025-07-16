
'use client';

import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useRef, useState } from 'react';
import { 
    Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon,
    Heading1, Heading2, Heading3, Palette, AlignLeft, AlignCenter, AlignRight, Sparkles, Pilcrow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { humanizeTextAction } from '@/app/admin/dashboard/create/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Dropcursor from '@tiptap/extension-dropcursor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


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


const AIHumanizerMenu = ({ editor }: { editor: Editor }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleHumanize = async () => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');

        if (!text) {
            toast({ title: "No Text Selected", description: "Please select text to humanize.", variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        const result = await humanizeTextAction(text);
        setIsLoading(false);

        if (result.success && result.humanizedText) {
            editor.chain().focus().deleteRange({ from, to }).insertContent(result.humanizedText).run();
            toast({ title: "Text Humanized!", description: "AI has improved the selected text." });
        } else {
            toast({ title: "Error", description: result.error || "Failed to humanize text.", variant: 'destructive' });
        }
    };

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background border rounded-lg shadow-xl p-1 flex items-center gap-1"
        >
            <Button
                onClick={handleHumanize}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="h-4 w-4" />
                )}
                Humanize
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
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
                codeBlock: false,
                blockquote: true,
                horizontalRule: true,
            }),
            Underline,
            Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                  class: 'rounded-lg shadow-md mx-auto',
                },
            }),
            Placeholder.configure({ placeholder }),
            FontFamily.configure({
                types: ['textStyle'],
            }),
            TextStyle,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            Dropcursor.configure({
                color: '#4094F7',
                width: 2,
            })
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
            <AIHumanizerMenu editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
