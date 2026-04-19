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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// --------------------------------------------------
// Config
// --------------------------------------------------
const PUBLIC_PAGES = new Set([
  '/login.html',
  '/set-password.html',
  '/logout.html'
]);

function isPublicPage(pathname) {
  const p = (pathname || '/').toLowerCase();
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

  /**
   * Change password for currently signed-in user. Requires current password
   * for re-authentication (Firebase security requirement).
   */
  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    // Clear the mustResetPassword flag in Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        mustResetPassword: false,
        passwordSetAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Trendzact Auth] Could not update user doc after password change', e);
    }
  },

  /** Send a password-reset email to the given address. */
  async sendResetEmail(email) {
    await sendPasswordResetEmail(auth, email);
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
      const here = encodeURIComponent(path + window.location.search);
      window.location.href = `/login.html?redirect=${here}`;
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
