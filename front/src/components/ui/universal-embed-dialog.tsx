import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Code, Video } from 'lucide-react';
import { detectEmbedPlatform, validateEmbedHTML, extractEmbedInfo } from './tiptap-extensions/embed-utils';

interface UniversalEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (html: string, platform: string) => void;
}

export function UniversalEmbedDialog({
  open,
  onOpenChange,
  onInsert,
}: UniversalEmbedDialogProps) {
  const [embedCode, setEmbedCode] = useState('');
  const [error, setError] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string>('');

  const handleCodeChange = (value: string) => {
    setEmbedCode(value);
    setError('');
    
    // Detectar plataforma automaticamente
    if (value.trim()) {
      const platform = detectEmbedPlatform(value);
      setDetectedPlatform(platform);
    } else {
      setDetectedPlatform('');
    }
  };

  const handleInsert = () => {
    setError('');

    if (!embedCode.trim()) {
      setError('Por favor, cole o código de embed');
      return;
    }

    // Validar HTML
    const validation = validateEmbedHTML(embedCode);
    if (!validation.valid) {
      setError(validation.error || 'Código de embed inválido');
      return;
    }

    // Extrair informações
    const info = extractEmbedInfo(embedCode);

    // Inserir no editor
    onInsert(embedCode, info.platform);

    // Limpar e fechar
    setEmbedCode('');
    setDetectedPlatform('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEmbedCode('');
    setDetectedPlatform('');
    setError('');
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter para inserir
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleInsert();
    }
  };

  const getPlatformBadge = () => {
    if (!detectedPlatform || detectedPlatform === 'generic') {
      return null;
    }

    const platformNames: Record<string, string> = {
      youtube: '📹 YouTube',
      tiktok: '🎵 TikTok',
      instagram: '📷 Instagram',
      spotify: '🎧 Spotify',
      soundcloud: '🎵 SoundCloud',
    };

    return (
      <Badge variant="secondary" className="mt-2">
        {platformNames[detectedPlatform] || detectedPlatform}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Inserir Embed
          </DialogTitle>
          <DialogDescription>
            Cole o código de embed oficial da plataforma (YouTube, TikTok, Instagram, Spotify, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="embed-code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Código de Embed
            </Label>
            <Textarea
              id="embed-code"
              placeholder={`Cole aqui o código HTML do embed, por exemplo:

<blockquote class="tiktok-embed" ...>
  ...conteúdo...
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>

ou

<iframe src="https://www.youtube.com/embed/..." ...></iframe>`}
              value={embedCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Copie o código de embed oficial do site da plataforma (botão "Compartilhar" → "Embed")
            </p>
            {getPlatformBadge()}
          </div>

          {/* Instruções */}
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-2">
            <p className="font-medium">Como obter o código de embed:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              <li><strong>YouTube:</strong> Vídeo → Compartilhar → Incorporar → Copiar código</li>
              <li><strong>TikTok:</strong> Vídeo → ... → Embed → Copiar código</li>
              <li><strong>Instagram:</strong> Post → ... → Embed → Copiar código</li>
              <li><strong>Spotify:</strong> Música/Playlist → ... → Share → Embed → Copiar código</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleInsert} disabled={!embedCode.trim()}>
            Inserir Embed
          </Button>
        </DialogFooter>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <p><strong>Atalho:</strong> Ctrl+Enter para inserir</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

