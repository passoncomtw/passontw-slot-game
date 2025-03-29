import { apiService } from './apiClient';

export interface GameListParams {
  type?: string;
  featured?: boolean;
  new?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface GameResponse {
  gameId: string;
  title: string;
  description: string;
  gameType: string;
  icon: string;
  backgroundColor: string;
  rtp: number;
  volatility: string;
  minBet: number;
  maxBet: number;
  features?: Record<string, any>;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  rating?: number;
  releaseDate: string;
}

export interface GameListResponse {
  games: GameResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GameSessionRequest {
  gameId: string;
  betAmount?: number;
}

export interface GameSessionResponse {
  sessionId: string;
  gameId: string;
  startTime: string;
  initialBalance: number;
  gameInfo: GameResponse;
}

const gameService = {
  // 獲取遊戲列表
  getGameList: (params?: GameListParams): Promise<GameListResponse> => {
    return apiService.get<GameListResponse>('/app/games', { params });
  },

  // 獲取遊戲詳情
  getGameDetail: (gameId: string): Promise<GameResponse> => {
    return apiService.get<GameResponse>(`/app/games/${gameId}`);
  },

  // 開始遊戲會話
  startGameSession: (data: GameSessionRequest): Promise<GameSessionResponse> => {
    return apiService.post<GameSessionResponse>('/app/game-sessions', data);
  },
};

export default gameService; 