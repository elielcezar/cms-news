import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { UserFormData } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Buscar usuário se for edição
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Não carregar senha
      });
      setConfirmPassword('');
    }
  }, [user, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso.',
      });
      navigate('/admin/usuarios');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserFormData>) => 
      usersService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast({
        title: 'Usuário atualizado',
        description: 'O usuário foi atualizado com sucesso.',
      });
      navigate('/admin/usuarios');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar usuário',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar confirmação de senha se estiver preenchida
    if (formData.password) {
      if (formData.password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Senha inválida',
          description: 'A senha deve ter no mínimo 6 caracteres.',
        });
        return;
      }

      if (formData.password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Senhas não coincidem',
          description: 'As senhas digitadas não são iguais.',
        });
        return;
      }
    }

    if (isEdit) {
      // Se editando e senha vazia, não enviar senha
      const dataToSend: Partial<UserFormData> = {
        name: formData.name,
        email: formData.email,
      };
      
      if (formData.password && formData.password.length > 0) {
        dataToSend.password = formData.password;
      }

      updateMutation.mutate(dataToSend);
    } else {
      // Na criação, senha é obrigatória
      if (!formData.password || formData.password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'Senha obrigatória',
          description: 'A senha deve ter no mínimo 6 caracteres.',
        });
        return;
      }

      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/usuarios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações do usuário' : 'Preencha os dados do novo usuário'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={isLoading || isLoadingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={isLoading || isLoadingUser}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha {isEdit ? '(deixe em branco para não alterar)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required={!isEdit}
                  disabled={isLoading || isLoadingUser}
                  placeholder={isEdit ? 'Digite apenas se quiser alterar' : 'Mínimo 6 caracteres'}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Senha {isEdit ? '(deixe em branco para não alterar)' : '*'}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isEdit}
                  disabled={isLoading || isLoadingUser}
                  placeholder={isEdit ? 'Digite apenas se quiser alterar' : 'Confirme a senha'}
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading || isLoadingUser}>
                {(isLoading || isLoadingUser) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/usuarios')}
                disabled={isLoading || isLoadingUser}
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
