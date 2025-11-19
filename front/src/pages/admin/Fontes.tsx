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
import { Input } from '@/components/ui/input';
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
      fonte.url.toLowerCase().includes(searchLower)
    );
  });

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
            placeholder="Buscar por título ou URL..."
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
          <TooltipProvider>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredFontes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {searchTerm ? 'Nenhuma fonte encontrada' : 'Nenhuma fonte cadastrada ainda'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFontes.map((fonte) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
