const USER_KEY = "chromora:v1:users";
const SESSION_KEY = "chromora:v1:session";

const HASH_ITERATIONS = 600000;
const HASH_LENGTH = 256;


// STORAGE HELPERS

function readUsers() {
    try {
        const data = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
        return data.filter(user =>
            user &&
            typeof user.id === "string" &&
            typeof user.email === "string" &&
            typeof user.passwordHash === "string" &&
            typeof user.salt === "string"
        );
    } catch (error) {
        console.error("Unable to read account data:", error);
        return [];
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(users));
        return true;
    } catch (error) {
        console.error("Unable to save account data:", error);
        return false;
    }
}


// PASSWORD HASHING
function generateSalt() {
    return crypto.randomUUID();
}

async function hashPassword(password, salt) {
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const result = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode(salt),
            iterations: HASH_ITERATIONS,
            hash: "SHA-256"
        },
        key,
        HASH_LENGTH
    );

    return btoa(
        String.fromCharCode(...new Uint8Array(result))
    );
}

function hashesMatch(first, second) {
    return first === second;
}

// SESSION MANAGEMENT

function createSession(userId) {
    const session = {
        userId,
        sessionId: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    try {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );

        return true;
    } catch (error) {
        console.error("Unable to create session:", error);
        return false;
    }
}

function getCurrentUser() {
    try {
        const session = JSON.parse(
            localStorage.getItem(SESSION_KEY) || "null"
        );

        if (
            !session ||
            typeof session.userId !== "string" ||
            typeof session.sessionId !== "string" ||
            !Number.isFinite(session.expiresAt) ||
            session.expiresAt <= Date.now()
        ) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return readUsers().find(user =>
            user.id === session.userId
        ) || null;

    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

function signOut() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "signin.html";
}

// FORM MESSAGE HELPERS


function showMessage(element, message, type = "error") {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.dataset.type = type;
    element.hidden = false;
}

function clearMessage(element) {
    if (!element) {
        return;
    }

    element.textContent = "";
    element.hidden = true;
    delete element.dataset.type;
}


// VALIDATION


function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}


// SIGN-UP


async function handleSignup(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const firstName = form.querySelector("#first-name");
    const lastName = form.querySelector("#last-name");
    const emailInput = form.querySelector("#email");
    const passwordInput = form.querySelector("#password");
    const confirmInput = form.querySelector("#confirm-password");

    const message = form.querySelector("#auth-message");
    const submitButton = form.querySelector('[type="submit"]');

    if (
        !firstName ||
        !lastName ||
        !emailInput ||
        !passwordInput ||
        !confirmInput
    ) {
        showMessage(message, "Some required form fields are missing.");
        return;
    }

    const first = firstName.value.trim();
    const last = lastName.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmation = confirmInput.value;

    clearMessage(message);

    if (!first || !last || !email || !password || !confirmation) {
        showMessage(message, "Please complete all required fields.");
        return;
    }

    if (!validateEmail(email)) {
        showMessage(message, "Please enter a valid email address.");
        return;
    }

    if (!validatePassword(password)) {
        showMessage(message, "Your password is week");
        return;
    }

    if (password !== confirmation) {
        showMessage(message, "Your passwords do not match.");
        return;
    }

    if (!crypto.subtle || !crypto.randomUUID) {
        showMessage(
            message,
            "Secure browser features are unavailable. Open this page through localhost or HTTPS."
        );
        return;
    }
    try {
        const users = readUsers();

        if (users.some(user => user.email === email)) {
            showMessage(
                message,
                "An account with this email already exists."
            );
            return;
        }

        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        // Check again in case another submission occurred while hashing.
        const latestUsers = readUsers();

        if (latestUsers.some(user => user.email === email)) {
            showMessage(
                message,
                "An account with this email already exists."
            );
            return;
        }

        const newUser = {
            id: crypto.randomUUID(),
            firstName: first,
            lastName: last,
            email,
            salt,
            passwordHash,
            createdAt: new Date().toISOString()
        };

        if (!saveUsers([...latestUsers, newUser])) {
            showMessage(
                message,
                "Your account could not be saved. Check browser storage."
            );
            return;
        }

        if (!createSession(newUser.id)) {
            showMessage(
                message,
                "Your account was created, but the session could not be saved. Please sign in."
            );
            return;
        }

        showMessage(message, "Account created successfully!", "success");

        window.location.href = "index.html";

    } catch (error) {
        console.error("Sign-up failed:", error);

        showMessage(
            message,
            "Something went wrong while creating your account."
        );
    }
}


// SIGN-IN


async function handleSignin(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const emailInput = form.querySelector("#email");
    const passwordInput = form.querySelector("#password");

    const message = form.querySelector("#auth-message");
    const submitButton = form.querySelector('[type="submit"]');

    if (!emailInput || !passwordInput) {
        showMessage(message, "Some required form fields are missing.");
        return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    clearMessage(message);

    if (!email || !password) {
        showMessage(message, "Enter your email and password.");
        return;
    }

    if (!validateEmail(email)) {
        showMessage(message, "Please enter a valid email address.");
        return;
    }

    if (!crypto.subtle || !crypto.randomUUID) {
        showMessage(
            message,
            "Secure browser features are unavailable. Open this page through localhost or HTTPS."
        );
        return;
    }


    try {
        const users = readUsers();
        const user = users.find(account => account.email === email);

        if (!user) {
            showMessage(message, "Email or password is incorrect.");
            return;
        }

        const enteredHash = await hashPassword(
            password,
            user.salt
        );

        if (!hashesMatch(enteredHash, user.passwordHash)) {
            showMessage(message, "Email or password is incorrect.");
            return;
        }

        if (!createSession(user.id)) {
            showMessage(message, "Could not create your session. Please try again.");
            return;
        }

        showMessage(message, "Signed in successfully!", "success");

        window.location.href = "index.html";

    } catch (error) {
        console.error("Sign-in failed:", error);

        showMessage(message, "Something went wrong while signing in.");
    }
}

// PASSWORD VISIBILITY

function initializePasswordToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.togglePassword;
            const input = document.getElementById(targetId);

            if (!input) {
                return;
            }

            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";
            if(input.type=="text")
            {
                button.innerHTML="";
                button.innerHTML=`<i class="bi bi-eye-slash-fill"></i>`
            }
            else{
                button.innerHTML="";
                button.innerHTML=`<i class="bi bi-eye-fill" aria-hidden="true"></i>`
            }
        });
    });
}

// INITIALIZE THE CURRENT PAGE


document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.querySelector("#signup-form");
    const signinForm = document.querySelector("#signin-form");

    initializePasswordToggles();

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }

    if (signinForm) {
        signinForm.addEventListener("submit", handleSignin);
    }
});