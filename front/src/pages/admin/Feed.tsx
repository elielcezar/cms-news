import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService, FeedFilters } from '@/services/feed.service';
import { FeedItem, FonteComContagem } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Trash2, 
  Loader2, 
  Search, 
  Rss,
  Eye,
  EyeOff,
  CheckCheck,
  RefreshCw,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Feed() {
  const [filters, setFilters] = useState<FeedFilters>({
    page: 1,
    limit: 24,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLButtonElement & { indeterminate?: boolean }>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar feed items
  const { data: feedData, isLoading, isFetching } = useQuery({
    queryKey: ['feed', filters],
    queryFn: () => feedService.getAll(filters),
  });

  // Buscar fontes para filtro
  const { data: fontes } = useQuery({
    queryKey: ['feed-fontes'],
    queryFn: () => feedService.getFontes(),
  });

  // Mutation para buscar novos itens
  const buscarFeed = useMutation({
    mutationFn: () => feedService.buscar(),
    onSuccess: (data) => {
      toast({
        title: 'Busca concluída!',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-fontes'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar feed',
        description: error.message,
      });
    },
  });

  // Mutation para marcar como lido
  const markAsRead = useMutation({
    mutationFn: (id: number) => feedService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Mutation para marcar todos como lidos
  const markAllAsRead = useMutation({
    mutationFn: () => feedService.markAllAsRead(),
    onSuccess: (data) => {
      toast({
        title: 'Todos marcados como lidos',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    },
  });

  // Mutation para deletar
  const deleteFeedItem = useMutation({
    mutationFn: (id: number) => feedService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-fontes'] });
      toast({
        title: 'Item removido',
        description: 'O item foi removido do feed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover item',
        description: error.message,
      });
    },
  });

  // Mutation para deletar múltiplos
  const deleteMultiple = useMutation({
    mutationFn: (ids: number[]) => feedService.deleteMultiple(ids),
    onSuccess: (data) => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-fontes'] });
      toast({
        title: 'Itens removidos',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover itens',
        description: error.message,
      });
    },
  });

  const items = feedData?.items || [];
  const pagination = feedData?.pagination;

  // Atualizar busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handlers de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(items.map(item => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
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
    if (idsArray.length === 0) return;

    if (confirm(`Tem certeza que deseja remover ${idsArray.length} item(ns)?`)) {
      deleteMultiple.mutate(idsArray);
    }
  };

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Handler para abrir link e marcar como lido
  const handleOpenLink = (item: FeedItem) => {
    if (!item.lida) {
      markAsRead.mutate(item.id);
    }
    window.open(item.url, '_blank');
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  };

  // Skeleton para loading
  const CardSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leitor de Feed</h1>
          <p className="text-muted-foreground">
            Notícias extraídas das fontes cadastradas
          </p>
        </div>
      </div>

      {/* Card de Busca */}
      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Rss className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Atualizar Feed</h3>
                <p className="text-sm text-muted-foreground">
                  Buscar novas notícias de todas as {fontes?.length || 0} fontes cadastradas
                </p>
              </div>
            </div>
            <Button 
              size="lg"
              onClick={() => buscarFeed.mutate()}
              disabled={buscarFeed.isPending}
              className="gap-2"
            >
              {buscarFeed.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Buscar Notícias
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por fonte */}
            <Select
              value={filters.fonteId?.toString() || 'todas'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  fonteId: value === 'todas' ? undefined : parseInt(value),
                  page: 1
                }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as fontes</SelectItem>
                {fontes?.map((fonte) => (
                  <SelectItem key={fonte.id} value={fonte.id.toString()}>
                    {fonte.titulo} ({fonte.totalItems})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por lida */}
            <Select
              value={filters.lida === undefined ? 'todas' : filters.lida ? 'lidas' : 'nao-lidas'}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  lida: value === 'todas' ? undefined : value === 'lidas',
                  page: 1
                }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="nao-lidas">Não lidas</SelectItem>
                <SelectItem value="lidas">Lidas</SelectItem>
              </SelectContent>
            </Select>

            {/* Ações em massa */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedIds.size} selecionado(s)
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteMultiple.isPending}
                >
                  {deleteMultiple.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Marcar todos como lidos */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="gap-2"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Marcar todos como lidos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header da lista */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              ref={selectAllCheckboxRef}
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Selecionar todos ({items.length})
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {pagination && (
              <>
                Mostrando {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </>
            )}
            {isFetching && !isLoading && (
              <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Rss className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filters.fonteId || filters.lida !== undefined
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Buscar Notícias" para atualizar o feed'}
            </p>
            {!searchTerm && !filters.fonteId && filters.lida === undefined && (
              <Button onClick={() => buscarFeed.mutate()} disabled={buscarFeed.isPending}>
                {buscarFeed.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Buscar Notícias
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all hover:shadow-lg group ${
                !item.lida ? 'border-primary/50 bg-primary/5' : ''
              } ${selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Imagem */}
              <div 
                className="relative h-40 bg-muted cursor-pointer overflow-hidden"
                onClick={() => handleOpenLink(item)}
              >
                {item.imagemUrl ? (
                  <img
                    src={item.imagemUrl}
                    alt={item.titulo}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                
                {/* Badge de status */}
                {!item.lida && (
                  <Badge className="absolute top-2 left-2" variant="default">
                    Nova
                  </Badge>
                )}

                {/* Checkbox */}
                <div 
                  className="absolute top-2 right-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    className="bg-background/80 backdrop-blur"
                  />
                </div>
              </div>

              {/* Conteúdo */}
              <CardHeader className="p-4 pb-2">
                <h3 
                  className="font-semibold text-sm leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleOpenLink(item)}
                  title={item.titulo}
                >
                  {item.titulo}
                </h3>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                {/* Chamada */}
                {item.chamada && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.chamada}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 truncate max-w-[60%]" title={item.fonte?.titulo}>
                    <Rss className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.fonte?.titulo}</span>
                  </div>
                  {item.dataPublicacao && (
                    <div className="flex items-center gap-1" title={format(new Date(item.dataPublicacao), 'PPp', { locale: ptBR })}>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.dataPublicacao)}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenLink(item)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (item.lida) {
                        // Toggle para não lida (não implementado no backend ainda)
                      } else {
                        markAsRead.mutate(item.id);
                      }
                    }}
                    title={item.lida ? 'Já lida' : 'Marcar como lida'}
                  >
                    {item.lida ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja remover este item?')) {
                        deleteFeedItem.mutate(item.id);
                      }
                    }}
                    disabled={deleteFeedItem.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            disabled={!pagination.hasMore}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Botão Carregar Mais (alternativa à paginação) */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            disabled={isFetching}
            className="gap-2"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Carregar mais ({pagination.total - (pagination.page * pagination.limit)} restantes)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

