import { onClickHomeMenu, onClickSignoutMenu } from "./controller/menueventhandlers.js";
import { attachAuthStateChangeObserver } from "./controller/firebase_auth.js";
import { routing } from "./controller/route_controller.js";

// Function to attach menu button event handlers
function attachMenuButtonEventHandlers() {
    document.getElementById('menu-home').addEventListener('click', onClickHomeMenu);
    // document.getElementById('Filter-menu').addEventListener('click', onClickFilterMenu);
    document.getElementById('menu-signout').addEventListener('click', onClickSignoutMenu);
}

// Initial setup function
function initialSetup() {
    // Attach menu button event handlers
    attachMenuButtonEventHandlers();

    // Attach observer for authentication state changes
    attachAuthStateChangeObserver();

    // Handle initial routing based on current URL
    handleRouting();
}

// Function to handle routing
function handleRouting() {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    console.log(`${pathname} ${hash}`);
    routing(pathname, hash);
}

// Window onload event
window.onload = function(e) {
    initialSetup();
};

// Window onpopstate event for handling browser navigation
window.onpopstate = function(e) {
    // Prevent the default browser behavior to ensure our routing function handles navigation
    e.preventDefault();
    handleRouting();
};
