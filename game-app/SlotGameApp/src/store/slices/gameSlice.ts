import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameListParams, GameListResponse, GameResponse, GameSessionResponse } from '../api/gameService';

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
}

const initialState: GameState = {
  gameList: {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
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
      state.gameList.data = action.payload.games;
      state.gameList.total = action.payload.total;
      state.gameList.page = action.payload.page;
      state.gameList.pageSize = action.payload.pageSize;
      state.gameList.totalPages = action.payload.totalPages;
      state.gameList.isLoading = false;
      state.gameList.error = null;
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
      state.gameDetail.data = action.payload;
      state.gameDetail.isLoading = false;
      state.gameDetail.error = null;
    },
    fetchGameDetailFailure: (state, action: PayloadAction<string>) => {
      state.gameDetail.isLoading = false;
      state.gameDetail.error = action.payload;
    },

    // 開始遊戲會話
    startGameSessionRequest: (state, action: PayloadAction<{ gameId: string; betAmount?: number }>) => {
      state.gameSession.isLoading = true;
      state.gameSession.error = null;
    },
    startGameSessionSuccess: (state, action: PayloadAction<GameSessionResponse>) => {
      state.gameSession.data = action.payload;
      state.gameSession.isLoading = false;
      state.gameSession.error = null;
    },
    startGameSessionFailure: (state, action: PayloadAction<string>) => {
      state.gameSession.isLoading = false;
      state.gameSession.error = action.payload;
    },

    // 重置遊戲會話
    resetGameSession: (state) => {
      state.gameSession.data = null;
      state.gameSession.isLoading = false;
      state.gameSession.error = null;
    },

    // 重置遊戲詳情
    resetGameDetail: (state) => {
      state.gameDetail.data = null;
      state.gameDetail.isLoading = false;
      state.gameDetail.error = null;
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
  resetGameSession,
  resetGameDetail,
} = gameSlice.actions;

export default gameSlice.reducer; 