import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Code2,
  FileCode,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { RawEmbed } from './tiptap-extensions/raw-embed';
import { loadPlatformScripts } from './tiptap-extensions/embed-utils';
import { UniversalEmbedDialog } from './universal-embed-dialog';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

// Tipagem para scripts de embed
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
    tiktokEmbed?: {
      lib: {
        render: () => void;
      };
    };
  }
}

export function RichTextEditor({ content, onChange, className }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadingRef = useRef(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(content);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);

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
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      RawEmbed.configure({
        inline: false,
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
      setHtmlContent(content || '');
    }
  }, [content, editor]);

  // Alternar entre modo visual e HTML
  const toggleHtmlMode = () => {
    if (!editor) return;

    if (isHtmlMode) {
      // Voltando para modo visual: aplicar HTML editado
      editor.commands.setContent(htmlContent);
      onChange(htmlContent);
    } else {
      // Indo para modo HTML: pegar HTML atual
      setHtmlContent(editor.getHTML());
    }
    
    setIsHtmlMode(!isHtmlMode);
  };

  // Atualizar HTML enquanto edita no modo HTML
  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    onChange(value);
  };

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

  // Handler para inserir embed genérico
  const handleInsertEmbed = (html: string, platform: string) => {
    if (!editor) return;
    
    editor.chain().focus().setRawEmbed({ html, platform }).run();
    
    // Carregar scripts necessários para a plataforma
    loadPlatformScripts(platform);
    
    const platformNames: Record<string, string> = {
      youtube: 'YouTube',
      tiktok: 'TikTok',
      instagram: 'Instagram',
      spotify: 'Spotify',
      soundcloud: 'SoundCloud',
      generic: 'Embed',
    };
    
    toast({
      title: `${platformNames[platform] || 'Embed'} inserido!`,
      description: platform === 'instagram' 
        ? 'Nota: Embeds do Instagram podem não aparecer em localhost.'
        : 'O embed foi adicionado ao conteúdo.',
    });
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
          onClick={toggleHtmlMode}
          className={isHtmlMode ? 'bg-accent' : ''}
          title={isHtmlMode ? 'Modo Visual' : 'Editar HTML'}
        >
          <FileCode className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          disabled={isHtmlMode}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
          title="Alinhar à esquerda"
          disabled={isHtmlMode}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
          title="Centralizar"
          disabled={isHtmlMode}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
          title="Alinhar à direita"
          disabled={isHtmlMode}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-accent' : ''}
          title="Código inline"
          disabled={isHtmlMode}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
          title="Bloco de código"
          disabled={isHtmlMode}
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingRef.current || isHtmlMode}
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
          onClick={() => setEmbedDialogOpen(true)}
          disabled={isHtmlMode}
          title="Inserir Embed (YouTube, TikTok, Instagram, Spotify...)"
        >
          <Video className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || isHtmlMode}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || isHtmlMode}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {isHtmlMode ? (
        <Textarea
          value={htmlContent}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm p-3 resize-none rounded-t-none border-0 focus-visible:ring-0"
          placeholder="Cole aqui o HTML (ex: iframe do YouTube, Instagram, etc.)"
        />
      ) : (
        <EditorContent editor={editor} className="bg-background" />
      )}

      <UniversalEmbedDialog
        open={embedDialogOpen}
        onOpenChange={setEmbedDialogOpen}
        onInsert={handleInsertEmbed}
      />
    </div>
  );
}