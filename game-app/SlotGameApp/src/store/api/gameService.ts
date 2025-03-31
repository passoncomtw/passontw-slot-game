import { apiService } from './apiClient';
import { EndSessionRequest, EndSessionResponse } from '../slices/gameSlice';

export interface GameListParams {
  Type?: string;
  Featured?: boolean;
  New?: boolean;
  Page?: number;
  PageSize?: number;
  SortBy?: string;
  SortOrder?: string;
}

export interface GameResponse {
  game_id: string;
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
  GameID: string;
  BetAmount?: number;
}

export interface GameSessionResponse {
  sessionId: string;
  gameId: string;
  startTime: string;
  initialBalance: number;
  gameInfo: GameResponse;
}

export interface BetRequest {
  SessionID: string;
  BetAmount: number;
  BetOptions?: Record<string, any>;
}

export interface PlaceBetRequest {
  sessionId: string;
  game_id?: string;
  betAmount: number;
  betOptions?: Record<string, any>;
}

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
  is_win?: boolean;
  game_id?: string;
}

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
  transactionId?: string;
}

export interface BetHistoryParams {
  Page: number;
  PageSize: number;
  StartDate?: string;
  EndDate?: string;
  GameID?: string;
  game_id?: string;
}

export interface BetHistoryResponse {
  bets: PlaceBetResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GameResultItem {
  position: number;
  symbol: string;
  isWinningSymbol: boolean;
}

function convertToPlaceBetResponse(response: BetResponse, gameId?: string): PlaceBetResponse {
  const isWin = response.is_win !== undefined ? response.is_win : response.win_amount > 0;
  
  const results: GameResultItem[] = [];
  
  if (response.symbols && response.symbols.length > 0) {
    response.symbols.forEach((row, rowIndex) => {
      row.forEach((symbol, colIndex) => {
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
    gameId: response.game_id || gameId || 'unknown',
    betAmount: response.bet_amount,
    isWin,
    winAmount: response.win_amount,
    currentBalance: response.balance_after,
    timestamp: response.created_at || new Date().toISOString(),
    results,
    jackpotWon: false,
    multiplier: response.multiplier || 1,
    transactionId: response.transaction_id
  };
}

function convertToBetRequest(request: PlaceBetRequest): BetRequest {
  return {
    SessionID: request.sessionId,
    BetAmount: request.betAmount,
    BetOptions: request.betOptions
  };
}

const gameService = {
  getGameList: async (params?: GameListParams): Promise<GameListResponse> => {
    try {
      const formattedParams = {
        ...(params?.Type && { Type: params.Type }),
        ...(params?.Featured !== undefined && { Featured: params.Featured }),
        ...(params?.New !== undefined && { New: params.New }),
        ...(params?.Page !== undefined && { Page: params.Page }),
        ...(params?.PageSize !== undefined && { PageSize: params.PageSize }),
        ...(params?.SortBy && { SortBy: params.SortBy }),
        ...(params?.SortOrder && { SortOrder: params.SortOrder })
      };
      
      console.log('獲取遊戲列表參數:', formattedParams);
      
      const response = await apiService.get<GameListResponse>('/games', { params: formattedParams });
      return response;
    } catch (error) {
      console.error('獲取遊戲列表失敗:', error);
      return {
        games: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
      };
    }
  },

  getGameDetail: async (gameId: string): Promise<GameResponse> => {
    try {
      const response = await apiService.get<GameResponse>(`/games/${gameId}`);
      return response;
    } catch (error) {
      console.error(`獲取遊戲 ${gameId} 詳情失敗:`, error);
      throw error;
    }
  },

  startGameSession: async (data: GameSessionRequest): Promise<GameSessionResponse> => {
    try {
      console.log('發送遊戲會話請求參數:', data);
      
      const sessionRequest = {
        game_id: data.GameID,
        ...(data.BetAmount && { bet_amount: data.BetAmount })
      };
      
      const response = await apiService.post<GameSessionResponse>('/games/sessions', sessionRequest);
      return response;
    } catch (error) {
      console.error('開始遊戲會話失敗:', error);
      throw error;
    }
  },

  endGameSession: async (data: EndSessionRequest): Promise<EndSessionResponse> => {
    try {
      const endSessionRequest = {
        session_id: data.sessionId
      };
      const response = await apiService.post<EndSessionResponse>('/games/sessions/end', endSessionRequest);
      return response;
    } catch (error) {
      console.error('結束遊戲會話失敗:', error);
      throw error;
    }
  },

  placeBet: async (data: PlaceBetRequest): Promise<PlaceBetResponse> => {
    try {
      console.log('發送下注請求參數:', data);
      
      const betRequest = {
        session_id: data.sessionId,
        bet_amount: data.betAmount,
        game_id: data.game_id,
        ...(data.betOptions && { bet_options: data.betOptions })
      };
      
      const response = await apiService.post<BetResponse>('/api/v1/games/bets', betRequest);
      
      console.log('下注回應:', response);
      return convertToPlaceBetResponse(response, data.game_id);
    } catch (error) {
      console.error('下注失敗:', error);
      throw error;
    }
  },

  getGameResult: async (betId: string): Promise<PlaceBetResponse> => {
    try {
      const response = await apiService.get<BetResponse>(`/api/v1/games/bets/${betId}`);
      console.log('獲取遊戲結果回應:', response);
      return convertToPlaceBetResponse(response);
    } catch (error) {
      console.error(`獲取遊戲結果失敗:`, error);
      throw error;
    }
  },

  getBetHistory: async (params?: BetHistoryParams): Promise<BetHistoryResponse> => {
    try {
      // 構建請求參數
      const historyParams = {
        page: params?.Page || 1,
        page_size: params?.PageSize || 10,
        ...(params?.StartDate && { start_date: params.StartDate }),
        ...(params?.EndDate && { end_date: params.EndDate }),
        ...(params?.game_id && { game_id: params.game_id }),
        ...(params?.GameID && { game_id: params.GameID })
      };
      
      console.log('獲取下注歷史參數:', historyParams);
      
      // 使用正確的 API 路徑
      const response = await apiService.get<{ items: any[], total_count: number }>('/bets/history', { params: historyParams });
      console.log('獲取下注歷史原始回應:', response);
      
      // 轉換回應格式為前端預期的格式
      const convertedResponse: BetHistoryResponse = {
        bets: response.items?.map(session => ({
          betId: session.session_id,
          sessionId: session.session_id,
          gameId: session.game_id,
          betAmount: session.total_bets || 0,
          isWin: session.win_count > 0,
          winAmount: session.total_wins || 0,
          currentBalance: session.final_balance || 0,
          timestamp: session.start_time,
          results: [], // 會話記錄中沒有詳細的遊戲結果
          jackpotWon: false,
          multiplier: 1,
          transactionId: session.session_id
        })) || [],
        total: response.total_count || 0,
        page: params?.Page || 1,
        pageSize: params?.PageSize || 10,
        totalPages: Math.ceil((response.total_count || 0) / (params?.PageSize || 10))
      };
      
      console.log('獲取下注歷史轉換後回應:', convertedResponse);
      return convertedResponse;
    } catch (error: any) {
      // 提供更詳細的錯誤信息
      if (error.response) {
        // 請求已發出，服務器回應狀態碼超出 2xx 範圍
        console.error('獲取下注歷史 API 錯誤:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // 請求已發出，但沒有收到回應
        console.error('獲取下注歷史請求無回應:', error.request);
      } else {
        // 設置請求時發生錯誤
        console.error('獲取下注歷史請求配置錯誤:', error.message);
      }
      
      // 返回一個空的響應結構，讓應用可以繼續運行
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