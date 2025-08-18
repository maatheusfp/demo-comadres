export interface Review {
  id: number;
  avaliador_id: number;
  avaliador_nome: string;
  estrelas: number;
  comentario: string;
  data: number;
}

export interface ChildDataRequest {
  id: number;
  solicitante_id: number;
  solicitante_nome: string;
  destinatario_id: number;
  status: 'pendente' | 'aceito' | 'recusado';
  data_solicitacao: number;
  data_resposta?: number;
}

export interface VerificationData {
  // Dados da mãe
  rg_mae: string;
  cpf_mae: string;
  historico_profissional: string;
  referencias: string;
  antecedentes_criminais: string;
  // Dados dos filhos
  filhos: Array<{
    nome: string;
    idade: number;
    documentos: string;
    alergias: string;
    medicamentos: string;
    restricoes_tela: boolean;
    tempo_max_tela: string;
    atividades_permitidas: string[];
    observacoes_especiais: string;
  }>;
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
  verificado?: boolean;
  dados_verificacao?: VerificationData;
  permissoes_dados_filhos?: number[]; // IDs dos usuários que podem ver dados dos filhos
}

export interface Message {
  remetente: number;
  texto: string;
  timestamp?: number;
  tipo?: 'texto' | 'solicitacao_dados_filhos';
  dados_solicitacao?: {
    request_id: number;
    status: 'pendente' | 'aceito' | 'recusado';
  };
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

import usersData from '../data/users.json';
import chatsData from '../data/chats.json';
import currentUserData from '../data/current-user.json';

export class StorageService {
  static initializeData() {
    // Data is already initialized in JSON files
    // This method is kept for compatibility but does nothing
  }

  static getUsers(): User[] {
    return usersData as User[];
  }

  static addUser(user: Omit<User, 'id'>): User {
    const users = this.getUsers();
    const newUser = { ...user, id: Date.now() };
    users.push(newUser);
    // In a real implementation, you would write to the JSON file
    // For now, this will only work during the session
    return newUser;
  }

  static loginUser(email: string, senha: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.senha === senha);
    if (user) {
      // In a real implementation, you would write to current-user.json
      // For now, we'll use a module variable to track the current user
      (globalThis as any).__currentUser = user;
      return user;
    }
    return null;
  }

  static updateUser(updatedUser: User): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      // In a real implementation, you would write to users.json
      
      // Update current user if it's the same user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        (globalThis as any).__currentUser = updatedUser;
      }
      
      return updatedUser;
    }
    
    throw new Error('Usuário não encontrado');
  }

  static getCurrentUser(): User | null {
    return (globalThis as any).__currentUser || currentUserData;
  }

  static logout() {
    (globalThis as any).__currentUser = null;
  }

  static getChats(): Chat[] {
    return [...(chatsData as Chat[]), ...((globalThis as any).__additionalChats || [])];
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
      // Store additional chats in memory during session
      if (!(globalThis as any).__additionalChats) {
        (globalThis as any).__additionalChats = [];
      }
      (globalThis as any).__additionalChats.push(chat);
    }

    const messageWithTimestamp = { ...message, timestamp: Date.now() };
    chat.mensagens.push(messageWithTimestamp);
    
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
      // In a real implementation, you would write to users.json
      
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

  // Métodos para gerenciar solicitações de acesso aos dados dos filhos
  static getChildDataRequests(): ChildDataRequest[] {
    return (globalThis as any).__childDataRequests || [];
  }

  static createChildDataRequest(solicitanteId: number, destinatarioId: number): ChildDataRequest {
    const solicitante = this.getUserById(solicitanteId);
    if (!solicitante) throw new Error('Solicitante não encontrado');

    // Verificar se já existe uma solicitação pendente
    const existingRequest = this.getChildDataRequests().find(req => 
      req.solicitante_id === solicitanteId && 
      req.destinatario_id === destinatarioId && 
      req.status === 'pendente'
    );

    if (existingRequest) {
      throw new Error('Já existe uma solicitação pendente');
    }

    const newRequest: ChildDataRequest = {
      id: Date.now(),
      solicitante_id: solicitanteId,
      solicitante_nome: solicitante.nome,
      destinatario_id: destinatarioId,
      status: 'pendente',
      data_solicitacao: Date.now()
    };

    if (!(globalThis as any).__childDataRequests) {
      (globalThis as any).__childDataRequests = [];
    }
    (globalThis as any).__childDataRequests.push(newRequest);

    return newRequest;
  }

  static sendChildDataRequestMessage(solicitanteId: number, destinatarioId: number): Chat {
    const request = this.createChildDataRequest(solicitanteId, destinatarioId);
    const solicitante = this.getUserById(solicitanteId);
    
    const message: Message = {
      remetente: solicitanteId,
      texto: `${solicitante?.nome} gostaria de ter acesso aos dados dos seus filhos para poder cuidar melhor deles.`,
      timestamp: Date.now(),
      tipo: 'solicitacao_dados_filhos',
      dados_solicitacao: {
        request_id: request.id,
        status: 'pendente'
      }
    };

    return this.addMessage(solicitanteId, destinatarioId, message);
  }

  static respondToChildDataRequest(requestId: number, response: 'aceito' | 'recusado'): ChildDataRequest {
    const requests = this.getChildDataRequests();
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
      throw new Error('Solicitação não encontrada');
    }

    const request = requests[requestIndex];
    request.status = response;
    request.data_resposta = Date.now();

    // Se aceito, adicionar permissão ao usuário
    if (response === 'aceito') {
      const destinatario = this.getUserById(request.destinatario_id);
      if (destinatario) {
        if (!destinatario.permissoes_dados_filhos) {
          destinatario.permissoes_dados_filhos = [];
        }
        if (!destinatario.permissoes_dados_filhos.includes(request.solicitante_id)) {
          destinatario.permissoes_dados_filhos.push(request.solicitante_id);
          this.updateUser(destinatario);
        }
      }
    }

    // Atualizar mensagem no chat
    this.updateChildDataRequestMessage(request);

    return request;
  }

  static updateChildDataRequestMessage(request: ChildDataRequest) {
    const chat = this.getChatBetweenUsers(request.solicitante_id, request.destinatario_id);
    if (chat) {
      const messageIndex = chat.mensagens.findIndex(msg => 
        msg.dados_solicitacao?.request_id === request.id
      );
      
      if (messageIndex !== -1) {
        // Garantir que a mensagem é atualizada com o novo status
        chat.mensagens[messageIndex].dados_solicitacao = {
          request_id: request.id,
          status: request.status
        };
        
        // Forçar atualização da referência do array para trigger re-render
        chat.mensagens = [...chat.mensagens];
      }
    }
  }

  static canViewChildData(viewerId: number, parentId: number): boolean {
    const parent = this.getUserById(parentId);
    if (!parent || !parent.permissoes_dados_filhos) return false;
    
    return parent.permissoes_dados_filhos.includes(viewerId);
  }

  static getUserPendingChildDataRequests(userId: number): ChildDataRequest[] {
    return this.getChildDataRequests().filter(req => 
      req.destinatario_id === userId && req.status === 'pendente'
    );
  }

  static getRequestById(requestId: number): ChildDataRequest | null {
    return this.getChildDataRequests().find(req => req.id === requestId) || null;
  }

  // Algoritmo de matching baseado nos dados dos filhos
  static calculateChildrenSimilarity(user1: User, user2: User): number {
    // Se algum usuário não tem dados de verificação ou filhos, retorna 0%
    if (!user1.dados_verificacao?.filhos || !user2.dados_verificacao?.filhos) {
      return 0;
    }

    const filhos1 = user1.dados_verificacao.filhos;
    const filhos2 = user2.dados_verificacao.filhos;

    let totalMatches = 0;
    let totalComparisons = 0;

    // Comparar cada filho do user1 com cada filho do user2
    filhos1.forEach(filho1 => {
      filhos2.forEach(filho2 => {
        let matchCount = 0;
        let comparisonCount = 0;

        // 1. Comparar idade (tolerância de ±1 ano)
        comparisonCount++;
        if (Math.abs(filho1.idade - filho2.idade) <= 1) {
          matchCount++;
        }

        // 2. Comparar restrições de tela
        comparisonCount++;
        if (filho1.restricoes_tela === filho2.restricoes_tela) {
          matchCount++;
        }

        // 3. Comparar atividades permitidas
        comparisonCount++;
        const atividades1 = new Set(filho1.atividades_permitidas);
        const atividades2 = new Set(filho2.atividades_permitidas);
        
        // Calcular interseção das atividades
        const atividadesComuns = [...atividades1].filter(x => atividades2.has(x));
        const totalAtividades = new Set([...atividades1, ...atividades2]).size;
        
        if (totalAtividades > 0) {
          const atividadesSimilarity = atividadesComuns.length / totalAtividades;
          matchCount += atividadesSimilarity;
        }

        totalMatches += matchCount;
        totalComparisons += comparisonCount;
      });
    });

    // Calcular porcentagem final
    if (totalComparisons === 0) return 0;
    
    const similarity = (totalMatches / totalComparisons) * 100;
    return Math.round(similarity);
  }

  static getUsersWithMatchPercentage(currentUserId: number): Array<User & { matchPercentage: number }> {
    const users = this.getUsers();
    const currentUser = users.find(u => u.id === currentUserId);
    
    if (!currentUser) return [];

    // Filtrar outros usuários e calcular matching
    const usersWithMatch = users
      .filter(user => user.id !== currentUserId)
      .map(user => ({
        ...user,
        matchPercentage: this.calculateChildrenSimilarity(currentUser, user)
      }))
      .sort((a, b) => b.matchPercentage - a.matchPercentage); // Ordenar por maior match

    return usersWithMatch;
  }

  static getMatchingUsers(currentUserId: number, limit?: number): Array<User & { matchPercentage: number }> {
    const usersWithMatch = this.getUsersWithMatchPercentage(currentUserId);
    
    if (limit) {
      return usersWithMatch.slice(0, limit);
    }
    
    return usersWithMatch;
  }
}