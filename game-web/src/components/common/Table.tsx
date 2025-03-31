import React from 'react';

// 列定義
export interface ColumnDef<T> {
  // 列標識符，用於資料存取和排序
  id: string;
  // 列標題
  header: React.ReactNode;
  // 單元格渲染函數
  cell: (row: T, index: number) => React.ReactNode;
  // 是否可排序
  sortable?: boolean;
  // 列寬度
  width?: string;
  // 列對齊方式
  align?: 'left' | 'center' | 'right';
}

// 分頁信息
export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

// 排序信息
export interface SortingState {
  id: string;
  desc: boolean;
}

// 表格屬性
export interface TableProps<T> {
  // 表格數據
  data: T[];
  // 列定義
  columns: ColumnDef<T>[];
  // 是否顯示分頁
  pagination?: PaginationProps;
  // 排序狀態
  sorting?: SortingState;
  // 排序變更回調
  onSortingChange?: (sorting: SortingState) => void;
  // 表格標題
  title?: string;
  // 表格描述
  description?: string;
  // 表格頂部工具欄
  toolbar?: React.ReactNode;
  // 表格為空時顯示的內容
  emptyContent?: React.ReactNode;
  // 是否顯示加載狀態
  isLoading?: boolean;
  // 行點擊事件
  onRowClick?: (row: T, index: number) => void;
  // 行樣式
  rowClassName?: (row: T, index: number) => string;
  // ID 字段名 (用於生成鍵值)
  idField?: keyof T;
}

// 表格元件
function Table<T>({
  data,
  columns,
  pagination,
  sorting,
  onSortingChange,
  title,
  description,
  toolbar,
  emptyContent,
  isLoading = false,
  onRowClick,
  rowClassName,
  idField,
}: TableProps<T>) {
  // 分頁選項
  const pageSizeOptions = pagination?.pageSizeOptions || [10, 20, 50, 100];
  
  // 表格為空判斷
  const isEmpty = !isLoading && (!data || data.length === 0);
  
  // 處理排序變更
  const handleSort = (columnId: string) => {
    if (!onSortingChange) return;
    
    if (sorting?.id === columnId) {
      // 如果點擊的是當前排序列，則切換排序方向
      onSortingChange({ id: columnId, desc: !sorting.desc });
    } else {
      // 如果點擊的是新列，則預設為升序
      onSortingChange({ id: columnId, desc: false });
    }
  };
  
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow-sm">
      {/* 表格標題和工具欄 */}
      {(title || toolbar) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              {title && <h2 className="text-lg font-semibold text-gray-800">{title}</h2>}
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            {toolbar && <div>{toolbar}</div>}
          </div>
        </div>
      )}
      
      {/* 表格主體 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* 表頭 */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-6 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sorting?.id === column.id && (
                      <span>
                        {sorting.desc 
                          ? <i className="fas fa-sort-down ml-1"></i>
                          : <i className="fas fa-sort-up ml-1"></i>
                        }
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* 表格內容 */}
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // 載入中狀態
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-500">載入中...</span>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              // 數據為空狀態
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  {emptyContent || (
                    <div className="flex flex-col items-center justify-center py-8">
                      <i className="fas fa-inbox text-4xl text-gray-300 mb-2"></i>
                      <p className="text-gray-500">沒有數據</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // 數據顯示
              data.map((row, index) => (
                <tr
                  key={idField ? String(row[idField]) : index}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName ? rowClassName(row, index) : ''}`}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 分頁控件 */}
      {pagination && (
        <div className="px-6 py-3 flex justify-between items-center border-t border-gray-200 bg-gray-50">
          <div className="flex items-center text-sm text-gray-500">
            {pagination.pageSizeOptions && (
              <>
                <span>每頁顯示</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                  className="mx-2 border rounded px-2 py-1 text-sm"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>條記錄</span>
              </>
            )}
            
            <span className="mx-4">
              顯示 {((pagination.page - 1) * pagination.pageSize) + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} 
              條，共 {pagination.totalItems} 條
            </span>
          </div>
          
          <div className="flex">
            <button
              className="px-3 py-1 border rounded-l hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(1)}
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button
              className="px-3 py-1 border-t border-b hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <i className="fas fa-angle-left"></i>
            </button>
            
            {/* 頁碼按鈕 */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // 計算頁碼，确保當前頁碼在中間
              let startPage = Math.max(1, pagination.page - 2);
              const endPage = Math.min(startPage + 4, pagination.totalPages);
              
              if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
              }
              
              const page = startPage + i;
              if (page > pagination.totalPages) return null;
              
              return (
                <button
                  key={page}
                  className={`px-3 py-1 border-t border-b ${
                    pagination.page === page
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => pagination.onPageChange(page)}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              className="px-3 py-1 border-t border-b hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button
              className="px-3 py-1 border rounded-r hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.totalPages)}
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table; 