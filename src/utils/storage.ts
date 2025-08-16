export interface Review {
  id: number;
  avaliador_id: number;
  avaliador_nome: string;
  estrelas: number;
  comentario: string;
  data: number;
}

export interface User {
  id: number;
  nome: string;
  idade_mae: number;
  faixa_filho: string;
  horario_trabalho: string;
  localizacao: string;
  email: string;
  senha: string;
  disponivel_cuidar?: boolean;
  horario_disponibilidade?: string;
  observacoes_disponibilidade?: string;
  avaliacoes?: Review[];
}

export interface Message {
  remetente: number;
  texto: string;
  timestamp?: number;
}

export interface Chat {
  id: number;
  id_usuario_1: number;
  id_usuario_2: number;
  mensagens: Message[];
}

const INITIAL_USERS: User[] = [
  {
    id: 1,
    nome: "Maria Silva",
    idade_mae: 32,
    faixa_filho: "3-5 anos",
    horario_trabalho: "08:00-17:00",
    localizacao: "São Paulo - SP",
    email: "maria@example.com",
    senha: "1234",
    disponivel_cuidar: true,
    horario_disponibilidade: "18:00-20:00",
    observacoes_disponibilidade: "Posso cuidar de crianças até 8 anos nos fins de semana"
  },
  {
    id: 2,
    nome: "Ana Souza",
    idade_mae: 28,
    faixa_filho: "1-2 anos",
    horario_trabalho: "09:00-18:00",
    localizacao: "Rio de Janeiro - RJ",
    email: "ana@example.com",
    senha: "abcd",
    disponivel_cuidar: false,
    horario_disponibilidade: "",
    observacoes_disponibilidade: ""
  },
  {
    id: 3,
    nome: "Fernanda Lima",
    idade_mae: 35,
    faixa_filho: "6-8 anos",
    horario_trabalho: "07:00-16:00",
    localizacao: "Belo Horizonte - MG",
    email: "fernanda@example.com",
    senha: "123456"
  },
  {
    id: 4,
    nome: "Carla Mendes",
    idade_mae: 30,
    faixa_filho: "0-1 ano",
    horario_trabalho: "08:30-17:30",
    localizacao: "Curitiba - PR",
    email: "carla@example.com",
    senha: "senha"
  }
];

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    id_usuario_1: 1,
    id_usuario_2: 2,
    mensagens: [
      { remetente: 1, texto: "Oi, tudo bem?", timestamp: Date.now() - 60000 },
      { remetente: 2, texto: "Tudo sim! E você?", timestamp: Date.now() - 30000 }
    ]
  }
];

export class StorageService {
  static initializeData() {
    if (!localStorage.getItem('usuarios')) {
      localStorage.setItem('usuarios', JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem('chats')) {
      localStorage.setItem('chats', JSON.stringify(INITIAL_CHATS));
    }
  }

  static getUsers(): User[] {
    const users = localStorage.getItem('usuarios');
    return users ? JSON.parse(users) : [];
  }

  static addUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const newUser = { ...user, id: Date.now() };
    users.push(newUser);
    localStorage.setItem('usuarios', JSON.stringify(users));
    return newUser;
  }

  static loginUser(email: string, senha: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.senha === senha);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  }

  static updateUser(updatedUser: User): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('usuarios', JSON.stringify(users));
      
      // Update current user if it's the same user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      return updatedUser;
    }
    
    throw new Error('Usuário não encontrado');
  }

  static getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  static logout() {
    localStorage.removeItem('currentUser');
  }

  static getChats(): Chat[] {
    const chats = localStorage.getItem('chats');
    return chats ? JSON.parse(chats) : [];
  }

  static getChatBetweenUsers(userId1: number, userId2: number): Chat | null {
    const chats = this.getChats();
    return chats.find(chat => 
      (chat.id_usuario_1 === userId1 && chat.id_usuario_2 === userId2) ||
      (chat.id_usuario_1 === userId2 && chat.id_usuario_2 === userId1)
    ) || null;
  }

  static addMessage(userId1: number, userId2: number, message: Message): Chat {
    const chats = this.getChats();
    let chat = this.getChatBetweenUsers(userId1, userId2);
    
    if (!chat) {
      chat = {
        id: Date.now(),
        id_usuario_1: userId1,
        id_usuario_2: userId2,
        mensagens: []
      };
      chats.push(chat);
    }

    const messageWithTimestamp = { ...message, timestamp: Date.now() };
    chat.mensagens.push(messageWithTimestamp);
    
    localStorage.setItem('chats', JSON.stringify(chats));
    return chat;
  }

  static getUserChats(userId: number): Chat[] {
    const chats = this.getChats();
    return chats.filter(chat => 
      chat.id_usuario_1 === userId || chat.id_usuario_2 === userId
    );
  }

  static addReview(userId: number, review: Omit<Review, 'id'>): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      const user = users[userIndex];
      if (!user.avaliacoes) {
        user.avaliacoes = [];
      }
      
      const newReview = { ...review, id: Date.now() };
      user.avaliacoes.push(newReview);
      
      users[userIndex] = user;
      localStorage.setItem('usuarios', JSON.stringify(users));
      
      return user;
    }
    
    throw new Error('Usuário não encontrado');
  }

  static getUserById(userId: number): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  static hasUserReviewed(userId: number, reviewerId: number): boolean {
    const user = this.getUserById(userId);
    if (!user || !user.avaliacoes) return false;
    
    return user.avaliacoes.some(review => review.avaliador_id === reviewerId);
  }

  static getUserAverageRating(userId: number): number {
    const user = this.getUserById(userId);
    if (!user || !user.avaliacoes || user.avaliacoes.length === 0) return 0;
    
    const total = user.avaliacoes.reduce((sum, review) => sum + review.estrelas, 0);
    return Math.round((total / user.avaliacoes.length) * 10) / 10;
  }
}