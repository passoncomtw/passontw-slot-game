import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';

// 定義遊戲類型
interface Game {
  id: string;
  title: string;
  icon: string;
  type?: string;
  description?: string;
  createdAt: string;
  isActive: boolean;
}

// API 返回的遊戲數據格式
interface ApiGame {
  game_id: string;
  title: string;
  icon: string;
  game_type?: string;
  description?: string;
  created_at: string;
  is_active: boolean;
}

// API 回應類型
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  games?: ApiGame[];
  total?: number;
}

const GamesPage: React.FC = () => {
  // 遊戲數據狀態
  const [games, setGames] = useState<Game[]>([]);
  
  // UI 狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 新遊戲表單狀態
  const [newGameName, setNewGameName] = useState('');
  const [newGameType, setNewGameType] = useState('老虎機');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameStatus, setNewGameStatus] = useState('active');
  
  // API 基礎 URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010';
  
  // 獲取 token
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };
  
  // 設定 API 請求頭
  const getRequestConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  };

  // 載入遊戲資料
  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 獲取遊戲列表
  const fetchGames = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用完整 URL 路徑
      const response = await axios.get<ApiResponse<Game[]>>(
        `${API_BASE_URL}/admin/games/list`,
        getRequestConfig()
      );
      
      console.log('API響應:', response.data);
      
      // 檢查回應中是否有 games 屬性
      if (response.data.games && Array.isArray(response.data.games)) {
        // 將 API 回傳的屬性名稱轉換為我們組件中使用的屬性名稱
        const formattedGames = response.data.games.map(game => ({
          id: game.game_id,
          title: game.title,
          icon: game.icon,
          type: game.game_type,
          description: game.description,
          createdAt: game.created_at,
          isActive: game.is_active
        }));
        
        setGames(formattedGames);
        console.log('處理後的遊戲數據:', formattedGames);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // 如果 API 回傳中使用 data 屬性
        setGames(response.data.data);
      } else {
        setError('獲取遊戲列表失敗: 無效的數據格式');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('獲取遊戲列表錯誤:', err);
      // 顯示詳細錯誤消息
      if (err.response) {
        setError(`獲取遊戲列表失敗: ${err.response.data?.error || err.response.statusText}`);
      } else {
        setError('獲取遊戲列表時發生錯誤，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 遊戲狀態切換處理
  const toggleGameStatus = async (id: string) => {
    try {
      const gameToUpdate = games.find(game => game.id === id);
      if (!gameToUpdate) return;
      
      setIsLoading(true);
      setError(null);
      
      const newStatus = !gameToUpdate.isActive;
      const response = await axios.patch<ApiResponse<Game>>(
        `${API_BASE_URL}/admin/games/status`,
        { gameId: id, isActive: newStatus },
        getRequestConfig()
      );
      
      if (response.data.success) {
        // 更新本地狀態
        setGames(games.map(game => 
          game.id === id ? { ...game, isActive: newStatus } : game
        ));
        
        // 顯示成功提示
        alert(newStatus ? '遊戲已成功上架！' : '遊戲已成功下架！');
      } else {
        setError(response.data.message || '更新遊戲狀態失敗');
      }
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('更新遊戲狀態錯誤:', err);
      // 顯示詳細錯誤消息
      if (err.response) {
        setError(`更新遊戲狀態失敗: ${err.response.data?.error || err.response.statusText}`);
      } else {
        setError('更新遊戲狀態時發生錯誤，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 添加新遊戲
  const handleAddGame = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newGame = {
        title: newGameName,
        type: newGameType,
        description: newGameDesc,
        isActive: newGameStatus === 'active'
      };
      
      const response = await axios.post<ApiResponse<Game>>(
        `${API_BASE_URL}/admin/games/create`,
        newGame,
        getRequestConfig()
      );
      
      if (response.data.success) {
        // 將新遊戲添加到列表
        if (response.data.data) {
          setGames([...games, response.data.data]);
        }
        
        // 重置表單並關閉模態框
        setShowModal(false);
        resetForm();
        
        // 顯示成功提示
        alert('遊戲已成功新增！');
      } else {
        setError(response.data.message || '新增遊戲失敗');
      }
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('新增遊戲錯誤:', err);
      // 顯示詳細錯誤消息
      if (err.response) {
        setError(`新增遊戲失敗: ${err.response.data?.error || err.response.statusText}`);
      } else {
        setError('新增遊戲時發生錯誤，請稍後再試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 表單驗證
  const validateForm = () => {
    if (!newGameName.trim()) {
      alert('請輸入遊戲名稱');
      return false;
    }
    
    // 檢查是否有登入
    if (!authService.isAuthenticated()) {
      setError('您尚未登入或登入已過期，請重新登入');
      return false;
    }
    
    return true;
  };

  // 重設表單
  const resetForm = () => {
    setNewGameName('');
    setNewGameType('老虎機');
    setNewGameDesc('');
    setNewGameStatus('active');
  };

  // 過濾遊戲
  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    game.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {/* 搜尋和功能區 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="搜尋遊戲..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary w-full md:w-auto"
            onClick={() => {
              if (!authService.isAuthenticated()) {
                setError('您尚未登入或登入已過期，請重新登入');
                return;
              }
              setShowModal(true);
            }}
            disabled={isLoading}
          >
            <i className="fas fa-plus mr-2"></i> 新增遊戲
          </button>
        </div>
      </div>
      
      {/* 載入中提示 */}
      {isLoading && !showModal && (
        <div className="flex justify-center items-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* 遊戲卡片網格 */}
      {!isLoading && (
        <>
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onToggleStatus={toggleGameStatus}
                  isLoading={isLoading}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <i className="fas fa-search text-gray-400 text-4xl mb-3"></i>
              <p className="text-gray-500">
                {searchTerm ? '沒有找到符合條件的遊戲' : '沒有任何遊戲，請新增遊戲'}
              </p>
            </div>
          )}
        </>
      )}
      
      {/* 新增遊戲模態框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            {/* 模態框標題 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">新增遊戲</h3>
              <button 
                className="text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={isLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 表單 */}
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">遊戲名稱 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入遊戲名稱"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">遊戲類型</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={newGameType}
                  onChange={(e) => setNewGameType(e.target.value)}
                  disabled={isLoading}
                >
                  <option>老虎機</option>
                  <option>卡牌遊戲</option>
                  <option>輪盤遊戲</option>
                  <option>骰子遊戲</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">遊戲描述</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                  placeholder="請輸入遊戲描述"
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  disabled={isLoading}
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">狀態</label>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newGameStatus === 'active'} 
                      onChange={() => setNewGameStatus('active')}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    立即上架
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={newGameStatus === 'inactive'} 
                      onChange={() => setNewGameStatus('inactive')}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    暫不上架
                  </label>
                </div>
              </div>
            </div>
            
            {/* 操作按鈕 */}
            <div className="flex justify-end gap-2">
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={isLoading}
              >
                取消
              </button>
              <button 
                className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                onClick={handleAddGame}
                disabled={isLoading}
              >
                {isLoading && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>}
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 遊戲卡片組件
interface GameCardProps {
  game: Game;
  onToggleStatus: (id: string) => void;
  isLoading?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, onToggleStatus, isLoading }) => {
  // 獲取隨機圖標，如果沒有指定
  const icon = game.icon || getRandomIcon();
  
  // 隨機選擇圖標
  function getRandomIcon() {
    const icons = ['fa-dice', 'fa-coins', 'fa-fire', 'fa-gem', 'fa-gamepad', 'fa-rocket'];
    return icons[Math.floor(Math.random() * icons.length)];
  }
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <i className={`fas ${icon} text-5xl text-primary`}></i>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{game.title}</h3>
        <div className="text-sm text-gray-500 mb-3">
          <div>ID: {game.id} | 創建於: {game.createdAt}</div>
          <div className="mt-1">
            <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
              game.isActive 
                ? 'bg-green-100 text-success' 
                : 'bg-red-100 text-error'
            }`}>
              {game.isActive ? '上架中' : '已下架'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
            <i className="fas fa-eye"></i> 查看
          </button>
          <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-1">
            <i className="fas fa-edit"></i> 編輯
          </button>
          <button 
            className={`px-2 py-1 rounded-lg text-sm flex items-center gap-1 ${
              game.isActive
                ? 'bg-red-100 hover:bg-red-200 text-error'
                : 'bg-green-100 hover:bg-green-200 text-success'
            }`}
            onClick={() => onToggleStatus(game.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full mr-1"></div>
            ) : (
              <i className="fas fa-power-off"></i>
            )}
            {game.isActive ? '下架' : '上架'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamesPage; 