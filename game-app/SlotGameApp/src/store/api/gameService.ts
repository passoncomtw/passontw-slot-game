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

// 依照Swagger定義的下注請求介面
export interface BetRequest {
  session_id: string;  // swagger定義要求
  bet_amount: number;  // swagger定義要求
  bet_lines?: number;  // swagger定義要求
  bet_options?: Record<string, any>;  // swagger定義要求
}

// 為了保持向後兼容，我們保留舊的介面但參數映射到新的
export interface PlaceBetRequest {
  sessionId: string;
  gameId: string;
  betAmount: number;
  betOptions?: Record<string, any>;
}

// 依照Swagger定義的下注回應介面
export interface BetResponse {
  session_id: string;
  round_id: string;
  transaction_id: string;
  bet_amount: number;
  win_amount: number;
  balance_before: number;
  balance_after: number;
  symbols: string[][];
  pay_lines?: any[];
  multiplier?: number;
  features?: Record<string, any>;
  created_at?: string;
}

// 為了保持向後兼容，我們保留舊的介面
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

// 將新的BetResponse轉換為舊的PlaceBetResponse格式
function convertToPlaceBetResponse(response: BetResponse, gameId: string): PlaceBetResponse {
  // 計算是否贏得遊戲
  const isWin = response.win_amount > 0;
  
  // 將二維陣列的符號轉換為一維陣列的GameResultItem
  const results: GameResultItem[] = [];
  
  if (response.symbols && response.symbols.length > 0) {
    // 假設symbols是一個二維陣列，例如 [["7", "bar"], ["cherry", "7"]]
    response.symbols.forEach((row, rowIndex) => {
      row.forEach((symbol, colIndex) => {
        // 判斷該符號是否是獲勝符號 (這裡簡單假設所有符號在有獎金時都是獲勝符號)
        const isWinningSymbol = isWin;
        
        results.push({
          position: rowIndex * row.length + colIndex,
          symbol,
          isWinningSymbol
        });
      });
    });
  }
  
  return {
    betId: response.round_id,
    sessionId: response.session_id,
    gameId: gameId,  // 使用傳入的gameId
    betAmount: response.bet_amount,
    isWin,
    winAmount: response.win_amount,
    currentBalance: response.balance_after,
    timestamp: response.created_at || new Date().toISOString(),
    results,
    jackpotWon: false,  // API沒有提供這個信息，默認為false
    multiplier: response.multiplier || 1
  };
}

// 將舊的PlaceBetRequest格式轉換為新的BetRequest格式
function convertToBetRequest(request: PlaceBetRequest): BetRequest {
  return {
    session_id: request.sessionId,
    bet_amount: request.betAmount,
    bet_options: request.betOptions
  };
}

const gameService = {
  // 獲取遊戲列表
  getGameList: async (params?: GameListParams): Promise<GameListResponse> => {
    try {
      const response = await apiService.get<GameListResponse>('/api/v1/games', { params });
      return response as GameListResponse;
    } catch (error) {
      console.error('獲取遊戲列表失敗:', error);
      // 返回空結果
      return {
        games: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      };
    }
  },

  // 獲取遊戲詳情
  getGameDetail: async (gameId: string): Promise<GameResponse> => {
    try {
      const response = await apiService.get<GameResponse>(`/api/v1/games/${gameId}`);
      return response as GameResponse;
    } catch (error) {
      console.error(`獲取遊戲 ${gameId} 詳情失敗:`, error);
      throw error;
    }
  },

  // 開始遊戲會話 - 根據swagger定義修改
  startGameSession: async (data: GameSessionRequest): Promise<GameSessionResponse> => {
    try {
      const response = await apiService.post<GameSessionResponse>('/api/v1/games/sessions', data);
      return response as GameSessionResponse;
    } catch (error) {
      console.error('開始遊戲會話失敗:', error);
      throw error;
    }
  },

  // 下注方法 - 根據swagger定義修改
  placeBet: async (data: PlaceBetRequest): Promise<PlaceBetResponse> => {
    try {
      // 將舊格式轉換為新的API格式
      const betRequest = convertToBetRequest(data);
      
      // 呼叫新的API
      const response = await apiService.post<BetResponse>('/api/v1/games/bets', betRequest);
      
      // 將API回應轉換為應用程式使用的格式
      return convertToPlaceBetResponse(response as BetResponse, data.gameId);
    } catch (error) {
      console.error('下注失敗:', error);
      throw error;
    }
  },

  // 獲取遊戲結果 - 根據swagger定義，可能需要調整
  getGameResult: async (betId: string): Promise<PlaceBetResponse> => {
    try {
      // 由於swagger沒有提供獲取單個下注結果的API，這裡使用模擬行為
      // 在實際應用中，我們應該考慮查詢歷史記錄或使用其他相應的API
      const response = await apiService.get<PlaceBetResponse>(`/api/v1/bets/${betId}/result`);
      return response as PlaceBetResponse;
    } catch (error) {
      console.error(`獲取下注結果 ${betId} 失敗:`, error);
      throw error;
    }
  },

  // 獲取下注歷史 - 根據swagger定義修改
  getBetHistory: async (params?: BetHistoryParams): Promise<BetHistoryResponse> => {
    try {
      const response = await apiService.get<BetHistoryResponse>('/api/v1/bets/history', { params });
      return response as BetHistoryResponse;
    } catch (error) {
      console.error('獲取下注歷史失敗:', error);
      // 返回空結果
      return {
        bets: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      };
    }
  },
};

export default gameService; 