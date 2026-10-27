import { colord, extend } from "colord";
import harmonies from "colord/plugins/harmonies";
import a11y from "colord/plugins/a11y";

extend([harmonies, a11y]);
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

const userId = getActiveUserId() ? getActiveUserId() : "user_guest_default";
console.log(userId);
const storageKey = `chromora_favorites_${userId}`;

let grid = document.getElementById("palette-grid");
let paletteSearch = document.getElementById("palette-search");
let explorerCount = document.querySelector(".explorer-count");
let emptyState = document.querySelector("#empty-state");
let toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function readableOn(hex) {
    let contrastWithDark = colord(hex).contrast("#1F1D2B");
    let contrastWithWhite = colord(hex).contrast("#FFFFFF");
    return contrastWithDark >= contrastWithWhite;
}


function readFavorites() {
    try {
        let data = JSON.parse(localStorage.getItem(storageKey) || "[]");
        console.log("hello",data)

        if (!Array.isArray(data)) {
            return [];
        }

        return data.filter(pal =>
            pal &&
            typeof pal.name === "string" &&
            Array.isArray(pal.colors) &&
            pal.colors.length > 0 &&
            pal.colors.every(hex => colord(hex).isValid())
        );
    } catch (err) {
        console.error("Could not read saved palettes:", err);
        return [];
    }
}

function writeFavorites(list) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(list));
        return true;
    } catch (err) {
        console.error("Could not save palettes:", err);
        return false;
    }
}


function buildCard(palette) {
    let card = document.createElement("section");
    card.className = "palette-card glass-card";

    let strip = document.createElement("section");
    strip.className = "swatch-strip";

    palette.colors.forEach(hex => {
        let swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = "swatch";
        swatch.style.backgroundColor = hex;

        swatch.addEventListener("mouseenter", () => {
            swatch.style.color = readableOn(hex) ? '#00000057' : '#ffffff95';
        });
        swatch.addEventListener("mouseleave", () => {
            swatch.style.color = '';
        });

        swatch.textContent = hex;
        swatch.addEventListener("click", () => copyText(hex));
        strip.append(swatch);
    });

    let data = document.createElement("div");
    data.className = "card-data";
    data.innerHTML = "<h3></h3><span></span>";
    data.querySelector("h3").textContent = palette.name;
    data.querySelector("span").textContent = palette.date || palette.category || "Saved";
    const colorsParam = palette.colors.map(c => c.slice(1)).join(",");
    const link = document.createElement("a");
    link.className = "open-link1";
    link.href = `index.html?colors=${colorsParam}`;
    link.innerHTML = `Open in Studio <i class="bi bi-upload"></i>`;

    // card.append(strip, data, );

    let removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "hormoni-btn";
    // removeBtn.style.margin = "0 6px";
    removeBtn.innerHTML = 'Remove<i class="bi bi-trash3"></i>';
    removeBtn.addEventListener("click", () => removePalette(palette));

    card.append(strip, data, removeBtn,link);
    return card;
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${text}`);
    } catch (err) {
        showToast("Copy blocked by the browser. Select the colour manually.");
    }
}

async function removePalette(palette) {
    const confirmed = await window.showCustomConfirm({
    title: "Delete Saved Palette?",
    message: "This palette will be permanently removed from your Favorites.",
    confirmText: "Delete",
    cancelText: "Keep It",
    isDanger: true
});
    if (!confirmed) {
        return;
    }

    let remaining = readFavorites().filter(pal => pal.id !== palette.id);

    if (!writeFavorites(remaining)) {
        showToast("Could not remove the palette. Check browser storage.");
        return;
    }

    renderFavorites();
    showToast(`Removed "${palette.name}"`);
}

function showEmptyMessage(hasAnySaved) {
    if (!emptyState) return;

    emptyState.textContent = "";

    if (hasAnySaved) {
        emptyState.textContent = "No saved palettes match that search.";
        return;
    }

    emptyState.append("You have not saved any palettes yet. ");

    let link = document.createElement("a");
    link.href = "index.html";
    link.textContent = "Open the Studio";
    emptyState.append(link, " and press Save Palette.");
}

function renderFavorites() {
    let userFavorites = readFavorites();

    let term = paletteSearch ? paletteSearch.value.trim().toLowerCase() : "";
    let filtered = userFavorites.filter(pal =>
        pal.name.toLowerCase().includes(term)
    );

    if (grid) {
        grid.replaceChildren(...filtered.map(buildCard));
    }

    if (explorerCount) {
        explorerCount.textContent = `${filtered.length} of ${userFavorites.length} saved palettes`;
    }

    if (emptyState) {
        emptyState.hidden = filtered.length > 0;

        if (filtered.length === 0) {
            showEmptyMessage(userFavorites.length > 0);
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();

    if (paletteSearch) {
        paletteSearch.addEventListener("input", renderFavorites);
    }

    // If you save a palette in another tab, this page updates too
    window.addEventListener("storage", (event) => {
        if (event.key === storageKey) {
            renderFavorites();
        }
    });
});
let headNav = document.querySelectorAll(".head-nav");
// console.log(headNav);
headNav.forEach((button) => 
{
    console.log(button);
    button.addEventListener("click",(event)=>
    {
        headNav.forEach((other) => {
            other.classList.remove("is-active");
        })
        button.classList.add("is-active");
    })
})
function updateActiveNav() {
    let currentPath = window.location.pathname.split("/").pop() || "index.html";
    let headNav = document.querySelectorAll(".head-nav");
    console.log(headNav);
    headNav.forEach((link) => {
        console.log(link);
        let linkHref = link.getAttribute("href");
        // console.log(linkHref);
        let linkPath = linkHref ? linkHref.split("/").pop() : "";
        // console.log(linkPath);
        if (linkPath === currentPath) {
            console.log(linkPath);
            link.classList.add("is-active");
        } else {
            link.classList.remove("is-active");
        }
    });
}
document.addEventListener("DOMContentLoaded", updateActiveNav);
window.addEventListener("pageshow", updateActiveNav);


// function getAuthenticatedUser() {
//     try {
//         const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
//         if (!session || !session.userId || session.expiresAt <= Date.now()) {
//             localStorage.removeItem(SESSION_KEY);
//             return null;
//         }
//         const users = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
//         if (!Array.isArray(users)) return null;

//         return users.find(u => u.id === session.userId) || null;
//     } catch (err) {
//         return null;
//     }
// }

// function setupUserProfileUI() {
//     const signInNav = document.getElementById("signInNav");
//     const profileContainer = document.getElementById("profileMenuContainer");
//     const avatarBtn = document.getElementById("profileAvatarBtn");
//     const dropdown = document.getElementById("profileDropdown");
//     const userNameDisplay = document.getElementById("dropdownUserName");
//     const logoutBtn = document.getElementById("logoutBtn");

//     const loggedInUser = getAuthenticatedUser();

//     if (loggedInUser) {
//         const firstName = loggedInUser.firstName || loggedInUser.email || "U";
//         const fullName = `${loggedInUser.firstName || ""} ${loggedInUser.lastName || ""}`.trim() || loggedInUser.email;
//         const firstLetter = firstName.charAt(0).toUpperCase();

//         if (signInNav) signInNav.classList.add("hidden");
//         if (profileContainer) profileContainer.classList.remove("hidden");
//         if (avatarBtn) avatarBtn.textContent = firstLetter;
//         if (userNameDisplay) userNameDisplay.textContent = fullName;
//     } else {
//         if (signInNav) signInNav.classList.remove("hidden");
//         if (profileContainer) profileContainer.classList.add("hidden");
//     }
// }

// document.addEventListener("DOMContentLoaded", () => {
//     setupUserProfileUI();

//     const avatarBtn = document.getElementById("profileAvatarBtn");
//     const dropdown = document.getElementById("profileDropdown");
//     const logoutBtn = document.getElementById("logoutBtn");

//     if (avatarBtn && dropdown) {
//         avatarBtn.addEventListener("click", (e) => {
//             e.stopPropagation();
//             dropdown.classList.toggle("hidden");
//         });
//     }

//     avatarBtn.addEventListener("click", () => {
//         if (dropdown && !dropdown.classList.contains("hidden")) {
//             dropdown.classList.add("hidden");
//         }
//     });

//     if (logoutBtn) {
//         logoutBtn.addEventListener("click", () => {
//             localStorage.removeItem(SESSION_KEY);
//             if (dropdown) dropdown.classList.add("hidden");
//             setupUserProfileUI();
//             showToast("Logged out successfully!");
//         });
//     }
// });

// window.addEventListener("pageshow", setupUserProfileUI);

let savePaletteBtn = document.querySelector("#savePaletteBtn");

if (savePaletteBtn) {
    savePaletteBtn.addEventListener("click", () => {
        let paletteName = prompt("Enter a name for your saved palette:", "My Studio Palette");
        if (!paletteName) return;

        let activeHarmonyType = document.querySelector(".hormoni-btn.is-active");
        let type = "mono"; 
        
        if (activeHarmonyType) {
            if (activeHarmonyType.dataset.mono) type = "mono";
            if (activeHarmonyType.dataset.analog) type = "analogus";
            if (activeHarmonyType.dataset.complementary) type = "Complementary";
            if (activeHarmonyType.dataset.triadic) type = "Triadic";
            if (activeHarmonyType.dataset.split) type = "split-complementary";
        }

        let currentColors = shadeChanger(colorPicker.value, type);

        if (!currentColors || currentColors.length === 0) {
            showToast("No colors found to save!");
            return;
        }

        let newSavedPalette = {
            id: Date.now(),
            name: paletteName,
            category: type.toUpperCase(),
            colors: currentColors,
            date: new Date().toLocaleDateString()
        };

        let userId = window.getActiveUserId ? window.getActiveUserId() : "user_guest_default";


        let storageKey = `chromora_favorites_${userId}`;
        let userFavorites = [];
        try {
            userFavorites = JSON.parse(localStorage.getItem(storageKey)) || [];
        } catch (e) {
            userFavorites = [];
        }
                
        userFavorites.push(newSavedPalette);
        localStorage.setItem(storageKey, JSON.stringify(userFavorites));

        showToast(`Palette "${paletteName}" saved to your Favorites!`);
    });
}