export * from "@/types/nft";
export * from "@/types/transaction";

// Global app types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  isLoading: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  hasMore: boolean;
}
