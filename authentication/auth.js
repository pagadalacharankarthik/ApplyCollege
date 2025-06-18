// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAA4UlGwN5oJRVJTv_J2AqkTqk7DACGGSo",
    authDomain: "ac-authentication-fcdee.firebaseapp.com",
    projectId: "ac-authentication-fcdee",
    storageBucket: "ac-authentication-fcdee.firebasestorage.app",
    messagingSenderId: "61840867992",
    appId: "1:61840867992:web:957a6bc506ddb9114906ed"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const signupContainer = document.getElementById('signup-container');
const signinContainer = document.getElementById('signin-container');
const dashboard = document.getElementById('dashboard');
const showSignin = document.getElementById('show-signin');
const showSignup = document.getElementById('show-signup');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const userEmailSpan = document.getElementById('user-email');
const rememberMe = document.getElementById('remember-me');
const userDataDiv = document.getElementById('user-data');

// Check Local Storage for Remembered User
function checkRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const user = JSON.parse(rememberedUser);
        document.getElementById('signin-email').value = user.email;
        document.getElementById('remember-me').checked = true;
    }
}

// Store User Data in Local Storage
function storeUserLocally(email, remember) {
    if (remember) {
        localStorage.setItem('rememberedUser', JSON.stringify({ email }));
    } else {
        localStorage.removeItem('rememberedUser');
    }
}

// Store User Data in Google Sheets via Apps Script
function storeUserInSheets(user, action) {
    const scriptUrl = 'YOUR_APPS_SCRIPT_URL';
    
    const data = {
        userId: user.uid,
        email: user.email,
        name: user.displayName || 'No name provided',
        action: action || 'login',
        timestamp: new Date().toISOString()
    };

    fetch(scriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => console.log('Data stored in Sheets:', data))
    .catch(error => console.error('Error:', error));
}

// Show Dashboard
function showDashboard(user) {
    signinContainer.style.display = 'none';
    signupContainer.style.display = 'none';
    dashboard.style.display = 'block';
    
    userNameSpan.textContent = user.displayName || 'User';
    userEmailSpan.textContent = user.email;

    // Load user data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                userDataDiv.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Your Information</h5>
                            <p class="card-text">Last login: ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                `;
            } else {
                // Create user document if doesn't exist
                db.collection('users').doc(user.uid).set({
                    email: user.email,
                    name: user.displayName || 'No name provided',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });
}

// Event Listeners
showSignin.addEventListener('click', (e) => {
    e.preventDefault();
    signupContainer.style.display = 'none';
    signinContainer.style.display = 'block';
});

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    signinContainer.style.display = 'none';
    signupContainer.style.display = 'block';
});

// Sign Up
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert('Registered successfully! You are now logged in.');
            storeUserInSheets(auth.currentUser, 'signup');
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then(() => {
            showDashboard(auth.currentUser);
        })
        .catch(error => {
            alert(`Registration error: ${error.message}`);
        });
});

// Sign In
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const remember = rememberMe.checked;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            storeUserLocally(email, remember);
            storeUserInSheets(user, 'login');
            showDashboard(user);
            alert(`Welcome back, ${user.displayName || 'User'}!`);
        })
        .catch(error => {
            alert(`Login error: ${error.message}`);
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            storeUserInSheets(auth.currentUser, 'logout');
            signinContainer.style.display = 'none';
            signupContainer.style.display = 'block';
            dashboard.style.display = 'none';
        })
        .catch(error => {
            console.error("Logout error:", error);
        });
});

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        showDashboard(user);
    } else {
        checkRememberedUser();
        signinContainer.style.display = 'none';
        signupContainer.style.display = 'block';
        dashboard.style.display = 'none';
    }
});

// Initialize
checkRememberedUser();