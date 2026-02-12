# File Upload Module

This module provides file upload, deletion, and pre-signed URL generation functionality using Azure Blob Storage.

## Features

- **File Upload**: Upload files to Azure Blob Storage with optional folder paths
- **File Deletion**: Delete files from Azure Blob Storage
- **Pre-Signed URLs**: Generate time-limited pre-signed URLs for secure file access
- **File Retrieval**: Get direct URLs for uploaded files

## API Endpoints

### 1. Upload File

**POST** `/file-upload/upload`

Upload a file to Azure Blob Storage.

**Request:**

- Form Data:
  - `file` (multipart file) - The file to upload
  - `folderPath` (query param, optional) - Folder path in the container (e.g., "farmers/documents")

**Response:**

```json
{
  "fileName": "farmers/documents/1707032400000-document.pdf",
  "url": "https://<account>.blob.core.windows.net/files/farmers/documents/...",
  "size": 1024,
  "contentType": "application/pdf",
  "uploadedAt": "2024-02-04T10:00:00.000Z"
}
```

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/file-upload/upload \
  -F "file=@document.pdf" \
  -F "folderPath=farmers/documents"
```

---

### 2. Generate Pre-Signed URL

**POST** `/file-upload/pre-signed-url`

Generate a time-limited pre-signed URL for secure file access.

**Request Body:**

```json
{
  "fileName": "farmers/documents/1707032400000-document.pdf",
  "expiresInMinutes": 60
}
```

**Response:**

```json
{
  "url": "https://<account>.blob.core.windows.net/files/farmers/documents/...?sv=2021-06-08&...",
  "expiresIn": 60,
  "fileName": "farmers/documents/1707032400000-document.pdf"
}
```

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/file-upload/pre-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "farmers/documents/1707032400000-document.pdf",
    "expiresInMinutes": 120
  }'
```

---

### 3. Delete File

**DELETE** `/file-upload/delete`

Delete a file from Azure Blob Storage.

**Request Body:**

```json
{
  "fileName": "farmers/documents/1707032400000-document.pdf"
}
```

**Response:**

```json
{
  "success": true,
  "message": "File farmers/documents/1707032400000-document.pdf deleted successfully",
  "fileName": "farmers/documents/1707032400000-document.pdf"
}
```

**Example (cURL):**

```bash
curl -X DELETE http://localhost:3000/file-upload/delete \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "farmers/documents/1707032400000-document.pdf"
  }'
```

---

### 4. Get File URL

**POST** `/file-upload/get-url`

Get the direct URL for an uploaded file.

**Request Body:**

```json
{
  "fileName": "farmers/documents/1707032400000-document.pdf"
}
```

**Response:**

```json
{
  "url": "https://<account>.blob.core.windows.net/files/farmers/documents/..."
}
```

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/file-upload/get-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "farmers/documents/1707032400000-document.pdf"
  }'
```

---

## Environment Variables

Required environment variables for Azure Storage configuration:

```env
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
AZURE_STORAGE_CONTAINER_NAME=files
```

See `.env.example` for reference.

## Setup Instructions

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new Storage Account
3. Note down your:
   - Storage Account Name
   - Storage Account Key (found under Access keys)

### 2. Configure Environment Variables

Add to your `.env` file:

```env
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONTAINER_NAME=files
```

### 3. Dependencies

The module uses:

- `@azure/storage-blob` - Azure Blob Storage SDK

Already installed in `package.json`.

## Usage Examples

### TypeScript/NestJS

Inject the service in your controller:

```typescript
import { FileUploadService } from './modules/file-upload/file-upload.service';

@Controller('my-module')
export class MyController {
  constructor(private fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: any) {
    return this.fileUploadService.uploadFile(file, 'documents');
  }

  @Post('delete')
  async deleteDocument(@Body() dto: { fileName: string }) {
    return this.fileUploadService.deleteFile(dto.fileName);
  }

  @Post('share-document')
  async shareDocument(@Body() dto: { fileName: string }) {
    const presignedUrl = await this.fileUploadService.generatePreSignedUrl(
      dto.fileName,
      120, // 2 hours
    );
    return presignedUrl;
  }
}
```

## File Organization Best Practices

Use folder paths to organize files:

```
container/
├── farmers/
│   ├── documents/
│   ├── photos/
│   └── certificates/
├── investors/
│   ├── documents/
│   └── kyc/
└── land-owners/
    ├── documents/
    └── property-docs/
```

## Security Considerations

1. **Pre-Signed URLs**: Always set appropriate expiration times
2. **Permissions**: Use `BlobSASPermissions` to limit access rights
3. **Credentials**: Store Azure keys in secure environment variables
4. **Validation**: Validate file types and sizes before upload
5. **Access Control**: Implement proper authentication/authorization in your controllers

## Error Handling

The module provides detailed error messages:

- `BadRequestException` - Invalid input (missing file, missing fileName)
- `InternalServerErrorException` - Azure operation failures

## Troubleshooting

### "Azure Storage credentials are not configured"

- Check that `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` are set in `.env`

### "File not found"

- Verify the exact file path (case-sensitive)
- Check that the file exists in the container

### Connection Issues

- Verify Azure Storage Account credentials
- Check network connectivity to Azure
- Ensure the container exists in your storage account
