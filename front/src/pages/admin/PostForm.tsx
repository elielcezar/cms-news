import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsService } from '@/services/posts.service';
import { sitesService } from '@/services/sites.service';
import { tagsService } from '@/services/tags.service';
import { PostFormData } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, X, Upload } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PostFormData>({
    titulo: '',
    chamada: '',
    conteudo: '',
    urlAmigavel: '',
    status: 'RASCUNHO',
    destaque: false,
    dataPublicacao: '',
    sites: [],
    tags: [],
    imagens: [],
    oldImages: [],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Buscar sites
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesService.getAll(),
  });

  // Buscar tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsService.getAll(),
  });

  // Buscar post se for edição
  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (post && isEdit) {
      const sitesIds = post.sites?.map(s => s.site.id) || [];
      const tagsIds = post.tags?.map(t => t.tag.id) || [];
      
      setFormData({
        titulo: post.titulo,
        chamada: post.chamada,
        conteudo: post.conteudo,
        urlAmigavel: post.urlAmigavel,
        status: post.status,
        destaque: post.destaque,
        dataPublicacao: post.dataPublicacao || '',
        sites: sitesIds,
        tags: tagsIds,
        imagens: [],
        oldImages: post.imagens || [],
      });
      setPreviewImages(post.imagens || []);
      setSelectedSites(sitesIds);
      setSelectedTags(tagsIds);
    }
  }, [post, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: PostFormData) => postsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: 'Post criado',
        description: 'O post foi criado com sucesso.',
      });
      navigate('/admin/posts');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar post',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: Partial<PostFormData>) => 
      postsService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast({
        title: 'Post atualizado',
        description: 'O post foi atualizado com sucesso.',
      });
      navigate('/admin/posts');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar post',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      sites: selectedSites,
      tags: selectedTags,
    };

    console.log('📤 Enviando formulário com dados:', dataToSubmit);

    if (isEdit) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleChange = (field: keyof PostFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Gerar slug automaticamente do título
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, ''); // Remove hífens do início e fim
  };

  const handleTituloChange = (value: string) => {
    handleChange('titulo', value);
    // Auto-gerar slug se estiver vazio ou for novo post
    if (!isEdit || !formData.urlAmigavel) {
      handleChange('urlAmigavel', generateSlug(value));
    }
  };

  // Handler para upload de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentTotal = (formData.imagens?.length || 0) + (formData.oldImages?.length || 0);
    
    if (currentTotal + newFiles.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Limite de imagens',
        description: 'Você pode adicionar no máximo 18 imagens.',
      });
      return;
    }

    // Validar tamanho dos arquivos (10MB)
    const maxSize = 10 * 1024 * 1024;
    const filesTooLarge = newFiles.filter(file => file.size > maxSize);
    
    if (filesTooLarge.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: `${filesTooLarge.length} arquivo(s) excede(m) o limite de 10MB.`,
      });
      e.target.value = '';
      return;
    }

    // Validar tipos de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = newFiles.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Apenas JPEG, JPG, PNG e WEBP são permitidos.',
      });
      e.target.value = '';
      return;
    }

    // Adicionar novas imagens
    setFormData(prev => ({
      ...prev,
      imagens: [...(prev.imagens || []), ...newFiles],
    }));

    // Criar previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Remover imagem
  const handleRemoveImage = (index: number) => {
    const totalOldImages = formData.oldImages?.length || 0;
    
    if (index < totalOldImages) {
      setFormData(prev => ({
        ...prev,
        oldImages: prev.oldImages?.filter((_, i) => i !== index),
      }));
    } else {
      const newIndex = index - totalOldImages;
      setFormData(prev => ({
        ...prev,
        imagens: prev.imagens?.filter((_, i) => i !== newIndex),
      }));
    }

    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle site
  const toggleSite = (siteId: number) => {
    setSelectedSites(prev => 
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  // Toggle tag
  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/posts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Post' : 'Novo Post'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações do post' : 'Preencha os dados do novo post'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Digite o título do post"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urlAmigavel">URL Amigável *</Label>
              <Input
                id="urlAmigavel"
                value={formData.urlAmigavel}
                onChange={(e) => handleChange('urlAmigavel', e.target.value)}
                required
                disabled={isLoading}
                placeholder="titulo-do-post"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Use apenas letras minúsculas, números e hífens"
              />
              <p className="text-sm text-muted-foreground">
                Slug para URL (ex: meu-primeiro-post). Gerado automaticamente do título.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chamada">Chamada *</Label>
              <Textarea
                id="chamada"
                value={formData.chamada}
                onChange={(e) => handleChange('chamada', e.target.value)}
                required
                disabled={isLoading}
                rows={3}
                placeholder="Resumo ou chamada do post (aparece nas listagens)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <RichTextEditor
                content={formData.conteudo}
                onChange={(html) => handleChange('conteudo', html)}
                className={isLoading ? 'opacity-50 pointer-events-none' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Use o editor para formatar o texto com negrito, itálico, listas e mais.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'RASCUNHO' | 'PUBLICADO') => handleChange('status', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                    <SelectItem value="PUBLICADO">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataPublicacao">Data de Publicação</Label>
                <Input
                  id="dataPublicacao"
                  type="datetime-local"
                  value={formData.dataPublicacao}
                  onChange={(e) => handleChange('dataPublicacao', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Destaque</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="destaque"
                    checked={formData.destaque}
                    onCheckedChange={(checked) => handleChange('destaque', checked)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="destaque"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Marcar como destaque
                  </label>
                </div>
              </div>
            </div>

            {/* Sites */}
            <div className="space-y-2">
              <Label>Sites</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sites?.map((site) => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => toggleSite(site.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`site-${site.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {site.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tags?.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tag.nome}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload de Imagens */}
            <div className="space-y-2">
              <Label>Imagens (máximo 18 arquivos, 10MB por arquivo)</Label>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPEG, JPG, PNG, WEBP
              </p>
              <div className="space-y-4">
                {/* Preview de imagens */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de upload */}
                <div className="flex items-center gap-4">
                  <Input
                    id="imagens"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isLoading || previewImages.length >= 18}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imagens')?.click()}
                    disabled={isLoading || previewImages.length >= 18}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Imagens
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {previewImages.length} / 18 imagens
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Post'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/posts')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

