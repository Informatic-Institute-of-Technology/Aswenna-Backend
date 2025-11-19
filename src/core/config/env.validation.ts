import Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  MONGO_URI: Joi.string().uri().required(),

  // AUTH0
  AUTH0_AUDIENCE: Joi.string().required(),
  AUTH0_DOMAIN: Joi.string().required(),
});
