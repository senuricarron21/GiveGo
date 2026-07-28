// Firebase Configuration and Initialization Module
const firebaseConfig = {
    apiKey: "AIzaSyBy8_Ic4K9OEPV6P6aKdm0w95A3qvLFudE",
    authDomain: "gooo-f7771.firebaseapp.com",
    projectId: "gooo-f7771",
    storageBucket: "gooo-f7771.firebasestorage.app",
    messagingSenderId: "853663855517",
    appId: "1:853663855517:web:c4e68b2d4030e2ca29b574",
    measurementId: "G-D1F4W7LJZX"
};

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            window.firebaseHelper = {
                auth: () => firebase.auth(),
                db: () => firebase.firestore(),
                storage: () => firebase.storage(),
                analytics: () => (firebase.analytics ? firebase.analytics() : null)
            };
            return true;
        } catch (err) {
            console.error("Firebase init error: ", err);
        }
    }
    return false;
}

// Initial attempt on script load
initFirebase();

// Fail-safe accessor function
window.getFirebaseHelper = function() {
    if (!window.firebaseHelper) {
        initFirebase();
    }
    return window.firebaseHelper || null;
};

console.log("Firebase Helper module initialized.");
