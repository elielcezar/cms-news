import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fontesService } from '@/services/fontes.service';
import { Fonte } from '@/types/admin';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Fontes() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar fontes
  const { data: fontes, isLoading } = useQuery({
    queryKey: ['fontes', searchTerm],
    queryFn: () => fontesService.getAll({ search: searchTerm }),
  });

  // Mutation para deletar
  const deleteFonte = useMutation({
    mutationFn: (id: number) => fontesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      toast({
        title: 'Fonte excluída',
        description: 'A fonte foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir fonte',
        description: error.message,
      });
    },
  });

  const handleDelete = (id: number, titulo: string) => {
    if (confirm(`Tem certeza que deseja excluir a fonte "${titulo}"?`)) {
      deleteFonte.mutate(id);
    }
  };

  const filteredFontes = (fontes || []).filter((fonte) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      fonte.titulo.toLowerCase().includes(searchLower) ||
      fonte.url.toLowerCase().includes(searchLower) ||
      fonte.site.nome.toLowerCase().includes(searchLower)
    );
  });

  // Agrupar fontes por site
  const fontesPorSite = filteredFontes.reduce((acc, fonte) => {
    const siteName = fonte.site.nome;
    if (!acc[siteName]) {
      acc[siteName] = [];
    }
    acc[siteName].push(fonte);
    return acc;
  }, {} as Record<string, Fonte[]>);

  // Ordenar sites alfabeticamente
  const sitesOrdenados = Object.keys(fontesPorSite).sort();

  // Helper para truncar URL
  const truncateUrl = (url: string, maxLength: number = 50): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fontes</h1>
          <p className="text-muted-foreground">
            Gerencie os feeds de notícias que a IA usará para gerar pautas
          </p>
        </div>
        <Button onClick={() => navigate('/admin/fontes/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fonte
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por título, URL ou site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fontes ({filteredFontes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredFontes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? 'Nenhuma fonte encontrada' : 'Nenhuma fonte cadastrada ainda'}
            </div>
          ) : (
            <TooltipProvider>
              <Accordion type="multiple" className="w-full space-y-3">
                {sitesOrdenados.map((siteName) => {
                  const fontes = fontesPorSite[siteName];
                  
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
                            {fontes.length} {fontes.length === 1 ? 'fonte' : 'fontes'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60px]">ID</TableHead>
                              <TableHead>Título</TableHead>
                              <TableHead>URL</TableHead>
                              <TableHead className="w-[120px]">Data</TableHead>
                              <TableHead className="w-[150px] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fontes.map((fonte) => (
                              <TableRow key={fonte.id}>
                                <TableCell className="font-medium">{fonte.id}</TableCell>
                                <TableCell className="font-semibold">{fonte.titulo}</TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={fonte.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        {truncateUrl(fonte.url)}
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs break-all">{fonte.url}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(fonte.createdAt).toLocaleDateString('pt-BR', {
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
                                      onClick={() => navigate(`/admin/fontes/${fonte.id}/editar`)}
                                      title="Editar"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(fonte.id, fonte.titulo)}
                                      disabled={deleteFonte.isPending}
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
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

