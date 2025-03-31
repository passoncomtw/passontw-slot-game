import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface GameHistory {
  id: string;
  gameType: string;
  betAmount: number;
  winAmount: number;
  timestamp: Date;
  isWin: boolean;
}

interface GameContextType {
  balance: number;
  winAmount: number;
  betAmount: number;
  jackpot: number;
  isSpinning: boolean;
  gameHistory: GameHistory[];
  reels: string[];
  aiSuggestion: string | null;
  setBetAmount: (amount: number) => void;
  increaseBet: () => void;
  decreaseBet: () => void;
  spin: () => Promise<void>;
  resetWinAmount: () => void;
  updateBalance: (amount: number) => void;
  setReels: (newReels: string[]) => void;
  setIsSpinningState: (spinning: boolean) => void;
}

// 匯出 GameContext，以便在 class components 中使用
export const GameContext = createContext<GameContextType>({
  balance: 0,
  winAmount: 0,
  betAmount: 10,
  jackpot: 10000,
  isSpinning: false,
  gameHistory: [],
  reels: ['7', '🍒', '🍋'],
  aiSuggestion: null,
  setBetAmount: () => {},
  increaseBet: () => {},
  decreaseBet: () => {},
  spin: async () => {},
  resetWinAmount: () => {},
  updateBalance: () => {},
  setReels: () => {},
  setIsSpinningState: () => {}
});

/**
 * 遊戲上下文提供器
 */
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(1000); // 設置一個默認值
  const [winAmount, setWinAmount] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [jackpot] = useState<number>(10000);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [reels, setReels] = useState<string[]>(['7', '🍒', '🍋']);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // 當用戶變更時更新餘額
  useEffect(() => {
    if (user) {
      console.log("用戶數據更新: ", user);
      setBalance(user.balance || 1000);
    }
  }, [user]);

  // 調試用
  useEffect(() => {
    console.log("當前餘額：", balance);
  }, [balance]);

  /**
   * 增加投注金額
   */
  const increaseBet = () => {
    if (betAmount < balance) {
      setBetAmount(prev => Math.min(prev + 10, balance));
    }
  };

  /**
   * 減少投注金額
   */
  const decreaseBet = () => {
    setBetAmount(prev => Math.max(prev - 10, 10));
  };

  /**
   * 旋轉老虎機
   */
  const spin = async (): Promise<void> => {
    if (isSpinning || balance < betAmount) return;

    setIsSpinning(true);
    // 扣除投注金額
    setBalance(prev => prev - betAmount);
    
    // 模擬旋轉動畫
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 隨機生成結果
    const symbols = ['7', '🍒', '🍋', '💎', '🔔', '🍊', '🍉', '🍇'];
    const newReels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    setReels(newReels);
    
    // 計算獎金
    let win = 0;
    
    // 三個相同符號
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
      // 三個7得頭獎
      if (newReels[0] === '7') {
        win = jackpot;
      } else {
        win = betAmount * 10;
      }
    } 
    // 兩個相同符號
    else if (
      newReels[0] === newReels[1] ||
      newReels[1] === newReels[2] ||
      newReels[0] === newReels[2]
    ) {
      win = betAmount * 2;
    }
    
    // 更新獎金和餘額
    setWinAmount(win);
    if (win > 0) {
      setBalance(prev => prev + win);
    }
    
    // 更新遊戲歷史
    const newHistory: GameHistory = {
      id: Date.now().toString(),
      gameType: '幸運七',
      betAmount,
      winAmount: win,
      timestamp: new Date(),
      isWin: win > 0,
    };
    
    setGameHistory(prev => [newHistory, ...prev]);
    
    // 更新AI建議
    const suggestions = [
      '根據歷史數據，目前有70%的機率獲得獎金，建議增加投注金額。',
      '您的投注模式偏向保守，建議嘗試逐步增加投注額。',
      '您已連續未中獎3次，根據概率學，接下來的幾次旋轉中獎機率較高。',
      '當前遊戲熱度正高，最近頭獎中獎率提升了15%。',
      '您目前的投注策略表現良好，建議維持當前投注額。',
    ];
    
    setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    
    setIsSpinning(false);
  };

  /**
   * 重置獲勝金額
   */
  const resetWinAmount = () => {
    setWinAmount(0);
  };

  /**
   * 更新餘額
   */
  const updateBalance = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  /**
   * 設置輪盤符號
   */
  const updateReels = (newReels: string[]) => {
    setReels(newReels);
  };
  
  /**
   * 設置是否正在旋轉
   */
  const setIsSpinningState = (spinning: boolean) => {
    setIsSpinning(spinning);
  };

  return (
    <GameContext.Provider
      value={{
        balance,
        winAmount,
        betAmount,
        jackpot,
        isSpinning,
        gameHistory,
        reels,
        aiSuggestion,
        setBetAmount,
        increaseBet,
        decreaseBet,
        spin,
        resetWinAmount,
        updateBalance,
        setReels: updateReels,
        setIsSpinningState
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

/**
 * 使用遊戲上下文的鉤子
 */
export const useGame = () => useContext(GameContext); 