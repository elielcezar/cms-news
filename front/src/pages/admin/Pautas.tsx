import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pautasService } from '@/services/pautas.service';
import { Pauta } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Trash2, Loader2, FileEdit, ExternalLink, Search, Sparkles, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Pautas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPauta, setSelectedPauta] = useState<Pauta | null>(null);
  const [convertingPautaId, setConvertingPautaId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do formulário de criação manual
  const [assunto, setAssunto] = useState('');
  const [resumo, setResumo] = useState('');
  const [fontes, setFontes] = useState<Array<{ nome: string; url: string }>>([
    { nome: '', url: '' }
  ]);

  // Buscar pautas
  const { data: pautas, isLoading } = useQuery({
    queryKey: ['pautas', searchTerm],
    queryFn: () => pautasService.getAll({ search: searchTerm }),
  });

  // Mutation para deletar
  const deletePauta = useMutation({
    mutationFn: (id: number) => pautasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: 'Pauta excluída',
        description: 'A sugestão de pauta foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir pauta',
        description: error.message,
      });
    },
  });

  // Mutation para deletar múltiplas pautas
  const deleteMultiplePautas = useMutation({
    mutationFn: async (ids: number[]) => {
      // Deletar todas as pautas em paralelo
      await Promise.all(ids.map(id => pautasService.delete(id)));
    },
    onSuccess: (_, ids) => {
      setSelectedIds(new Set()); // Limpar seleção
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: 'Pautas excluídas',
        description: `${ids.length} sugestão(ões) de pauta foram excluídas com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir pautas',
        description: error.message,
      });
    },
  });

  // Mutation para marcar como lida
  const markAsRead = useMutation({
    mutationFn: (id: number) => pautasService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
    },
  });

  // Mutation para gerar pautas via N8N
  const gerarPautas = useMutation({
    mutationFn: () => pautasService.gerar(),
    onSuccess: (data) => {
      toast({
        title: 'Busca Iniciada!',
        description: data.message,
      });
      // Atualizar lista após 5 segundos
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['pautas'] });
      }, 5000);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar pautas',
        description: error.message,
      });
    },
  });

  // Mutation para criar pauta manualmente
  const createPauta = useMutation({
    mutationFn: (data: { assunto: string; resumo: string; fontes: Array<{ nome: string; url: string }> }) =>
      pautasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
      toast({
        title: 'Pauta criada',
        description: 'A sugestão de pauta foi criada com sucesso.',
      });
      // Limpar formulário e fechar dialog
      setAssunto('');
      setResumo('');
      setFontes([{ nome: '', url: '' }]);
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pauta',
        description: error.message,
      });
    },
  });

  // Mutation para converter em post
  const convertToPost = useMutation({
    mutationFn: (id: number) => pautasService.convertToPost(id),
    onSuccess: (data) => {
      setConvertingPautaId(null);
      toast({
        title: 'Post criado com sucesso!',
        description: 'A notícia foi gerada pela IA e salva como rascunho.',
      });
      // Redirecionar para edição do post
      navigate(`/admin/posts/${data.postId}/editar`);
    },
    onError: (error: Error) => {
      setConvertingPautaId(null);
      toast({
        variant: 'destructive',
        title: 'Erro ao converter pauta',
        description: error.message || 'Não foi possível gerar a notícia com IA.',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta sugestão de pauta?')) {
      deletePauta.mutate(id);
    }
  };

  const filteredPautas = (pautas || []).filter((pauta) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pauta.assunto.toLowerCase().includes(searchLower) ||
      pauta.resumo.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selecionar todas as pautas filtradas
      const allIds = new Set(filteredPautas.map(p => p.id));
      setSelectedIds(allIds);
    } else {
      // Desmarcar todas
      setSelectedIds(new Set());
    }
  };

  const handleSelectPauta = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    const idsArray = Array.from(selectedIds);
    if (idsArray.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma pauta selecionada',
        description: 'Selecione pelo menos uma pauta para excluir.',
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir ${idsArray.length} sugestão(ões) de pauta?`)) {
      deleteMultiplePautas.mutate(idsArray);
    }
  };

  const isAllSelected = filteredPautas.length > 0 && selectedIds.size === filteredPautas.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredPautas.length;

  // Atualizar estado indeterminado do checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleViewDetails = (pauta: Pauta) => {
    setSelectedPauta(pauta);
    setIsDialogOpen(true);
    
    // Marcar como lida ao abrir
    if (!pauta.lida) {
      markAsRead.mutate(pauta.id);
    }
  };

  const handleConvertToPost = (pautaId: number) => {
    if (convertToPost.isPending) return; // Evitar múltiplos cliques

    setConvertingPautaId(pautaId); // Define qual pauta está sendo convertida

    toast({
      title: 'Gerando notícia...',
      description: 'A IA está criando uma notícia completa baseada nas fontes. Isso pode levar alguns segundos.',
    });

    convertToPost.mutate(pautaId);
  };

  // Helper para truncar texto
  const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handlers do formulário de criação manual
  const handleAddFonte = () => {
    setFontes([...fontes, { nome: '', url: '' }]);
  };

  const handleRemoveFonte = (index: number) => {
    if (fontes.length > 1) {
      setFontes(fontes.filter((_, i) => i !== index));
    }
  };

  const handleFonteChange = (index: number, field: 'nome' | 'url', value: string) => {
    const newFontes = [...fontes];
    newFontes[index][field] = value;
    setFontes(newFontes);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!assunto.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O assunto é obrigatório.',
      });
      return;
    }

    if (!resumo.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O resumo é obrigatório.',
      });
      return;
    }

    // Validar fontes
    const fontesValidas = fontes.filter(f => f.nome.trim() && f.url.trim());
    if (fontesValidas.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Adicione pelo menos uma fonte válida (nome e URL).',
      });
      return;
    }

    // Validar URLs
    const urlsInvalidas = fontesValidas.filter(f => {
      try {
        new URL(f.url);
        return false;
      } catch {
        return true;
      }
    });

    if (urlsInvalidas.length > 0) {
      toast({
        variant: 'destructive',
        title: 'URL inválida',
        description: 'Verifique se todas as URLs estão no formato correto (ex: https://exemplo.com).',
      });
      return;
    }

    createPauta.mutate({
      assunto: assunto.trim(),
      resumo: resumo.trim(),
      fontes: fontesValidas,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sugestões de Pauta</h1>
          <p className="text-muted-foreground">
            Pautas sugeridas pela IA via n8n
          </p>
        </div>
      </div>

      {/* Botões de Ação - Buscar e Criar Manualmente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Botão Buscar Pautas - Destaque */}
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Buscar Novas Pautas</h3>
                  <p className="text-sm text-muted-foreground">
                    A IA irá analisar as fontes cadastradas e sugerir novas pautas
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                onClick={() => gerarPautas.mutate()}
                disabled={gerarPautas.isPending}
                className="gap-2"
              >
                {gerarPautas.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Buscar Pautas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botão Criar Manualmente */}
        <Card className="border-secondary/50 bg-gradient-to-r from-secondary/5 to-secondary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/10">
                  <Plus className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Cadastrar Manualmente</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma sugestão de pauta específica que você encontrou
                  </p>
                </div>
              </div>
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Pauta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar por assunto ou resumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {selectedIds.size} selecionada(s)
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteMultiplePautas.isPending}
                >
                  {deleteMultiplePautas.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionadas
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Header com checkbox de selecionar todas */}
        {filteredPautas.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                ref={selectAllCheckboxRef}
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar todas ({filteredPautas.length})
              </span>
            </div>
            <CardTitle className="text-lg">
              Sugestões de Pauta ({filteredPautas.length})
            </CardTitle>
          </div>
        )}

        {/* Grid de Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPautas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm ? 'Nenhuma pauta encontrada' : 'Nenhuma sugestão de pauta ainda'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 xlg:grid-cols-5 gap-4">
            {filteredPautas.map((pauta) => {
              const isConverting = convertingPautaId === pauta.id;
              const isDisabled = convertingPautaId !== null && !isConverting;

              return (
                <Card
                  key={pauta.id}
                  className={`relative transition-all duration-300 ${
                    isConverting
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02] z-10'
                      : isDisabled
                      ? 'opacity-40 pointer-events-none'
                      : !pauta.lida
                      ? 'border-primary/50 bg-primary/5'
                      : ''
                  }`}
                >
                  {isConverting && (
                    <div className="absolute inset-0 bg-primary/5 rounded-lg flex items-center justify-center z-20">
                      <div className="flex flex-col items-center gap-2 bg-background/95 p-4 rounded-lg shadow-lg border">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Gerando notícia com IA...</p>
                        <p className="text-xs text-muted-foreground">Aguarde alguns segundos</p>
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            checked={selectedIds.has(pauta.id)}
                            onCheckedChange={(checked) => handleSelectPauta(pauta.id, checked as boolean)}
                            disabled={isDisabled}
                          />
                          {!pauta.lida && (
                            <Badge variant="default" className="text-xs">Nova</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            #{pauta.id}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight">
                          {pauta.assunto}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Resumo */}
                    <div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {pauta.resumo}
                      </p>
                    </div>

                    {/* Fontes */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Fontes ({pauta.fontes.length})
                      </h4>
                      <div className="space-y-1">
                        {pauta.fontes.slice(0, 3).map((fonte, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <a
                              href={fonte.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {fonte.nome}
                            </a>
                          </div>
                        ))}
                        {pauta.fontes.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{pauta.fontes.length - 3} fonte(s) adicional(is)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Data */}
                    <div className="text-xs text-muted-foreground">
                      {new Date(pauta.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConvertToPost(pauta.id)}
                        disabled={isDisabled || convertToPost.isPending}
                        className="flex-1"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <FileEdit className="h-4 w-4 mr-2" />
                            Converter
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(pauta)}
                        disabled={isDisabled}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(pauta.id)}
                        disabled={isDisabled || deletePauta.isPending || deleteMultiplePautas.isPending}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedPauta?.assunto}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          
          {selectedPauta && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Resumo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedPauta.resumo}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Fontes</h3>
                <ul className="space-y-2">
                  {selectedPauta.fontes.map((fonte, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={fonte.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {fonte.nome}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedPauta) {
                      handleConvertToPost(selectedPauta.id);
                      setIsDialogOpen(false);
                    }
                  }}
                  disabled={convertingPautaId !== null}
                  className="flex-1"
                >
                  {convertingPautaId !== null ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando notícia com IA...
                    </>
                  ) : (
                    <>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Converter em Post com IA
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={convertingPautaId !== null}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação Manual */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cadastrar Pauta Manualmente</DialogTitle>
            <DialogDescription>
              Preencha os dados da sugestão de pauta que você encontrou
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitManual} className="space-y-6 mt-4">
            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex: Tiësto anuncia nova turnê mundial"
                required
                disabled={createPauta.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Título ou assunto principal da pauta
              </p>
            </div>

            {/* Resumo */}
            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo *</Label>
              <Textarea
                id="resumo"
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                placeholder="Descreva brevemente o assunto da pauta..."
                rows={5}
                required
                disabled={createPauta.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Resumo ou descrição detalhada da pauta
              </p>
            </div>

            {/* Fontes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fontes *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFonte}
                  disabled={createPauta.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Fonte
                </Button>
              </div>
              
              <div className="space-y-3">
                {fontes.map((fonte, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`fonte-nome-${index}`}>Nome da Fonte</Label>
                          <Input
                            id={`fonte-nome-${index}`}
                            value={fonte.nome}
                            onChange={(e) => handleFonteChange(index, 'nome', e.target.value)}
                            placeholder="Ex: Mixmag Brasil"
                            disabled={createPauta.isPending}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`fonte-url-${index}`}>URL</Label>
                          <Input
                            id={`fonte-url-${index}`}
                            type="url"
                            value={fonte.url}
                            onChange={(e) => handleFonteChange(index, 'url', e.target.value)}
                            placeholder="https://exemplo.com/noticia"
                            disabled={createPauta.isPending}
                          />
                        </div>
                      </div>
                      {fontes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFonte(index)}
                          disabled={createPauta.isPending}
                          className="mt-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Adicione pelo menos uma fonte de referência (nome e URL)
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                disabled={createPauta.isPending}
                className="flex-1"
              >
                {createPauta.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Pauta
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setAssunto('');
                  setResumo('');
                  setFontes([{ nome: '', url: '' }]);
                }}
                disabled={createPauta.isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
