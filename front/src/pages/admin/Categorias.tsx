import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasService } from '@/services/categorias.service';
import { Categoria } from '@/types/admin';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Categorias() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias (todas as traduções para o admin)
  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias', 'all'],
    queryFn: () => categoriasService.getAll(),
  });

  // Mutation para deletar
  const deleteCategoria = useMutation({
    mutationFn: (id: number) => categoriasService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir categoria',
        description: error.message,
      });
    },
  });

  const filteredCategorias = (categorias || []).filter((categoria) => {
    const searchLower = searchTerm.toLowerCase();
    // Buscar em todas as traduções
    return categoria.translations?.some((t: any) =>
      t.nome.toLowerCase().includes(searchLower)
    ) || false;
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategoria.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos posts
          </p>
        </div>
        <Button onClick={() => navigate('/admin/categorias/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome (PT)</TableHead>
                <TableHead>Nome (EN)</TableHead>
                <TableHead>Nome (ES)</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredCategorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategorias.map((categoria) => {
                  const ptTranslation = categoria.translations?.find((t: any) => t.idioma === 'pt');
                  const enTranslation = categoria.translations?.find((t: any) => t.idioma === 'en');
                  const esTranslation = categoria.translations?.find((t: any) => t.idioma === 'es');

                  return (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">{categoria.id}</TableCell>
                      <TableCell>
                        {ptTranslation?.nome || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell>
                        {enTranslation?.nome || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell>
                        {esTranslation?.nome || <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell>
                        {new Date(categoria.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/categorias/${categoria.id}/editar`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(categoria.id)}
                            disabled={deleteCategoria.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

