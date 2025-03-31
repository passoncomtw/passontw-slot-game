import { put, call, takeLatest, all, select } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import gameService, { 
  GameListParams, 
  GameListResponse, 
  GameResponse, 
  GameSessionRequest, 
  GameSessionResponse,
  PlaceBetRequest,
  BetHistoryParams
} from '../api/gameService';
import {
  fetchGamesRequest,
  fetchGamesSuccess,
  fetchGamesFailure,
  fetchGameDetailRequest,
  fetchGameDetailSuccess,
  fetchGameDetailFailure,
  startGameSessionRequest,
  startGameSessionSuccess,
  startGameSessionFailure,
  endGameSessionRequest,
  endGameSessionSuccess,
  endGameSessionFailure,
  placeBetRequest,
  placeBetSuccess,
  placeBetFailure,
  getGameResultRequest,
  getGameResultSuccess,
  getGameResultFailure,
  fetchBetHistoryRequest,
  fetchBetHistorySuccess,
  fetchBetHistoryFailure,
  initGameSessionRequest,
} from '../slices/gameSlice';
import { updateUserBalance } from '../slices/authSlice';
import { RootState } from '../rootReducer';

// 錯誤處理工具函數
function getErrorMessage(error: any): string {
  return error?.response?.data?.message || error?.message || '發生未知錯誤';
}

// 獲取遊戲列表的 Saga
function* fetchGamesSaga(): Generator<any, void, any> {
  try {
    const response = yield call(gameService.getGameList);
    yield put(fetchGamesSuccess(response));
  } catch (error) {
    yield put(fetchGamesFailure(getErrorMessage(error)));
  }
}

// 獲取遊戲詳情的 Saga
function* fetchGameDetailSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const gameId = action.payload;
    const response = yield call(gameService.getGameDetail, gameId);
    yield put(fetchGameDetailSuccess(response));
  } catch (error) {
    yield put(fetchGameDetailFailure(getErrorMessage(error)));
  }
}

// 開始遊戲會話的 Saga
function* startGameSessionSaga(action: PayloadAction<GameSessionRequest>): Generator<any, void, any> {
  try {
    const response = yield call(gameService.startGameSession, action.payload);
    yield put(startGameSessionSuccess(response));
  } catch (error) {
    yield put(startGameSessionFailure(getErrorMessage(error)));
  }
}

// 結束遊戲會話的 Saga
function* endGameSessionSaga(action: PayloadAction<{ sessionId: string }>): Generator<any, void, any> {
  try {
    const response = yield call(gameService.endGameSession, action.payload);
    yield put(endGameSessionSuccess(response));
    
    // 如果需要更新用戶餘額
    if (response && response.finalBalance !== undefined) {
      yield put(updateUserBalance(response.finalBalance));
    }
  } catch (error) {
    yield put(endGameSessionFailure(getErrorMessage(error)));
  }
}

// 下注 Saga
function* placeBetSaga(action: PayloadAction<PlaceBetRequest>): Generator<any, void, any> {
  try {
    const response = yield call(gameService.placeBet, action.payload);
    yield put(placeBetSuccess(response));
    
    // 注意: 新的 API 直接返回完整的下注結果，不需要額外呼叫 getGameResult
    // 如果特定情況下仍需要獲取遊戲結果，可以保留此呼叫
    // yield put(getGameResultRequest(response.betId));
  } catch (error) {
    yield put(placeBetFailure(getErrorMessage(error)));
  }
}

// 獲取遊戲結果 Saga (如果仍需要此功能)
function* getGameResultSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    const betId = action.payload;
    console.log(`正在獲取下注 ID ${betId} 的遊戲結果`);
    const response = yield call(gameService.getGameResult, betId);
    yield put(getGameResultSuccess(response));
    
    // 成功獲取遊戲結果後獲取最新的下注歷史
    const gameState = yield select((state: RootState) => state.game);
    const gameId = gameState.gameDetail.data?.game_id;
    if (gameId) {
      yield put(fetchBetHistoryRequest({
        Page: 1,
        PageSize: 10,
        game_id: gameId
      }));
    }
  } catch (error) {
    console.error(`獲取遊戲結果失敗:`, error);
    yield put(getGameResultFailure(getErrorMessage(error)));
  }
}

// 獲取下注歷史記錄 Saga
function* fetchBetHistorySaga(action: PayloadAction<BetHistoryParams>): Generator<any, void, any> {
  try {
    const params = action.payload;
    const response = yield call(gameService.getBetHistory, params);
    yield put(fetchBetHistorySuccess(response));
  } catch (error) {
    yield put(fetchBetHistoryFailure(getErrorMessage(error)));
  }
}

// 處理初始化遊戲會話（新增的 saga）
function* initGameSessionSaga(action: PayloadAction<{ gameId: string, betAmount: number }>): Generator<any, void, any> {
  try {
    // 1. 獲取遊戲詳情
    const gameId = action.payload.gameId;
    const betAmount = action.payload.betAmount;
    const gameDetailResponse = yield call(gameService.getGameDetail, gameId);
    yield put(fetchGameDetailSuccess(gameDetailResponse));
    
    // 2. 開始遊戲會話
    const sessionRequest: GameSessionRequest = {
      GameID: gameId,
      BetAmount: betAmount
    };
    const sessionResponse = yield call(gameService.startGameSession, sessionRequest);
    yield put(startGameSessionSuccess(sessionResponse));
    
    // 3. 獲取下注歷史（在會話開始後）
    if (sessionResponse.sessionId) {
      const historyParams: BetHistoryParams = {
        Page: 1,
        PageSize: 10,
        game_id: gameId
      };
      yield put(fetchBetHistoryRequest(historyParams));
    }
  } catch (error) {
    // 處理所有可能的錯誤
    yield put(fetchGameDetailFailure(getErrorMessage(error)));
    yield put(startGameSessionFailure(getErrorMessage(error)));
    console.error("初始化遊戲會話失敗:", error);
  }
}

// 監聽 Redux 操作的 Saga
export default function* gameSaga() {
  yield all([
    takeLatest(fetchGamesRequest.type, fetchGamesSaga),
    takeLatest(fetchGameDetailRequest.type, fetchGameDetailSaga),
    takeLatest(startGameSessionRequest.type, startGameSessionSaga),
    takeLatest(endGameSessionRequest.type, endGameSessionSaga),
    takeLatest(placeBetRequest.type, placeBetSaga),
    takeLatest(getGameResultRequest.type, getGameResultSaga),
    takeLatest(fetchBetHistoryRequest.type, fetchBetHistorySaga),
    takeLatest(initGameSessionRequest.type, initGameSessionSaga),
  ]);
} 