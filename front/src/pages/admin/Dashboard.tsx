import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { postsService } from '@/services/posts.service';
import { usersService } from '@/services/users.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CheckCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    featuredPosts: 0,
    totalUsers: 0,
  });

  // Buscar posts
  const { data: posts, isError: postsError } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postsService.getAll(),
  });

  // Buscar usuários
  const { data: users, isError: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  useEffect(() => {
    if (posts && users) {
      const published = posts.filter(p => p.status === 'PUBLICADO').length;
      const featured = posts.filter(p => p.destaque).length;
      
      setStats({
        totalPosts: posts.length,
        publishedPosts: published,
        featuredPosts: featured,
        totalUsers: users.length,
      });
    }
  }, [posts, users]);

  useEffect(() => {
    if (postsError || usersError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as estatísticas do dashboard.',
      });
    }
  }, [postsError, usersError, toast]);

  const statCards = [
    {
      title: 'Total de Posts',
      value: stats.totalPosts,
      icon: FileText,
      description: 'Posts cadastrados no sistema',
    },
    {
      title: 'Posts Publicados',
      value: stats.publishedPosts,
      icon: CheckCircle,
      description: 'Posts com status publicado',
    },
    {
      title: 'Posts em Destaque',
      value: stats.featuredPosts,
      icon: Star,
      description: 'Posts marcados como destaque',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
