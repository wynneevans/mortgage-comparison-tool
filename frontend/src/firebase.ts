import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// Use debug token in development
if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
  console.log('[App Check] Using debug token:', import.meta.env.VITE_APPCHECK_DEBUG_TOKEN);
  // @ts-expect-error - Debug token for development
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
} else if (import.meta.env.DEV) {
  console.warn('[App Check] No debug token found - App Check may fail in development');
}

// Initialize App Check with reCAPTCHA Enterprise
console.log('[App Check] Initializing with reCAPTCHA site key:', import.meta.env.VITE_RECAPTCHA_SITE_KEY);
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY
  ),
  isTokenAutoRefreshEnabled: true, // Auto-refresh at 50% TTL
});
console.log('[App Check] Initialized successfully');
