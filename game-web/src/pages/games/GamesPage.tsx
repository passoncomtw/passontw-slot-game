import React, { useState } from 'react';

// 定義遊戲類型
interface Game {
  id: string;
  title: string;
  icon: string;
  createdAt: string;
  isActive: boolean;
}

const GamesPage: React.FC = () => {
  // 模擬遊戲數據
  const [games, setGames] = useState<Game[]>([
    { id: 'G001', title: '幸運七', icon: 'fa-dice', createdAt: '2024/05/10', isActive: true },
    { id: 'G002', title: '金幣樂園', icon: 'fa-coins', createdAt: '2024/05/15', isActive: true },
    { id: 'G003', title: '水果派對', icon: 'fa-fire', createdAt: '2024/05/20', isActive: true },
    { id: 'G004', title: '寶石迷情', icon: 'fa-gem', createdAt: '2024/06/01', isActive: false },
  ]);

  // 搜尋和模態框狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameType, setNewGameType] = useState('老虎機');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [newGameStatus, setNewGameStatus] = useState('active');

  // 遊戲狀態切換處理
  const toggleGameStatus = (id: string) => {
    setGames(games.map(game => 
      game.id === id ? { ...game, isActive: !game.isActive } : game
    ));
  };

  // 添加新遊戲
  const handleAddGame = () => {
    if (!newGameName.trim()) return;

    const newGame: Game = {
      id: `G${Math.floor(1000 + Math.random() * 9000)}`,
      title: newGameName,
      icon: getRandomIcon(),
      createdAt: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      isActive: newGameStatus === 'active',
    };

    setGames([...games, newGame]);
    setShowModal(false);
    resetForm();
  };

  // 隨機選擇圖標
  const getRandomIcon = () => {
    const icons = ['fa-dice', 'fa-coins', 'fa-fire', 'fa-gem', 'fa-gamepad', 'fa-rocket'];
    return icons[Math.floor(Math.random() * icons.length)];
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
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus mr-2"></i> 新增遊戲
          </button>
        </div>
      </div>
      
      {/* 遊戲卡片網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredGames.map(game => (
          <GameCard
            key={game.id}
            game={game}
            onToggleStatus={toggleGameStatus}
          />
        ))}
      </div>
      
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
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* 表單 */}
            <div className="mb-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">遊戲名稱</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="請輸入遊戲名稱"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">遊戲類型</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={newGameType}
                  onChange={(e) => setNewGameType(e.target.value)}
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
              >
                取消
              </button>
              <button 
                className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-colors"
                onClick={handleAddGame}
              >
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
}

const GameCard: React.FC<GameCardProps> = ({ game, onToggleStatus }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <i className={`fas ${game.icon} text-5xl text-primary`}></i>
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
          >
            <i className="fas fa-power-off"></i> 
            {game.isActive ? '下架' : '上架'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamesPage; 