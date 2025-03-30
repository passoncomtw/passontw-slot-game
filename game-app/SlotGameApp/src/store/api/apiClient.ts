import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 獲取環境變數中的 API URL，如果沒有設置則使用默認值
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3010/api/v1';
const USE_MOCK_API = process.env.NODE_ENV === 'development' || true; // 開發環境使用模擬API

// Token 存儲鍵
export const AUTH_TOKEN_KEY = '@SlotGame:auth_token';
export const USER_PROFILE_KEY = '@SlotGame:user_profile';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加日誌
console.log('Loading apiClient...', USE_MOCK_API ? '使用模擬API' : '使用真實API');

// 請求攔截器
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 從 AsyncStorage 獲取 token
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      // 如果 token 存在，添加到請求頭
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log(`API 請求: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('獲取 token 失敗', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API 響應: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // 處理 401 錯誤 (身份驗證失敗)
    if (error.response && error.response.status === 401) {
      try {
        // 移除 token 和用戶資料
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        console.log('已移除無效的身份認證資料');
      } catch (e) {
        console.error('移除身份認證資料失敗', e);
      }
    }
    
    console.error('API 請求錯誤:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 模擬API響應處理
const mockAPI = {
  get: async <T>(url: string) => {
    console.log(`模擬 GET 請求: ${url}`);
    
    // 在這裡根據不同的URL返回模擬數據
    if (url.includes('/api/v1/bets/history')) {
      return getMockBetHistory();
    }
    
    if (url.includes('/api/v1/bets/') && url.includes('/result')) {
      const betId = url.split('/').pop();
      return getMockBetResult(betId);
    }
    
    if (url.includes('/api/v1/games/')) {
      const gameId = url.split('/').pop();
      return getMockGameDetail(gameId);
    }
    
    if (url === '/api/v1/games') {
      return getMockGameList();
    }
    
    // 默認返回空對象
    return {} as T;
  },
  
  post: async <T>(url: string, data: any) => {
    console.log(`模擬 POST 請求: ${url}`, data);
    
    // 處理下注請求
    if (url === '/api/v1/games/bets') {
      return createMockBet(data);
    }
    
    // 處理遊戲會話請求
    if (url === '/api/v1/games/sessions') {
      return createMockGameSession(data);
    }
    
    // 默認返回空對象
    return {} as T;
  },
  
  put: async <T>(url: string, data: any) => {
    console.log(`模擬 PUT 請求: ${url}`, data);
    return {} as T;
  },
  
  delete: async <T>(url: string) => {
    console.log(`模擬 DELETE 請求: ${url}`);
    return {} as T;
  }
};

// 模擬遊戲列表
function getMockGameList() {
  return {
    games: [
      {
        gameId: "game-1",
        title: "幸運七",
        description: "傳統老虎機遊戲，三個七就能贏得大獎",
        gameType: "slot",
        icon: "slot-machine",
        backgroundColor: "#FF5722",
        rtp: 95.5,
        volatility: "medium",
        minBet: 10,
        maxBet: 1000,
        features: { free_spins: true },
        isFeatured: true,
        isNew: false,
        isActive: true,
        rating: 4.8,
        releaseDate: "2023-01-01T00:00:00Z"
      },
      {
        gameId: "game-2",
        title: "水果派對",
        description: "繽紛水果老虎機，多重獎線讓您贏得豐厚獎金",
        gameType: "slot",
        icon: "fruits",
        backgroundColor: "#4CAF50",
        rtp: 96.2,
        volatility: "low",
        minBet: 5,
        maxBet: 500,
        features: { multipliers: true },
        isFeatured: false,
        isNew: true,
        isActive: true,
        rating: 4.5,
        releaseDate: "2023-05-15T00:00:00Z"
      }
    ],
    total: 2,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };
}

// 模擬遊戲詳情
function getMockGameDetail(gameId: string | undefined) {
  const gameList = getMockGameList();
  const game = gameList.games.find(g => g.gameId === gameId) || gameList.games[0];
  return game;
}

// 模擬創建遊戲會話
function createMockGameSession(data: any) {
  const gameDetail = getMockGameDetail(data.gameId);
  
  return {
    sessionId: "session-" + Math.random().toString(36).substring(2, 10),
    gameId: data.gameId,
    startTime: new Date().toISOString(),
    initialBalance: 5000,
    gameInfo: gameDetail
  };
}

// 模擬下注歷史數據
function getMockBetHistory() {
  return {
    bets: [
      {
        betId: 'bet-' + Math.random().toString(36).substring(2, 10),
        sessionId: 'session-123456',
        gameId: 'slot-lucky-seven',
        betAmount: 100,
        isWin: true,
        winAmount: 250,
        currentBalance: 5150,
        timestamp: new Date().toISOString(),
        results: [
          { position: 0, symbol: '7', isWinningSymbol: true },
          { position: 1, symbol: '7', isWinningSymbol: true },
          { position: 2, symbol: '7', isWinningSymbol: true }
        ],
        jackpotWon: false,
        multiplier: 1
      },
      {
        betId: 'bet-' + Math.random().toString(36).substring(2, 10),
        sessionId: 'session-123456',
        gameId: 'slot-lucky-seven',
        betAmount: 50,
        isWin: false,
        winAmount: 0,
        currentBalance: 5000,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 一天前
        results: [
          { position: 0, symbol: 'cherry', isWinningSymbol: false },
          { position: 1, symbol: 'bar', isWinningSymbol: false },
          { position: 2, symbol: 'lemon', isWinningSymbol: false }
        ],
        jackpotWon: false,
        multiplier: 1
      },
      {
        betId: 'bet-' + Math.random().toString(36).substring(2, 10),
        sessionId: 'session-123456',
        gameId: 'slot-lucky-seven',
        betAmount: 100,
        isWin: true,
        winAmount: 150,
        currentBalance: 5050,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 兩天前
        results: [
          { position: 0, symbol: 'cherry', isWinningSymbol: true },
          { position: 1, symbol: 'cherry', isWinningSymbol: true },
          { position: 2, symbol: 'bar', isWinningSymbol: false }
        ],
        jackpotWon: false,
        multiplier: 1
      }
    ],
    total: 3,
    page: 1,
    pageSize: 10,
    totalPages: 1
  };
}

// 模擬創建下注 - 根據swagger格式修改
function createMockBet(data: any) {
  // 生成隨機下注ID
  const roundId = 'round-' + Math.random().toString(36).substring(2, 10);
  const transactionId = 'tx-' + Math.random().toString(36).substring(2, 10);
  
  // 計算是否獲勝 (70% 機率輸, 30% 機率贏)
  const isWin = Math.random() > 0.7;
  
  // 計算獎金 (如果贏了, 獎金是下注金額的 1.5-3 倍)
  const winMultiplier = isWin ? (Math.random() * 1.5) + 1.5 : 0;
  const winAmount = Math.floor(data.bet_amount * winMultiplier);
  
  // 計算新餘額
  const balanceBefore = 5000; // 假設初始餘額
  const balanceAfter = balanceBefore - data.bet_amount + winAmount;
  
  // 隨機生成結果
  const symbolOptions = ['7', 'bar', 'cherry', 'lemon', 'orange', 'watermelon'];
  let symbols = [];
  
  if (isWin) {
    if (Math.random() > 0.9) {
      // Jackpot - 三個七 (10% 獲勝的機會)
      symbols = [
        ['7', '7', '7'],
        ['bar', 'cherry', 'lemon'],
        ['orange', 'bar', 'watermelon']
      ];
    } else {
      // 普通獲勝 - 至少一行相同
      const winSymbol = symbolOptions[Math.floor(Math.random() * symbolOptions.length)];
      symbols = [
        [winSymbol, winSymbol, winSymbol],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ];
    }
  } else {
    // 隨機生成符號
    symbols = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
    ];
  }
  
  // 輔助函數 - 獲取隨機符號
  function getRandomSymbol() {
    return symbolOptions[Math.floor(Math.random() * symbolOptions.length)];
  }
  
  // 返回符合Swagger定義的下注結果
  return {
    session_id: data.session_id,
    round_id: roundId,
    transaction_id: transactionId,
    bet_amount: data.bet_amount,
    win_amount: winAmount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    symbols: symbols,
    multiplier: data.bet_options?.multiplier || 1,
    created_at: new Date().toISOString()
  };
}

// 模擬獲取下注結果
function getMockBetResult(betId: string | undefined) {
  // 重用創建下注的邏輯以保持一致性
  return {
    betId: betId || 'bet-' + Math.random().toString(36).substring(2, 10),
    sessionId: 'session-123456',
    gameId: 'slot-lucky-seven',
    betAmount: 100,
    isWin: Math.random() > 0.7,
    winAmount: 150,
    currentBalance: 5050,
    timestamp: new Date().toISOString(),
    results: [
      { position: 0, symbol: getRandomSymbol(), isWinningSymbol: true },
      { position: 1, symbol: getRandomSymbol(), isWinningSymbol: true },
      { position: 2, symbol: getRandomSymbol(), isWinningSymbol: false }
    ],
    jackpotWon: false,
    multiplier: 1
  };
  
  // 輔助函數 - 獲取隨機符號
  function getRandomSymbol() {
    const symbolOptions = ['7', 'bar', 'cherry', 'lemon', 'orange', 'watermelon'];
    return symbolOptions[Math.floor(Math.random() * symbolOptions.length)];
  }
}

// API 服務包裝器，負責處理 axios 響應體
export const apiService = {
  get: async <T>(url: string, config = {}) => {
    if (USE_MOCK_API) {
      return mockAPI.get<T>(url);
    }
    
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  post: async <T>(url: string, data = {}, config = {}) => {
    if (USE_MOCK_API) {
      return mockAPI.post<T>(url, data);
    }
    
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  put: async <T>(url: string, data = {}, config = {}) => {
    if (USE_MOCK_API) {
      return mockAPI.put<T>(url, data);
    }
    
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} 請求失敗:`, error);
      throw error;
    }
  },
  
  delete: async <T>(url: string, config = {}) => {
    if (USE_MOCK_API) {
      return mockAPI.delete<T>(url);
    }
    
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} 請求失敗:`, error);
      throw error;
    }
  }
};

export default apiClient; 