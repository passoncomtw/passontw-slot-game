import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DepositRequest, TransactionResponse, UserWallet, WithdrawRequest } from '../api/userService';

interface WalletState {
  balance: {
    data: UserWallet | null;
    isLoading: boolean;
    error: string | null;
  };
  deposit: {
    isLoading: boolean;
    success: boolean;
    error: string | null;
    transaction: TransactionResponse | null;
  };
  withdraw: {
    isLoading: boolean;
    success: boolean;
    error: string | null;
    transaction: TransactionResponse | null;
  };
}

const initialState: WalletState = {
  balance: {
    data: null,
    isLoading: false,
    error: null,
  },
  deposit: {
    isLoading: false,
    success: false,
    error: null,
    transaction: null,
  },
  withdraw: {
    isLoading: false,
    success: false,
    error: null,
    transaction: null,
  },
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // 獲取錢包餘額
    fetchBalanceRequest: (state) => {
      state.balance.isLoading = true;
      state.balance.error = null;
    },
    fetchBalanceSuccess: (state, action: PayloadAction<UserWallet>) => {
      state.balance.data = action.payload;
      state.balance.isLoading = false;
      state.balance.error = null;
    },
    fetchBalanceFailure: (state, action: PayloadAction<string>) => {
      state.balance.isLoading = false;
      state.balance.error = action.payload;
    },
    
    // 更新錢包餘額（用於其他交易後的餘額更新）
    updateWalletBalance: (state, action: PayloadAction<{ balance: number }>) => {
      if (state.balance.data) {
        state.balance.data.balance = action.payload.balance;
      }
    },

    // 存款
    depositRequest: (state, action: PayloadAction<DepositRequest>) => {
      state.deposit.isLoading = true;
      state.deposit.success = false;
      state.deposit.error = null;
      state.deposit.transaction = null;
    },
    depositSuccess: (state, action: PayloadAction<TransactionResponse>) => {
      state.deposit.isLoading = false;
      state.deposit.success = true;
      state.deposit.error = null;
      state.deposit.transaction = action.payload;
      
      // 更新餘額
      if (state.balance.data) {
        state.balance.data.balance = action.payload.balanceAfter;
        state.balance.data.totalDeposit += action.payload.amount;
      }
    },
    depositFailure: (state, action: PayloadAction<string>) => {
      state.deposit.isLoading = false;
      state.deposit.success = false;
      state.deposit.error = action.payload;
    },
    resetDeposit: (state) => {
      state.deposit.isLoading = false;
      state.deposit.success = false;
      state.deposit.error = null;
      state.deposit.transaction = null;
    },

    // 提款
    withdrawRequest: (state, action: PayloadAction<WithdrawRequest>) => {
      state.withdraw.isLoading = true;
      state.withdraw.success = false;
      state.withdraw.error = null;
      state.withdraw.transaction = null;
    },
    withdrawSuccess: (state, action: PayloadAction<TransactionResponse>) => {
      state.withdraw.isLoading = false;
      state.withdraw.success = true;
      state.withdraw.error = null;
      state.withdraw.transaction = action.payload;
      
      // 更新餘額
      if (state.balance.data) {
        state.balance.data.balance = action.payload.balanceAfter;
        state.balance.data.totalWithdraw += action.payload.amount;
      }
    },
    withdrawFailure: (state, action: PayloadAction<string>) => {
      state.withdraw.isLoading = false;
      state.withdraw.success = false;
      state.withdraw.error = action.payload;
    },
    resetWithdraw: (state) => {
      state.withdraw.isLoading = false;
      state.withdraw.success = false;
      state.withdraw.error = null;
      state.withdraw.transaction = null;
    },
  },
});

export const {
  fetchBalanceRequest,
  fetchBalanceSuccess,
  fetchBalanceFailure,
  updateWalletBalance,
  depositRequest,
  depositSuccess,
  depositFailure,
  resetDeposit,
  withdrawRequest,
  withdrawSuccess,
  withdrawFailure,
  resetWithdraw,
} = walletSlice.actions;

export default walletSlice.reducer; 