// A predictable development-only key keeps the zero-setup demo convenient.
// Production deployments must supply a unique secret through the environment.
const developmentSecret = 'safebuddy-local-development-only-secret-change-before-deploy';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.');
}

export const JWT_SECRET = process.env.JWT_SECRET || developmentSecret;
