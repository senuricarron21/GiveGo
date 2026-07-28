// Client-Side Authentication and Role Guard Logic
document.addEventListener("DOMContentLoaded", () => {
    
    function getHelperOrWait() {
        let helper = window.getFirebaseHelper ? window.getFirebaseHelper() : null;
        return helper;
    }

    window.authEngine = {
        login: async (email, password) => {
            try {
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
                
                const db = helper.db();
                const userRef = db.collection("users").doc(authUser.uid);
                const userDoc = await userRef.get();
                
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

                if (userDoc.exists) {
                    const data = userDoc.data();
                    
                    if (authUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || authUser.email.toLowerCase().includes("admin")) {
                        role = "admin";
                        status = "verified";
                    } else if (data.role) {
                        role = data.role;
                        status = data.status || (role === 'donor' ? 'verified' : 'pending');
                    } else if (data.accountType) {
                        role = data.accountType.includes('receiver') ? 'receiver' : 'donor';
                        status = role === 'donor' ? 'verified' : 'pending';
                    }

                    profileData = {
                        uid: authUser.uid,
                        email: authUser.email,
                        name: data.name || name,
                        role: role,
                        status: status,
                        donorType: data.donorType || "individual",
                        receiverCategory: data.receiverCategory || "",
                        district: data.district || "Colombo",
                        location: data.location || { lat: 6.9271, lng: 79.8612 }
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
                
                if (profileData.status === 'suspended') {
                    await helper.auth().signOut();
                    showToast("Your account has been suspended pending administrator review.", "danger");
                    return;
                }

                const syncResponse = await fetch("api/auth_session.php?action=login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profileData)
                });
                const syncResult = await syncResponse.json();
                
                if (syncResult.success) {
                    showToast("Login successful. Redirecting...", "success");
                    setTimeout(() => {
                        window.location.href = "dashboard.php";
                    }, 600);
                } else {
                    throw new Error("PHP Session synchronization failed.");
                }
            } catch (error) {
                let friendlyMsg = error.message;
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    friendlyMsg = "Invalid email address or password. Please check your credentials.";
                } else if (error.code === 'auth/too-many-requests') {
                    friendlyMsg = "Too many failed attempts. Please try again in a few minutes.";
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
                    categories,
                    receiverCategory,
                    orgDetails,
                    receiverDetails,
                    lat,
                    lng
                } = payload;

                const location = { 
                    lat: parseFloat(lat) || 6.9271, 
                    lng: parseFloat(lng) || 79.8612 
                };

                let role = "donor";
                let donorType = "";
                let status = "pending";

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
                
                const userDocData = {
                    uid: authUser.uid,
                    email: authUser.email,
                    name,
                    role,
                    donorType,
                    accountType,
                    phone,
                    district,
                    categories: categories || "All Categories",
                    receiverCategory: receiverCategory || "",
                    orgDetails: orgDetails || null,
                    receiverDetails: receiverDetails || null,
                    location,
                    status,
                    createdAt: new Date().toISOString()
                };

                await db.collection("users").doc(authUser.uid).set(userDocData);

                const syncResponse = await fetch("api/auth_session.php?action=login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        uid: authUser.uid,
                        email: authUser.email,
                        name: name,
                        role: role,
                        donorType,
                        receiverCategory,
                        status: status,
                        location: location
                    })
                });
                const syncResult = await syncResponse.json();

                if (syncResult.success) {
                    if (status === 'pending') {
                        showToast("Registration successful. Account pending Admin verification.", "success");
                    } else {
                        showToast("Registration successful. Welcome to GiveGo.", "success");
                    }
                    setTimeout(() => {
                        window.location.href = "dashboard.php";
                    }, 1000);
                } else {
                    throw new Error("PHP Session synchronization failed.");
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
                if (helper) await helper.auth().signOut();
                
                const syncResponse = await fetch("api/auth_session.php?action=logout");
                const syncResult = await syncResponse.json();
                
                if (syncResult.success) {
                    showToast("Logged out successfully.", "success");
                    setTimeout(() => {
                        window.location.href = "index.php";
                    }, 600);
                }
            } catch (error) {
                showToast("Error logging out.", "danger");
                console.error(error);
            }
        }
    };

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            window.authEngine.login(email, password);
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const accountType = document.getElementById("regAccountType").value;
            const name = document.getElementById("regName").value.trim();
            const phone = document.getElementById("regPhone").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value.trim();
            const district = document.getElementById("regDistrict").value;
            const categories = document.getElementById("regCategories").value;
            const receiverCategory = document.getElementById("regReceiverCategory").value;
            const lat = document.getElementById("regLat").value;
            const lng = document.getElementById("regLng").value;

            if (!email || !password || !name || !phone) {
                showToast("Please fill all required profile fields.", "warning");
                return;
            }
            if (password.length < 6) {
                showToast("Password must be at least 6 characters.", "warning");
                return;
            }

            let orgDetails = null;
            if (accountType === 'donor_org') {
                orgDetails = {
                    orgName: document.getElementById("regOrgName").value.trim(),
                    repName: document.getElementById("regRepName").value.trim(),
                    repDesignation: document.getElementById("regRepDesignation").value.trim(),
                    repPhone: document.getElementById("regRepPhone").value.trim(),
                    brDocUrl: document.getElementById("regBrDocUrl").value || ""
                };
                if (!orgDetails.orgName || !orgDetails.brDocUrl) {
                    showToast("Please provide Organisation Name and Business Registration document.", "warning");
                    return;
                }
            }

            let receiverDetails = null;
            if (accountType === 'receiver') {
                receiverDetails = {
                    address: document.getElementById("regReceiverAddress").value.trim(),
                    repName: document.getElementById("regReceiverRep").value.trim(),
                    bankName: document.getElementById("regBankName").value.trim(),
                    accountName: document.getElementById("regAccountName").value.trim(),
                    accountNumber: document.getElementById("regAccountNumber").value.trim(),
                    bankBranch: document.getElementById("regBankBranch").value.trim(),
                    registrationDocUrl: document.getElementById("regReceiverDocUrl").value || "",
                    bankDocUrl: document.getElementById("regBankDocUrl").value || ""
                };
                if (!receiverDetails.bankName || !receiverDetails.accountNumber || !receiverDetails.registrationDocUrl || !receiverDetails.bankDocUrl) {
                    showToast("Please provide complete bank details and upload required documents.", "warning");
                    return;
                }
            }

            window.authEngine.register({
                email,
                password,
                name,
                accountType,
                phone,
                district,
                categories,
                receiverCategory,
                orgDetails,
                receiverDetails,
                lat,
                lng
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
