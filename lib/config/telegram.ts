/**
 * Telegram community configuration (frontend side).
 *
 * NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL — public link to the community group, e.g. https://t.me/plantsheep_chat.
 * Evaluated at build time — rebuild the frontend after changing it.
 */
export const TELEGRAM_COMMUNITY_URL: string | undefined =
  process.env.NEXT_PUBLIC_TELEGRAM_COMMUNITY_URL || undefined;

/**
 * Launch date of the Telegram community feature.
 * Users registered on/after this date see the "welcome" banner variant,
 * users registered before it see the "what's new" variant.
 */
export const TELEGRAM_COMMUNITY_LAUNCH_DATE = new Date('2026-08-19T00:00:00Z');

export const isTelegramCommunityEnabled = (): boolean => !!TELEGRAM_COMMUNITY_URL;
