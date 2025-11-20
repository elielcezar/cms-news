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

  const [nomePt, setNomePt] = useState('');
  const [nomeEn, setNomeEn] = useState('');
  const [nomeEs, setNomeEs] = useState('');

  // Buscar categoria se for edição
  const { data: categoria } = useQuery({
    queryKey: ['categoria', id],
    queryFn: () => categoriasService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (categoria && isEdit && categoria.translations) {
      const ptTranslation = categoria.translations.find((t: any) => t.idioma === 'pt');
      const enTranslation = categoria.translations.find((t: any) => t.idioma === 'en');
      const esTranslation = categoria.translations.find((t: any) => t.idioma === 'es');
      
      setNomePt(ptTranslation?.nome || '');
      setNomeEn(enTranslation?.nome || '');
      setNomeEs(esTranslation?.nome || '');
    }
  }, [categoria, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: any) => categoriasService.create(data),
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
    mutationFn: (data: any) => categoriasService.update(Number(id), data),
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

    if (!nomePt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'O nome em Português é obrigatório.',
      });
      return;
    }

    const data = {
      translations: {
        pt: nomePt,
        ...(nomeEn && { en: nomeEn }),
        ...(nomeEs && { es: nomeEs }),
      }
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                  Traduções da Categoria
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-pt" className="flex items-center gap-2">
                      🇧🇷 Nome em Português *
                    </Label>
                    <Input
                      id="nome-pt"
                      value={nomePt}
                      onChange={(e) => setNomePt(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Ex: Tecnologia, Música, Eventos..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome-en" className="flex items-center gap-2">
                      🇺🇸 Nome em Inglês
                    </Label>
                    <Input
                      id="nome-en"
                      value={nomeEn}
                      onChange={(e) => setNomeEn(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ex: Technology, Music, Events..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome-es" className="flex items-center gap-2">
                      🇪🇸 Nome em Espanhol
                    </Label>
                    <Input
                      id="nome-es"
                      value={nomeEs}
                      onChange={(e) => setNomeEs(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ex: Tecnología, Música, Eventos..."
                    />
                  </div>
                </div>
              </div>
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

