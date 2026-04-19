// Trendzact Partners — Auth Module
//
// Loaded on every page as <script type="module" src="/assets/auth.js"></script>
//
// Responsibilities:
//   - Initialize Firebase with the public client config
//   - Track signed-in state, expose it on window.TrendzactAuth
//   - Run auth guard — redirect unauthenticated users to /login.html
//   - Redirect users with mustResetPassword=true to /set-password.html
//   - Expose sign-in / sign-out helpers for login/logout pages
//   - Update the utility bar with the real signed-in user email
//
// Non-goals in this increment:
//   - Role-based page gating (comes in Increment 2)
//   - OrgID scoping (comes in Increment 2)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// --------------------------------------------------
// Config
// --------------------------------------------------
// Firebase Hosting's cleanUrls setting strips .html extensions,
// so we normalize paths and check against both forms.
const PUBLIC_PAGES = new Set([
  '/login.html', '/login',
  '/set-password.html', '/set-password',
  '/logout.html', '/logout',
  '/verify-link.html', '/verify-link'
]);

function isPublicPage(pathname) {
  const p = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  return PUBLIC_PAGES.has(p);
}

// --------------------------------------------------
// Initialize Firebase
// --------------------------------------------------
if (!window.FIREBASE_CONFIG) {
  console.error('[Trendzact Auth] firebase-config.js did not load before auth.js. Aborting.');
  throw new Error('firebase-config.js missing');
}

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// --------------------------------------------------
// Public API — window.TrendzactAuth
// --------------------------------------------------
window.TrendzactAuth = {
  app,
  auth,
  db,
  currentUser: null,
  userDoc: null,

  /** Sign in with email + password. Returns the UserCredential. */
  async signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred;
  },

  /** Sign out and redirect to /login.html */
  async signOutAndRedirect() {
    try { await signOut(auth); } catch (e) { console.warn(e); }
    window.location.href = '/login.html';
  },

  /** Send a password-reset email to the given address. */
  async sendResetEmail(email) {
    const actionCodeSettings = {
      // After Firebase completes the password reset, send the user back
      // to our branded login page with a success flag.
      url: window.location.origin + '/login.html?reset=success',
      handleCodeInApp: false
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  /**
   * Send a passwordless sign-in link to the given email.
   * When the user clicks the link, they'll land on /verify-link.html
   * which completes the sign-in. The email address is stored in
   * localStorage to finish the handshake on the same device.
   */
  async sendMagicLink(email) {
    const actionCodeSettings = {
      url: window.location.origin + '/verify-link.html',
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email so we can complete sign-in on the same device
    // without asking again. Cleared after successful sign-in.
    window.localStorage.setItem('trendzactEmailForSignIn', email);
  },

  /** True if the current URL is a valid Firebase sign-in link. */
  isSignInLink(url) {
    return isSignInWithEmailLink(auth, url || window.location.href);
  },

  /**
   * Complete the magic-link sign-in. If email was saved in localStorage
   * (same device), uses it automatically. Otherwise the caller must
   * pass the email in.
   */
  async completeMagicLinkSignIn(email) {
    const finalEmail = email || window.localStorage.getItem('trendzactEmailForSignIn');
    if (!finalEmail) {
      throw new Error('email-required');
    }
    const cred = await signInWithEmailLink(auth, finalEmail, window.location.href);
    window.localStorage.removeItem('trendzactEmailForSignIn');
    return cred;
  }
};

// --------------------------------------------------
// Utility bar wiring (updates "Signed in as..." on every page)
// --------------------------------------------------
function updateUtilityBar(user) {
  // Poll until the utility bar is in the DOM (header.js injects it async)
  let attempts = 0;
  const tick = () => {
    const el = document.querySelector('.util-user');
    if (el) {
      if (user) {
        el.innerHTML = `Signed in as <strong>${escapeHtml(user.email)}</strong>`;
      } else {
        el.innerHTML = '';
      }
      // Wire sign-out link
      const signOutLink = document.querySelector('.util-link');
      if (signOutLink) {
        signOutLink.setAttribute('href', '#');
        signOutLink.textContent = user ? 'Sign out' : 'Sign in';
        signOutLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (user) {
            window.TrendzactAuth.signOutAndRedirect();
          } else {
            window.location.href = '/login.html';
          }
        }, { once: true });
      }
      return;
    }
    if (attempts++ < 20) setTimeout(tick, 50);
  };
  tick();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --------------------------------------------------
// Auth state observer — the guard
// --------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  const onPublicPage = isPublicPage(path);

  window.TrendzactAuth.currentUser = user;

  if (!user) {
    // Not signed in
    if (!onPublicPage) {
      // Sanitize current path — if it's already a redirect chain, just send
      // them to plain login without a new redirect param (breaks any loop).
      const current = path + window.location.search;
      const looksLikeRedirectChain =
        /[?&]redirect=/.test(current) ||
        /\/login/i.test(path);
      if (looksLikeRedirectChain) {
        window.location.href = '/login.html';
      } else {
        const here = encodeURIComponent(current);
        window.location.href = `/login.html?redirect=${here}`;
      }
      return;
    }
    updateUtilityBar(null);
    return;
  }

  // Signed in — fetch user Firestore doc for mustResetPassword flag and role
  let userDoc = null;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    userDoc = snap.exists() ? snap.data() : null;
  } catch (e) {
    // Firestore not yet accessible (rules not deployed, etc.) — not fatal here
    console.warn('[Trendzact Auth] Could not fetch user doc:', e.message);
  }

  window.TrendzactAuth.userDoc = userDoc;

  // If they must reset their temp password, force them to the reset page
  if (userDoc && userDoc.mustResetPassword === true && path !== '/set-password.html') {
    window.location.href = '/set-password.html';
    return;
  }

  updateUtilityBar(user);

  // Emit a custom event that page-specific scripts can listen for
  window.dispatchEvent(new CustomEvent('trendzact-auth-ready', {
    detail: { user, userDoc }
  }));
});
