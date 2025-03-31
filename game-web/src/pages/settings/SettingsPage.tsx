import React, { useState } from 'react';

// 定義設置類別
type SettingCategory = 'system' | 'security' | 'game' | 'notification';

const SettingsPage: React.FC = () => {
  // 當前選擇的設置類別
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('system');
  
  // 系統設置狀態
  const [systemName, setSystemName] = useState('AI 老虎機遊戲');
  const [systemVersion, setSystemVersion] = useState('1.0.0');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Taipei');
  
  // 安全設置狀態
  const [passwordExpiry, setPasswordExpiry] = useState('30');
  const [sessionTimeout, setSessionTimeout] = useState('120');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [ipRestriction, setIpRestriction] = useState(false);
  const [allowedIps, setAllowedIps] = useState('');
  
  // 遊戲參數設置狀態
  const [defaultBet, setDefaultBet] = useState('10');
  const [maxBet, setMaxBet] = useState('1000');
  const [minBet, setMinBet] = useState('1');
  const [winRate, setWinRate] = useState('40');
  const [bonusFrequency, setBonusFrequency] = useState('15');
  
  // 通知設置狀態
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [userActivityAlerts, setUserActivityAlerts] = useState(true);
  
  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('設置已保存！在實際應用中這會將數據發送到伺服器。');
  };
  
  // 處理重置設置
  const handleReset = () => {
    if (window.confirm('確定要重置所有設置嗎？此操作無法撤銷。')) {
      alert('設置已重置為預設值！');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 左側導航 */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">設置類別</h3>
            <nav className="flex flex-col gap-1">
              <button 
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-left transition-colors ${
                  activeCategory === 'system' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveCategory('system')}
              >
                <i className="fas fa-server"></i>
                <span>系統基本設置</span>
              </button>
              <button 
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-left transition-colors ${
                  activeCategory === 'security' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveCategory('security')}
              >
                <i className="fas fa-shield-alt"></i>
                <span>安全設置</span>
              </button>
              <button 
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-left transition-colors ${
                  activeCategory === 'game' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveCategory('game')}
              >
                <i className="fas fa-gamepad"></i>
                <span>遊戲參數設置</span>
              </button>
              <button 
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-left transition-colors ${
                  activeCategory === 'notification' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveCategory('notification')}
              >
                <i className="fas fa-bell"></i>
                <span>通知設置</span>
              </button>
            </nav>
            
            <div className="mt-8">
              <button 
                className="bg-red-50 text-red-600 hover:bg-red-100 w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                onClick={handleReset}
              >
                <i className="fas fa-undo"></i>
                <span>重置為預設值</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 右側設置表單 */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              {/* 系統基本設置 */}
              {activeCategory === 'system' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">系統基本設置</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系統名稱
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        系統版本
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={systemVersion}
                        onChange={(e) => setSystemVersion(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        管理員電子郵件
                      </label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        時區設置
                      </label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="Asia/Taipei">亞洲/台北 (GMT+8)</option>
                        <option value="Asia/Tokyo">亞洲/東京 (GMT+9)</option>
                        <option value="America/New_York">美國/紐約 (GMT-5)</option>
                        <option value="Europe/London">歐洲/倫敦 (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">啟用維護模式</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      開啟維護模式後，只有管理員可以訪問系統。
                    </p>
                  </div>
                </>
              )}
              
              {/* 安全設置 */}
              {activeCategory === 'security' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">安全設置</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        密碼過期天數
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={passwordExpiry}
                        onChange={(e) => setPasswordExpiry(e.target.value)}
                        min="0"
                        max="365"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        設置為 0 表示密碼永不過期
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        會話超時（分鐘）
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        min="1"
                        max="1440"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={twoFactorAuth}
                        onChange={(e) => setTwoFactorAuth(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">啟用雙因素認證</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      管理員登入時需要額外的驗證碼
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={ipRestriction}
                        onChange={(e) => setIpRestriction(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">啟用 IP 限制</span>
                    </label>
                    
                    {ipRestriction && (
                      <div className="mt-3 ml-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          允許的 IP 地址（每行一個）
                        </label>
                        <textarea 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          rows={4}
                          value={allowedIps}
                          onChange={(e) => setAllowedIps(e.target.value)}
                          placeholder="例如：192.168.1.1"
                        ></textarea>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* 遊戲參數設置 */}
              {activeCategory === 'game' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">遊戲參數設置</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        預設下注金額
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={defaultBet}
                        onChange={(e) => setDefaultBet(e.target.value)}
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最低下注金額
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={minBet}
                        onChange={(e) => setMinBet(e.target.value)}
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最高下注金額
                      </label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={maxBet}
                        onChange={(e) => setMaxBet(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      獲獎機率 ({winRate}%)
                    </label>
                    <input 
                      type="range" 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      value={winRate}
                      onChange={(e) => setWinRate(e.target.value)}
                      min="1"
                      max="100"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      特殊獎勵頻率 ({bonusFrequency}%)
                    </label>
                    <input 
                      type="range" 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      value={bonusFrequency}
                      onChange={(e) => setBonusFrequency(e.target.value)}
                      min="1"
                      max="50"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* 通知設置 */}
              {activeCategory === 'notification' && (
                <>
                  <h2 className="text-xl font-semibold mb-6">通知設置</h2>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">啟用電子郵件通知</span>
                    </label>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">啟用簡訊通知</span>
                    </label>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-md font-medium text-gray-700 mb-4">通知類型</h3>
                    
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={systemAlerts}
                          onChange={(e) => setSystemAlerts(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">系統警報（伺服器錯誤、異常行為）</span>
                      </label>
                    </div>
                    
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={userActivityAlerts}
                          onChange={(e) => setUserActivityAlerts(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">用戶活動（大額交易、異常登入）</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              {/* 提交按鈕 */}
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                >
                  保存設置
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 