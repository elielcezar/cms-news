import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pautasService } from '@/services/pautas.service';
import { Pauta } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, Loader2, FileEdit, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Pautas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPauta, setSelectedPauta] = useState<Pauta | null>(null);  // Logo após os outros estados (linha ~30)
  const [convertingPautaId, setConvertingPautaId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  // Mutation para marcar como lida
  const markAsRead = useMutation({
    mutationFn: (id: number) => pautasService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pautas'] });
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

  const filteredPautas = (pautas || []).filter((pauta) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pauta.assunto.toLowerCase().includes(searchLower) ||
      pauta.resumo.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar pautas por site
  const pautasPorSite = filteredPautas.reduce((acc, pauta) => {
    const siteName = pauta.site?.nome || 'Sem Site';
    if (!acc[siteName]) {
      acc[siteName] = [];
    }
    acc[siteName].push(pauta);
    return acc;
  }, {} as Record<string, Pauta[]>);

  // Ordenar sites alfabeticamente
  const sitesOrdenados = Object.keys(pautasPorSite).sort();

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

      <Card className="mb-4">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por assunto ou resumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Sugestões ({filteredPautas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPautas.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhuma pauta encontrada' : 'Nenhuma sugestão de pauta ainda'}
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-3">
              {sitesOrdenados.map((siteName) => {
                const pautas = pautasPorSite[siteName];
                const pautasNovas = pautas.filter(p => !p.lida).length;
                
                return (
                  <AccordionItem 
                    key={siteName} 
                    value={siteName}
                    className="border rounded-lg px-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 w-full">
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {siteName}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {pautas.length} {pautas.length === 1 ? 'pauta' : 'pautas'}
                        </span>
                        {pautasNovas > 0 && (
                          <Badge variant="default" className="text-xs ml-auto mr-2">
                            {pautasNovas} {pautasNovas === 1 ? 'nova' : 'novas'}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">ID</TableHead>
                            <TableHead>Assunto</TableHead>
                            <TableHead>Resumo</TableHead>
                            <TableHead className="w-[120px]">Data</TableHead>
                            <TableHead className="w-[200px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pautas.map((pauta) => (
                            <TableRow key={pauta.id} className={!pauta.lida ? 'font-semibold' : ''}>
                              <TableCell className="font-medium">{pauta.id}</TableCell>
                              <TableCell className={!pauta.lida ? 'font-bold' : ''}>
                                <div className="flex items-center gap-2">
                                  {!pauta.lida && (
                                    <Badge variant="default" className="text-xs">Nova</Badge>
                                  )}
                                  {truncate(pauta.assunto, 50)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {truncate(pauta.resumo, 80)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(pauta.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleViewDetails(pauta)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleConvertToPost(pauta.id)}
                                    disabled={convertingPautaId !== null}
                                    title="Converter em post com IA"
                                  >
                                    {convertingPautaId === pauta.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <FileEdit className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(pauta.id)}
                                    disabled={deletePauta.isPending}
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedPauta?.assunto}</DialogTitle>
            <DialogDescription>
              {selectedPauta?.site && (
                <Badge variant="secondary" className="mt-2">
                  {selectedPauta.site.nome}
                </Badge>
              )}
            </DialogDescription>
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

