import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { StorageService } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import VerificationModal from "@/components/VerificationModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const user = StorageService.loginUser(email, senha);
      if (user) {
        toast({
          title: "Login realizado!",
          description: `Bem-vinda, ${user.nome}!`,
        });
        
        // Verificar se o usuário completou a verificação
        if (!user.verificado) {
          setShowVerificationModal(true);
        } else {
          navigate("/feed");
        }
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Match Mães Solo</h1>
          <p className="text-white/80">Conecte-se com outras mães</p>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-0">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="bg-background/50 border-border/50"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="maternal"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <Link 
                to="/cadastro" 
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Ainda não tem conta? Cadastre-se
              </Link>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Usuários de teste disponíveis:
          </p>
          <p className="text-white/80 text-xs mt-1">
            maria@example.com (senha: 1234)
          </p>
        </div>

        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onComplete={() => {
            setShowVerificationModal(false);
            navigate("/feed");
          }}
        />
      </div>
    </div>
  );
};

export default Login;