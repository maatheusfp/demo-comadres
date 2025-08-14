import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StorageService } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { Heart, ArrowLeft } from "lucide-react";

const Cadastro = () => {
  const [formData, setFormData] = useState({
    nome: "",
    idade_mae: "",
    faixa_filho: "",
    horario_trabalho: "",
    localizacao: "",
    email: "",
    senha: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const faixasEtarias = [
    "0-1 ano",
    "1-2 anos", 
    "3-5 anos",
    "6-8 anos",
    "9-12 anos",
    "13+ anos"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = ['nome', 'idade_mae', 'faixa_filho', 'horario_trabalho', 'localizacao', 'email', 'senha'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        ...formData,
        idade_mae: parseInt(formData.idade_mae)
      };
      
      const newUser = StorageService.addUser(userData);
      
      toast({
        title: "Cadastro realizado!",
        description: "Agora você pode fazer login.",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o cadastro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center mb-6 pt-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/login")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <Heart className="h-6 w-6 text-white mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-white">Cadastro</h1>
          </div>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Seu nome"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade_mae">Sua idade</Label>
              <Input
                id="idade_mae"
                type="number"
                value={formData.idade_mae}
                onChange={(e) => handleInputChange('idade_mae', e.target.value)}
                placeholder="28"
                min="18"
                max="60"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Faixa etária do(s) filho(s)</Label>
              <Select onValueChange={(value) => handleInputChange('faixa_filho', value)}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue placeholder="Selecione a faixa etária" />
                </SelectTrigger>
                <SelectContent>
                  {faixasEtarias.map((faixa) => (
                    <SelectItem key={faixa} value={faixa}>
                      {faixa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario_trabalho">Horário de trabalho</Label>
              <Input
                id="horario_trabalho"
                value={formData.horario_trabalho}
                onChange={(e) => handleInputChange('horario_trabalho', e.target.value)}
                placeholder="08:00-17:00"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={(e) => handleInputChange('localizacao', e.target.value)}
                placeholder="São Paulo - SP"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="seu@email.com"
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(e) => handleInputChange('senha', e.target.value)}
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
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Já tem conta? Faça login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Cadastro;