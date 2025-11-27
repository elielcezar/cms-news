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
import { Eye, Trash2, Loader2, FileEdit, ExternalLink, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Pautas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPauta, setSelectedPauta] = useState<Pauta | null>(null);
  const [convertingPautaId, setConvertingPautaId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    </div>
  );
}
