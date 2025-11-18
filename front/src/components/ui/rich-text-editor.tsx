import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function RichTextEditor({ content, onChange, className }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
    },
  });

  // Sincronizar conteúdo quando a prop muda
  useEffect(() => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    const normalizedCurrent = currentContent === '<p></p>' ? '' : currentContent;
    const normalizedNew = content === '<p></p>' ? '' : content;
    
    if (normalizedNew !== normalizedCurrent) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor || uploadingRef.current) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
      });
      return;
    }

    uploadingRef.current = true;

    try {
      toast({
        title: 'Enviando imagem...',
        description: 'Aguarde enquanto fazemos o upload.',
      });

      // Upload para S3 via API
      const formData = new FormData();
      formData.append('imagens', file);

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.urls[0];

      // Inserir imagem no editor
      editor.chain().focus().setImage({ src: imageUrl }).run();

      toast({
        title: 'Imagem inserida!',
        description: 'A imagem foi adicionada ao conteúdo.',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar imagem',
        description: 'Não foi possível fazer upload da imagem. Tente novamente.',
      });
    } finally {
      uploadingRef.current = false;
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-md', className)}>
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingRef.current}
          title="Inserir imagem"
        >
          {uploadingRef.current ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="bg-background" />
    </div>
  );
}