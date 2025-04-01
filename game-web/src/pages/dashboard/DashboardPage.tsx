import React, { useState } from 'react';
import { useDashboardData, useMarkAllNotificationsAsRead } from '../../hooks/useDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';

// 移除對不存在模組的導入，直接內聯定義所需類型
interface GameStatistic {
  gameId: string;
  name: string;
  icon: string;
  iconColor: string;
  value: number;
  percentage: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  username: string;
  userId: string;
  time: string;
  timeDisplay: string;
}

interface SystemNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  icon: string;
  time: string;
  timeDisplay: string;
  isRead: boolean;
}

const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('today');
  const { data, isLoading, error } = useDashboardData(timeRange);
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // 處理時間範圍變更
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  // 處理標記所有通知為已讀
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message="載入儀表板數據失敗" error={error} />;
  if (!data) return <div className="text-center p-8">沒有可用數據</div>;

  return (
    <div>
      {/* 歡迎訊息 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">您好，{data.summary?.adminName || '管理員'}！</h2>
            <p className="text-gray-600">歡迎回到 AI 老虎機遊戲管理系統，以下是今日概覽。</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="text-sm text-gray-500">
              <i className="fas fa-calendar-alt mr-2"></i>今日日期: {data.summary?.currentDate || new Date().toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="總收入"
          value={`$${data.summary?.totalIncome?.toLocaleString() || '0'}`}
          trend={`${(data.summary?.incomePercentage || 0) > 0 ? '+' : ''}${data.summary?.incomePercentage || 0}%`}
          isTrendUp={(data.summary?.incomePercentage || 0) > 0}
          icon="fa-dollar-sign"
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          title="活躍用戶"
          value={data.summary?.activeUsers?.toLocaleString() || '0'}
          trend={`${(data.summary?.usersPercentage || 0) > 0 ? '+' : ''}${data.summary?.usersPercentage || 0}%`}
          isTrendUp={(data.summary?.usersPercentage || 0) > 0}
          icon="fa-users"
          iconBg="bg-blue-100"
          iconColor="text-info"
        />
        <StatCard
          title="遊戲總數"
          value={data.summary?.totalGames?.toString() || '0'}
          trend={`+${data.summary?.newGames || 0}`}
          isTrendUp={true}
          icon="fa-gamepad"
          iconBg="bg-orange-100"
          iconColor="text-accent"
        />
        <StatCard
          title="AI 推薦效果"
          value={`${data.summary?.aiEffectiveness || 0}%`}
          trend={`${(data.summary?.aiImprovement || 0) > 0 ? '+' : ''}${data.summary?.aiImprovement || 0}%`}
          isTrendUp={(data.summary?.aiImprovement || 0) > 0}
          icon="fa-brain"
          iconBg="bg-green-100"
          iconColor="text-success"
        />
      </div>

      {/* 圖表和排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 主圖表 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">收入趨勢</h3>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-full ${timeRange === 'today' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => handleTimeRangeChange('today')}
              >
                今日
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-full ${timeRange === 'week' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => handleTimeRangeChange('week')}
              >
                本週
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-full ${timeRange === 'month' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => handleTimeRangeChange('month')}
              >
                本月
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium rounded-full ${timeRange === 'year' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => handleTimeRangeChange('year')}
              >
                全年
              </button>
            </div>
          </div>
          <div className="h-80 w-full bg-gray-50 rounded flex items-center justify-center text-gray-400">
            {/* 這裡應該是整合實際的收入圖表，如 Recharts */}
            <RevenueChart data={data.income || []} />
          </div>
        </div>

        {/* 遊戲排行榜 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">熱門遊戲</h3>
            <button className="text-sm text-purple-600 hover:text-purple-800">查看全部</button>
          </div>
          
          <div className="space-y-6">
            {data.popularGames && data.popularGames.length > 0 ? 
              data.popularGames.map((game: GameStatistic) => (
                <GameRankItem
                  key={game.gameId}
                  name={game.name || '未知遊戲'}
                  value={`$${game.value?.toLocaleString() || 0}`}
                  percent={game.percentage || 0}
                  color={game.iconColor || '#6200EA'}
                  icon={`fa-${game.icon || 'gamepad'}`}
                  bgColor={game.iconColor || '#6200EA'}
                />
              )) : 
              <div className="text-center text-gray-500">無遊戲數據</div>
            }
          </div>
        </div>
      </div>

      {/* 最新交易和通知 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最新交易 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">最新交易</h3>
            <button className="text-sm text-purple-600 hover:text-purple-800">查看全部</button>
          </div>
          
          <div className="space-y-4">
            {data.recentTransactions && data.recentTransactions.length > 0 ? 
              data.recentTransactions.map((transaction: RecentTransaction) => (
                <TransactionItem
                  key={transaction.id}
                  title={transaction.type === 'deposit' ? "用戶充值" : "用戶提現"}
                  username={transaction.username || '未知用戶'}
                  amount={transaction.type === 'deposit' 
                    ? `+$${transaction.amount?.toLocaleString() || 0}` 
                    : `-$${transaction.amount?.toLocaleString() || 0}`}
                  time={transaction.timeDisplay || '未知時間'}
                  isIncome={transaction.type === 'deposit'}
                />
              )) : 
              <div className="text-center text-gray-500">無交易記錄</div>
            }
          </div>
        </div>

        {/* 系統通知 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">系統通知</h3>
            <button 
              className="text-sm text-purple-600 hover:text-purple-800"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? '處理中...' : '全部標為已讀'}
            </button>
          </div>
          
          <div className="space-y-5">
            {data.notifications && data.notifications.length > 0 ? 
              data.notifications.map((notification: SystemNotification) => (
                <NotificationItem
                  key={notification.id}
                  title={notification.title || '未知通知'}
                  text={notification.content || ''}
                  time={notification.timeDisplay || '未知時間'}
                  type={(notification.type as 'info' | 'warning' | 'success' | 'accent') || 'info'}
                  isRead={notification.isRead || false}
                />
              )) : 
              <div className="text-center text-gray-500">無系統通知</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// 收入圖表組件
const RevenueChart: React.FC<{ data: { time: string; value: number }[] }> = ({ data }) => {
  // 這裡實際項目中應該使用圖表庫如 Recharts 來渲染圖表
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span>暫無收入數據</span>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span>收入圖表 - {data.length} 資料點</span>
    </div>
  );
};

// 統計卡片組件
interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isTrendUp: boolean;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, isTrendUp, icon, iconBg, iconColor }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`${iconBg} ${iconColor} w-10 h-10 rounded-full flex items-center justify-center`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800 mb-1">{value}</span>
        <div className="flex items-center">
          <span className={isTrendUp ? "text-success font-medium" : "text-error font-medium"}>
            {isTrendUp ? <i className="fas fa-arrow-up mr-1"></i> : <i className="fas fa-arrow-down mr-1"></i>}
            {trend}
          </span>
          <span className="text-gray-500 text-sm ml-1">相比上週</span>
        </div>
      </div>
    </div>
  );
};

// 遊戲排行項目組件
interface GameRankItemProps {
  name: string;
  value: string;
  percent: number;
  color: string;
  icon: string;
  bgColor: string;
}

const GameRankItem: React.FC<GameRankItemProps> = ({ name, value, percent, color, icon, bgColor }) => {
  return (
    <div className="flex items-center">
      <div className="text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0"
           style={{ backgroundColor: bgColor }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <h4 className="font-medium text-gray-800">{name}</h4>
          <span className="font-semibold text-sm text-gray-800">{value}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ width: `${percent}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// 交易項目組件
interface TransactionItemProps {
  title: string;
  username: string;
  amount: string;
  time: string;
  isIncome: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ title, username, amount, time, isIncome }) => {
  return (
    <div className="flex items-center py-3 border-b border-gray-200 last:border-0 last:pb-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
        isIncome ? 'bg-green-100 text-success' : 'bg-red-100 text-error'
      }`}>
        <i className={`fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-medium text-gray-800">{title}</h4>
          <span className={`font-semibold ${isIncome ? 'text-success' : 'text-error'}`}>{amount}</span>
        </div>
        <div className="text-sm text-gray-500">
          <span>{username}</span>
          <span className="mx-2">•</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

// 通知項目組件
interface NotificationItemProps {
  title: string;
  text: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'accent';
  isRead?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ title, text, time, type, isRead = false }) => {
  const getIconBg = () => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-info';
      case 'warning': return 'bg-amber-100 text-warning';
      case 'success': return 'bg-green-100 text-success';
      case 'accent': return 'bg-orange-100 text-accent';
      default: return 'bg-blue-100 text-info';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'info': return 'fa-info';
      case 'warning': return 'fa-exclamation';
      case 'success': return 'fa-check';
      case 'accent': return 'fa-bell';
      default: return 'fa-info';
    }
  };
  
  return (
    <div className={`flex ${isRead ? 'opacity-70' : ''}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${getIconBg()}`}>
        <i className={`fas ${getIcon()}`}></i>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-800 mb-1">{title}</h4>
        <p className="text-sm text-gray-600 mb-1">{text}</p>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
};

export default DashboardPage; 