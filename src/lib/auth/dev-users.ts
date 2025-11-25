/**
 * Development-only user credentials for quick testing
 * These users must be manually created in Supabase before use
 */

export const DEV_USERS = {
    company: {
        email: "dev-company@hunter.local",
        password: "dev123456",
        role: "company" as const,
        displayName: "Dev Company User"
    },
    hunter: {
        email: "dev-hunter@hunter.local",
        password: "dev123456",
        role: "hunter" as const,
        displayName: "Dev Hunter User"
    }
} as const;

export type DevUserRole = keyof typeof DEV_USERS;

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
    return process.env.NODE_ENV !== 'production';
}
