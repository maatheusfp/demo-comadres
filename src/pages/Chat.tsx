import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StorageService, User, Chat as ChatType, Message } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Heart } from "lucide-react";

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

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  if (!currentUser || !otherUser) {
    return null;
  }

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
          <div className="bg-white/20 p-2 rounded-full">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">{otherUser.nome}</h1>
            <p className="text-white/80 text-sm">{otherUser.localizacao}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!chat || chat.mensagens.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-muted/50 p-6 rounded-lg max-w-md mx-auto">
              <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
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
            {chat.mensagens.map((message, index) => {
              const isCurrentUser = message.remetente === currentUser.id;
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
            })}
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