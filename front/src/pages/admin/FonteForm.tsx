import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fontesService } from '@/services/fontes.service';
import { FonteFormData } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function FonteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<FonteFormData>({
    titulo: '',
    url: '',
  });

  // Buscar fonte se for edição
  const { data: fonte } = useQuery({
    queryKey: ['fonte', id],
    queryFn: () => fontesService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (fonte && isEdit) {
      setFormData({
        titulo: fonte.titulo,
        url: fonte.url,
      });
    }
  }, [fonte, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: FonteFormData) => fontesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      toast({
        title: 'Fonte criada',
        description: 'A fonte foi criada com sucesso.',
      });
      navigate('/admin/fontes');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar fonte',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: FonteFormData) => fontesService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      queryClient.invalidateQueries({ queryKey: ['fonte', id] });
      toast({
        title: 'Fonte atualizada',
        description: 'A fonte foi atualizada com sucesso.',
      });
      navigate('/admin/fontes');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar fonte',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.titulo.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O título é obrigatório.',
      });
      return;
    }

    if (!formData.url.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'A URL é obrigatória.',
      });
      return;
    }

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof FonteFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/fontes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Fonte' : 'Nova Fonte'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações da fonte' : 'Preencha os dados da nova fonte'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Fonte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                required
                disabled={isLoading}
                placeholder="Ex: House Mag - Música Eletrônica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                required
                disabled={isLoading}
                placeholder="https://exemplo.com/feed"
              />
              <p className="text-sm text-muted-foreground">
                URL do feed RSS, página inicial ou API da fonte de notícias
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Fonte'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/fontes')}
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

