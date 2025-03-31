import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div>
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="總用戶數"
          value="1,284"
          trend="+12%"
          isTrendUp={true}
          icon="fa-users"
          iconBg="bg-primary-light"
          iconColor="text-primary"
        />
        <StatCard
          title="今日交易額"
          value="$23,657"
          trend="+8%"
          isTrendUp={true}
          icon="fa-money-bill-wave"
          iconBg="bg-blue-100"
          iconColor="text-info"
        />
        <StatCard
          title="總投注次數"
          value="45,208"
          trend="+15%"
          isTrendUp={true}
          icon="fa-dice"
          iconBg="bg-orange-100"
          iconColor="text-accent"
        />
        <StatCard
          title="總淨收益"
          value="$142,540"
          trend="+5%"
          isTrendUp={true}
          icon="fa-chart-line"
          iconBg="bg-green-100"
          iconColor="text-success"
        />
      </div>

      {/* 圖表和排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 主圖表 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">交易趨勢</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs font-medium rounded-full bg-purple-600 text-white">今日</button>
              <button className="px-3 py-1 text-xs font-medium rounded-full text-gray-600 hover:bg-gray-100">本週</button>
              <button className="px-3 py-1 text-xs font-medium rounded-full text-gray-600 hover:bg-gray-100">本月</button>
              <button className="px-3 py-1 text-xs font-medium rounded-full text-gray-600 hover:bg-gray-100">全年</button>
            </div>
          </div>
          <div className="h-80 w-full bg-gray-50 rounded flex items-center justify-center text-gray-400">
            <span>圖表區域 - 實際項目需整合圖表庫</span>
          </div>
        </div>

        {/* 遊戲排行榜 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">熱門遊戲</h3>
            <button className="text-sm text-purple-600 hover:text-purple-800">查看全部</button>
          </div>
          
          <div className="space-y-6">
            <GameRankItem
              name="宇宙探險"
              value="$12,458"
              percent={85}
              color="bg-purple-600"
              icon="fa-rocket"
              bgColor="bg-purple-600"
            />
            <GameRankItem
              name="神秘寶藏"
              value="$8,372"
              percent={70}
              color="bg-blue-500"
              icon="fa-gem"
              bgColor="bg-blue-500"
            />
            <GameRankItem
              name="水果盛宴"
              value="$6,489"
              percent={60}
              color="bg-green-500"
              icon="fa-apple-whole"
              bgColor="bg-green-500"
            />
            <GameRankItem
              name="幸運七彩"
              value="$4,932"
              percent={45}
              color="bg-amber-500"
              icon="fa-clover"
              bgColor="bg-amber-500"
            />
            <GameRankItem
              name="海底尋寶"
              value="$3,527"
              percent={30}
              color="bg-cyan-500"
              icon="fa-fish"
              bgColor="bg-cyan-500"
            />
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
            <TransactionItem
              title="用戶充值"
              username="張先生"
              amount="+$500.00"
              time="今天 14:23"
              isIncome={true}
            />
            <TransactionItem
              title="用戶提現"
              username="李小姐"
              amount="-$350.00"
              time="今天 12:48"
              isIncome={false}
            />
            <TransactionItem
              title="用戶充值"
              username="王先生"
              amount="+$1,000.00"
              time="今天 10:15"
              isIncome={true}
            />
            <TransactionItem
              title="用戶提現"
              username="趙先生"
              amount="-$720.00"
              time="昨天 18:36"
              isIncome={false}
            />
            <TransactionItem
              title="用戶充值"
              username="陳先生"
              amount="+$650.00"
              time="昨天 15:22"
              isIncome={true}
            />
          </div>
        </div>

        {/* 系統通知 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800">系統通知</h3>
            <button className="text-sm text-purple-600 hover:text-purple-800">全部標為已讀</button>
          </div>
          
          <div className="space-y-5">
            <NotificationItem
              title="系統更新完成"
              text="系統已成功更新到最新版本 v1.2.5，包含多項安全更新和性能優化。"
              time="30 分鐘前"
              type="info"
            />
            <NotificationItem
              title="新用戶註冊高峰"
              text="今日新用戶註冊量已超過上週同期 150%，請注意監控系統負載。"
              time="2 小時前"
              type="success"
            />
            <NotificationItem
              title="資料庫備份提醒"
              text="今日18:00將進行例行資料庫備份，預計耗時30分鐘，期間系統可能略有延遲。"
              time="5 小時前"
              type="warning"
            />
            <NotificationItem
              title="新遊戲上線通知"
              text="「宇宙探險 II」已於今日上線，請各管理員注意玩家反饋和系統穩定性。"
              time="昨天"
              type="accent"
            />
          </div>
        </div>
      </div>
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
      <div className={`${bgColor} text-white w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <h4 className="font-medium text-gray-800">{name}</h4>
          <span className="font-semibold text-sm text-gray-800">{value}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full`}
            style={{ width: `${percent}%` }}
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
}

const NotificationItem: React.FC<NotificationItemProps> = ({ title, text, time, type }) => {
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
    <div className="flex">
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