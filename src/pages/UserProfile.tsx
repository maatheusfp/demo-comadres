import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Clock, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StorageService, User, Review } from "@/utils/storage";
import { useToast } from "@/hooks/use-toast";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}

const StarRating = ({ rating, onRatingChange, interactive = false, size = 20 }: StarRatingProps) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={`${
          star <= rating 
            ? "fill-primary text-primary" 
            : "text-muted-foreground"
        } ${interactive ? "cursor-pointer hover:text-primary" : ""}`}
        onClick={interactive ? () => onRatingChange?.(star) : undefined}
      />
    ))}
  </div>
);

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const current = StorageService.getCurrentUser();
    if (!current) {
      navigate("/login");
      return;
    }

    const userId = parseInt(id as string);
    const targetUser = StorageService.getUserById(userId);
    
    if (!targetUser) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      });
      navigate("/feed");
      return;
    }

    setCurrentUser(current);
    setUser(targetUser);
  }, [id, navigate, toast]);

  const handleAddReview = () => {
    if (!user || !currentUser) return;

    const hasReviewed = StorageService.hasUserReviewed(user.id, currentUser.id);
    if (hasReviewed) {
      toast({
        title: "Aviso",
        description: "Você já avaliou esta mãe",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUser = StorageService.addReview(user.id, {
        avaliador_id: currentUser.id,
        avaliador_nome: currentUser.nome,
        estrelas: newRating,
        comentario: newComment,
        data: Date.now(),
      });

      setUser(updatedUser);
      setNewRating(5);
      setNewComment("");
      setIsDialogOpen(false);

      toast({
        title: "Sucesso",
        description: "Avaliação adicionada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar avaliação",
        variant: "destructive",
      });
    }
  };

  const handleStartChat = () => {
    if (!user) return;
    navigate(`/chat/${user.id}`);
  };

  if (!user || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const averageRating = StorageService.getUserAverageRating(user.id);
  const hasReviewed = StorageService.hasUserReviewed(user.id, currentUser.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-maternal-light to-maternal-soft p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-maternal-primary hover:bg-maternal-primary/10"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-xl font-semibold text-maternal-primary">Perfil</h1>
          <div></div>
        </div>

        {/* User Info Card */}
        <Card className="border-maternal-accent/20 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-maternal-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon size={40} className="text-maternal-primary" />
            </div>
            <CardTitle className="text-2xl text-maternal-primary">{user.nome}</CardTitle>
            {averageRating > 0 && (
              <div className="flex items-center justify-center gap-2">
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-sm text-muted-foreground">
                  ({averageRating.toFixed(1)}) • {user.avaliacoes?.length || 0} avaliações
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserIcon size={16} className="text-maternal-primary" />
                <span className="text-sm">{user.idade_mae} anos</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-maternal-primary" />
                <span className="text-sm">{user.localizacao}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-maternal-primary" />
                <span className="text-sm">Trabalha: {user.horario_trabalho}</span>
              </div>
            </div>
            
            <div>
              <Badge variant="secondary" className="bg-maternal-accent/10 text-maternal-primary">
                Filho(s): {user.faixa_filho}
              </Badge>
            </div>

            {user.disponivel_cuidar && (
              <div className="p-3 bg-maternal-light/50 rounded-lg">
                <h4 className="font-medium text-maternal-primary mb-2">Disponível para cuidar</h4>
                <p className="text-sm text-muted-foreground mb-1">
                  Horário: {user.horario_disponibilidade}
                </p>
                {user.observacoes_disponibilidade && (
                  <p className="text-sm text-muted-foreground">
                    {user.observacoes_disponibilidade}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleStartChat}
                className="flex-1 bg-maternal-primary hover:bg-maternal-primary/90"
              >
                <MessageCircle size={16} className="mr-2" />
                Conversar
              </Button>
              
              {!hasReviewed && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Star size={16} className="mr-2" />
                      Avaliar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Avaliar {user.nome}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Sua avaliação</label>
                        <StarRating
                          rating={newRating}
                          onRatingChange={setNewRating}
                          interactive
                          size={32}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Comentário (opcional)
                        </label>
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Conte sobre sua experiência..."
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleAddReview} className="w-full">
                        Enviar Avaliação
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {user.avaliacoes && user.avaliacoes.length > 0 && (
          <Card className="border-maternal-accent/20 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-maternal-primary">
                Avaliações ({user.avaliacoes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.avaliacoes.map((review) => (
                <div key={review.id} className="border-b border-maternal-accent/10 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{review.avaliador_nome}</span>
                      <StarRating rating={review.estrelas} size={16} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.data).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comentario && (
                    <p className="text-sm text-muted-foreground">{review.comentario}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;