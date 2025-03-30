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

// 新增下注請求介面
export interface PlaceBetRequest {
  sessionId: string;
  gameId: string;
  betAmount: number;
  betLines?: number[];
  betOptions?: Record<string, any>;
}

// 新增下注結果介面
export interface PlaceBetResponse {
  betId: string;
  sessionId: string;
  gameId: string;
  betAmount: number;
  isWin: boolean;
  winAmount: number;
  currentBalance: number;
  timestamp: string;
  results: GameResultItem[];
  jackpotWon: boolean;
  multiplier: number;
}

// 下注歷史請求參數
export interface BetHistoryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  gameId?: string;
}

// 下注歷史回應
export interface BetHistoryResponse {
  bets: PlaceBetResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 遊戲結果項目
export interface GameResultItem {
  position: number;
  symbol: string;
  isWinningSymbol: boolean;
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

  // 新增下注方法
  placeBet: (data: PlaceBetRequest): Promise<PlaceBetResponse> => {
    return apiService.post<PlaceBetResponse>('/app/bets', data);
  },

  // 獲取遊戲結果
  getGameResult: (betId: string): Promise<PlaceBetResponse> => {
    return apiService.get<PlaceBetResponse>(`/app/bets/${betId}/result`);
  },

  // 獲取下注歷史
  getBetHistory: (params?: BetHistoryParams): Promise<BetHistoryResponse> => {
    return apiService.get<BetHistoryResponse>('/app/bets/history', { params });
  },
};

export default gameService; 