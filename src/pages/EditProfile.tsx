import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StorageService, User } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, User as UserIcon, Shield } from "lucide-react";
import VerificationModal from "@/components/VerificationModal";

const EditProfile = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    idade_mae: "",
    faixa_filho: "",
    horario_trabalho: "",
    localizacao: "",
    disponivel_cuidar: false,
    horario_disponibilidade: "",
    observacoes_disponibilidade: ""
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

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    setFormData({
      nome: user.nome,
      idade_mae: user.idade_mae.toString(),
      faixa_filho: user.faixa_filho,
      horario_trabalho: user.horario_trabalho,
      localizacao: user.localizacao,
      disponivel_cuidar: user.disponivel_cuidar || false,
      horario_disponibilidade: user.horario_disponibilidade || "",
      observacoes_disponibilidade: user.observacoes_disponibilidade || ""
    });
  }, [navigate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    const requiredFields = ['nome', 'idade_mae', 'faixa_filho', 'horario_trabalho', 'localizacao'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const updatedUser: User = {
        ...currentUser,
        nome: formData.nome,
        idade_mae: parseInt(formData.idade_mae),
        faixa_filho: formData.faixa_filho,
        horario_trabalho: formData.horario_trabalho,
        localizacao: formData.localizacao,
        disponivel_cuidar: formData.disponivel_cuidar,
        horario_disponibilidade: formData.horario_disponibilidade,
        observacoes_disponibilidade: formData.observacoes_disponibilidade
      };
      
      StorageService.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      navigate("/feed");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/feed")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="bg-white/20 p-2 rounded-full">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Editar Perfil</h1>
            <p className="text-white/80 text-sm">Atualize suas informações</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <Card className="p-6 bg-gradient-card shadow-card border-border/50 max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Informações Básicas
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Seu nome"
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idade_mae">Sua idade *</Label>
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
                <Label>Faixa etária do(s) filho(s) *</Label>
                <Select value={formData.faixa_filho} onValueChange={(value) => handleInputChange('faixa_filho', value)}>
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
                <Label htmlFor="horario_trabalho">Horário de trabalho *</Label>
                <Input
                  id="horario_trabalho"
                  value={formData.horario_trabalho}
                  onChange={(e) => handleInputChange('horario_trabalho', e.target.value)}
                  placeholder="08:00-17:00"
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização *</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="São Paulo - SP"
                  className="bg-background/50 border-border/50"
                />
              </div>
            </div>

            {/* Disponibilidade para Cuidar */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Disponibilidade para Cuidar de Outros Filhos
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="disponivel_cuidar" className="text-base font-medium">
                    Disponível para cuidar de outras crianças
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ative se você pode ajudar outras mães cuidando de seus filhos
                  </p>
                </div>
                <Switch
                  id="disponivel_cuidar"
                  checked={formData.disponivel_cuidar}
                  onCheckedChange={(checked) => handleInputChange('disponivel_cuidar', checked)}
                />
              </div>

              {formData.disponivel_cuidar && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label htmlFor="horario_disponibilidade">Horário de disponibilidade</Label>
                    <Input
                      id="horario_disponibilidade"
                      value={formData.horario_disponibilidade}
                      onChange={(e) => handleInputChange('horario_disponibilidade', e.target.value)}
                      placeholder="Ex: 18:00-20:00, Fins de semana"
                      className="bg-background/50 border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes_disponibilidade">Observações adicionais</Label>
                    <Textarea
                      id="observacoes_disponibilidade"
                      value={formData.observacoes_disponibilidade}
                      onChange={(e) => handleInputChange('observacoes_disponibilidade', e.target.value)}
                      placeholder="Ex: Posso cuidar de crianças até 8 anos, tenho experiência com bebês, etc."
                      className="bg-background/50 border-border/50 min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Seção de Verificação */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Verificação de Segurança
              </h2>
              
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-5 w-5 ${currentUser.verificado ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className="font-medium">
                      Status: {currentUser.verificado ? 'Verificado' : 'Pendente'}
                    </span>
                  </div>
                  {currentUser.verificado && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Verificado
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {currentUser.verificado 
                    ? "Seu perfil foi verificado com sucesso. Você pode atualizar suas informações quando necessário."
                    : "Complete a verificação para acessar todos os recursos da plataforma com segurança."
                  }
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVerificationModal(true)}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {currentUser.verificado ? "Atualizar Verificação" : "Iniciar Verificação"}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              variant="maternal"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Card>

        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onComplete={() => {
            setShowVerificationModal(false);
            // Recarregar dados do usuário
            const updatedUser = StorageService.getCurrentUser();
            if (updatedUser) {
              setCurrentUser(updatedUser);
            }
          }}
        />
      </div>
    </div>
  );
};

export default EditProfile;