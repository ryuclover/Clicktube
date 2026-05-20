const { z } = require('zod');
const dotenv = require('dotenv');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().url('Invalid MONGO_URI. Please provide a valid MongoDB connection string.'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
}).superRefine((env, ctx) => {
  const hasUrl = !!env.CLOUDINARY_URL;
  const hasSplitCreds = !!env.CLOUDINARY_CLOUD_NAME && !!env.CLOUDINARY_API_KEY && !!env.CLOUDINARY_API_SECRET;

  if (!hasUrl && !hasSplitCreds) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLOUDINARY_URL'],
      message: 'Provide either CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.'
    });
  }
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envParsed.error.format(), null, 2));
  process.exit(1);
}

module.exports = envParsed.data;
