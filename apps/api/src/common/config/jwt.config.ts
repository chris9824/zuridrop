/**
 * JWT configuration helper.
 * Resolves TTLs based on NODE_ENV and provides utility functions.
 */

const isProd = () => process.env.NODE_ENV === 'production';

export const jwtConfig = {
  secret: () => process.env.JWT_SECRET || 'zuridrop-secret',

  /** Access token TTL – long in dev for Swagger comfort, short in prod */
  accessTokenTtl: () =>
    isProd()
      ? process.env.ACCESS_TOKEN_TTL_PROD || '15m'
      : process.env.ACCESS_TOKEN_TTL_DEV || '8h',

  /** Refresh token TTL */
  refreshTokenTtl: () => process.env.REFRESH_TOKEN_TTL || '30d',

  /** Whether to expose refresh token in responses (never in prod) */
  exposeRefreshToken: () => !isProd(),

  /** Convert a TTL string like "15m", "8h", "30d" to milliseconds */
  ttlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 15 * 60 * 1000; // fallback 15m
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default:  return 15 * 60 * 1000;
    }
  },

  /** Returns a Date = now + ttl */
  expiresAtFromTtl(ttl: string): Date {
    return new Date(Date.now() + jwtConfig.ttlToMs(ttl));
  },

  /** Log config at boot (dev only) */
  logConfig(): void {
    const env = process.env.NODE_ENV || 'development';
    const accessTtl = jwtConfig.accessTokenTtl();
    const refreshTtl = jwtConfig.refreshTokenTtl();
    console.log(`🔐 JWT config [${env}]:`);
    console.log(`   Access token TTL:  ${accessTtl}`);
    console.log(`   Refresh token TTL: ${refreshTtl}`);
    console.log(`   Expose refresh in response: ${jwtConfig.exposeRefreshToken()}`);
  },
};
