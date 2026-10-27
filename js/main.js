import { colord, extend } from "colord";
import harmonies from "colord/plugins/harmonies";
import a11y from "colord/plugins/a11y";

extend([harmonies, a11y]);
function describeColor(hex)
{
    let color = colord(hex);
    return {
        hex: color.toHex(),
        rgb: color.toRgbString(),
        hsl: color.toHslString()
    };
}
let hexValue = document.querySelector("#hex-value");
let rgbValue = document.querySelector("#rgb-value");
let hslValue = document.querySelector("#hsl-value");
let colorInput = document.querySelector("#color-input");
let colorShower = document.querySelector(".color-show-container");

function isUserLoggedIn() {
    if (typeof window.getActiveUserId === "function") {
        let uid = window.getActiveUserId();
        if (uid && uid !== "user_guest_default") return true;
    }
    let profileMenu = document.getElementById("profileMenuContainer");
    if (profileMenu && !profileMenu.classList.contains("hidden")) {
        return true;
    }
    return false;
}
 
let harmonyButtons = document.querySelectorAll(".hormoni-btn");
function showColor(hex) {
    let info = describeColor(hex);
    // console.log(info);
    colorShower.style.backgroundColor = info.hex;
    // colorInput.value = info.hex;
    hexValue.textContent = info.hex;
    rgbValue.textContent = info.rgb;
    hslValue.textContent = info.hsl;
}
function createEl(tagName,className,toAdd)
{
    let tag = document.createElement(tagName);
    tag.classList.add(className);
   
    toAdd.append(tag);
    return tag;
}

let colorPicker = document.querySelector("#color-picker");
function shadeChanger(hexColor,type)
{
    let base = colord(hexColor);
    // console.log()
    if(type=="mono")
    {
        let monochromatic = [
            base.lighten(0.303).toHex(), 
            base.lighten(0.12).toHex(),
            base.toHex(),              
            base.darken(0.15).toHex(),
            base.darken(0.3).toHex()
        ];
        return monochromatic;
    }
    if(type=="analogus")
    {
        let analogous = base.harmonies("analogous").map(color => color.toHex());
        // console.log(analogous);
        return analogous;
    }
    if(type=="Complementary")
    {
        let complementary = base.harmonies("complementary").map(color => color.toHex());
        // console.log(complementary);
        return complementary;
    }
    if(type=="Triadic")
    {
        let triadic = base.harmonies("triadic").map(color => color.toHex());
        // console.log(complementary);
        return triadic;
    }
    if(type=="split-complementary")
    {
        let split = base.harmonies("split-complementary").map(color => color.toHex());
        // console.log(complementary);
        return split;
    }
    // return "";
}

function readableOn(hex)
{
    let contrastWithDark = colord(hex).contrast("#1F1D2B");
    let contrastWithWhite = colord(hex).contrast("#FFFFFF");
    return contrastWithDark>=contrastWithWhite ? true : false;
}
function colorShadeProducer(hexColor)
{
    let base = colord(hexColor);
    let monochromatic = [
            base.lighten(0.3).toHex(), 
            base.lighten(0.15).toHex(),
            
            base.toHex(), 
            
            base.darken(0.15).toHex(),
            base.darken(0.3).toHex()
        ];
    return monochromatic;
}
let currentDisplayedColors = [];
let liveSyncTimer;

function triggerLiveUpdateIndicator() {
    const pill = document.getElementById("liveStatusPill");
    const statusText = document.getElementById("liveStatusText");
    const previewPage = document.getElementById("preview-page");

    if (!pill || !statusText) return;

    pill.classList.add("is-updating");
    statusText.textContent = "SYNCING SHADES...";
    if (previewPage) previewPage.classList.add("preview-flash");

    clearTimeout(liveSyncTimer);
    liveSyncTimer = setTimeout(() => {
        pill.classList.remove("is-updating");
        statusText.textContent = "LIVE SYNC";
        if (previewPage) previewPage.classList.remove("preview-flash");
    }, 550);
}
function updateLivePreviewFromPalette(colorsArray, clickedColor = null){
    let previewContainer = document.querySelector(".live-preview");
    if (!previewContainer || !colorsArray || colorsArray.length === 0) return;
    let c5 = clickedColor || colorsArray[0];
    let c2 = colorsArray[1 % colorsArray.length];
    let c3 = colorsArray[2 % colorsArray.length];
    let c4 = colorsArray[3 % colorsArray.length];
    let c1 = colorsArray[4 % colorsArray.length];

    previewContainer.style.setProperty("--preview-accent", c1);
    previewContainer.style.setProperty("--preview-secondary", c2);
    previewContainer.style.setProperty("--preview-blue", c3);
    previewContainer.style.setProperty("--preview-c4", c4);
    previewContainer.style.setProperty("--preview-c5", c5);

    previewContainer.style.setProperty("--preview-on-accent", readableOn(c1) ? "#17172b" : "#ffffff");
    previewContainer.style.setProperty("--preview-on-secondary", readableOn(c2) ? "#17172b" : "#ffffff");

    triggerLiveUpdateIndicator();
}


function changedShadeShower(type)
{
    let shadeCont = document.querySelector(".color-shade-cont");
    let shadeCont1 = document.querySelector(".color-shade-cont1");
    // console.log(shadeCont)
    // let shades1 = colorShadeProducer(colorPicker.value);
    let shades=shadeChanger(colorPicker.value,type);
    currentDisplayedColors = [...shades];
    // console.log()
    // console.log("hii",shades)
    updateLivePreviewFromPalette(currentDisplayedColors);
    shadeCont1.style.gridTemplateColumns = `repeat(${shades.length}, 1fr)`;
    shadeCont.style.gridTemplateColumns = `repeat(${shades.length}, 1fr)`;
    shadeCont.innerHTML = "";
    shadeCont1.innerHTML = "";
    // let flag =true;
    shades.forEach((color,index)=>
    {
        // console.log(color);
        let colorBox = createEl("div","box",shadeCont);
        colorBox.style.cursor="pointer";
        colorBox.style.backgroundColor = color;
        colorBox.dataset.currentColor = color;
        
        
        colorBox.addEventListener("dblclick", () => {
            copyToClipBoard(colorBox.dataset.currentColor);
            updateLivePreviewFromPalette(currentDisplayedColors, colorBox.dataset.currentColor);
        });
        colorBox.addEventListener("click", () => {
            updateLivePreviewFromPalette(currentDisplayedColors, colorBox.dataset.currentColor);
        });
        let innerColorBox = createEl("div","inner-box",shadeCont1);
        let shades1 = colorShadeProducer(color);
        shades1.forEach(color1=>
        {
            
            let colorbox = createEl("div","box2",innerColorBox);
            colorbox.style.backgroundColor = color1;
            colorbox.textContent = color1;
            colorbox.addEventListener("mouseenter",()=>
            {
                // console.log(color1);
                if(readableOn(color1))
                {
                    colorbox.style.color = '#0000007e';
                }
                else{
                    colorbox.style.color = '#ffffff95';
                }
            })
            colorbox.addEventListener("mouseleave",()=>
            {
                colorbox.style.color = '';
            })
            colorbox.addEventListener("click",()=>
            {
                colorBox.style.backgroundColor=color1;
                colorBox.dataset.currentColor = color1;
                shades[index] = color1;
                currentDisplayedColors[index] = color1;
                updateLivePreviewFromPalette(currentDisplayedColors);
                copyToClipBoard(color1);
                   
            
        }
        )
        
    }   
)
    
    
   
})
console.log(shades);
return shades;
}

function pickerEvent(type){
    colorPicker.addEventListener("input", () => 
        {
            // console.log(colorPicker.value);
            colorInput.value = colorPicker.value;
            showColor(colorPicker.value)
            changedShadeShower(type)
            // colorShadeProducer(colorPicker.value)
            
            
        });
    
    colorInput.addEventListener("input", () => 
        {
            // console.log(colorInput.value);
            showColor(colorInput.value);
            colorPicker.value = colorInput.value;
            changedShadeShower(type)
            // colorShadeProducer(colorInput.value);
        }); 
 
}


let container = document.querySelector(".color-picker-out-container");
 

// const glow = document.querySelector('.mouse-glow');

document.addEventListener('DOMContentLoaded', () => {
    const glow = document.querySelector('.mouse-glow');

    if (glow) {
        window.addEventListener('mousemove', (e) => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        });
    }
});


// console.log(shadeGrid);

// console.log(shadeGrid);
// function shadeChanger(hexColor)
// {
//     let base = colord(hexColor);
//     let deepBase = base.darken(0.2).toHex();
//     let exactComplement = base.harmonies("complementary")[1].toHex();
//     let softComplement = base.harmonies("complementary")[1].lighten(0.01).saturate(0.072).toHex();
//     // let complementaryColors = colorObj.harmonies("complementary").map(c => c.toHex());
//     console.log({
//         original: base.toHex(),
//         deepBase: deepBase,
//         complementary: exactComplement,
//         softComplement: softComplement
//     });
// }

async function copyToClipBoard(text)
{
    try{
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${text}`);
        console.log(`Copied: ${text}`);
    }
    catch(err)
    {
        console.error("Could not copy to clipboard : ",err);
    }
}
[hexValue,rgbValue,hslValue].forEach((ele)=>
{
    ele.style.cursor="pointer";
    ele.title="Click to copy";
    ele.addEventListener("click",()=>
    {
        copyToClipBoard(ele.textContent);
    })
})
// #961d1d
// console.log(harmonyButtons);
document.addEventListener("DOMContentLoaded",()=>
{
    pickerEvent("mono");
    changedShadeShower("mono");
    showColor(colorPicker.value);
    harmonyButtons[0].classList.add("is-active");
})
harmonyButtons.forEach((button) => {
    // console.log(harmonyButtons[4].dataset.split);

    button.addEventListener("click", (event) => {
        // console.log(event.target);
        harmonyButtons.forEach((other) => {
            // console.log(other.dataset.mono);
            
            if(event.target.dataset.mono=="Monochromatic")
            {
                pickerEvent("mono");
                changedShadeShower("mono");
                showColor(colorPicker.value);

            }
            if(event.target.dataset.analog=="Analogous")
            {
                pickerEvent("analogus")
                changedShadeShower("analogus");
                showColor(colorPicker.value);
            }
            if(event.target.dataset.complementary=="Complementary")
            {
                pickerEvent("Complementary")
                changedShadeShower("Complementary");
                showColor(colorPicker.value);
            }
            if(event.target.dataset.triadic=="Triadic")
            {
                pickerEvent("Triadic")
                changedShadeShower("Triadic");
                showColor(colorPicker.value);
            }
            if(event.target.dataset.split=="split-complementary")
            {
                pickerEvent("split-complementary")
                changedShadeShower("split-complementary");
                showColor(colorPicker.value);
            }
            other.classList.remove("is-active");
            
        });

        button.classList.add("is-active");

    });
});

// console.log(headNav);
function updateActiveNav() {
    let currentPath = window.location.pathname.split("/").pop() || "index.html";
    let headNav = document.querySelectorAll(".head-nav");
    // console.log(headNav);
    headNav.forEach((link) => {
        // console.log(link);
        let linkHref = link.getAttribute("href");
        // console.log(linkHref);
        let linkPath = linkHref ? linkHref.split("/").pop() : "";
        // console.log(linkPath);
        if (linkPath === currentPath) {
            // console.log(linkPath);
            link.classList.add("is-active");
        } else {
            link.classList.remove("is-active");
        }
    });
}
document.addEventListener("DOMContentLoaded", updateActiveNav);
window.addEventListener("pageshow", updateActiveNav);
let preview = document.getElementById("preview-page");
let visionSelect = document.getElementById("vision-mode");
let themeToggleCheckbox = document.getElementById("theme-toggle-checkbox");
let previewContainer = document.querySelector(".live-preview");

colorPicker.addEventListener("input", function () {
    let selectedColor = colorPicker.value;
    previewContainer.style.setProperty("--preview-accent", selectedColor);
});

if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener("change", function () {
        if (this.checked) {
            preview.classList.add("dark");
        } else {
            preview.classList.remove("dark");
        }
        if (colorPicker && typeof updatePreviewTheme === "function") {
            updatePreviewTheme(colorPicker.value);
        }
    });
}

let visionClasses = ["protanopia", "deuteranopia", "tritanopia","achromatopsia"];
visionSelect.addEventListener("change", function () {
    let selectedMode = visionSelect.value;
    preview.classList.remove(...visionClasses);
    if (selectedMode !== "normal") {
        preview.classList.add(selectedMode);
    }
});
let toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}
const visionDescriptions = {
  normal: {
    title: "Normal Vision",
    description: "Standard full-color spectrum vision with no red, green, or blue cone deficiencies."
  },
  protanopia: {
    title: "Protanopia (Red-blindness)",
    description: "Caused by the lack of the long-wavelength (red) cones. People with this have difficulty distinguishing between blue and green and also between red and green."
  },
  deuteranopia: {
    title: "Deuteranopia (Green-blindness)",
    description: "Caused by the lack of the medium-wavelength (green) cones. Greens and reds often appear as brownish-yellow or beige tones."
  },
  tritanopia: {
    title: "Tritanopia (Blue-blindness)",
    description: "Caused by a lack of short-wavelength (blue) cones. Individuals experience difficulty distinguishing blue from green and yellow from violet."
  },
  achromatopsia:{
    title:"Achromatopsia (Full-color-blindnesss)",
    description:"Achromatopsia is a rare, inherited retinal disorder that causes a complete or partial inability to perceive color, leaving individuals to see the world mostly or entirely in shades of black, white, and gray"
  }
};

const infoBtn = document.getElementById('info-trigger');
// const visionSelect = document.getElementById('vision-mode');
const tooltipBox = document.getElementById('vision-tooltip');
const titleEl = document.getElementById('tooltip-title');
const descEl = document.getElementById('tooltip-desc');


infoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const selectedMode = visionSelect.value;
  const data = visionDescriptions[selectedMode] || visionDescriptions.normal;
  
  titleEl.textContent = data.title;
  descEl.textContent = data.description;
  
  tooltipBox.classList.toggle('hidden');
});


window.addEventListener('click', () => {
  if (!tooltipBox.classList.contains('hidden')) {
    tooltipBox.classList.add('hidden');
  }
});
// let currentUser = localStorage.getItem("chromora:v1:users") || "user_guest_default";
// localStorage.setItem("chromora:v1:users", currentUser);
let savePaletteBtn = document.querySelector("#savePaletteBtn");

if (savePaletteBtn) {
    let cleanSaveBtn = savePaletteBtn.cloneNode(true);
    savePaletteBtn.parentNode.replaceChild(cleanSaveBtn, savePaletteBtn);
    savePaletteBtn = cleanSaveBtn;
    
    savePaletteBtn.addEventListener("click", async () => {
        if (!isUserLoggedIn()) {
            showToast("Please Sign In to use the AI Color Reviewer!");
            setTimeout(() => {
                window.location.href = "signin.html";
            }, 1200);
            return;
        }
        let paletteName = await window.showCustomPrompt({
        title: "Save Studio Palette",
        message: "Give your custom harmony a memorable name:",
        defaultValue: "My Studio Palette",
        confirmText: "Save to Favorites"

    });
        if (!paletteName) 
        {
           return;
        }
            

        let activeHarmonyType = document.querySelector(".hormoni-btn.is-active");
        let type = "mono"; 
        
        if (activeHarmonyType) {
            if (activeHarmonyType.dataset.mono) type = "mono";
            if (activeHarmonyType.dataset.analog) type = "analogus";
            if (activeHarmonyType.dataset.complementary) type = "Complementary";
            if (activeHarmonyType.dataset.triadic) type = "Triadic";
            if (activeHarmonyType.dataset.split) type = "split-complementary";
        }

        let currentColors =currentDisplayedColors;
    
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
        // console.log("hiii",userId);


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
function renderCustomStudioPalette(colorsArray) {
    let shadeCont = document.querySelector(".color-shade-cont");
    let shadeCont1 = document.querySelector(".color-shade-cont1");
    if (!shadeCont || !shadeCont1) return;
    if (typeof currentDisplayedColors !== "undefined") {
        currentDisplayedColors = [...colorsArray];
    }
    updateLivePreviewFromPalette(currentDisplayedColors);
    shadeCont1.style.gridTemplateColumns = `repeat(${colorsArray.length}, 1fr)`;
    shadeCont.style.gridTemplateColumns = `repeat(${colorsArray.length}, 1fr)`;
    shadeCont.innerHTML = "";
    shadeCont1.innerHTML = "";
    colorsArray.forEach((color, index) => {
        let colorBox = createEl("div", "box", shadeCont);
        colorBox.style.cursor = "pointer";
        colorBox.style.backgroundColor = color;
        colorBox.dataset.currentColor = color;

        colorBox.addEventListener("click", () => {
            if (typeof copyToClipBoard === "function") {
                copyToClipBoard(colorBox.dataset.currentColor);
            }
        });
        let innerColorBox = createEl("div", "inner-box", shadeCont1);
        let shades1 = colorShadeProducer ? colorShadeProducer(color) : [color];
        shades1.forEach(color1=>
        {
            
            let colorbox = createEl("div","box2",innerColorBox);
            colorbox.style.backgroundColor = color1;
            colorbox.textContent = color1;
            colorbox.addEventListener("mouseenter",()=>
            {
                // console.log(color1);
                if(readableOn(color1))
                {
                    colorbox.style.color = '#0000007e';
                }
                else{
                    colorbox.style.color = '#ffffff95';
                }
            })
            colorbox.addEventListener("mouseleave",()=>
            {
                colorbox.style.color = '';
            })
            colorbox.addEventListener("click", () => {
                colorBox.style.backgroundColor = color1;
                colorBox.dataset.currentColor = color1;

                colorsArray[index] = color1;
                
                if (typeof currentDisplayedColors !== "undefined") {
                    currentDisplayedColors[index] = color1;
                }
                updateLivePreviewFromPalette(currentDisplayedColors);

                if (typeof copyToClipBoard === "function") {
                    copyToClipBoard(color1);
                }
            });
        });

    });
}
document.addEventListener("DOMContentLoaded",()=>
{
    const urlParams = new URLSearchParams(window.location.search);
    const colorsParam = urlParams.get("colors")
    if (colorsParam) {
        let customPaletteColors = colorsParam.split(",").map(c => `#${c}`);
        if (customPaletteColors.length > 0) {
            document.querySelectorAll(".hormoni-btn").forEach(btn => {
                btn.classList.remove("is-active");
            });
            renderCustomStudioPalette(customPaletteColors);
        }
        else {
            const defaultBtn = document.querySelector(".hormoni-btn");
            if (defaultBtn) defaultBtn.classList.add("is-active");
            if (typeof changedShadeShower === "function") {
            changedShadeShower("mono");
        }
        }
    }
});


const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
let aiAssistent = document.getElementById("Ai-assitent-btn");
let aiModelCont = document.getElementById("ai-model-container");
let aiModalSwatches = document.getElementById("aiModalSwatches");
// let aiActiveHexLabel = document.getElementById("aiActiveHexLabel");
let aiWebsiteType = document.getElementById("aiWebsiteType");
let aiExtraContext = document.getElementById("aiExtraContext");
let runAiAnalysisBtn = document.getElementById("runAiAnalysisBtn");
let aiResultContainer = document.getElementById("aiResultContainer");
let aiResultText = document.getElementById("aiResultText");
let copyAiResultBtn = document.getElementById("copyAiResultBtn");
if (aiAssistent) {
aiAssistent.addEventListener("click", () => {
        if (!isUserLoggedIn()) {
            showToast("Please Sign In to use the AI Color Reviewer!");
            setTimeout(() => {
                window.location.href = "signin.html";
            }, 1000);
            return;
        }
        aiModelCont.classList.toggle("hidden");
        let activeShades = (currentDisplayedColors && currentDisplayedColors.length > 0)? currentDisplayedColors: [colorPicker.value];
        // aiActiveHexLabel.textContent = activeShades.join(" • ").toUpperCase();
        aiModalSwatches.style.gridTemplateColumns = `repeat(${activeShades.length}, 1fr)`;
        aiModalSwatches.innerHTML = "";

        activeShades.forEach(hex => {
            let swatch =createEl("div","ai-mini-swatch",aiModalSwatches);
            swatch.style.backgroundColor = hex;
            // swatch.style.color = readableOn(hex) ? "#1F1D2B" : "#FFFFFF";
            // swatch.textContent = hex.toUpperCase();
        });
    });
}
function formatAiResponseToHTML(rawText) {
    let safeText = rawText;
    safeText = safeText.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (match) => {
        return `<span class="ai-inline-hex" data-hex="${match.toUpperCase()}"><span class="ai-hex-dot" style="background:${match};"></span>${match.toUpperCase()}</span>`;
    });

    safeText = safeText.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    safeText = safeText.replace(/\*(.+?)\*/g, "<em>$1</em>");

    const lines = safeText.split("\n");
    let htmlOutput = "";
    let inList = false;

    lines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed) {
            if (inList) { 
                htmlOutput += "</ul>"; 
                inList = false; 
            }
            return;
        }

        if (/^#{1,6}\s+/.test(trimmed)) {
            if (inList) { 
                htmlOutput += "</ul>"; 
                inList = false;
            }
            let title = trimmed.replace(/^#{1,6}\s+/, "");
            htmlOutput += `<h4 class="ai-sec-title">${title}</h4>`;
        } 
        else if (/^\d+\.\s+/.test(trimmed)) {
            if (inList) { 
                htmlOutput += "</ul>"; 
                inList = false; 
            }
            htmlOutput += `<h4 class="ai-sec-title">${trimmed}</h4>`;
        }
        else if (/^[-*•]\s+/.test(trimmed)) {
            if (!inList) { 
                htmlOutput += `<ul class="ai-sec-list">`; 
                inList = true;
            }
            let item = trimmed.replace(/^[-*•]\s+/, "");
            htmlOutput += `<li>${item}</li>`;
        } 
        else {
            if (inList) { 
                htmlOutput += "</ul>"; 
                inList = false; 
            }
            htmlOutput += `<p class="ai-sec-para">${trimmed}</p>`;
        }
    });

    if (inList) htmlOutput += "</ul>";
    return htmlOutput;
}
if (runAiAnalysisBtn) {
    runAiAnalysisBtn.addEventListener("click", async () => {
        let activeShades = (currentDisplayedColors && currentDisplayedColors.length > 0)
            ? currentDisplayedColors
            : [colorPicker.value];
        let siteType = aiWebsiteType.value;
        let extraDetails = aiExtraContext.value.trim();

        let promptText = [
            "You are an expert UI/UX designer and web accessibility reviewer.",
            "Evaluate this generated color palette for a website. Keep it practical, specific, and well-structured.",
            `Generated Palette Shades: ${activeShades.join(", ")}`,
            `Website Type: ${siteType}`,
            `Additional Context: ${extraDetails || "None provided"}`,
            "",
            "Please structure your response with the following sections:",
            "**QUICK SUMMARY VERDICT:** (Provide a 1-line bold statement here on whether this is a Good Choice, Good with Adjustments, or Not Ideal).",
            "1. Overall Suitability & Fit: How precisely this palette matches a " + siteType + ".",
            "2. Mood & Brand Impression: The emotional vibe and personality these shades project.",
            "3. Recommended UI Roles: Assign specific HEX codes from the palette to Primary CTA buttons, Backgrounds, Accents, and Text.",
            "4. Accessibility & Contrast Tips: Crucial warnings or guidelines when pairing these shades with text for WCAG compliance.",
            "5. Final Detailed Verdict: A concise explanation of why this palette works or what adjustments are needed."
        ].join("\n");

        runAiAnalysisBtn.disabled = true;
        runAiAnalysisBtn.textContent = "✨ Analyzing Palette with Gemini...";
        aiResultContainer.classList.remove("hidden");
        aiResultText.textContent = "Consulting Gemini AI Designer... Please wait a moment.";

        try {
            let response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": MY_GEMINI_API_KEY
                },
                body: JSON.stringify({
                    model: GEMINI_MODEL,
                    input: promptText,
                    generation_config:{
                        temperature:0.3
                    
                    },
                    store: false
                }) 
            });

            let data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || "Request failed with HTTP " + response.status);
            }

            let answer = typeof data.output_text === "string" ? data.output_text : "";
            // console.log(answ)

            if (!answer && Array.isArray(data.steps)) {
                answer = data.steps
                    .filter(step => step.type === "model_output")
                    .flatMap(step => step.content || [])
                    .filter(item => item.type === "text")
                    .map(item => item.text || "")
                    .join("\n");
            }

            if (!answer && data.candidates) {
                answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
            console.log(data);

            answer = answer.trim();
            if (!answer) {
                console.error("Unexpected Gemini response:", data);
                throw new Error("Gemini returned no text. Check the browser console.");
            }
            aiResultText.dataset.cleanText = answer
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/\*\*(.+?)\*\*/g, "$1")
                .replace(/\*(.+?)\*/g, "$1");
            aiResultText.innerHTML = formatAiResponseToHTML(answer);

            aiResultText.querySelectorAll(".ai-inline-hex").forEach(badge => {
                badge.style.cursor = "pointer";
                badge.title = "Click to copy & preview this color";
                badge.addEventListener("click", () => {
                    let hexCode = badge.dataset.hex;
                    if (hexCode) {
                        copyToClipBoard(hexCode);
                        // updateLivePreviewFromPalette(currentDisplayedColors, hexCode);
                    }
                });
            });
            showToast("AI Analysis Complete!");

        } catch (error) {
            console.error("AI Review Error:", error);
            aiResultText.textContent = "Error: " + error.message;
            showToast("AI Review failed. Check console.");
        } finally {
            runAiAnalysisBtn.disabled = false;
            runAiAnalysisBtn.textContent = "✨ Evaluate Palette for This Website";
        }
    });
}
if (copyAiResultBtn) {
    copyAiResultBtn.addEventListener("click", () => {
        if (aiResultText.textContent) {
            copyToClipBoard(aiResultText.textContent);
        }
    });
}
