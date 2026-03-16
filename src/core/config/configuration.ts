export default () => ({
  app: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
  },
  db: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'defaultSecret',
    expiration: process.env.JWT_EXPIRATION || '1h',
  },
  otp: {
    expirationMinutes: process.env.OTP_EXPIRATION_MINUTES
      ? parseInt(process.env.OTP_EXPIRATION_MINUTES, 10)
      : 5,
    maxAttempts: process.env.OTP_MAX_ATTEMPTS
      ? parseInt(process.env.OTP_MAX_ATTEMPTS, 10)
      : 5,
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 2525,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  azure: {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'files',
    uploadSasExpirationMinutes: process.env.AZURE_UPLOAD_SAS_EXPIRATION_MINUTES
      ? parseInt(process.env.AZURE_UPLOAD_SAS_EXPIRATION_MINUTES, 10)
      : 15,
  },
});
