export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
  items?: T;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
}
