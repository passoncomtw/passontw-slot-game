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
  placeBetRequest,
  placeBetSuccess,
  placeBetFailure,
  getGameResultRequest,
  getGameResultSuccess,
  getGameResultFailure,
  fetchBetHistoryRequest,
  fetchBetHistorySuccess,
  fetchBetHistoryFailure
} from '../slices/gameSlice';
import { updateUserBalance } from '../slices/authSlice';
import { RootState } from '../rootReducer';

// 獲取遊戲列表的 Saga
function* fetchGamesSaga(action: PayloadAction<GameListParams>): Generator<any, void, GameListResponse> {
  try {
    const response = yield call(gameService.getGameList, action.payload);
    yield put(fetchGamesSuccess(response));
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || '獲取遊戲列表失敗';
    Toast.show({
      type: 'error',
      text1: '獲取遊戲列表失敗',
      text2: errorMsg,
      position: 'bottom'
    });
    yield put(fetchGamesFailure(errorMsg));
  }
}

// 獲取遊戲詳情的 Saga
function* fetchGameDetailSaga(action: PayloadAction<string>): Generator<any, void, GameResponse> {
  try {
    const response = yield call(gameService.getGameDetail, action.payload);
    yield put(fetchGameDetailSuccess(response));
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || '獲取遊戲詳情失敗';
    Toast.show({
      type: 'error',
      text1: '獲取遊戲詳情失敗',
      text2: errorMsg,
      position: 'bottom'
    });
    yield put(fetchGameDetailFailure(errorMsg));
  }
}

// 開始遊戲會話的 Saga
function* startGameSessionSaga(action: PayloadAction<{ gameId: string; betAmount?: number }>): Generator<any, void, GameSessionResponse> {
  try {
    const request: GameSessionRequest = {
      gameId: action.payload.gameId,
    };
    
    if (action.payload.betAmount) {
      request.betAmount = action.payload.betAmount;
    }
    
    const response = yield call(gameService.startGameSession, request);
    yield put(startGameSessionSuccess(response));
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || '開始遊戲會話失敗';
    Toast.show({
      type: 'error',
      text1: '開始遊戲會話失敗',
      text2: errorMsg,
      position: 'bottom'
    });
    yield put(startGameSessionFailure(errorMsg));
  }
}

// 下注 Saga
function* placeBetSaga(action: PayloadAction<PlaceBetRequest>): Generator<any, void, any> {
  try {
    console.log('正在進行下注...', action.payload);
    
    // 使用真實API調用
    const response = yield call(gameService.placeBet, action.payload);
    console.log('下注成功，結果:', response);
    
    // 更新用戶餘額
    if (response && response.currentBalance !== undefined) {
      yield put(updateUserBalance(response.currentBalance));
      
      // 顯示成功通知
      if (response.isWin) {
        Toast.show({
          type: 'success',
          text1: '恭喜贏得獎金!',
          text2: `您贏得了 $${response.winAmount.toLocaleString()}`,
          position: 'bottom'
        });
      }
    }
    
    yield put(placeBetSuccess(response));
    
    // 在下注成功後，刷新下注歷史
    const params: BetHistoryParams = {
      page: 1,
      pageSize: 10
    };
    yield put(fetchBetHistoryRequest(params as any));
  } catch (error) {
    console.error('下注失敗:', error);
    let errorMessage = '下注失敗，請稍後再試';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    Toast.show({
      type: 'error',
      text1: '下注失敗',
      text2: errorMessage,
      position: 'bottom'
    });
    
    yield put(placeBetFailure(errorMessage));
  }
}

// 獲取遊戲結果 Saga
function* getGameResultSaga(action: PayloadAction<string>): Generator<any, void, any> {
  try {
    console.log('正在獲取遊戲結果...', action.payload);
    
    // 使用真實API調用
    const response = yield call(gameService.getGameResult, action.payload);
    console.log('獲取結果成功:', response);
    
    // 更新用戶餘額
    if (response && response.currentBalance !== undefined) {
      yield put(updateUserBalance(response.currentBalance));
    }
    
    yield put(getGameResultSuccess(response));
  } catch (error) {
    console.error('獲取遊戲結果失敗:', error);
    let errorMessage = '獲取遊戲結果失敗';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    Toast.show({
      type: 'error',
      text1: '獲取結果失敗',
      text2: errorMessage,
      position: 'bottom'
    });
    
    yield put(getGameResultFailure(errorMessage));
  }
}

// 獲取下注歷史記錄 Saga
function* fetchBetHistorySaga(action: PayloadAction<BetHistoryParams>): Generator<any, void, any> {
  try {
    console.log('正在獲取下注歷史...', action.payload);
    const response = yield call(gameService.getBetHistory, action.payload);
    console.log('獲取下注歷史成功:', response);
    yield put(fetchBetHistorySuccess(response));
  } catch (error) {
    console.error('獲取下注歷史失敗:', error);
    let errorMessage = '獲取下注歷史失敗';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    Toast.show({
      type: 'error',
      text1: '獲取歷史記錄失敗',
      text2: errorMessage,
      position: 'bottom'
    });
    
    yield put(fetchBetHistoryFailure(errorMessage));
  }
}

// 監聽 Redux 操作的 Saga
export default function* gameSaga() {
  yield all([
    takeLatest(fetchGamesRequest.type, fetchGamesSaga),
    takeLatest(fetchGameDetailRequest.type, fetchGameDetailSaga),
    takeLatest(startGameSessionRequest.type, startGameSessionSaga),
    takeLatest(placeBetRequest.type, placeBetSaga),
    takeLatest(getGameResultRequest.type, getGameResultSaga),
    takeLatest(fetchBetHistoryRequest.type, fetchBetHistorySaga),
  ]);
} 