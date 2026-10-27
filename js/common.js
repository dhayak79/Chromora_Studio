const USER_KEY = "chromora:v1:users";
const SESSION_KEY = "chromora:v1:session";

function getAuthenticatedUser() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        if (!session || !session.userId || session.expiresAt <= Date.now()) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        const users = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
        if (!Array.isArray(users)) return null;

        return users.find(u => u.id === session.userId) || null;
    } catch (err) {
        return null;
    }
}
function getActiveUserId() {
    const user = getAuthenticatedUser();
    return user ? user.id : "user_guest_default";
}
window.getAuthenticatedUser = getAuthenticatedUser;
window.getActiveUserId = getActiveUserId;

function setupUserProfileUI() {
    const signInNav = document.getElementById("signInNav");
    const profileContainer = document.getElementById("profileMenuContainer");
    const avatarBtn = document.getElementById("profileAvatarBtn");
    const userNameDisplay = document.getElementById("dropdownUserName");
    

    const loggedInUser = getAuthenticatedUser();

    if (loggedInUser) {
        const firstName = loggedInUser.firstName || loggedInUser.email || "U";
        const fullName = `${loggedInUser.firstName || ""} ${loggedInUser.lastName || ""}`.trim() || loggedInUser.email;
        const firstLetter = firstName.charAt(0).toUpperCase();

        if (signInNav) signInNav.classList.add("hidden");
        if (profileContainer) profileContainer.classList.remove("hidden");
        if (avatarBtn) avatarBtn.textContent = firstLetter;
        if (userNameDisplay) userNameDisplay.textContent = fullName;
    } else {
        if (signInNav) signInNav.classList.remove("hidden");
        if (profileContainer) profileContainer.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupUserProfileUI();

    let avatarBtn = document.getElementById("profileAvatarBtn");
    let dropdown = document.getElementById("profileDropdown");
    let logoutBtn = document.getElementById("logoutBtn");

    console.log(avatarBtn,dropdown,logoutBtn);


    if (avatarBtn && dropdown) {
        avatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });
        dropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    window.addEventListener("click", () => {
        if (dropdown && !dropdown.classList.contains("hidden")) {
            dropdown.classList.add("hidden");
            console.log("hii");
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem(SESSION_KEY);
            window.location.href="signin.html";
            if (dropdown) dropdown.classList.add("hidden");
            setupUserProfileUI();
            showToast("Logged out successfully!");
        });
    }
});

window.addEventListener("pageshow", setupUserProfileUI);
(function initCustomDialogs() {
    function ensureDialogDOM() {
        let existing = document.getElementById("chromoraCustomDialog");
        if (existing) return existing;

        let overlay = document.createElement("div");
        overlay.id = "chromoraCustomDialog";
        overlay.className = "custom-dialog-overlay";
        overlay.innerHTML = `
            <div class="custom-dialog-card" role="dialog" aria-modal="true">
                <span class="custom-dialog-badge" id="cdBadge">CHROMORA STUDIO</span>
                <h3 class="custom-dialog-title" id="cdTitle">Title</h3>
                <p class="custom-dialog-message" id="cdMessage"></p>
                <div class="custom-dialog-swatches hidden" id="cdSwatches"></div>
                <input type="text" class="custom-dialog-input hidden" id="cdInput" autocomplete="off" />
                <div class="custom-dialog-actions">
                    <button type="button" class="custom-dialog-btn cancel-btn" id="cdCancelBtn">Cancel</button>
                    <button type="button" class="custom-dialog-btn confirm-btn" id="cdConfirmBtn">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    window.showCustomPrompt = function ({
        title = "Save Palette",
        message = "Enter a name for your palette:",
        defaultValue = "My Studio Palette",
        placeholder = "e.g., Sunset Pastel...",
        confirmText = "Save Palette",
        colors = []
    } = {}) {
        return new Promise((resolve) => {
            let overlay = ensureDialogDOM();
            let titleEl = overlay.querySelector("#cdTitle");
            let msgEl = overlay.querySelector("#cdMessage");
            let inputEl = overlay.querySelector("#cdInput");
            let swatchesEl = overlay.querySelector("#cdSwatches");
            let cancelBtn = overlay.querySelector("#cdCancelBtn");
            let confirmBtn = overlay.querySelector("#cdConfirmBtn");

            titleEl.textContent = title;
            msgEl.textContent = message;
            inputEl.value = defaultValue;
            inputEl.placeholder = placeholder;
            inputEl.classList.remove("hidden");

            confirmBtn.textContent = confirmText;
            confirmBtn.className = "custom-dialog-btn confirm-btn";

            if (Array.isArray(colors) && colors.length > 0) {
                swatchesEl.classList.remove("hidden");
                swatchesEl.style.gridTemplateColumns = `repeat(${colors.length}, 1fr)`;
                swatchesEl.innerHTML = colors
                    .map(c => `<span style="background:${c};" title="${c}"></span>`)
                    .join("");
            } else {
                swatchesEl.classList.add("hidden");
            }

            overlay.classList.add("is-visible");
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 60);

            function closeDialog(result) {
                overlay.classList.remove("is-visible");
                cleanup();
                resolve(result);
            }

            function onConfirm() {
                let val = inputEl.value.trim();
                closeDialog(val || null);
            }

            function onCancel() {
                closeDialog(null);
            }

            function onKeyDown(e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onConfirm();
                } else if (e.key === "Escape") {
                    onCancel();
                }
            }

            function onBackdropClick(e) {
                if (e.target === overlay) onCancel();
            }

            function cleanup() {
                confirmBtn.removeEventListener("click", onConfirm);
                cancelBtn.removeEventListener("click", onCancel);
                window.removeEventListener("keydown", onKeyDown);
                overlay.removeEventListener("click", onBackdropClick);
            }

            confirmBtn.addEventListener("click", onConfirm);
            cancelBtn.addEventListener("click", onCancel);
            window.addEventListener("keydown", onKeyDown);
            overlay.addEventListener("click", onBackdropClick);
        });
    };

    window.showCustomConfirm = function ({
        title = "Are you sure?",
        message = "Do you want to proceed with this action?",
        confirmText = "Confirm",
        cancelText = "Cancel",
        isDanger = false
    } = {}) {
        return new Promise((resolve) => {
            let overlay = ensureDialogDOM();
            let titleEl = overlay.querySelector("#cdTitle");
            let msgEl = overlay.querySelector("#cdMessage");
            let inputEl = overlay.querySelector("#cdInput");
            let swatchesEl = overlay.querySelector("#cdSwatches");
            let cancelBtn = overlay.querySelector("#cdCancelBtn");
            let confirmBtn = overlay.querySelector("#cdConfirmBtn");

            titleEl.textContent = title;
            msgEl.textContent = message;
            inputEl.classList.add("hidden");
            swatchesEl.classList.add("hidden");

            cancelBtn.textContent = cancelText;
            confirmBtn.textContent = confirmText;
            confirmBtn.className = `custom-dialog-btn ${isDanger ? "danger-btn" : "confirm-btn"}`;

            overlay.classList.add("is-visible");

            function closeDialog(result) {
                overlay.classList.remove("is-visible");
                cleanup();
                resolve(result);
            }

            function onConfirm() { closeDialog(true); }
            function onCancel() { closeDialog(false); }
            function onKeyDown(e) {
                if (e.key === "Enter") onConfirm();
                if (e.key === "Escape") onCancel();
            }
            function onBackdropClick(e) {
                if (e.target === overlay) onCancel();
            }

            function cleanup() {
                confirmBtn.removeEventListener("click", onConfirm);
                cancelBtn.removeEventListener("click", onCancel);
                window.removeEventListener("keydown", onKeyDown);
                overlay.removeEventListener("click", onBackdropClick);
            }

            confirmBtn.addEventListener("click", onConfirm);
            cancelBtn.addEventListener("click", onCancel);
            window.addEventListener("keydown", onKeyDown);
            overlay.addEventListener("click", onBackdropClick);
        });
    };
})();

// let savePaletteBtn = document.querySelector("#savePaletteBtn");

// if (savePaletteBtn) {
//     savePaletteBtn.addEventListener("click", () => {
//         let paletteName = prompt("Enter a name for your saved palette:", "My Studio Palette");
//         if (!paletteName) return;

//         let activeHarmonyType = document.querySelector(".hormoni-btn.is-active");
//         let type = "mono"; 
        
//         if (activeHarmonyType) {
//             if (activeHarmonyType.dataset.mono) type = "mono";
//             if (activeHarmonyType.dataset.analog) type = "analogus";
//             if (activeHarmonyType.dataset.complementary) type = "Complementary";
//             if (activeHarmonyType.dataset.triadic) type = "Triadic";
//             if (activeHarmonyType.dataset.split) type = "split-complementary";
//         }

//         let currentColors = shadeChanger(colorPicker.value, type);

//         if (!currentColors || currentColors.length === 0) {
//             showToast("No colors found to save!");
//             return;
//         }

//         let newSavedPalette = {
//             id: Date.now(),
//             name: paletteName,
//             category: type.toUpperCase(),
//             colors: currentColors,
//             date: new Date().toLocaleDateString()
//         };

//         // const activeUser = getAuthenticatedUser();
//         const userId = window.getActiveUserId ? window.getActiveUserId() : "user_guest_default";
//         console.log(userId);


//         let storageKey = `chromora_favorites_${userId}`;
//         let userFavorites = JSON.parse(localStorage.getItem(storageKey)) || [];
        
//         userFavorites.push(newSavedPalette);
//         localStorage.setItem(storageKey, JSON.stringify(userFavorites));

//         showToast(`Palette "${paletteName}" saved to your Favorites!`);
//     });
// }
