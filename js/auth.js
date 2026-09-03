// Client-Side Authentication, Role Guard & Validation Logic

// Detailed Email Validation with exact, actionable error messages
window.validateEmailDetailed = function(email) {
    if (!email || typeof email !== 'string' || !email.trim()) {
        return { isValid: false, message: "Email address is required." };
    }
    const cleanEmail = email.trim();
    if (/\s/.test(cleanEmail)) {
        return { isValid: false, message: "Email address cannot contain spaces." };
    }
    if (!cleanEmail.includes("@")) {
        return { isValid: false, message: "Email address is missing the '@' symbol (e.g. user@givego.lk or name@example.com)." };
    }
    const atParts = cleanEmail.split("@");
    if (atParts.length > 2) {
        return { isValid: false, message: "Email address cannot contain multiple '@' symbols." };
    }
    const username = atParts[0];
    const domain = atParts[1];
    
    if (!username) {
        return { isValid: false, message: "Email address is missing the username before '@' (e.g. name@example.com)." };
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(username)) {
        return { isValid: false, message: "Email username before '@' contains invalid characters." };
    }
    if (!domain) {
        return { isValid: false, message: "Email address is missing the domain after '@' (e.g. @givego.lk or @gmail.com)." };
    }
    if (!domain.includes(".")) {
        return { isValid: false, message: "Email address domain is missing a dot '.' (e.g. domain.com or givego.lk)." };
    }
    
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    const topLevelDomain = domainParts[domainParts.length - 1];
    
    if (!domainName) {
        return { isValid: false, message: "Email domain name is missing before '.' (e.g. example.com)." };
    }
    if (domainName.startsWith("-") || domainName.endsWith("-")) {
        return { isValid: false, message: "Email domain name cannot start or end with a hyphen." };
    }
    if (!topLevelDomain || topLevelDomain.length < 2) {
        return { isValid: false, message: "Email address is missing a valid domain extension (e.g. .com, .org, .lk, .net)." };
    }
    if (!/^[a-zA-Z]{2,24}$/.test(topLevelDomain)) {
        return { isValid: false, message: "Email domain extension (e.g. .com, .lk) must only contain letters." };
    }
    
    // Standard RFC-compliant check
    const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!rfcRegex.test(cleanEmail)) {
        return { isValid: false, message: "Email address format is invalid. Please enter a valid email address (e.g. user@givego.lk)." };
    }
    
    return { isValid: true, message: "" };
};

// Detailed Password Validation (Min 8 characters + special character)
window.validatePasswordDetailed = function(password) {
    if (!password || typeof password !== 'string') {
        return { isValid: false, message: "Password is required." };
    }
    if (password.length < 8) {
        return { isValid: false, message: "Password must have a minimum length of 8 characters (currently " + password.length + " characters)." };
    }
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (!specialCharRegex.test(password)) {
        return { isValid: false, message: "Password must include at least one special character (e.g. ! @ # $ % ^ & * ? _ -)." };
    }
    return { isValid: true, message: "" };
};

// Confirm Password Validation
window.validateConfirmPassword = function(password, confirmPassword) {
    if (!confirmPassword) {
        return { isValid: false, message: "Please enter your password confirmation." };
    }
    if (password !== confirmPassword) {
        return { isValid: false, message: "Passwords do not match. Please ensure both password fields are identical." };
    }
    return { isValid: true, message: "" };
};

// Global Password Visibility Toggle (Eye Icon)
window.togglePasswordVisibility = function(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const isPassword = input.getAttribute("type") === "password";
    input.setAttribute("type", isPassword ? "text" : "password");
    
    if (btnEl) {
        if (isPassword) {
            // Show eye-off icon (password revealed)
            btnEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            btnEl.setAttribute("aria-label", "Hide password");
            btnEl.style.color = "#0D7C7A";
        } else {
            // Show standard eye icon (password masked)
            btnEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            btnEl.setAttribute("aria-label", "Show password");
            btnEl.style.color = "#64748B";
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    
    function getHelperOrWait() {
        let helper = window.getFirebaseHelper ? window.getFirebaseHelper() : null;
        return helper;
    }

    window.authEngine = {
        login: async (email, password) => {
            try {
                // Pre-validate email format
                const emailCheck = window.validateEmailDetailed(email);
                if (!emailCheck.isValid) {
                    showToast(emailCheck.message, "warning");
                    return;
                }
                if (!password) {
                    showToast("Password is required to sign in.", "warning");
                    return;
                }

                showToast("Authenticating credentials...", "info");
                
                let helper = getHelperOrWait();
                if (!helper) {
                    await new Promise(r => setTimeout(r, 600));
                    helper = getHelperOrWait();
                }

                if (!helper) {
                    throw new Error("Unable to connect to Firebase services. Please check your internet connection and refresh.");
                }

                const result = await helper.auth().signInWithEmailAndPassword(email, password);
                const authUser = result.user;
                
                let userDoc = null;
                try {
                    const db = helper.db();
                    const userRef = db.collection("users").doc(authUser.uid);
                    userDoc = await userRef.get();

                    let role = "donor";
                    let status = "verified";
                    let name = authUser.displayName || authUser.email.split('@')[0];
                    let profileData = {
                        uid: authUser.uid,
                        email: authUser.email,
                        name: name,
                        role: role,
                        status: status
                    };

                    const districtCoordinates = {
                        "Colombo": { lat: 6.9271, lng: 79.8612 },
                        "Gampaha": { lat: 7.0840, lng: 79.9943 },
                        "Kalutara": { lat: 6.5854, lng: 79.9607 },
                        "Kandy": { lat: 7.2906, lng: 80.6337 },
                        "Matale": { lat: 7.4675, lng: 80.6234 },
                        "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
                        "Galle": { lat: 6.0535, lng: 80.2210 },
                        "Matara": { lat: 5.9549, lng: 80.5550 },
                        "Hambantota": { lat: 6.1429, lng: 81.1212 },
                        "Jaffna": { lat: 9.6615, lng: 80.0255 },
                        "Kilinochchi": { lat: 9.3803, lng: 80.3770 },
                        "Mannar": { lat: 8.9810, lng: 79.9044 },
                        "Vavuniya": { lat: 8.7542, lng: 80.4982 },
                        "Mullaitivu": { lat: 9.2671, lng: 80.8142 },
                        "Batticaloa": { lat: 7.7310, lng: 81.6747 },
                        "Ampara": { lat: 7.2975, lng: 81.6747 },
                        "Trincomalee": { lat: 8.5874, lng: 81.2152 },
                        "Kurunegala": { lat: 7.4863, lng: 80.3623 },
                        "Puttalam": { lat: 8.0362, lng: 79.8283 },
                        "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
                        "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
                        "Badulla": { lat: 6.9934, lng: 81.0550 },
                        "Moneragala": { lat: 6.8728, lng: 81.3507 },
                        "Ratnapura": { lat: 6.6828, lng: 80.4037 },
                        "Kegalle": { lat: 7.2513, lng: 80.3464 }
                    };

                    if (userDoc && userDoc.exists) {
                        const data = userDoc.data();
                        
                        if (authUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || authUser.email.toLowerCase().includes("admin")) {
                            role = "admin";
                            status = "verified";
                        } else if (data.role) {
                            role = data.role;
                            const isOrg = data.donorType === 'organisation' || (data.accountType && data.accountType.includes('org')) || !!data.orgDetails || role === 'receiver';
                            status = data.status || (role === 'donor' && !isOrg ? 'verified' : 'pending');
                        } else if (data.accountType) {
                            role = data.accountType.includes('receiver') ? 'receiver' : 'donor';
                            const isOrg = data.accountType.includes('org') || data.accountType.includes('receiver');
                            status = data.status || (role === 'donor' && !isOrg ? 'verified' : 'pending');
                        }

                        profileData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            name: data.name || name,
                            role: role,
                            status: status,
                            donorType: data.donorType || (role === 'donor' ? 'individual' : ''),
                            receiverCategory: data.receiverCategory || "",
                            phone: data.phone || "",
                            district: data.district || "Colombo",
                            address: data.address || (data.receiverDetails && data.receiverDetails.address) || "",
                            city: data.city || "",
                            postalCode: data.postalCode || "",
                            registrationNumber: data.registrationNumber || (data.orgDetails && data.orgDetails.registrationNumber) || (data.receiverDetails && data.receiverDetails.registrationNumber) || (data.nicNumber) || "",
                            nicNumber: data.nicNumber || "",
                            receiverDetails: data.receiverDetails || null,
                            orgDetails: data.orgDetails || null,
                            categories: data.categories || "All Categories",
                            location: data.location || districtCoordinates[data.district || "Colombo"] || { lat: 6.9271, lng: 79.8612 }
                        };

                        if (!data.role || !data.status) {
                            await userRef.set({ role, status }, { merge: true });
                        }
                    } else {
                        if (authUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || authUser.email.toLowerCase().includes("admin")) {
                            role = "admin";
                            status = "verified";
                            name = "System Admin";
                        }

                        profileData.role = role;
                        profileData.status = status;
                        profileData.name = name;

                        await userRef.set({
                            uid: authUser.uid,
                            email: authUser.email,
                            name: name,
                            role: role,
                            status: status,
                            district: "Colombo",
                            createdAt: new Date().toISOString()
                        });
                    }

                    if (role !== 'admin') {
                        const isOrg = profileData.donorType === 'organisation' || (profileData.accountType && profileData.accountType.includes('org')) || !!profileData.orgDetails || role === 'receiver';

                        if (profileData.status === 'pending' && isOrg) {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your organisation account is pending Administrator approval. Please wait for an Admin to verify and approve your account before logging in.", "warning");
                            return;
                        }
                        if (profileData.status === 'suspended') {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your account has been suspended pending administrator review.", "danger");
                            return;
                        }
                        if (profileData.status === 'rejected') {
                            await helper.auth().signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                            showToast("Your registration application was not approved by the Administrator.", "danger");
                            return;
                        }
                    }

                    try {
                        localStorage.setItem("givego_user", JSON.stringify(profileData));
                        const syncResponse = await fetch("api/auth_session.php?action=login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(profileData)
                        });
                        if (syncResponse.ok) {
                            const text = await syncResponse.text();
                            if (text) JSON.parse(text);
                        }
                    } catch (syncErr) {
                        console.warn("Session sync skipped (static host environment):", syncErr);
                    }
                } catch (fsError) {
                    console.error("Firestore user fetch error:", fsError);
                    if (fsError.code === 'permission-denied' || (fsError.message && fsError.message.includes("permission"))) {
                        throw new Error("Database Permission Error: Please update your Firestore Security Rules in Firebase Console to allow read/write access.");
                    } else {
                        throw fsError;
                    }
                }

                showToast("Login successful. Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 400);
            } catch (error) {
                let friendlyMsg = error.message;
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    friendlyMsg = "Invalid email address or password. Please check your credentials.";
                } else if (error.code === 'auth/too-many-requests') {
                    friendlyMsg = "Too many failed attempts. Please try again in a few minutes.";
                } else if (error.code === 'permission-denied' || (error.message && error.message.includes('permission'))) {
                    friendlyMsg = "Database Permission Error: Please update your Firestore Security Rules in Firebase Console.";
                }
                showToast(friendlyMsg, "danger");
                console.error("Auth Error: ", error);
            }
        },

        register: async (payload) => {
            try {
                showToast("Creating account...", "info");
                
                let helper = getHelperOrWait();
                if (!helper) {
                    await new Promise(r => setTimeout(r, 600));
                    helper = getHelperOrWait();
                }

                if (!helper) {
                    throw new Error("Unable to connect to Firebase services. Please check your internet connection.");
                }

                const {
                    email,
                    password,
                    name,
                    accountType,
                    phone,
                    district,
                    address,
                    city,
                    postalCode,
                    categories,
                    receiverCategory,
                    individualDetails,
                    orgDetails,
                    receiverDetails
                } = payload;

                const districtCoordinates = {
                    "Colombo": { lat: 6.9271, lng: 79.8612 },
                    "Gampaha": { lat: 7.0840, lng: 79.9943 },
                    "Kalutara": { lat: 6.5854, lng: 79.9607 },
                    "Kandy": { lat: 7.2906, lng: 80.6337 },
                    "Matale": { lat: 7.4675, lng: 80.6234 },
                    "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
                    "Galle": { lat: 6.0535, lng: 80.2210 },
                    "Matara": { lat: 5.9549, lng: 80.5550 },
                    "Hambantota": { lat: 6.1429, lng: 81.1212 },
                    "Jaffna": { lat: 9.6615, lng: 80.0255 },
                    "Kilinochchi": { lat: 9.3803, lng: 80.3770 },
                    "Mannar": { lat: 8.9810, lng: 79.9044 },
                    "Vavuniya": { lat: 8.7542, lng: 80.4982 },
                    "Mullaitivu": { lat: 9.2671, lng: 80.8142 },
                    "Batticaloa": { lat: 7.7310, lng: 81.6747 },
                    "Ampara": { lat: 7.2975, lng: 81.6747 },
                    "Trincomalee": { lat: 8.5874, lng: 81.2152 },
                    "Kurunegala": { lat: 7.4863, lng: 80.3623 },
                    "Puttalam": { lat: 8.0362, lng: 79.8283 },
                    "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
                    "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
                    "Badulla": { lat: 6.9934, lng: 81.0550 },
                    "Moneragala": { lat: 6.8728, lng: 81.3507 },
                    "Ratnapura": { lat: 6.6828, lng: 80.4037 },
                    "Kegalle": { lat: 7.2513, lng: 80.3464 }
                };

                const location = payload.location || districtCoordinates[district || "Colombo"] || { lat: 6.9271, lng: 79.8612 };

                let role = "donor";
                let donorType = "individual";
                let status = "verified";

                if (accountType === 'donor_individual') {
                    role = "donor";
                    donorType = "individual";
                    status = "verified";
                } else if (accountType === 'donor_org') {
                    role = "donor";
                    donorType = "organisation";
                    status = "pending";
                } else if (accountType === 'receiver') {
                    role = "receiver";
                    status = "pending";
                }

                const auth = helper.auth();
                const db = helper.db();
                
                const result = await auth.createUserWithEmailAndPassword(email, password);
                const authUser = result.user;
                
                const nicNumber = (individualDetails && individualDetails.nicNumber) || payload.nicNumber || "";
                const nicDocUrl = (individualDetails && individualDetails.nicDocUrl) || payload.nicDocUrl || "";
                const regNum = nicNumber || (orgDetails && orgDetails.registrationNumber) || (receiverDetails && receiverDetails.registrationNumber) || "";

                const userDocData = {
                    uid: authUser.uid,
                    email: authUser.email,
                    name,
                    role,
                    donorType,
                    accountType,
                    registrationNumber: regNum,
                    nicNumber: nicNumber,
                    nicDocUrl: nicDocUrl,
                    individualDetails: individualDetails || null,
                    phone,
                    district: district || "Colombo",
                    address: address || "",
                    city: city || "",
                    postalCode: postalCode || "",
                    categories: categories || "All Categories",
                    receiverCategory: receiverCategory || "",
                    orgDetails: orgDetails || null,
                    receiverDetails: receiverDetails || null,
                    location,
                    status: status,
                    createdAt: new Date().toISOString()
                };

                await db.collection("users").doc(authUser.uid).set(userDocData);

                if (status === 'verified') {
                    try {
                        localStorage.setItem("givego_user", JSON.stringify(userDocData));
                    } catch (lsErr) {}

                    showToast("Registration successful! Welcome to GiveGo.", "success");
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 500);
                } else {
                    try {
                        await auth.signOut();
                        localStorage.removeItem("givego_user");
                        sessionStorage.clear();
                    } catch (soErr) {
                        console.warn("Sign out after registration:", soErr);
                    }

                    showToast("Registration submitted! Your organisation account is currently pending Admin verification. You will be able to log in once an Administrator approves your account.", "info");
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 2000);
                }
            } catch (error) {
                let friendlyMsg = error.message;
                if (error.code === 'auth/email-already-in-use') {
                    friendlyMsg = "An account with this email address already exists. Please sign in instead.";
                } else if (error.code === 'auth/weak-password') {
                    friendlyMsg = "Password must be at least 6 characters long.";
                }
                showToast(friendlyMsg, "danger");
                console.error("Registration Error: ", error);
            }
        },

        logout: async () => {
            try {
                let helper = getHelperOrWait();
                if (helper && helper.auth()) await helper.auth().signOut();
                
                try {
                    localStorage.removeItem("givego_user");
                    sessionStorage.clear();
                    const syncResponse = await fetch("api/auth_session.php?action=logout");
                    if (syncResponse.ok) {
                        const text = await syncResponse.text();
                        if (text) JSON.parse(text);
                    }
                } catch (syncErr) {
                    console.warn("Session sync skipped (static host environment):", syncErr);
                }
                
                showToast("Logged out successfully.", "success");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 400);
            } catch (error) {
                showToast("Error logging out.", "danger");
                console.error(error);
            }
        }
    };

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        const loginEmailInput = document.getElementById("loginEmail");
        if (loginEmailInput) {
            loginEmailInput.addEventListener("input", () => {
                const feedbackEl = document.getElementById("loginEmailFeedback");
                if (loginEmailInput.value.length > 0) {
                    const res = window.validateEmailDetailed(loginEmailInput.value);
                    if (!res.isValid) {
                        loginEmailInput.classList.add("input-error");
                        loginEmailInput.classList.remove("input-success");
                        if (feedbackEl) {
                            feedbackEl.textContent = res.message;
                            feedbackEl.style.display = "block";
                        }
                    } else {
                        loginEmailInput.classList.remove("input-error");
                        loginEmailInput.classList.add("input-success");
                        if (feedbackEl) feedbackEl.style.display = "none";
                    }
                } else {
                    loginEmailInput.classList.remove("input-error", "input-success");
                    if (feedbackEl) feedbackEl.style.display = "none";
                }
            });
        }

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            const emailCheck = window.validateEmailDetailed(email);
            if (!emailCheck.isValid) {
                showToast(emailCheck.message, "warning");
                const feedbackEl = document.getElementById("loginEmailFeedback");
                if (feedbackEl) {
                    feedbackEl.textContent = emailCheck.message;
                    feedbackEl.style.display = "block";
                }
                loginEmailInput?.focus();
                return;
            }

            window.authEngine.login(email, password);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        const emailInput = document.getElementById("regEmail");
        const passInput = document.getElementById("regPassword");
        const confirmPassInput = document.getElementById("regConfirmPassword");

        // Helper to update inline validation feedback UI
        const updateFieldFeedback = (input, feedbackId, validationResult) => {
            let feedbackEl = document.getElementById(feedbackId);
            if (!input) return;
            if (!validationResult.isValid) {
                input.classList.add("input-error");
                input.classList.remove("input-success");
                if (feedbackEl) {
                    feedbackEl.className = "validation-msg-error";
                    feedbackEl.textContent = validationResult.message;
                    feedbackEl.style.display = "block";
                }
            } else {
                input.classList.remove("input-error");
                input.classList.add("input-success");
                if (feedbackEl) {
                    feedbackEl.className = "validation-msg-success";
                    feedbackEl.textContent = "✓ Valid";
                    feedbackEl.style.display = "block";
                }
            }
        };

        // Live input listeners for instant feedback
        if (emailInput) {
            emailInput.addEventListener("input", () => {
                if (emailInput.value.length > 0) {
                    const res = window.validateEmailDetailed(emailInput.value);
                    updateFieldFeedback(emailInput, "emailValidationFeedback", res);
                } else {
                    emailInput.classList.remove("input-error", "input-success");
                    const fb = document.getElementById("emailValidationFeedback");
                    if (fb) fb.style.display = "none";
                }
            });
        }

        if (passInput) {
            passInput.addEventListener("input", () => {
                if (passInput.value.length > 0) {
                    const res = window.validatePasswordDetailed(passInput.value);
                    updateFieldFeedback(passInput, "passwordValidationFeedback", res);
                } else {
                    passInput.classList.remove("input-error", "input-success");
                    const fb = document.getElementById("passwordValidationFeedback");
                    if (fb) fb.style.display = "none";
                }
                if (confirmPassInput && confirmPassInput.value.length > 0) {
                    const confirmRes = window.validateConfirmPassword(passInput.value, confirmPassInput.value);
                    updateFieldFeedback(confirmPassInput, "confirmPasswordValidationFeedback", confirmRes);
                }
            });
        }

        if (confirmPassInput) {
            confirmPassInput.addEventListener("input", () => {
                const passVal = passInput ? passInput.value : "";
                if (confirmPassInput.value.length > 0) {
                    const res = window.validateConfirmPassword(passVal, confirmPassInput.value);
                    updateFieldFeedback(confirmPassInput, "confirmPasswordValidationFeedback", res);
                } else {
                    confirmPassInput.classList.remove("input-error", "input-success");
                    const fb = document.getElementById("confirmPasswordValidationFeedback");
                    if (fb) fb.style.display = "none";
                }
            });
        }

        const readFileAsDataUrl = (file) => {
            return new Promise((resolve) => {
                if (!file) return resolve("");
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => resolve("");
                reader.readAsDataURL(file);
            });
        };

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const accountType = document.getElementById("regAccountType").value;
            const name = document.getElementById("regName").value.trim();
            const phone = document.getElementById("regPhone").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("regConfirmPassword") ? document.getElementById("regConfirmPassword").value : password;
            const district = document.getElementById("regDistrict")?.value || "Colombo";
            const categories = document.getElementById("regCategories")?.value || "All Categories";
            const receiverCategory = document.getElementById("regReceiverCategory")?.value || "";
            const address = document.getElementById("regAddress")?.value.trim() || document.getElementById("regReceiverAddress")?.value.trim() || "";
            const city = document.getElementById("regCity")?.value.trim() || "";
            const postalCode = document.getElementById("regPostalCode")?.value.trim() || "";

            if (!name || name.length < 2) {
                showToast("Please enter your full name (at least 2 characters).", "warning");
                document.getElementById("regName")?.focus();
                return;
            }

            const phoneClean = phone.replace(/[^0-9+]/g, '');
            if (!phoneClean || phoneClean.replace(/[^0-9]/g, '').length < 9) {
                showToast("Please enter a valid contact phone number (at least 9 digits).", "warning");
                document.getElementById("regPhone")?.focus();
                return;
            }

            // 1. Comprehensive Email Validation Check
            const emailValidation = window.validateEmailDetailed(email);
            if (!emailValidation.isValid) {
                showToast(emailValidation.message, "warning");
                updateFieldFeedback(emailInput, "emailValidationFeedback", emailValidation);
                emailInput?.focus();
                return;
            }

            // 2. Comprehensive Password Validation Check (Min 8 chars + special character)
            const passwordValidation = window.validatePasswordDetailed(password);
            if (!passwordValidation.isValid) {
                showToast(passwordValidation.message, "warning");
                updateFieldFeedback(passInput, "passwordValidationFeedback", passwordValidation);
                passInput?.focus();
                return;
            }

            // 3. Confirm Password Match Validation Check
            const confirmValidation = window.validateConfirmPassword(password, confirmPassword);
            if (!confirmValidation.isValid) {
                showToast(confirmValidation.message, "warning");
                updateFieldFeedback(confirmPassInput, "confirmPasswordValidationFeedback", confirmValidation);
                confirmPassInput?.focus();
                return;
            }

            // 4. Operating Address & City Validation
            if (!address || address.length < 3) {
                showToast("Please provide your street address / premise location.", "warning");
                document.getElementById("regAddress")?.focus();
                return;
            }

            if (!city || city.length < 2) {
                showToast("Please enter your city / town.", "warning");
                document.getElementById("regCity")?.focus();
                return;
            }

            // 5. Role-Specific Strict Field & Document Upload Validation
            let individualDetails = null;
            if (accountType === 'donor_individual') {
                const nicNumber = document.getElementById("regNicNumber")?.value.trim() || "";
                let nicDoc = document.getElementById("regNicDocUrl")?.value || "";

                const nicInput = document.getElementById("nicUploadInput");
                if (!nicDoc && nicInput && nicInput.files && nicInput.files[0]) {
                    showToast("Attaching NIC document...", "info");
                    nicDoc = await readFileAsDataUrl(nicInput.files[0]);
                    if (document.getElementById("regNicDocUrl")) {
                        document.getElementById("regNicDocUrl").value = nicDoc;
                    }
                }

                if (!nicNumber) {
                    showToast("Please provide your National Identity Card (NIC) number.", "warning");
                    document.getElementById("regNicNumber")?.focus();
                    return;
                }

                // Strict NIC Format Check (Sri Lankan NIC format: 9 digits + V/X or 12 digits)
                const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
                if (!nicRegex.test(nicNumber)) {
                    showToast("Please enter a valid NIC Number (e.g. 199512345678 or 951234567V).", "warning");
                    document.getElementById("regNicNumber")?.focus();
                    return;
                }

                // Mandatory NIC Document Upload Check
                if (!nicDoc) {
                    showToast("Please upload your NIC image or document (PNG, JPG, or PDF) to verify identity.", "warning");
                    if (nicInput) {
                        nicInput.classList.add("input-error");
                        nicInput.focus();
                    }
                    return;
                } else if (nicInput) {
                    nicInput.classList.remove("input-error");
                }

                individualDetails = {
                    nicNumber: nicNumber,
                    nicDocUrl: nicDoc
                };
            }

            let orgDetails = null;
            if (accountType === 'donor_org') {
                const orgNumEl = document.getElementById("regOrgNumber");
                const orgNum = orgNumEl ? orgNumEl.value.trim() : "";
                const orgNameInput = document.getElementById("regOrgName")?.value.trim() || "";
                const repName = document.getElementById("regRepName")?.value.trim() || "";
                const repDesignation = document.getElementById("regRepDesignation")?.value.trim() || "";
                const repPhone = document.getElementById("regRepPhone")?.value.trim() || "";
                let brDoc = document.getElementById("regBrDocUrl")?.value || "";

                const brInput = document.getElementById("brUploadInput");
                if (!brDoc && brInput && brInput.files && brInput.files[0]) {
                    showToast("Attaching BR document...", "info");
                    brDoc = await readFileAsDataUrl(brInput.files[0]);
                    if (document.getElementById("regBrDocUrl")) {
                        document.getElementById("regBrDocUrl").value = brDoc;
                    }
                }

                if (!orgNameInput) {
                    showToast("Please provide your Organisation Name.", "warning");
                    document.getElementById("regOrgName")?.focus();
                    return;
                }

                if (!orgNum) {
                    showToast("Please provide your Official Registration Number (BR / NGO).", "warning");
                    document.getElementById("regOrgNumber")?.focus();
                    return;
                }

                if (!repName) {
                    showToast("Please provide the Authorised Representative Name.", "warning");
                    document.getElementById("regRepName")?.focus();
                    return;
                }

                if (!repDesignation) {
                    showToast("Please provide the Representative Designation.", "warning");
                    document.getElementById("regRepDesignation")?.focus();
                    return;
                }

                if (!repPhone) {
                    showToast("Please provide the Representative Phone Number.", "warning");
                    document.getElementById("regRepPhone")?.focus();
                    return;
                }

                if (!brDoc) {
                    showToast("Please upload your Business Registration (BR) or NGO certification document.", "warning");
                    if (brInput) {
                        brInput.classList.add("input-error");
                        brInput.focus();
                    }
                    return;
                } else if (brInput) {
                    brInput.classList.remove("input-error");
                }

                orgDetails = {
                    orgName: orgNameInput,
                    registrationNumber: orgNum,
                    repName: repName,
                    repDesignation: repDesignation,
                    repPhone: repPhone,
                    brDocUrl: brDoc
                };
            }

            let receiverDetails = null;
            if (accountType === 'receiver') {
                const recNumEl = document.getElementById("regReceiverRegNumber");
                const recNum = recNumEl ? recNumEl.value.trim() : "";
                const recAddress = document.getElementById("regReceiverAddress")?.value.trim() || address;
                const recRep = document.getElementById("regReceiverRep")?.value.trim() || "";
                const bankName = document.getElementById("regBankName")?.value.trim();
                const accountName = document.getElementById("regAccountName")?.value.trim() || name;
                const accountNumber = document.getElementById("regAccountNumber")?.value.trim();
                const bankBranch = document.getElementById("regBankBranch")?.value.trim() || "";
                let recDoc = document.getElementById("regReceiverDocUrl")?.value || "";
                let bankDoc = document.getElementById("regBankDocUrl")?.value || "";

                const recInput = document.getElementById("receiverRegUploadInput");
                if (!recDoc && recInput && recInput.files && recInput.files[0]) {
                    recDoc = await readFileAsDataUrl(recInput.files[0]);
                    if (document.getElementById("regReceiverDocUrl")) document.getElementById("regReceiverDocUrl").value = recDoc;
                }

                const bankInput = document.getElementById("bankDocUploadInput");
                if (!bankDoc && bankInput && bankInput.files && bankInput.files[0]) {
                    bankDoc = await readFileAsDataUrl(bankInput.files[0]);
                    if (document.getElementById("regBankDocUrl")) document.getElementById("regBankDocUrl").value = bankDoc;
                }

                if (!receiverCategory) {
                    showToast("Please select your Receiver Category.", "warning");
                    document.getElementById("regReceiverCategory")?.focus();
                    return;
                }

                if (!recAddress) {
                    showToast("Please enter the Full Official Address of your organisation.", "warning");
                    document.getElementById("regReceiverAddress")?.focus();
                    return;
                }

                if (!recNum) {
                    showToast("Please provide your Official NGO / Government Registration Number.", "warning");
                    document.getElementById("regReceiverRegNumber")?.focus();
                    return;
                }

                if (!recRep) {
                    showToast("Please provide the Authorised Representative Name.", "warning");
                    document.getElementById("regReceiverRep")?.focus();
                    return;
                }

                if (!bankName) {
                    showToast("Please enter your Bank Name.", "warning");
                    document.getElementById("regBankName")?.focus();
                    return;
                }

                if (!accountName) {
                    showToast("Please enter your Official Bank Account Name.", "warning");
                    document.getElementById("regAccountName")?.focus();
                    return;
                }

                if (!accountNumber) {
                    showToast("Please enter your Bank Account Number.", "warning");
                    document.getElementById("regAccountNumber")?.focus();
                    return;
                }

                if (!bankBranch) {
                    showToast("Please enter your Bank Branch.", "warning");
                    document.getElementById("regBankBranch")?.focus();
                    return;
                }

                if (!recDoc) {
                    showToast("Please upload your Official Organisation Registration Certificate.", "warning");
                    if (recInput) {
                        recInput.classList.add("input-error");
                        recInput.focus();
                    }
                    return;
                } else if (recInput) {
                    recInput.classList.remove("input-error");
                }

                if (!bankDoc) {
                    showToast("Please upload your Official Bank Account Proof / statement header.", "warning");
                    if (bankInput) {
                        bankInput.classList.add("input-error");
                        bankInput.focus();
                    }
                    return;
                } else if (bankInput) {
                    bankInput.classList.remove("input-error");
                }

                receiverDetails = {
                    address: recAddress,
                    registrationNumber: recNum,
                    repName: recRep,
                    bankName: bankName,
                    accountName: accountName,
                    accountNumber: accountNumber,
                    bankBranch: bankBranch,
                    registrationDocUrl: recDoc,
                    bankDocUrl: bankDoc
                };
            }

            window.authEngine.register({
                email,
                password,
                name,
                accountType,
                phone,
                district,
                address,
                city,
                postalCode,
                categories,
                receiverCategory,
                individualDetails,
                orgDetails,
                receiverDetails
            });
        });
    }

    const locateBtn = document.getElementById("btnGeolocate");
    if (locateBtn) {
        locateBtn.addEventListener("click", () => {
            if (navigator.geolocation) {
                showToast("Fetching location...", "info");
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById("regLat").value = position.coords.latitude.toFixed(6);
                        document.getElementById("regLng").value = position.coords.longitude.toFixed(6);
                        showToast("Location captured successfully.", "success");
                    },
                    (error) => {
                        showToast("Failed to fetch location. Using default coordinates.", "warning");
                        document.getElementById("regLat").value = "6.927100";
                        document.getElementById("regLng").value = "79.861200";
                    }
                );
            } else {
                showToast("Geolocation is not supported by your browser.", "danger");
            }
        });
    }
});

function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = `toast glass-panel`;
    
    let borderTheme = "var(--color-primary)";
    if (type === "success") borderTheme = "var(--color-success)";
    else if (type === "warning") borderTheme = "var(--color-warning)";
    else if (type === "danger") borderTheme = "var(--color-danger)";
    else if (type === "info") borderTheme = "var(--color-secondary)";
    
    toast.style.borderLeft = `4px solid ${borderTheme}`;
    toast.innerHTML = `<div style="color: var(--color-primary); font-weight: 600; font-size: 0.9rem;">${message}</div>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = "translateY(-10px)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
window.showToast = showToast;
