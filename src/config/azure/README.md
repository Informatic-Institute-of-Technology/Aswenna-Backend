# Azure Storage Configuration

This module handles all Azure Blob Storage operations including file uploads, deletion, and pre-signed URL generation.

## Overview

The Azure config module provides:

- **AzureStorageService**: Initializes and manages the Azure Blob Service Client
- **AzureBlobStorageService**: Implements file operations (upload, delete, pre-signed URLs)

## Features

### File Upload

Upload files to Azure Blob Storage with support for folder organization.

**Endpoint**: `POST /file-upload/upload`

**Query Parameters**:

- `folderPath` (optional): Organize files in folders

**Request**:

```bash
curl -X POST http://localhost:3000/file-upload/upload \
  -F "file=@/path/to/file.txt" \
  -H "Content-Type: multipart/form-data"
```

**Response**:

```json
{
  "fileName": "1707046400000-file.txt",
  "url": "https://account.blob.core.windows.net/files/1707046400000-file.txt",
  "size": 1024,
  "contentType": "text/plain",
  "uploadedAt": "2026-02-04T12:00:00.000Z"
}
```

### File Deletion

Delete files from Azure Blob Storage.

**Endpoint**: `DELETE /file-upload/delete`

**Request Body**:

```json
{
  "fileName": "1707046400000-file.txt"
}
```

**Request**:

```bash
curl -X DELETE http://localhost:3000/file-upload/delete \
  -H "Content-Type: application/json" \
  -d '{"fileName": "1707046400000-file.txt"}'
```

**Response**:

```json
{
  "success": true,
  "message": "File 1707046400000-file.txt deleted successfully",
  "fileName": "1707046400000-file.txt"
}
```

### Generate Pre-Signed URL

Generate time-limited URLs for secure file access without authentication.

**Endpoint**: `POST /file-upload/pre-signed-url`

**Request Body**:

```json
{
  "fileName": "1707046400000-file.txt",
  "expiresInMinutes": 60
}
```

**Request**:

```bash
curl -X POST http://localhost:3000/file-upload/pre-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "1707046400000-file.txt",
    "expiresInMinutes": 60
  }'
```

**Response**:

```json
{
  "url": "https://account.blob.core.windows.net/files/1707046400000-file.txt?sv=2023-01-01&...",
  "expiresIn": 60,
  "fileName": "1707046400000-file.txt"
}
```

### Get File URL

Retrieve the direct URL for a file.

**Endpoint**: `POST /file-upload/get-url`

**Request Body**:

```json
{
  "fileName": "1707046400000-file.txt"
}
```

**Request**:

```bash
curl -X POST http://localhost:3000/file-upload/get-url \
  -H "Content-Type: application/json" \
  -d '{"fileName": "1707046400000-file.txt"}'
```

**Response**:

```json
{
  "url": "https://account.blob.core.windows.net/files/1707046400000-file.txt"
}
```

## Environment Configuration

Add the following to your `.env` file:

```env
# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=files
```

## Setup Instructions

### 1. Create Azure Storage Account

- Go to Azure Portal
- Create a new Storage Account
- Note the account name and access key

### 2. Create Container

- In your Storage Account, create a Blob Container
- Default name is `files`

### 3. Configure Environment Variables

```env
AZURE_STORAGE_ACCOUNT_NAME=mystorageaccount
AZURE_STORAGE_ACCOUNT_KEY=your-access-key-here
AZURE_STORAGE_CONTAINER_NAME=files
```

### 4. Validate Configuration

The AzureStorageService will validate credentials on initialization. If credentials are missing, it will throw an InternalServerErrorException.

## File Organization

Files are organized with timestamps to ensure uniqueness:

- Format: `[folderPath/]timestamp-originalname`
- Example: `documents/1707046400000-myfile.pdf`
- Without folder: `1707046400000-myfile.pdf`

## Logging

All operations are logged using NestJS Logger:

- File uploads
- File deletions
- Pre-signed URL generation
- File URL retrieval
- Errors with detailed messages

## Error Handling

### BadRequestException (400)

- No file provided
- File name is required
- File not found

### InternalServerErrorException (500)

- Azure credentials not configured
- Upload failures
- Deletion failures
- Pre-signed URL generation failures

## Security Best Practices

1. **Access Control**: Use environment variables for sensitive credentials
2. **Pre-Signed URLs**: Always set appropriate expiration times
3. **Permissions**: Use read-only permissions for client-side access
4. **Validation**: Validate file types before upload
5. **Size Limits**: Implement file size restrictions in the controller

## Example: Upload with Folder Path

```bash
curl -X POST "http://localhost:3000/file-upload/upload?folderPath=documents/2024" \
  -F "file=@/path/to/document.pdf" \
  -H "Content-Type: multipart/form-data"
```

Response:

```json
{
  "fileName": "documents/2024/1707046400000-document.pdf",
  "url": "https://account.blob.core.windows.net/files/documents/2024/1707046400000-document.pdf",
  "size": 5242880,
  "contentType": "application/pdf",
  "uploadedAt": "2026-02-04T12:00:00.000Z"
}
```

## Troubleshooting

### "Azure Storage credentials are not configured"

- Verify AZURE_STORAGE_ACCOUNT_NAME is set
- Verify AZURE_STORAGE_ACCOUNT_KEY is set
- Check .env file for typos

### "File not found"

- Verify the fileName is correct
- Check if the file was successfully uploaded
- Ensure the file hasn't been deleted

### Connection Issues

- Verify your Storage Account name is correct
- Check your access key is valid
- Ensure network connectivity to Azure

## Integration Example

To use the Azure Blob Storage Service in other modules:

```typescript
import { Injectable } from '@nestjs/common';
import { AzureBlobStorageService } from '../../config/azure/services/azure-blob-storage.service';

@Injectable()
export class MyService {
  constructor(private azureBlobStorageService: AzureBlobStorageService) {}

  async processFile(file: Express.Multer.File) {
    const result = await this.azureBlobStorageService.uploadFile(
      file,
      'my-folder',
    );
    return result;
  }
}
```
