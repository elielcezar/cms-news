import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LanguageRedirect } from "./components/LanguageRedirect";
import "./i18n/config";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Posts from "./pages/admin/Posts";
import PostForm from "./pages/admin/PostForm";
import Categorias from "./pages/admin/Categorias";
import CategoriaForm from "./pages/admin/CategoriaForm";
import Tags from "./pages/admin/Tags";
import TagForm from "./pages/admin/TagForm";
import Pautas from "./pages/admin/Pautas";
import Fontes from "./pages/admin/Fontes";
import FonteForm from "./pages/admin/FonteForm";
import Users from "./pages/admin/Users";
import UserForm from "./pages/admin/UserForm";
import Profile from "./pages/admin/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LanguageProvider>
              <Routes>
                {/* Rota raiz - detecta e redireciona para idioma */}
                <Route path="/" element={<LanguageRedirect />} />
                
                {/* Rotas públicas com idioma */}
                <Route path="/:lang" element={<Index />} />
                
                {/* Rotas de admin (sem idioma na URL) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="perfil" element={<Profile />} />
                  <Route path="posts" element={<Posts />} />
                  <Route path="posts/novo" element={<PostForm />} />
                  <Route path="posts/:id/editar" element={<PostForm />} />
                  <Route path="pautas" element={<Pautas />} />
                  <Route path="fontes" element={<Fontes />} />
                  <Route path="fontes/novo" element={<FonteForm />} />
                  <Route path="fontes/:id/editar" element={<FonteForm />} />
                  <Route path="categorias" element={<Categorias />} />
                  <Route path="categorias/novo" element={<CategoriaForm />} />
                  <Route path="categorias/:id/editar" element={<CategoriaForm />} />
                  <Route path="tags" element={<Tags />} />
                  <Route path="tags/novo" element={<TagForm />} />
                  <Route path="tags/:id/editar" element={<TagForm />} />
                  <Route path="usuarios" element={<Users />} />
                  <Route path="usuarios/novo" element={<UserForm />} />
                  <Route path="usuarios/:id/editar" element={<UserForm />} />
                </Route>
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
