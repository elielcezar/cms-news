import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriasService } from '@/services/categorias.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CategoriaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [nome, setNome] = useState('');

  // Buscar categoria se for edição
  const { data: categoria } = useQuery({
    queryKey: ['categoria', id],
    queryFn: async () => {
      const allCategorias = await categoriasService.getAll();
      return allCategorias.find(c => c.id === Number(id));
    },
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (categoria && isEdit) {
      setNome(categoria.nome);
    }
  }, [categoria, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: { nome: string }) => categoriasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
      navigate('/admin/categorias');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar categoria',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: { nome: string }) => categoriasService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categoria', id] });
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
      navigate('/admin/categorias');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar categoria',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O nome da categoria é obrigatório.',
      });
      return;
    }

    if (isEdit) {
      updateMutation.mutate({ nome });
    } else {
      createMutation.mutate({ nome });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/categorias')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações da categoria' : 'Preencha os dados da nova categoria'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Ex: Tecnologia, Música, Eventos, Lifestyle..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/categorias')}
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

