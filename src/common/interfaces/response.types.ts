export interface ResponseType {
  readonly message: string;
  readonly statusCode: number;
}

export interface PaginationType {
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
  readonly limit: number;
  readonly nextPage: number;
  readonly page: number;
  readonly prevPage: number;
  readonly totalDocs: number;
  readonly totalPages: number;
}

export interface PaginatedResponseType<T> {
  readonly data: T;
  readonly pagination: PaginationType;
}
