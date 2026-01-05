// Copy this file to both:
// - apps/api-gateway/src/common/constants/services.constants.ts
// - apps/auth-service/src/common/constants/services.constants.ts
// - apps/user-service/src/common/constants/services.constants.ts

/**
 * Service names for ClientProxy injection
 */
export const SERVICES = {
  AUTH: 'AUTH-SERVICE',
  USER: 'USER-SERVICE',
} as const;

export type ServiceName = (typeof SERVICES)[keyof typeof SERVICES];
