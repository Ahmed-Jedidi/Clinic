// ========== Firebase Config ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✅ ⚠️ PASTE YOUR FIREBASE CONFIG HERE ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyD8l_RlBvhTlBIqIajUxpqIoGOt2jg3ylY",
    authDomain: "usingfirebase-b4c6a.firebaseapp.com",
    projectId: "usingfirebase-b4c6a",
    storageBucket: "usingfirebase-b4c6a.firebasestorage.app",
    messagingSenderId: "678814978439",
    appId: "1:678814978439:web:be0ce0e40925c85fc7c322",
    measurementId: "G-MBNL06FWXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM Elements ==========
const allScreens = document.querySelectorAll('.screen');
const splashScreen = document.getElementById('splash-screen');
const formScreen = document.getElementById('form-screen');
const shareScreen = document.getElementById('share-screen');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Splash Screen Elements
const startSetupBtn = document.getElementById('start-setup-btn');
const clinicLogo = document.getElementById('clinic-logo');
const clinicName = document.getElementById('clinic-name');
const clinicDescription = document.getElementById('clinic-description');

// Form Screen Elements
const backToSplashBtn = document.getElementById('back-to-splash');
const patientForm = document.getElementById('patient-form');
const submitFormBtn = document.getElementById('submit-form-btn');

// NEW Form Input Elements
const fullNameInput = document.getElementById('patient-name');
const emailInput = document.getElementById('patient-email');
const phoneInput = document.getElementById('patient-phone');
const dobInput = document.getElementById('patient-dob');
const nationInput = document.getElementById('patient-nation');
const symptomsInput = document.getElementById('patient-symptoms');
const allFormInputs = [fullNameInput, emailInput, phoneInput, dobInput, nationInput, symptomsInput];

// Share Screen Elements
const setupNewPatientBtn = document.getElementById('setup-new-patient');
const qrCanvas = document.getElementById('qr-canvas');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const nativeShareBtn = document.getElementById('native-share-btn');

// ========== App State ==========
const BASE_URL = "https://free-po.vercel.app/"; // Base URL for the story camera app

// ========== UI Functions ==========

/**
 * Shows or hides the global loading overlay
 * @param {boolean} show - True to show, false to hide
 * @param {string} text - Optional text to display
 */
function showLoading(show, text = 'Loading...') {
    loadingText.textContent = text;
    loadingOverlay.classList.toggle('hidden', !show);
}

/**
 * Hides all screens and shows the one with the specified ID
 * @param {string} screenId - The ID of the screen to show
 */
function showScreen(screenId) {
    allScreens.forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

/**
 * Displays a toast notification message.
 * @param {string} message The message to display.
 * @param {string} type The type of toast ('success', 'error', or 'info').
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fas fa-info-circle"></i>';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    if (type === 'error') icon = '<i class="fas fa-times-circle"></i>';
    
    toast.innerHTML = `${icon} ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Toggles the loading state of the submit button
 * @param {boolean} isLoading - True to show spinner, false to show text
 */
function toggleSubmitLoading(isLoading) {
    submitFormBtn.disabled = isLoading;
    submitFormBtn.classList.toggle('loading', isLoading);
    submitFormBtn.querySelector('.btn-text').style.visibility = isLoading ? 'hidden' : 'visible';
    submitFormBtn.querySelector('.spinner-small').classList.toggle('hidden', !isLoading);
}

// ========== NEW Validation Functions ==========

/**
 * Shows an error message for a specific form field
 * @param {HTMLElement} inputEl - The input, select, or textarea element
 * @param {string} message - The error message to show
 */
function showError(inputEl, message) {
    inputEl.classList.add('error');
    const errorContainer = inputEl.closest('.form-group').querySelector('.error-message');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

/**
 * Clears an error message for a specific form field
 * @param {HTMLElement} inputEl - The input, select, or textarea element
 */
function clearError(inputEl) {
    inputEl.classList.remove('error');
    const errorContainer = inputEl.closest('.form-group').querySelector('.error-message');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

/**
 * Clears all validation errors from the form
 */
function clearAllErrors() {
    allFormInputs.forEach(input => clearError(input));
}

/**
 * Validates the entire patient form
 * @returns {boolean} - True if the form is valid, false otherwise
 */
function validateForm() {
    clearAllErrors();
    let hasError = false;

    // 1. Full Name
    if (!fullNameInput.value.trim()) {
        showError(fullNameInput, "Please enter your full name");
        hasError = true;
    }

    // 2. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        showError(emailInput, "Please enter a valid email address");
        hasError = true;
    }

    // 3. Phone
    const phoneRegex = /^\d{10}$/;
    const phoneValue = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
    if (!phoneValue || !phoneRegex.test(phoneValue)) {
        showError(phoneInput, "Please enter a valid 10-digit phone number");
        hasError = true;
    }

    // 4. Date of Birth
    if (!dobInput.value) {
        showError(dobInput, "Please enter your date of birth");
        hasError = true;
    }

    // 5. Nation
    if (!nationInput.value) {
        showError(nationInput, "Please select your nation");
        hasError = true;
    }

    // 'symptoms' is optional, no validation needed

    return !hasError;
}


// ========== Core Functions ==========

/**
 * Loads clinic information from Firebase to populate the splash screen.
 */
async function loadClinicInfo() {
    showLoading(true, "Loading clinic details...");
    try {
        const docRef = doc(db, "config", "clinicDetails");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            clinicName.textContent = data.name || "Clinic Name";
            clinicDescription.textContent = data.description || "Welcome to our patient portal.";
            if (data.logoUrl) {
                clinicLogo.src = data.logoUrl;
            }
        } else {
            clinicName.textContent = "FreePo Clinic Portal";
            clinicDescription.textContent = "Welcome! Please set up a patient to begin.";
            console.warn("No 'config/clinicDetails' doc found in Firestore. Using fallback text.");
        }
    } catch (err) {
        console.error("Error loading clinic info: ", err);
        showToast("Could not load clinic details.", 'error');
        clinicDescription.textContent = "Could not load details. Please try again.";
    } finally {
        showLoading(false);
    }
}


/**
 * Handles the submission of the new patient form. (MODIFIED)
 * @param {Event} e - The form submission event
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // 1. Validate the form first
    if (!validateForm()) {
        return; // Stop submission if validation fails
    }
    
    // 2. Start loading spinner
    toggleSubmitLoading(true);

    try {
        // 3. Get form data
        const patientData = {
            name: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            dob: dobInput.value,
            nation: nationInput.value,
            symptoms: symptomsInput.value.trim(),
            createdAt: new Date()
        };

        // 4. Save to Firebase
        const docRef = await addDoc(collection(db, "patients"), patientData);
        const newPatientUID = docRef.id;
        console.log("New patient created with UID:", newPatientUID);

        // 5. Populate the share screen
        await populateShareScreen(newPatientUID, patientData.name);
        console.log("Share screen populated.", newPatientUID, patientData.name);

        // 6. Navigate to the share screen
        showScreen('share-screen');
        patientForm.reset();
        // clearAllErrors() is not needed here as reset triggers a "new" form state

    } catch (err) {
        console.error("Error submitting form: ", err);
        showToast("Failed to create patient link.", 'error');
    } finally {
        // 7. Stop loading spinner
        toggleSubmitLoading(false);
    }
}

/**
 * Populates the share screen with the unique URL and QR code
 * @param {string} uid - The new patient's Firestore document ID
 * @param {string} patientName - The patient's name for sharing
 */

async function generateQRCode(url, qrCanvas) {
    await window.QRCode.toCanvas(qrCanvas, url, {
        width: 200,
        margin: 2,
        color: { dark: '#262626', light: '#ffffff' }
    });
}


async function populateShareScreen(uid, patientName) {
    const url = `${BASE_URL}?uid=${uid}`;
    shareLinkInput.value = url;
    
    // Store patient name in the screen's dataset for the share API
    shareScreen.dataset.patientName = patientName || 'your loved one';
    shareScreen.dataset.url = url; // Store the URL for sharing

    try {
        // Generate QR Code
        /*await window.QRCode.toCanvas(qrCanvas, url, {
            width: 200,
            margin: 2,
            color: { dark: '#262626', light: '#ffffff' }
        });*/
        await generateQRCode(url, qrCanvas);
    } catch (err) {
        console.error("QR Code generation failed: ", err);
        qrCanvas.style.display = 'none';
    }
}

/**
 * Copies the generated share link to the user's clipboard
 */
function copyLinkToClipboard() {
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999);
    
    const originalHtml = copyLinkBtn.innerHTML;
    
    try {
        // Use modern clipboard API
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            showToast("Link copied!", 'success');
        }, () => {
            document.execCommand('copy'); // Fallback
            showToast("Link copied!", 'success');
        });
    } catch (err) {
        document.execCommand('copy'); // Fallback
        showToast("Link copied!", 'success');
    }
    
    // Visual feedback on the button
    copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    copyLinkBtn.disabled = true;
    setTimeout(() => {
        copyLinkBtn.innerHTML = originalHtml;
        copyLinkBtn.disabled = false;
    }, 2000);
}

/**
 * Checks for and initializes the native Web Share API
 */
function initNativeShare() {
    if (navigator.share) {
        nativeShareBtn.classList.remove('hidden');
        nativeShareBtn.addEventListener('click', handleNativeShare);
    }
}

/**
 * Handles the native share functionality
 */
async function handleNativeShare() {
    const url = shareScreen.dataset.url;
    const patientName = shareScreen.dataset.patientName;
    
    try {
        await navigator.share({
            title: `FreePo Link for ${patientName}`,
            text: `Here is the special link to send messages to ${patientName}:`,
            url: url
        });
        console.log("Link shared successfully");
    } catch (err) {
        // User probably cancelled the share, no error toast needed.
        console.error("Error using native share: ", err);
    }
}


// ========== Event Listeners ==========

/**
 * Attaches all primary event listeners for the app
 */
function setupEventListeners() {
    // Splash Screen
    startSetupBtn.addEventListener('click', () => showScreen('form-screen'));

    // Form Screen
    backToSplashBtn.addEventListener('click', () => showScreen('splash-screen'));
    patientForm.addEventListener('submit', handleFormSubmit);

    // Add real-time validation listeners
    allFormInputs.forEach(input => {
        // Use 'input' for text/email/tel, 'change' for select/date
        const eventType = (input.tagName === 'SELECT' || input.type === 'date') ? 'change' : 'input';
        input.addEventListener(eventType, () => {
            // Clear error as the user types or changes value
            if (input.classList.contains('error')) {
                clearError(input);
            }
        });
    });

    // Share Screen
    setupNewPatientBtn.addEventListener('click', () => {
        showScreen('form-screen');
        // We reset the form when they click "setup new"
        patientForm.reset();
        clearAllErrors(); // Also clear any lingering error messages
    });
    copyLinkBtn.addEventListener('click', copyLinkToClipboard);
}

// ========== Initialize App ==========
window.onload = () => {
    setupEventListeners();
    loadClinicInfo();
    initNativeShare(); // Check for share capabilities
    showScreen('splash-screen'); // Start on the splash screen
};
