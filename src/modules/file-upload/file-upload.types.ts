export interface FileUploadResponse {
  fileName: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

export interface DeleteFileResponse {
  success: boolean;
  message: string;
  fileName: string;
}

export interface PreSignedUrlResponse {
  url: string;
  expiresIn: number;
  fileName: string;
}
