import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StorageService, User } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";
import { Heart, MessageCircle, MapPin, Clock, User as UserIcon, LogOut, Settings, CheckCircle, Shield } from "lucide-react";
import ChatList from "@/components/ChatList";

const Feed = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUser(user);
    const allUsers = StorageService.getUsers();
    setUsers(allUsers.filter(u => u.id !== user.id));
  }, [navigate]);

  const handleStartChat = (otherUser: User) => {
    navigate(`/chat/${otherUser.id}`, { state: { otherUser } });
  };

  const handleLogout = () => {
    StorageService.logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/login");
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Match Mães Solo</h1>
              <p className="text-white/80 text-sm">Olá, {currentUser.nome}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChatList currentUser={currentUser} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/edit-profile")}
              className="text-white hover:bg-white/20"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Conecte-se com outras mães
          </h2>
          <p className="text-muted-foreground">
            Encontre mães na sua região com filhos de idades similares
          </p>
        </div>

        {users.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-card shadow-card">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma mãe encontrada no momento.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-soft transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {user.nome}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      {user.idade_mae} anos
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <Badge variant="secondary" className="bg-accent/50">
                          Filhos: {user.faixa_filho}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {user.localizacao}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Trabalha: {user.horario_trabalho}
                        </span>
                      </div>

                      {user.disponivel_cuidar && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Disponível para cuidar
                          </Badge>
                        </div>
                      )}

                      {user.horario_disponibilidade && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Disponibilidade:</strong> {user.horario_disponibilidade}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    variant="outline"
                    className="flex-1 border-accent/30 text-primary hover:bg-primary/10"
                    disabled={!currentUser.verificado}
                  >
                    Ver Perfil
                  </Button>
                  <Button 
                    onClick={() => handleStartChat(user)}
                    className="flex-1"
                    variant="maternal"
                    disabled={!currentUser.verificado}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar
                  </Button>
                </div>
                
                {!currentUser.verificado && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 text-orange-700">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Complete a verificação para interagir</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;