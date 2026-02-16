// UI state and component types

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ErrorStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onRetry?: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

export type TimeRange = '7D' | '30D' | '90D';

export interface PriceHistoryChartProps {
  data: Array<{ date: string; price: number }>;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  checked: boolean;
}

export interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  stores: FilterOption[];
  minPrice: string;
  maxPrice: string;
  onStoreToggle: (storeId: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
}
