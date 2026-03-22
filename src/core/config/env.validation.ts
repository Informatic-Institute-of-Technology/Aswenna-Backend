import Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  MONGO_URI: Joi.string().uri().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),

  // OTP
  OTP_EXPIRATION_MINUTES: Joi.number().default(5),
  OTP_MAX_ATTEMPTS: Joi.number().default(5),

  // Email
  EMAIL_HOST: Joi.string().default('smtp.mailtrap.io'),
  EMAIL_PORT: Joi.number().default(2525),
  EMAIL_USER: Joi.string().allow(''),
  EMAIL_PASS: Joi.string().allow(''),

  // Azure Storage
  AZURE_STORAGE_ACCOUNT_NAME: Joi.string().required(),
  AZURE_STORAGE_ACCOUNT_KEY: Joi.string().required(),
  AZURE_STORAGE_CONTAINER_NAME: Joi.string().default('files'),
  AZURE_UPLOAD_SAS_EXPIRATION_MINUTES: Joi.number().default(15),

  // PayHere
  PAYHERE_MERCHANT_ID: Joi.string().allow('').default(''),
  PAYHERE_MERCHANT_SECRET: Joi.string().allow('').default(''),
  PAYHERE_CURRENCY: Joi.string().default('LKR'),
  PAYHERE_SANDBOX: Joi.boolean().truthy('true').falsy('false').default(true),
  PAYHERE_CHECKOUT_URL: Joi.string().allow('').default(''),
  PAYHERE_NOTIFY_URL: Joi.string().allow('').default(''),
  PAYHERE_RETURN_URL: Joi.string().allow('').default(''),
  PAYHERE_CANCEL_URL: Joi.string().allow('').default(''),
});
