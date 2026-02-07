
import { logger } from '@/lib/logger';

// Admin creation must be done server-side or manually in Supabase.
// Keeping this as a no-op to avoid exposing credentials in the client bundle.
export const initializeAdmin = () => {
  logger.warn('initializeAdmin disabled. Create admin users in Supabase.');
};
