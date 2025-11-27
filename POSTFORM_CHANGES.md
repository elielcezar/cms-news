# Código para adicionar ao PostForm.tsx

## 1. Import do ícone Languages (Linha 23)
**TROCAR:**
```tsx
import { ArrowLeft, Loader2, X, Upload, Globe } from 'lucide-react';
```

**POR:**
```tsx
import { ArrowLeft, Loader2, X, Upload, Globe, Languages } from 'lucide-react';
```

## 2. Adicionar estado (Linha 56, após tagSearchQuery)
**ADICIONAR APÓS a linha:**
```tsx
const [tagSearchQuery, setTagSearchQuery] = useState('');
```

**ADICIONAR:**
```tsx
const [isGeneratingTranslations, setIsGeneratingTranslations] = useState(false);
```

## 3. Adicionar função handler (Linha 334, após handleTagSearch e ANTES de isLoading)
**ADICIONAR ANTES de:**
```tsx
const isLoading = createMutation.isPending || updateMutation.isPending;
```

**ADICIONAR:**
```tsx
// Handler para gerar traduções automáticas
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
  if (!formData.titulo || !formData.chamada || !formData.conteudo) {
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
      titulo: formData.titulo,
      chamada: formData.chamada,
      conteudo: formData.conteudo,
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
```

## 4. Adicionar botão na UI (Linha 668, ENTRE o botão "Salvar" e "Cancelar")
**TROCAR:**
```tsx
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
```

**POR:**
```tsx
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
```
