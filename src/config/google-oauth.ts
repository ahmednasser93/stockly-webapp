/**
 * Google OAuth Configuration
 * 
 * This file provides the Google OAuth Client ID for the application.
 * It checks for environment variables first, then falls back to production defaults.
 * 
 * Note: Client IDs are public and safe to include in the codebase.
 */

// Production Google OAuth Client ID for webapp
const PRODUCTION_CLIENT_ID = "272719199106-9hpeemg60nqoph9t52audf6hmri27mb6.apps.googleusercontent.com";

/**
 * Get Google OAuth Client ID
 * Priority:
 * 1. VITE_GOOGLE_CLIENT_ID environment variable (set during build)
 * 2. Production default (hardcoded fallback)
 */
export const GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  PRODUCTION_CLIENT_ID;

// Log warning in development if using default
if (import.meta.env.DEV && !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  console.warn(
    "VITE_GOOGLE_CLIENT_ID not set. Using production default.",
    "This is fine for development, but ensure it's set for production builds."
  );
}

// Log error if still empty (should never happen)
if (!GOOGLE_CLIENT_ID) {
  console.error("Google OAuth Client ID is not configured. Google Sign-In will not work.");
}




