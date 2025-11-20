import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsService } from '@/services/posts.service';
import { categoriasService } from '@/services/categorias.service';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, X, Upload, Globe } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [currentLang, setCurrentLang] = useState<'pt' | 'en' | 'es'>('pt');
  const [formData, setFormData] = useState<PostFormData>({
    titulo: '',
    chamada: '',
    conteudo: '',
    urlAmigavel: '',
    status: 'RASCUNHO',
    destaque: false,
    dataPublicacao: new Date().toISOString().slice(0, 16), // Data atual no formato datetime-local
    categorias: [],
    tags: [],
    imagens: [],
    oldImages: [],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['pt']);

  // Buscar categorias (sempre em PT no admin)
  const { data: categorias } = useQuery({
    queryKey: ['categorias', 'pt'],
    queryFn: () => categoriasService.getAll('pt'),
  });

  // Buscar tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsService.getAll(),
  });

  // Buscar post se for edição (com idioma atual)
  const { data: post, refetch: refetchPost } = useQuery({
    queryKey: ['post', id, currentLang],
    queryFn: () => postsService.getById(Number(id), currentLang),
    enabled: isEdit && !!id,
  });

  // Recarregar tradução ao trocar idioma
  useEffect(() => {
    if (isEdit && id) {
      refetchPost();
    }
  }, [currentLang, isEdit, id, refetchPost]);

  useEffect(() => {
    if (post && isEdit) {
      const categoriasIds = post.categorias?.map(c => c.categoria.id) || [];
      const tagsIds = post.tags?.map(t => t.tag.id) || [];
      
      // Idiomas disponíveis (traduções existentes)
      const langs = post.translations?.map(t => t.idioma) || ['pt'];
      setAvailableLanguages(langs);
      
      // Converter data para formato datetime-local (YYYY-MM-DDTHH:mm)
      let dataFormatada = '';
      if (post.dataPublicacao) {
        const date = new Date(post.dataPublicacao);
        dataFormatada = date.toISOString().slice(0, 16); // Remove segundos e timezone
      }
      
      setFormData({
        titulo: post.titulo || '',
        chamada: post.chamada || '',
        conteudo: post.conteudo || '',
        urlAmigavel: post.urlAmigavel || '',
        status: post.status,
        destaque: post.destaque,
        dataPublicacao: dataFormatada,
        categorias: categoriasIds,
        tags: tagsIds,
        imagens: [],
        oldImages: post.imagens || [],
      });
      setPreviewImages(post.imagens || []);
      setSelectedCategorias(categoriasIds);
      setSelectedTags(tagsIds);
    }
  }, [post, isEdit]);

  // Preencher formulário com dados da pauta (se vier de conversão)
  useEffect(() => {
    const pautaData = location.state?.fromPauta;
    if (pautaData && !isEdit) {
      setFormData(prev => ({
        ...prev,
        titulo: pautaData.titulo || '',
        chamada: pautaData.chamada || '',
        conteudo: pautaData.conteudo || '',
      }));
      
      // Auto-gerar slug do título
      if (pautaData.titulo) {
        const slug = generateSlug(pautaData.titulo);
        setFormData(prev => ({ ...prev, urlAmigavel: slug }));
      }

      // Selecionar site se fornecido
      if (pautaData.siteId) {
        // Pautas não têm mais relacionamento com categorias
      }

      toast({
        title: 'Dados carregados da pauta',
        description: 'O formulário foi preenchido com os dados da sugestão de pauta.',
      });
    }
  }, [location.state, isEdit, toast]);

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
      postsService.update(Number(id), data, currentLang),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      toast({
        title: 'Post atualizado',
        description: `Tradução em ${currentLang.toUpperCase()} atualizada com sucesso.`,
      });
      // Não redirecionar - permite editar outros idiomas
      refetchPost();
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
      categorias: selectedCategorias,
      tags: selectedTags,
    };

    console.log('📤 Enviando formulário com dados:', dataToSubmit);

    if (isEdit) {
      updateMutation.mutate(dataToSubmit);
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleChange = (field: keyof PostFormData, value: string | boolean | number | File[] | string[]) => {
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

  // Handler para upload de imagem de capa
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Apenas primeira imagem

    // Validar tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'A imagem não pode exceder 10MB.',
      });
      e.target.value = '';
      return;
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Apenas JPEG, JPG, PNG e WEBP são permitidos.',
      });
      e.target.value = '';
      return;
    }

    // Substituir imagem (apenas 1)
    setFormData(prev => ({
      ...prev,
      imagens: [file],
      oldImages: [], // Limpar imagem antiga
    }));

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImages([reader.result as string]);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Remover imagem de capa
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imagens: [],
      oldImages: [],
    }));
    setPreviewImages([]);
  };

  // Toggle categoria
  const toggleCategoria = (categoriaId: number) => {
    setSelectedCategorias(prev => 
      prev.includes(categoriaId)
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Post' : 'Novo Post'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações do post' : 'Preencha os dados do novo post'}
          </p>
        </div>
      </div>

      {/* Seletor de Idioma */}
      {isEdit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Idioma da Edição:</Label>
              <Tabs value={currentLang} onValueChange={(val) => setCurrentLang(val as 'pt' | 'en' | 'es')}>
                <TabsList>
                  <TabsTrigger value="pt" className="gap-2">
                    🇧🇷 PT
                    {availableLanguages.includes('pt') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="en" className="gap-2">
                    🇺🇸 EN
                    {availableLanguages.includes('en') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="es" className="gap-2">
                    🇪🇸 ES
                    {availableLanguages.includes('es') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {!availableLanguages.includes(currentLang) && (
                <Badge variant="destructive">Nova Tradução</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Post {isEdit && `(${currentLang.toUpperCase()})`}</CardTitle>
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
                placeholder={isEdit ? `${currentLang}/titulo-do-post` : "titulo-do-post"}
                pattern="^([a-z]{2}/)?[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Use formato: pt/titulo-do-post ou apenas titulo-do-post"
              />
              <p className="text-sm text-muted-foreground">
                {isEdit 
                  ? `Slug com idioma (ex: ${currentLang}/meu-post). O prefixo ${currentLang}/ é adicionado automaticamente.`
                  : 'Slug para URL (ex: meu-primeiro-post). Gerado automaticamente do título.'
                }
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

            {/* Imagem de Capa */}
            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPEG, JPG, PNG, WEBP (máximo 10MB)
              </p>
              <div className="space-y-4">
                {/* Preview da imagem */}
                {previewImages.length > 0 && (
                  <div className="relative w-full max-w-md">
                    <img
                      src={previewImages[0]}
                      alt="Imagem de capa"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Input de upload */}
                {previewImages.length === 0 && (
                  <div className="flex items-center gap-4">
                    <Input
                      id="imagem-capa"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imagem-capa')?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Imagem de Capa
                    </Button>
                  </div>
                )}
              </div>
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

            {/* Categorias */}
            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categorias?.map((categoria) => (
                  <div key={categoria.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`categoria-${categoria.id}`}
                      checked={selectedCategorias.includes(categoria.id)}
                      onCheckedChange={() => toggleCategoria(categoria.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`categoria-${categoria.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {categoria.nome}
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

