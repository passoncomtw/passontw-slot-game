import React, { useState } from 'react';

// 定義交易類型
interface Transaction {
  id: string;
  user: string;
  type: 'deposit' | 'bet' | 'withdraw' | 'win';
  amount: string;
  game: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
}

const TransactionsPage: React.FC = () => {
  // 模擬交易數據
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: '#T2024061500001', 
      user: '王小明', 
      type: 'deposit', 
      amount: '+$200.00', 
      game: '-', 
      time: '2024/06/15 10:25:18', 
      status: 'success' 
    },
    { 
      id: '#T2024061500002', 
      user: '張三', 
      type: 'bet', 
      amount: '-$50.00', 
      game: '幸運七', 
      time: '2024/06/15 10:30:45', 
      status: 'success' 
    },
    { 
      id: '#T2024061500003', 
      user: '張三', 
      type: 'win', 
      amount: '+$120.00', 
      game: '幸運七', 
      time: '2024/06/15 10:31:12', 
      status: 'success' 
    },
    { 
      id: '#T2024061500004', 
      user: '李四', 
      type: 'withdraw', 
      amount: '-$350.00', 
      game: '-', 
      time: '2024/06/15 11:05:37', 
      status: 'pending' 
    },
    { 
      id: '#T2024061500005', 
      user: '陳麗', 
      type: 'bet', 
      amount: '-$20.00', 
      game: '金幣樂園', 
      time: '2024/06/15 11:15:22', 
      status: 'success' 
    },
    { 
      id: '#T2024061500006', 
      user: '張三', 
      type: 'deposit', 
      amount: '+$500.00', 
      game: '-', 
      time: '2024/06/15 11:30:05', 
      status: 'success' 
    },
  ]);

  // 搜尋和過濾狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 處理匯出報表
  const handleExport = () => {
    alert('報表匯出功能將在此實現');
  };

  // 過濾交易
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // 搜尋詞過濾
      const searchMatch = 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        transaction.user.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 類型過濾
      const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
      
      // 日期過濾 (簡化版本，實際應用需要更複雜的日期比較)
      const dateMatch = (!startDate && !endDate) || true; // 暫時假設總是匹配
      
      return searchMatch && typeMatch && dateMatch;
    });
  };

  // 獲取過濾後的交易
  const filteredTransactions = getFilteredTransactions();

  // 獲取類型顯示文字
  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return '儲值';
      case 'bet': return '下注';
      case 'withdraw': return '提現';
      case 'win': return '獲獎';
      default: return type;
    }
  };

  // 獲取狀態顯示文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'pending': return '處理中';
      case 'failed': return '失敗';
      default: return status;
    }
  };

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
              placeholder="搜尋交易ID、用戶名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
            onClick={handleExport}
          >
            <i className="fas fa-file-export"></i>
            <span>匯出報表</span>
          </button>
        </div>
      </div>
      
      {/* 過濾選項 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('all')}
          >
            所有類型
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'deposit' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('deposit')}
          >
            儲值
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'bet' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('bet')}
          >
            下注
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'withdraw' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('withdraw')}
          >
            提現
          </button>
          <button 
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              typeFilter === 'win' 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:border-primary hover:text-primary border border-gray-300'
            }`}
            onClick={() => setTypeFilter('win')}
          >
            獲獎
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="date" 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-500">至</span>
          <input 
            type="date" 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-primary"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button 
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            篩選
          </button>
        </div>
      </div>
      
      {/* 交易列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">相關遊戲</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-700">{transaction.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                      transaction.type === 'deposit' 
                        ? 'bg-green-100 text-success' 
                        : transaction.type === 'bet'
                          ? 'bg-blue-100 text-info'
                          : transaction.type === 'withdraw'
                            ? 'bg-red-100 text-error'
                            : 'bg-yellow-100 text-warning'
                    }`}>
                      {getTypeText(transaction.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      transaction.amount.startsWith('+') 
                        ? 'text-success' 
                        : 'text-error'
                    }`}>
                      {transaction.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.game}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                      transaction.status === 'success' 
                        ? 'bg-green-100 text-success' 
                        : transaction.status === 'pending'
                          ? 'bg-blue-100 text-info'
                          : 'bg-red-100 text-error'
                    }`}>
                      {getStatusText(transaction.status)}
                    </span>
                  </td>
                </tr>
              ))}
              
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    沒有找到符合條件的交易記錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分頁 */}
        {filteredTransactions.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-500">
              顯示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredTransactions.length}</span> 項結果，共 <span className="font-medium">{transactions.length}</span> 項
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md bg-primary text-white">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">...</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">10</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage; 