import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().uri().required(),
  SPOTIFY_CLIENT_ID: Joi.string().required(),
  SPOTIFY_CLIENT_SECRET: Joi.string().required(),
  SPOTIFY_REDIRECT_URI: Joi.string().uri().required(),
  SPOTIFY_SESSION_SECRET: Joi.string().required(),
  // trailing slash stripped: the CORS origin has to match the browser's Origin
  // header exactly, and the post-login redirect appends '/dashboard'
  FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .custom((value: string) => value.replace(/\/+$/, '')),
  GEMINI_API_KEY: Joi.string().required()
});
