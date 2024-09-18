import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    onAuthStateChanged, sendPasswordResetEmail ,signOut,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { app } from "./firebase_core.js";
import { DEV } from "../model/constants.js";
// import { homePageView } from "../view/home_page.js";
import { ShowsigninPage } from "../view/signin_page.js";
import { routePathnames, routing } from "./route_controller.js";
import { userInfo } from "../view/elements.js";

export const auth = getAuth(app);
export let currentUser = null;


export async function signinFirebase(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        //  const user = userCredential.user;

    } catch (error) {
        if (DEV) console.log('signin error: ', error);
        const errorCode = error.code;
        const errorMessage = error.message;
        alert('Signin Error: ' + errorCode + ' ' + errorMessage);

    }
}

export function attachAuthStateChangeObserver() {
    onAuthStateChanged(auth, authStateChangeListener);

}

function authStateChangeListener(user) {
    currentUser = user;
    if (user) {
        userInfo.textContent = user.email;
        const postAuth = document.getElementsByClassName('myclass-postauth');
        for (let i = 0; i < postAuth.length; i++) {
            postAuth[i].classList.replace('d-none', 'd-block');
        }
        const preAuth = document.getElementsByClassName('myclass-preauth');
        for (let i = 0; i < preAuth.length; i++) {
            preAuth[i].classList('d-block', 'd-none');
        }
        const pathname = window.location.pathname;
        const hash = window.location.hash;
        routing(pathname, hash);
    } else {
        userInfo.textContent = 'No User';
        const postAuth = document.getElementsByClassName('myclass-postauth');
        for (let i = 0; i < postAuth.length; i++) {
            postAuth[i].classList.replace('d-block', 'd-none');
        }
        const preAuth = document.getElementsByClassName('myclass-preauth');
        for (let i = 0; i < preAuth.length; i++) {
            preAuth[i].classList('d-none', 'd-block');
        }
        history.pushState(null, null, routePathnames.HOME);
        ShowsigninPage();
    }
}

export async function registerFirebase(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        signOut(auth);
        console.log("User registered successfully:", userCredential.user);
        // Optionally, redirect the user or perform other actions upon successful registration

    } catch (error) {
        if (DEV) console.log('Registration error: ', error);
        const errorCode = error.code;
        const errorMessage = error.message;
        alert('Registration Error: ' + errorCode + ' ' + errorMessage);
    }
}

export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent successfully. Please check your inbox.');
    } catch (error) {
        if (DEV) console.log('Password reset error: ', error);
        const errorCode = error.code;
        const errorMessage = error.message;
        alert('Password Reset Error: ' + errorCode + ' ' + errorMessage);
    }
}

export async function signOutFirebase() {
    await signOut(auth);

}