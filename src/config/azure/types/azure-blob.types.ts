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

export interface UploadUrlResponse {
  url: string;
  expiresIn: number;
  fileName: string;
  method: 'PUT';
  headers: {
    'Content-Type': string;
    'x-ms-blob-type': 'BlockBlob';
  };
}

export interface BlobFileDetails {
  fileName: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}
