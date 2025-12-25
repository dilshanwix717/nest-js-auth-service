// FILE: apps/auth-service/src/config/env.ts

export const getEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }

  return value;
};
