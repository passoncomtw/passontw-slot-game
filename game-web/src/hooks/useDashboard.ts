import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dashboardApi from '../services/dashboardApi';
import { DashboardResponse } from '../types/dashboard';

export const useDashboardData = (timeRange: string = 'today') => {
  return useQuery<DashboardResponse, Error>({
    queryKey: ['dashboardData', timeRange],
    queryFn: () => dashboardApi.getDashboardData(timeRange),
    refetchInterval: 5 * 60 * 1000, // 5分鐘自動更新一次
    staleTime: 1 * 60 * 1000, // 1分鐘後過期
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => dashboardApi.markAllNotificationsAsRead(),
    onSuccess: () => {
      // 成功後重新獲取儀表板數據，以更新通知狀態
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    }
  });
}; 