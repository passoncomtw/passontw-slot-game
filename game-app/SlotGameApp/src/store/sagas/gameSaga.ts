import { put, call, takeLatest, all } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import gameService, { 
  GameListParams, 
  GameListResponse, 
  GameResponse, 
  GameSessionRequest, 
  GameSessionResponse 
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
} from '../slices/gameSlice';

// 獲取遊戲列表的 Saga
function* fetchGamesSaga(action: PayloadAction<GameListParams>): Generator<any, void, GameListResponse> {
  try {
    const response = yield call(gameService.getGameList, action.payload);
    yield put(fetchGamesSuccess(response));
  } catch (error: any) {
    yield put(fetchGamesFailure(error.response?.data?.error || '獲取遊戲列表失敗'));
  }
}

// 獲取遊戲詳情的 Saga
function* fetchGameDetailSaga(action: PayloadAction<string>): Generator<any, void, GameResponse> {
  try {
    const response = yield call(gameService.getGameDetail, action.payload);
    yield put(fetchGameDetailSuccess(response));
  } catch (error: any) {
    yield put(fetchGameDetailFailure(error.response?.data?.error || '獲取遊戲詳情失敗'));
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
    yield put(startGameSessionFailure(error.response?.data?.error || '開始遊戲會話失敗'));
  }
}

// 監聽 Redux 操作的 Saga
export default function* gameSaga() {
  yield all([
    takeLatest(fetchGamesRequest.type, fetchGamesSaga),
    takeLatest(fetchGameDetailRequest.type, fetchGameDetailSaga),
    takeLatest(startGameSessionRequest.type, startGameSessionSaga),
  ]);
} 