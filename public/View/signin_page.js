import { root } from "./elements.js";
import { signinFirebase, registerFirebase, resetPassword } from "../controller/firebase_auth.js";

export async function ShowsigninPage() {
    const response = await fetch('/view/templates/signin_page_template.html', { cache: 'no-store' });
    const divWrapper = document.createElement('div');
    divWrapper.style.width = "400px";
    divWrapper.classList.add('m-4', 'p-4');
    divWrapper.innerHTML = await response.text();

    // Attach the forms and signup prompt after the content is loaded
    setupFormEventHandlers(divWrapper);

    root.innerHTML = '';
    root.classList.add('d-flex', 'justify-content-center', 'align-items-center');
    root.appendChild(divWrapper);
}

function setupFormEventHandlers(containerElement) {
    const signinForm = containerElement.querySelector('#signinForm');
    const registrationForm = containerElement.querySelector('#registrationForm');
    const passwordResetForm = containerElement.querySelector('#passwordResetForm');
    const signupPrompt = containerElement.querySelector('#signupPrompt');
    const passwordResetPrompt = containerElement.querySelector('#ForgotPass');

    // Handle signin form submission
    if (signinForm) {
        signinForm.onsubmit = signinFirebase;
    }

    // Handle registration form submission
    if (registrationForm) {
        registrationForm.onsubmit = async (e) => {
            e.preventDefault(); // Prevent the default form submission
            const email = e.target.email.value; // Get the email from the form
            const password = e.target.password.value; // Get the password from the form

            // Regular expressions for password validation
        const uppercaseRegex = /[A-Z]/;
        const numericRegex = /[0-9]/;
        const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

        // Validation checks
        if (!uppercaseRegex.test(password)) {
            alert("Password must contain at least one uppercase letter.");
            return;
        }
        if (!numericRegex.test(password)) {
            alert("Password must contain at least one numeric value.");
            return;
        }
        if (!specialCharRegex.test(password)) {
            alert("Password must contain at least one special character.");
            return;
        }
            
            try {
                await registerFirebase(email, password); // Call the registration function
                alert("Registration successful. Please log in."); // Inform the user
                // Toggle visibility after successful registration
                registrationForm.style.display = 'none'; // Hide registration form
                signinForm.style.display = 'block'; // Show sign-in form
                signupPrompt.style.display = 'block'; // Show signup prompt again
                passwordResetPrompt.style.display = 'none';
            } catch (error) {
                console.error("Registration failed:", error);
                alert("Registration failed: " + error.message); // Display an error message to the user
            }
        };
    }

    // Toggle between signin and registration forms on signup prompt click
    if (signupPrompt) {
        signupPrompt.addEventListener('click', () => {
            signinForm.style.display = 'none'; // Hide sign-in form
            registrationForm.style.display = 'block'; // Show registration form
            signupPrompt.style.display = 'none'; // Hide signup prompt
            passwordResetForm.style.display = 'none'; // Hide password reset form

            // Add this line to ensure password reset prompt is hidden
            if (passwordResetPrompt) {
                passwordResetPrompt.style.display = 'none';
            }
        });
    }

    // Handle password reset form submission
    if (passwordResetForm) {
        passwordResetForm.onsubmit = async (e) => {
            e.preventDefault(); // Prevent the default form submission
            const email = e.target.email.value; // Get the email from the form
            try {
                await resetPassword(email); // Send the password reset email
                console.log('Password reset email sent successfully');
                // Optionally, update the UI or show a message
                passwordResetForm.style.display = 'none'; // Hide password reset form
                signinForm.style.display = 'block';
                signupPrompt.style.display = 'block';
                passwordResetPrompt.style.display = 'block'; // Show sign-in form again
            } catch (error) {
                console.error("Failed to send password reset email:", error);
                // Display an error message
            }
        };
    }

    // Toggle visibility to show password reset form when "Forgot Password" is clicked
    if (passwordResetPrompt) {
        passwordResetPrompt.addEventListener('click', () => {
            signinForm.style.display = 'none'; // Hide sign-in form
            passwordResetForm.style.display = 'block'; // Show password reset form
            if (signupPrompt) {
                signupPrompt.style.display = 'none'; // Ensure signup prompt is hidden
            }
            passwordResetPrompt.style.display = 'none';
            // Optionally, reset any form inputs or states
        });
    }
}
