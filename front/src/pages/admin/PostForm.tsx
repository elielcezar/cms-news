import { useEffect, useState, useRef } from 'react';
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
import { ArrowLeft, Loader2, X, Upload, Globe, Languages } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from '@/components/ui/tag-input';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [currentLang, setCurrentLang] = useState<'pt' | 'en' | 'es'>('pt');
  const initialRedirectDone = useRef(false);

  // Estado separado por idioma
  const [translationsData, setTranslationsData] = useState<{
    pt: { titulo: string; chamada: string; conteudo: string; urlAmigavel: string };
    en: { titulo: string; chamada: string; conteudo: string; urlAmigavel: string };
    es: { titulo: string; chamada: string; conteudo: string; urlAmigavel: string };
  }>({
    pt: { titulo: '', chamada: '', conteudo: '', urlAmigavel: '' },
    en: { titulo: '', chamada: '', conteudo: '', urlAmigavel: '' },
    es: { titulo: '', chamada: '', conteudo: '', urlAmigavel: '' },
  });

  // Dados comuns (compartilhados entre idiomas)
  const [commonData, setCommonData] = useState({
    status: 'RASCUNHO' as 'RASCUNHO' | 'PUBLICADO',
    destaque: false,
    dataPublicacao: new Date().toISOString().slice(0, 16),
    imagens: [] as File[],
    oldImages: [] as string[],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['pt']);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isGeneratingTranslations, setIsGeneratingTranslations] = useState(false);

  // Buscar categorias (sempre em PT no admin)
  const { data: categorias } = useQuery({
    queryKey: ['categorias', 'pt'],
    queryFn: () => categoriasService.getAll('pt'),
  });

  // Buscar tags para autocomplete
  const { data: tagSuggestions = [] } = useQuery({
    queryKey: ['tags', 'search', tagSearchQuery],
    queryFn: () => tagsService.search(tagSearchQuery),
    enabled: tagSearchQuery.length > 0,
  });

  // Buscar todas as tags (para carregar tags existentes do post)
  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsService.getAll(),
  });

  // Buscar post se for edição (com idioma atual)
  // Buscar post se for edição (carrega TODAS as traduções de uma vez)
  const { data: post, refetch: refetchPost } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  // useEffect de refetch removido pois não é mais necessário recarregar ao trocar idioma

  useEffect(() => {
    if (post && isEdit) {
      console.log('📦 Post carregado:', {
        id: post.id,
        idiomaDefault: post.idiomaDefault,
        translations: post.translations,
        titulo: post.titulo
      });

      const categoriasIds = post.categorias?.map(c => c.categoria.id) || [];
      // Converter IDs de tags para nomes
      const tagNamesFromPost = post.tags?.map(t => {
        // Suportar ambos os formatos: { id, tag: { nome } } ou { id, nome }
        if ('nome' in t && typeof t.nome === 'string') {
          return t.nome;
        }
        if ('tag' in t && t.tag && 'nome' in t.tag) {
          return t.tag.nome;
        }
        return '';
      }).filter(Boolean) || [];

      // Idiomas disponíveis (traduções existentes)
      const langs = post.translations?.map(t => t.idioma) || post.translationsAvailable || [];
      // Se não houver traduções listadas, assume-se o idioma padrão do post
      const availableLangs = langs.length > 0 ? langs : [post.idiomaDefault || 'pt'];

      setAvailableLanguages(availableLangs);

      // IMPORTANTE: Primeiro, processar TODAS as traduções disponíveis
      // Isso garante que os dados estejam prontos independente do idioma selecionado
      setTranslationsData(prev => {
        const newData = { ...prev };

        // Preencher dados de cada tradução disponível
        if (post.translations && post.translations.length > 0) {
          console.log('🔄 Processando traduções:', post.translations);
          post.translations.forEach(t => {
            console.log(`  ➡️ Tradução [${t.idioma}]:`, t);
            if (t.idioma === 'pt' || t.idioma === 'en' || t.idioma === 'es') {
              newData[t.idioma] = {
                titulo: t.titulo || '',
                chamada: t.chamada || '',
                conteudo: t.conteudo || '',
                urlAmigavel: t.urlAmigavel || '',
              };
            }
          });
        }

        return newData;
      });

      // Se o idioma atual não está entre os disponíveis, mudar para o primeiro disponível
      // Isso evita mostrar aba vazia quando o post foi criado em outro idioma
      // MAS apenas na primeira carga, para permitir que o usuário mude de aba para criar tradução
      if (!initialRedirectDone.current && langs.length > 0 && !langs.includes(currentLang)) {
        // Preferir o idioma padrão do post, senão usar o primeiro disponível
        const targetLang = (post.idiomaDefault && langs.includes(post.idiomaDefault)) 
          ? post.idiomaDefault as 'pt' | 'en' | 'es'
          : langs[0] as 'pt' | 'en' | 'es';
        console.log(`🔄 Redirecionando para idioma: ${targetLang} (idiomaDefault: ${post.idiomaDefault})`);
        setCurrentLang(targetLang);
      }
      
      // Marcar como feito após primeira carga
      initialRedirectDone.current = true;

      // Converter data para formato datetime-local (YYYY-MM-DDTHH:mm)
      let dataFormatada = '';
      if (post.dataPublicacao) {
        const date = new Date(post.dataPublicacao);
        dataFormatada = date.toISOString().slice(0, 16); // Remove segundos e timezone
      }

      // Atualizar dados comuns
      setCommonData({
        status: post.status,
        destaque: post.destaque,
        dataPublicacao: dataFormatada,
        imagens: [],
        oldImages: post.imagens || [],
      });

      setPreviewImages(post.imagens || []);
      setSelectedCategorias(categoriasIds);
      setTagNames(tagNamesFromPost);
    }
  }, [post, isEdit]);

  // Preencher formulário com dados da pauta (se vier de conversão)
  useEffect(() => {
    const pautaData = location.state?.fromPauta;
    if (pautaData && !isEdit) {
      setTranslationsData(prev => ({
        ...prev,
        [currentLang]: {
          ...prev[currentLang],
          titulo: pautaData.titulo || '',
          chamada: pautaData.chamada || '',
          conteudo: pautaData.conteudo || '',
        }
      }));

      // Auto-gerar slug do título
      if (pautaData.titulo) {
        const slug = generateSlug(pautaData.titulo);
        const slugWithLang = `${currentLang}/${slug}`;
        setTranslationsData(prev => ({
          ...prev,
          [currentLang]: {
            ...prev[currentLang],
            urlAmigavel: slugWithLang
          }
        }));
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

  // Atualizar campo de idioma específico
  const updateTranslation = (
    lang: 'pt' | 'en' | 'es',
    field: 'titulo' | 'chamada' | 'conteudo' | 'urlAmigavel',
    value: string
  ) => {
    setTranslationsData(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  // Verificar se um idioma tem conteúdo
  const hasContent = (lang: 'pt' | 'en' | 'es') => {
    const data = translationsData[lang];
    return !!(data.titulo && data.chamada && data.conteudo);
  };

  // Obter idiomas preenchidos
  const getFilledLanguages = (): ('pt' | 'en' | 'es')[] => {
    return (['pt', 'en', 'es'] as const).filter(lang => hasContent(lang));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que pelo menos 1 idioma foi preenchido
    const filledLangs = getFilledLanguages();
    if (filledLangs.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum idioma preenchido',
        description: 'Preencha pelo menos um idioma antes de salvar.',
      });
      return;
    }

    try {
      const tagIds = await tagsService.resolveTagIds(tagNames);

      if (isEdit) {
        // Modo edição: salvar apenas o idioma atual
        const dataToSubmit = {
          ...translationsData[currentLang],
          ...commonData,
          categorias: selectedCategorias || [],
          tags: tagIds || [],
        };
        updateMutation.mutate(dataToSubmit);
      } else {
        // Modo criação: criar post com primeira tradução
        const primaryLang = filledLangs[0];

        const dataToSubmit = {
          ...translationsData[primaryLang],
          ...commonData,
          categorias: selectedCategorias || [],
          tags: tagIds || [],
          idioma: primaryLang,
        };

        // Criar post
        const createdPost = await createMutation.mutateAsync(dataToSubmit);

        // Se há outros idiomas preenchidos, salvá-los também
        if (filledLangs.length > 1) {
          for (const lang of filledLangs.slice(1)) {
            await postsService.update(
              createdPost.id,
              {
                titulo: translationsData[lang].titulo,
                chamada: translationsData[lang].chamada,
                conteudo: translationsData[lang].conteudo,
                urlAmigavel: translationsData[lang].urlAmigavel,
                categorias: selectedCategorias,
                tags: tagIds,
              },
              lang
            );
          }
        }

        toast({
          title: 'Post criado com sucesso!',
          description: `Post criado com ${filledLangs.length} idioma(s): ${filledLangs.map(l => l.toUpperCase()).join(', ')}`,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar post:', error);
    }
  };


  const handleChange = (field: keyof typeof commonData, value: any) => {
    setCommonData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleTituloChange = (novoTitulo: string) => {
    updateTranslation(currentLang, 'titulo', novoTitulo);
    // Sempre atualizar slug (criação e edição)
    const slug = generateSlug(novoTitulo);
    // Adiciona o prefixo do idioma (ex: pt/titulo-do-post)
    const slugWithLang = `${currentLang}/${slug}`;
    updateTranslation(currentLang, 'urlAmigavel', slugWithLang);
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
    // Limpar oldImages para que o backend substitua todas as imagens antigas pela nova
    setCommonData(prev => ({
      ...prev,
      imagens: [file],
      oldImages: [], // Array vazio indica que queremos substituir todas as imagens antigas
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
    setCommonData(prev => ({
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

  // Handler para busca de tags (autocomplete)
  const handleTagSearch = (query: string) => {
    setTagSearchQuery(query);
  };

  const handleGenerateTranslations = async () => {
    if (!isEdit || !id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário salvar o post antes de gerar traduções.',
      });
      return;
    }

    // Validar se há conteúdo suficiente
    const currentData = translationsData[currentLang];
    if (!currentData.titulo || !currentData.chamada || !currentData.conteudo) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios faltando',
        description: 'Preencha título, chamada e conteúdo antes de gerar traduções.',
      });
      return;
    }

    try {
      setIsGeneratingTranslations(true);

      toast({
        title: '🤖 Gerando traduções...',
        description: 'A IA está gerando as traduções. Isso pode levar alguns segundos.',
      });

      // Chamar API para gerar traduções
      const response = await postsService.generateTranslations(Number(id), {
        idiomaOriginal: currentLang,
        titulo: currentData.titulo,
        chamada: currentData.chamada,
        conteudo: currentData.conteudo,
      });

      if (!response.success || !response.translations) {
        throw new Error('Falha ao gerar traduções');
      }

      // Salvar cada tradução gerada
      const idiomasGerados = Object.keys(response.translations);

      for (const lang of idiomasGerados) {
        const translation = response.translations[lang];

        await postsService.update(
          Number(id),
          {
            titulo: translation.titulo,
            chamada: translation.chamada,
            conteudo: translation.conteudo,
            urlAmigavel: translation.urlAmigavel,
            categorias: selectedCategorias,
            tags: await tagsService.resolveTagIds(tagNames),
          },
          lang as 'pt' | 'en' | 'es'
        );
      }

      // Atualizar lista de idiomas disponíveis
      const novosIdiomas = [...new Set([...availableLanguages, ...idiomasGerados])];
      setAvailableLanguages(novosIdiomas);

      // Recarregar post
      await refetchPost();

      toast({
        title: '✅ Traduções geradas com sucesso!',
        description: `As traduções em ${idiomasGerados.map(l => l.toUpperCase()).join(' e ')} foram criadas e salvas.`,
      });
    } catch (error) {
      console.error('Erro ao gerar traduções:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar traduções',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao gerar traduções.',
      });
    } finally {
      setIsGeneratingTranslations(false);
    }
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

      {/* Seletor de Idioma - Sempre visível */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Label className="text-base font-semibold">Idioma da Edição:</Label>
            <Tabs value={currentLang} onValueChange={(val) => setCurrentLang(val as 'pt' | 'en' | 'es')}>
              <TabsList>
                <TabsTrigger value="pt" className="gap-2">
                  🇧🇷 PT
                  {hasContent('pt') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                </TabsTrigger>
                <TabsTrigger value="en" className="gap-2">
                  🇺🇸 EN
                  {hasContent('en') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                </TabsTrigger>
                <TabsTrigger value="es" className="gap-2">
                  🇪🇸 ES
                  {hasContent('es') && <Badge variant="secondary" className="text-xs">✓</Badge>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {!isEdit && !hasContent(currentLang) && (
              <Badge variant="outline">Vazio</Badge>
            )}
          </div>
        </CardContent>
      </Card>


      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Post ({currentLang.toUpperCase()})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={translationsData[currentLang].titulo}
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
                value={translationsData[currentLang].urlAmigavel}
                onChange={(e) => updateTranslation(currentLang, 'urlAmigavel', e.target.value)}
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
                value={translationsData[currentLang].chamada}
                onChange={(e) => updateTranslation(currentLang, 'chamada', e.target.value)}
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
                content={translationsData[currentLang].conteudo}
                onChange={(html) => updateTranslation(currentLang, 'conteudo', html)}
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
                  value={commonData.status}
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
                  value={commonData.dataPublicacao}
                  onChange={(e) => handleChange('dataPublicacao', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Destaque</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="destaque"
                    checked={commonData.destaque}
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
              <TagInput
                value={tagNames}
                onChange={setTagNames}
                suggestions={tagSuggestions}
                onSearch={handleTagSearch}
                disabled={isLoading}
                placeholder="Digite tags separadas por vírgula (ex: música, festival, eletrônica)..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Post'}
              </Button>

              {isEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateTranslations}
                  disabled={isLoading || isGeneratingTranslations}
                >
                  {isGeneratingTranslations ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Languages className="mr-2 h-4 w-4" />
                      Gerar Traduções
                    </>
                  )}
                </Button>
              )}

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

