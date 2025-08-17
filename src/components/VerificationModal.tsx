import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StorageService, VerificationData } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { Shield, User, Baby, X, Plus, Trash } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VerificationModal = ({ isOpen, onClose, onComplete }: VerificationModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [dadosMae, setDadosMae] = useState({
    rg_mae: "",
    cpf_mae: "",
    historico_profissional: "",
    referencias: "",
    antecedentes_criminais: ""
  });

  const [filhos, setFilhos] = useState([{
    nome: "",
    idade: 0,
    documentos: "",
    alergias: "",
    medicamentos: "",
    restricoes_tela: false,
    tempo_max_tela: "",
    atividades_permitidas: [],
    observacoes_especiais: ""
  }]);

  const atividadesDisponiveis = [
    "Brincadeiras ao ar livre",
    "Jogos educativos", 
    "Leitura",
    "Desenho/Pintura",
    "Música",
    "Culinária básica",
    "Artesanato",
    "Esportes"
  ];

  const addFilho = () => {
    setFilhos([...filhos, {
      nome: "",
      idade: 0,
      documentos: "",
      alergias: "",
      medicamentos: "",
      restricoes_tela: false,
      tempo_max_tela: "",
      atividades_permitidas: [],
      observacoes_especiais: ""
    }]);
  };

  const removeFilho = (index: number) => {
    if (filhos.length > 1) {
      setFilhos(filhos.filter((_, i) => i !== index));
    }
  };

  const updateFilho = (index: number, field: string, value: any) => {
    const updated = filhos.map((filho, i) => 
      i === index ? { ...filho, [field]: value } : filho
    );
    setFilhos(updated);
  };

  const toggleAtividade = (filhoIndex: number, atividade: string) => {
    const filho = filhos[filhoIndex];
    const atividades = filho.atividades_permitidas.includes(atividade)
      ? filho.atividades_permitidas.filter(a => a !== atividade)
      : [...filho.atividades_permitidas, atividade];
    
    updateFilho(filhoIndex, 'atividades_permitidas', atividades);
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!dadosMae.rg_mae || !dadosMae.cpf_mae) {
      toast({
        title: "Campos obrigatórios",
        description: "RG e CPF são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const filhosValidos = filhos.every(f => f.nome && f.idade > 0);
    if (!filhosValidos) {
      toast({
        title: "Dados dos filhos incompletos", 
        description: "Nome e idade são obrigatórios para todos os filhos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const currentUser = StorageService.getCurrentUser();
      if (!currentUser) return;

      const verificationData: VerificationData = {
        ...dadosMae,
        filhos
      };

      const updatedUser = {
        ...currentUser,
        verificado: true,
        dados_verificacao: verificationData
      };

      StorageService.updateUser(updatedUser);
      
      toast({
        title: "Verificação concluída!",
        description: "Seu perfil foi verificado com sucesso.",
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Ocorreu um erro ao salvar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Questionário de Verificação - Etapa {currentStep}/2
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Etapa 1: Dados da mãe */}
        {currentStep === 1 && (
          <Card className="p-6 space-y-6">
            <div className="text-center mb-4">
              <User className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Verificação da Mãe</h3>
              <p className="text-sm text-muted-foreground">
                Para garantir a segurança, precisamos verificar sua identidade
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RG *</Label>
                  <Input
                    value={dadosMae.rg_mae}
                    onChange={(e) => setDadosMae({...dadosMae, rg_mae: e.target.value})}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF *</Label>
                  <Input
                    value={dadosMae.cpf_mae}
                    onChange={(e) => setDadosMae({...dadosMae, cpf_mae: e.target.value})}
                    placeholder="123.456.789-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Histórico Profissional</Label>
                <Textarea
                  value={dadosMae.historico_profissional}
                  onChange={(e) => setDadosMae({...dadosMae, historico_profissional: e.target.value})}
                  placeholder="Descreva sua experiência profissional..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Referências Pessoais</Label>
                <Textarea
                  value={dadosMae.referencias}
                  onChange={(e) => setDadosMae({...dadosMae, referencias: e.target.value})}
                  placeholder="Nome e contato de referências (opcional)"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Declaração de Antecedentes</Label>
                <Textarea
                  value={dadosMae.antecedentes_criminais}
                  onChange={(e) => setDadosMae({...dadosMae, antecedentes_criminais: e.target.value})}
                  placeholder="Declaro que não possuo antecedentes criminais..."
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} variant="maternal">
                Próxima Etapa
              </Button>
            </div>
          </Card>
        )}

        {/* Etapa 2: Dados dos filhos */}
        {currentStep === 2 && (
          <Card className="p-6 space-y-6">
            <div className="text-center mb-4">
              <Baby className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Dados dos Filhos</h3>
              <p className="text-sm text-muted-foreground">
                Informações importantes sobre seus filhos para cuidados adequados
              </p>
            </div>

            <div className="space-y-6">
              {filhos.map((filho, index) => (
                <div key={index} className="border border-border/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filho {index + 1}</h4>
                    {filhos.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilho(index)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={filho.nome}
                        onChange={(e) => updateFilho(index, 'nome', e.target.value)}
                        placeholder="Nome da criança"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Idade *</Label>
                      <Input
                        type="number"
                        value={filho.idade || ''}
                        onChange={(e) => updateFilho(index, 'idade', parseInt(e.target.value) || 0)}
                        placeholder="5"
                        min="0"
                        max="18"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Documentos</Label>
                    <Input
                      value={filho.documentos}
                      onChange={(e) => updateFilho(index, 'documentos', e.target.value)}
                      placeholder="CPF, RG, Certidão de nascimento..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alergias</Label>
                      <Textarea
                        value={filho.alergias}
                        onChange={(e) => updateFilho(index, 'alergias', e.target.value)}
                        placeholder="Lista de alergias..."
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Medicamentos</Label>
                      <Textarea
                        value={filho.medicamentos}
                        onChange={(e) => updateFilho(index, 'medicamentos', e.target.value)}
                        placeholder="Medicamentos em uso..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Restrições de tela</Label>
                        <p className="text-xs text-muted-foreground">Limitar tempo de tela?</p>
                      </div>
                      <Switch
                        checked={filho.restricoes_tela}
                        onCheckedChange={(checked) => updateFilho(index, 'restricoes_tela', checked)}
                      />
                    </div>

                    {filho.restricoes_tela && (
                      <div className="space-y-2">
                        <Label>Tempo máximo de tela</Label>
                        <Input
                          value={filho.tempo_max_tela}
                          onChange={(e) => updateFilho(index, 'tempo_max_tela', e.target.value)}
                          placeholder="Ex: 1 hora por dia"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Atividades permitidas</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {atividadesDisponiveis.map((atividade) => (
                        <div key={atividade} className="flex items-center space-x-2">
                          <Checkbox
                            checked={filho.atividades_permitidas.includes(atividade)}
                            onCheckedChange={() => toggleAtividade(index, atividade)}
                          />
                          <Label className="text-sm">{atividade}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações especiais</Label>
                    <Textarea
                      value={filho.observacoes_especiais}
                      onChange={(e) => updateFilho(index, 'observacoes_especiais', e.target.value)}
                      placeholder="Informações importantes sobre cuidados especiais..."
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addFilho}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar outro filho
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading} variant="maternal">
                {loading ? "Salvando..." : "Finalizar Verificação"}
              </Button>
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;