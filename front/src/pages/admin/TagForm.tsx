import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsService } from '@/services/tags.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function TagForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [nome, setNome] = useState('');

  // Buscar tag se for edição
  const { data: tag } = useQuery({
    queryKey: ['tag', id],
    queryFn: async () => {
      const allTags = await tagsService.getAll();
      return allTags.find(t => t.id === Number(id));
    },
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (tag && isEdit) {
      setNome(tag.nome);
    }
  }, [tag, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (nome: string) => tagsService.create(nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({
        title: 'Tag criada',
        description: 'A tag foi criada com sucesso.',
      });
      navigate('/admin/tags');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar tag',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (nome: string) => tagsService.update(Number(id), nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', id] });
      toast({
        title: 'Tag atualizada',
        description: 'A tag foi atualizada com sucesso.',
      });
      navigate('/admin/tags');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar tag',
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
        description: 'O nome da tag é obrigatório.',
      });
      return;
    }

    if (isEdit) {
      updateMutation.mutate(nome);
    } else {
      createMutation.mutate(nome);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tags')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Tag' : 'Nova Tag'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações da tag' : 'Preencha os dados da nova tag'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Tag</CardTitle>
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
                placeholder="Ex: IA, Blockchain, Copa do Mundo..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Tag'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/tags')}
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

