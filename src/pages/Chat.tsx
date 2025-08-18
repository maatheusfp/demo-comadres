import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StorageService, User, Chat as ChatType, Message } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Baby, Check, X } from "lucide-react";

const Chat = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [chat, setChat] = useState<ChatType | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Função para forçar atualização
  const forceRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUser(user);

    // Get other user from location state or fetch from storage
    let targetUser = location.state?.otherUser;
    if (!targetUser && userId) {
      const users = StorageService.getUsers();
      targetUser = users.find(u => u.id === parseInt(userId));
    }

    if (!targetUser) {
      toast({
        title: "Usuário não encontrado",
        description: "Redirecionando para o feed.",
        variant: "destructive",
      });
      navigate("/feed");
      return;
    }

    setOtherUser(targetUser);

    // Load existing chat
    const existingChat = StorageService.getChatBetweenUsers(user.id, targetUser.id);
    setChat(existingChat);
  }, [userId, location.state, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.mensagens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser || !otherUser) return;

    setLoading(true);

    try {
      const message: Message = {
        remetente: currentUser.id,
        texto: newMessage.trim(),
      };

      const updatedChat = StorageService.addMessage(currentUser.id, otherUser.id, message);
      setChat(updatedChat);
      setNewMessage("");

      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi entregue!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChildData = async () => {
    if (!currentUser || !otherUser) return;

    setLoading(true);

    try {
      // Verificar se já tem permissão
      if (StorageService.canViewChildData(currentUser.id, otherUser.id)) {
        toast({
          title: "Acesso já concedido",
          description: "Você já tem acesso aos dados dos filhos desta usuária.",
        });
        return;
      }

      // Verificar se já existe solicitação pendente
      const existingRequest = StorageService.getChildDataRequests().find(req => 
        req.solicitante_id === currentUser.id && 
        req.destinatario_id === otherUser.id && 
        req.status === 'pendente'
      );

      if (existingRequest) {
        toast({
          title: "Solicitação já enviada",
          description: "Aguarde a resposta da usuária.",
        });
        return;
      }

      const updatedChat = StorageService.sendChildDataRequestMessage(currentUser.id, otherUser.id);
      setChat(updatedChat);

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação para ver os dados dos filhos foi enviada!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: number, response: 'aceito' | 'recusado') => {
    setLoading(true);

    try {
      // Primeiro, responder à solicitação
      const updatedRequest = StorageService.respondToChildDataRequest(requestId, response);
      
      // Forçar atualização imediata do chat
      const freshChat = StorageService.getChatBetweenUsers(currentUser!.id, otherUser!.id);
      
      // Verificar se a mensagem foi atualizada corretamente
      if (freshChat) {
        const messageIndex = freshChat.mensagens.findIndex(msg => 
          msg.dados_solicitacao?.request_id === requestId
        );
        
        if (messageIndex !== -1 && freshChat.mensagens[messageIndex].dados_solicitacao) {
          // Garantir que o status está atualizado na mensagem
          freshChat.mensagens[messageIndex].dados_solicitacao!.status = response;
        }
        
        setChat({...freshChat}); // Criar nova referência para forçar re-render
      }

      // Atualizar também o currentUser se ele foi afetado pela mudança de permissões
      if (response === 'aceito') {
        const updatedCurrentUser = StorageService.getCurrentUser();
        if (updatedCurrentUser) {
          setCurrentUser(updatedCurrentUser);
        }
        
        const updatedOtherUser = StorageService.getUserById(otherUser!.id);
        if (updatedOtherUser) {
          setOtherUser(updatedOtherUser);
        }
      }

      // Forçar re-render completo
      forceRefresh();

      toast({
        title: response === 'aceito' ? "Solicitação aceita" : "Solicitação recusada",
        description: response === 'aceito' 
          ? "O usuário agora pode ver os dados dos seus filhos."
          : "A solicitação foi recusada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar a resposta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.remetente === currentUser!.id;
    
    if (message.tipo === 'solicitacao_dados_filhos') {
      return (
        <div key={index} className="flex justify-center">
          <Card className="p-4 max-w-sm bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Solicitação de Acesso aos Dados
              </span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              {message.texto}
            </p>
            
            {message.dados_solicitacao?.status === 'pendente' && !isCurrentUser && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleRespondToRequest(message.dados_solicitacao!.request_id, 'aceito')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespondToRequest(message.dados_solicitacao!.request_id, 'recusado')}
                  disabled={loading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Recusar
                </Button>
              </div>
            )}
            
            {message.dados_solicitacao?.status === 'aceito' && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                <span className="text-xs">Solicitação aceita</span>
              </div>
            )}
            
            {message.dados_solicitacao?.status === 'recusado' && (
              <div className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                <span className="text-xs">Solicitação recusada</span>
              </div>
            )}
            
            {message.dados_solicitacao?.status === 'pendente' && isCurrentUser && (
              <div className="text-xs text-amber-600">
                Aguardando resposta...
              </div>
            )}
          </Card>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? "bg-gradient-primary text-white"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <p className="text-sm">{message.texto}</p>
          {message.timestamp && (
            <p className={`text-xs mt-1 ${
              isCurrentUser ? "text-white/70" : "text-muted-foreground"
            }`}>
              {formatTime(message.timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (!currentUser || !otherUser) {
    return null;
  }

  const canRequestChildData = !StorageService.canViewChildData(currentUser.id, otherUser.id) &&
    !StorageService.getChildDataRequests().some(req => 
      req.solicitante_id === currentUser.id && 
      req.destinatario_id === otherUser.id && 
      req.status === 'pendente'
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <img 
            src="/logo.png" 
            alt="Match Mães Solo Logo" 
            className="h-20 w-20 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{otherUser.nome}</h1>
            <p className="text-white/80 text-sm">{otherUser.localizacao}</p>
          </div>
          {canRequestChildData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRequestChildData}
              disabled={loading}
              className="text-white hover:bg-white/20 text-xs"
            >
              <Baby className="h-4 w-4 mr-1" />
              Solicitar dados dos filhos
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!chat || chat.mensagens.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-muted/50 p-6 rounded-lg max-w-md mx-auto">
              <img 
                src="/logo.png" 
                alt="Match Mães Solo Logo" 
                className="h-20 w-20 mx-auto mb-3 object-contain"
              />
              <p className="text-muted-foreground">
                Início da conversa com {otherUser.nome}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Envie a primeira mensagem!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {chat.mensagens.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-lg mx-auto">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={loading}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="maternal"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;