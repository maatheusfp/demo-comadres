import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StorageService, User, Chat } from "@/utils/storage";
import { MessageCircle, User as UserIcon, Clock } from "lucide-react";

interface ChatListProps {
  currentUser: User;
}

const ChatList = ({ currentUser }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatUsers, setChatUsers] = useState<{ [key: number]: User }>({});
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userChats = StorageService.getUserChats(currentUser.id);
    setChats(userChats);

    // Buscar dados dos usuários envolvidos nos chats
    const allUsers = StorageService.getUsers();
    const usersMap: { [key: number]: User } = {};
    
    userChats.forEach(chat => {
      const otherUserId = chat.id_usuario_1 === currentUser.id ? chat.id_usuario_2 : chat.id_usuario_1;
      const user = allUsers.find(u => u.id === otherUserId);
      if (user) {
        usersMap[otherUserId] = user;
      }
    });
    
    setChatUsers(usersMap);
  }, [currentUser.id, isOpen]);

  const handleChatClick = (chat: Chat) => {
    const otherUserId = chat.id_usuario_1 === currentUser.id ? chat.id_usuario_2 : chat.id_usuario_1;
    if (chatUsers[otherUserId]) {
      setIsOpen(false);
      navigate(`/chat/${otherUserId}`, { 
        state: { otherUser: chatUsers[otherUserId] } 
      });
    }
  };

  const getLastMessage = (chat: Chat) => {
    if (chat.mensagens.length === 0) return "Nenhuma mensagem ainda";
    const lastMessage = chat.mensagens[chat.mensagens.length - 1];
    return lastMessage.texto;
  };

  const getLastMessageTime = (chat: Chat) => {
    if (chat.mensagens.length === 0) return "";
    const lastMessage = chat.mensagens[chat.mensagens.length - 1];
    if (!lastMessage.timestamp) return "";
    
    const date = new Date(lastMessage.timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Suas Conversas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chats.length === 0 ? (
            <Card className="p-6 text-center">
              <UserIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Você ainda não iniciou nenhuma conversa
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Vá para o feed e comece a conversar!
              </p>
            </Card>
          ) : (
            chats.map((chat) => {
              const otherUserId = chat.id_usuario_1 === currentUser.id ? chat.id_usuario_2 : chat.id_usuario_1;
              const otherUser = chatUsers[otherUserId];
              
              if (!otherUser) return null;
              
              return (
                <Card 
                  key={chat.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm">{otherUser.nome}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {getLastMessage(chat)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {getLastMessageTime(chat)}
                        </span>
                      </div>
                      {chat.mensagens.length > 0 && (
                        <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                          {chat.mensagens.length}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatList;