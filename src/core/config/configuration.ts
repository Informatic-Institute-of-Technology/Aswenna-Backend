export default () => ({
  app: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
  },
  db: {
    uri: process.env.MONGO_URI,
  },
});
