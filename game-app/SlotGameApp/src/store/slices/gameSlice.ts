import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameListParams, GameListResponse, GameResponse, GameSessionResponse, PlaceBetRequest, PlaceBetResponse, BetHistoryParams, BetHistoryResponse } from '../api/gameService';

interface GameState {
  gameList: {
    data: GameResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
  gameDetail: {
    data: GameResponse | null;
    isLoading: boolean;
    error: string | null;
  };
  gameSession: {
    data: GameSessionResponse | null;
    isLoading: boolean;
    error: string | null;
  };
  bet: {
    isPlacing: boolean;
    isProcessing: boolean;
    currentBet: PlaceBetResponse | null;
    error: string | null;
  };
  betHistory: {
    data: PlaceBetResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;
  };
}

const initialState: GameState = {
  gameList: {
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    isLoading: false,
    error: null,
  },
  gameDetail: {
    data: null,
    isLoading: false,
    error: null,
  },
  gameSession: {
    data: null,
    isLoading: false,
    error: null,
  },
  bet: {
    isPlacing: false,
    isProcessing: false,
    currentBet: null,
    error: null,
  },
  betHistory: {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    isLoading: false,
    error: null,
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // 獲取遊戲列表
    fetchGamesRequest: (state, action: PayloadAction<GameListParams>) => {
      state.gameList.isLoading = true;
      state.gameList.error = null;
    },
    fetchGamesSuccess: (state, action: PayloadAction<GameListResponse>) => {
      state.gameList.isLoading = false;
      state.gameList.data = action.payload.games;
      state.gameList.total = action.payload.total;
      state.gameList.page = action.payload.page;
      state.gameList.pageSize = action.payload.pageSize;
      state.gameList.totalPages = action.payload.totalPages;
    },
    fetchGamesFailure: (state, action: PayloadAction<string>) => {
      state.gameList.isLoading = false;
      state.gameList.error = action.payload;
    },

    // 獲取遊戲詳情
    fetchGameDetailRequest: (state, action: PayloadAction<string>) => {
      state.gameDetail.isLoading = true;
      state.gameDetail.error = null;
    },
    fetchGameDetailSuccess: (state, action: PayloadAction<GameResponse>) => {
      state.gameDetail.isLoading = false;
      state.gameDetail.data = action.payload;
    },
    fetchGameDetailFailure: (state, action: PayloadAction<string>) => {
      state.gameDetail.isLoading = false;
      state.gameDetail.error = action.payload;
    },

    // 開始遊戲會話
    startGameSessionRequest: (state) => {
      state.gameSession.isLoading = true;
      state.gameSession.error = null;
    },
    startGameSessionSuccess: (state, action: PayloadAction<GameSessionResponse>) => {
      state.gameSession.isLoading = false;
      state.gameSession.data = action.payload;
    },
    startGameSessionFailure: (state, action: PayloadAction<string>) => {
      state.gameSession.isLoading = false;
      state.gameSession.error = action.payload;
    },

    // 下注動作
    placeBetRequest: (state, action: PayloadAction<PlaceBetRequest>) => {
      state.bet.isPlacing = true;
      state.bet.error = null;
    },
    placeBetSuccess: (state, action: PayloadAction<PlaceBetResponse>) => {
      state.bet.isPlacing = false;
      state.bet.currentBet = action.payload;
    },
    placeBetFailure: (state, action: PayloadAction<string>) => {
      state.bet.isPlacing = false;
      state.bet.error = action.payload;
    },

    // 獲取遊戲結果動作
    getGameResultRequest: (state, action: PayloadAction<string>) => {
      state.bet.isProcessing = true;
      state.bet.error = null;
    },
    getGameResultSuccess: (state, action: PayloadAction<PlaceBetResponse>) => {
      state.bet.isProcessing = false;
      state.bet.currentBet = action.payload;
    },
    getGameResultFailure: (state, action: PayloadAction<string>) => {
      state.bet.isProcessing = false;
      state.bet.error = action.payload;
    },

    // 獲取下注歷史記錄
    fetchBetHistoryRequest: (state, action?: PayloadAction<BetHistoryParams>) => {
      state.betHistory.isLoading = true;
      state.betHistory.error = null;
    },
    fetchBetHistorySuccess: (state, action: PayloadAction<BetHistoryResponse>) => {
      state.betHistory.isLoading = false;
      state.betHistory.data = action.payload.bets;
      state.betHistory.total = action.payload.total;
      state.betHistory.page = action.payload.page;
      state.betHistory.pageSize = action.payload.pageSize;
      state.betHistory.totalPages = action.payload.totalPages;
    },
    fetchBetHistoryFailure: (state, action: PayloadAction<string>) => {
      state.betHistory.isLoading = false;
      state.betHistory.error = action.payload;
    },

    // 重置下注狀態
    resetBetState: (state) => {
      state.bet = {
        isPlacing: false,
        isProcessing: false,
        currentBet: null,
        error: null
      };
    },
  },
});

export const {
  fetchGamesRequest,
  fetchGamesSuccess,
  fetchGamesFailure,
  fetchGameDetailRequest,
  fetchGameDetailSuccess,
  fetchGameDetailFailure,
  startGameSessionRequest,
  startGameSessionSuccess,
  startGameSessionFailure,
  placeBetRequest,
  placeBetSuccess,
  placeBetFailure,
  getGameResultRequest,
  getGameResultSuccess,
  getGameResultFailure,
  fetchBetHistoryRequest,
  fetchBetHistorySuccess,
  fetchBetHistoryFailure,
  resetBetState,
} = gameSlice.actions;

export default gameSlice.reducer; 