// GiveGo Main Application Controller - Enhanced UI, Routing & Notification Engine
document.addEventListener("DOMContentLoaded", () => {
    let currentUser = null;
    let usersList = [];
    let donationsList = [];
    let requestsList = [];
    let announcementsList = [];
    let notificationsList = [];
    let matchesList = [];
    let messagesList = [];
    
    let activeChatMatchId = null;
    let unsubscribes = [];
    let leafletMap = null;

    async function init() {
        const getHelper = () => window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
        let dbHelper = getHelper();
        if (!dbHelper) {
            await new Promise(r => setTimeout(r, 600));
            dbHelper = getHelper();
        }
        if (!dbHelper) return;

        const auth = dbHelper.auth();

        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                const page = window.location.pathname;
                if (!page.includes("index.html") && !page.includes("register.html")) {
                    window.location.href = "index.html";
                }
                return;
            }
            currentUser = user;
            
            try {
                const db = dbHelper.db();
                const doc = await db.collection("users").doc(user.uid).get();
                if (doc.exists) {
                    currentUser = { ...currentUser, ...doc.data() };
                }
            } catch (err) {
                console.error("Error fetching profile: ", err);
            }
            
            setupDataSubscriptions();
            setupRouting();
            setInterval(checkMonetaryEvidenceSLAs, 60000);
        });
    }

    function updateUIProfileAndMenu() {
        if (!currentUser) return;
        const nameEl = document.getElementById("profileDisplayName");
        const roleEl = document.getElementById("profileDisplayRole");
        const welcomeEl = document.getElementById("welcomeHeading");

        if (nameEl) nameEl.textContent = currentUser.name || "User";
        if (roleEl) roleEl.textContent = (currentUser.role || "member").toUpperCase();
        if (welcomeEl) welcomeEl.textContent = `Hello, ${(currentUser.name || "User").split(" ")[0]}`;

        const menuList = document.getElementById("sidebarMenuList");
        if (!menuList) return;

        const roleStr = (currentUser.role || currentUser.accountType || "").toLowerCase();
        const isAdmin = roleStr.includes("admin") || (currentUser.email && currentUser.email.includes("admin"));
        const isDonor = roleStr.includes("donor");
        const isReceiver = roleStr.includes("receiver");

        const unreadNotis = notificationsList.filter(n => !n.read).length;
        const unreadBadgeHTML = unreadNotis > 0 ? `<span class="nav-badge-dot">${unreadNotis}</span>` : '';

        let menuHTML = `<li class="menu-item active"><a href="#overview">Overview</a></li>`;

        if (isAdmin) {
            menuHTML += `
                <li class="menu-item"><a href="#users">Accounts</a></li>
                <li class="menu-item"><a href="#approvals">Approvals</a></li>
                <li class="menu-item"><a href="#system-directory">System Directory</a></li>
            `;
        } else if (isDonor) {
            menuHTML += `
                <li class="menu-item"><a href="#listings">My Donations</a></li>
                <li class="menu-item"><a href="#needs-catalogue">Requests Catalogue</a></li>
                <li class="menu-item"><a href="#matching">Smart Matches</a></li>
                <li class="menu-item"><a href="#chat">Messages</a></li>
            `;
        } else if (isReceiver) {
            menuHTML += `
                <li class="menu-item"><a href="#requests">Material Requests</a></li>
                <li class="menu-item"><a href="#matching">Smart Matches</a></li>
                <li class="menu-item"><a href="#chat">Messages</a></li>
            `;
        }

        menuHTML += `
            <li class="menu-item"><a href="#available-items">Available Items</a></li>
            <li class="menu-item"><a href="#history">History</a></li>
            <li class="menu-item"><a href="#notifications">Notifications ${unreadBadgeHTML}</a></li>
        `;

        menuList.innerHTML = menuHTML;
        
        // Re-bind active class to current hash
        const currentHash = window.location.hash || '#overview';
        document.querySelectorAll("#sidebarMenuList .menu-item").forEach(item => {
            const link = item.querySelector("a");
            if (link && link.getAttribute("href") === currentHash) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
    }

    function updateOverviewStats() {
        if (!currentUser) return;

        updateUIProfileAndMenu();

        const roleStr = (currentUser.role || currentUser.accountType || "").toLowerCase();
        const emailStr = (currentUser.email || "").toLowerCase();

        const isAdmin = roleStr.includes("admin") || emailStr.includes("admin") || currentUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2';
        const isDonor = roleStr.includes("donor");
        const isReceiver = roleStr.includes("receiver");

        const overviewGrid = document.getElementById("overviewStatsGrid");
        if (overviewGrid) {
            if (isAdmin) {
                overviewGrid.innerHTML = `
                    <div class="stat-card glass-panel"><div class="stat-title">PENDING APPROVALS</div><div class="stat-number" id="statPendingApprovalsCount">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">PUBLISHED NEEDS</div><div class="stat-number" id="statTotalRequests">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">MATCH ALLOCATION RATE</div><div class="stat-number" id="statMatchRate">0%</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">REGISTERED USERS</div><div class="stat-number" id="statTotalUsers">0</div></div>
                `;
            } else if (isDonor) {
                overviewGrid.innerHTML = `
                    <div class="stat-card glass-panel"><div class="stat-title">MY PHYSICAL LISTINGS</div><div class="stat-number" id="statMyListings">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">ACTIVE MATCHES</div><div class="stat-number" id="statMyMatches">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">COMPLETED SUPPORT</div><div class="stat-number" id="statCompletedDons">0</div></div>
                `;
            } else if (isReceiver) {
                overviewGrid.innerHTML = `
                    <div class="stat-card glass-panel"><div class="stat-title">MY REQUESTS</div><div class="stat-number" id="statMyRequests">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">MATCHED OFFERS</div><div class="stat-number" id="statReceiverMatches">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">UTILISATION PENDING</div><div class="stat-number" id="statPendingEvidence">0</div></div>
                    <div class="stat-card glass-panel"><div class="stat-title">FULFILLMENT RATE</div><div class="stat-number" id="statFulfillRate">0%</div></div>
                `;
            }
        }

        // --- 1. Admin Overview Metrics ---
        if (isAdmin) {
            const pendingAccountVerifications = usersList.filter(u => u.status === 'pending').length;
            const pendingRequestApprovals = requestsList.filter(r => r.status === 'pending_admin').length;
            const pendingDonationApprovals = donationsList.filter(d => d.status === 'pending_admin').length;
            const totalPendingApprovals = pendingAccountVerifications + pendingRequestApprovals + pendingDonationApprovals;
            
            const totalSystemRequests = requestsList.filter(r => r.status === 'published').length;
            const totalMatches = matchesList.length;
            const confirmedMatches = matchesList.filter(m => m.status === 'confirmed').length;
            const rate = totalMatches > 0 ? Math.round((confirmedMatches / totalMatches) * 100) : 0;
            const totalUsersCount = usersList.length;

            const elPending = document.getElementById("statPendingApprovalsCount");
            if (elPending) elPending.textContent = totalPendingApprovals;

            const elTotalReqs = document.getElementById("statTotalRequests");
            if (elTotalReqs) elTotalReqs.textContent = totalSystemRequests;

            const elRate = document.getElementById("statMatchRate");
            if (elRate) elRate.textContent = `${rate}%`;

            const elUsers = document.getElementById("statTotalUsers");
            if (elUsers) elUsers.textContent = totalUsersCount;
        }

        // --- 2. Donor Overview Metrics ---
        if (isDonor) {
            const myDonations = donationsList.filter(d => d.donorId === currentUser.uid);
            const myOffers = matchesList.filter(m => m.donorId === currentUser.uid);
            const activeMatches = myOffers.filter(m => m.status !== 'rejected');
            const completedCount = myOffers.filter(m => m.status === 'confirmed').length;

            const elListings = document.getElementById("statMyListings");
            if (elListings) elListings.textContent = myDonations.length;

            const elMatches = document.getElementById("statMyMatches");
            if (elMatches) elMatches.textContent = activeMatches.length;

            const elCompleted = document.getElementById("statCompletedDons");
            if (elCompleted) elCompleted.textContent = completedCount;
        }

        // --- 3. Receiver Overview Metrics ---
        if (isReceiver) {
            const myReqs = requestsList.filter(r => r.receiverId === currentUser.uid);
            const myMatches = matchesList.filter(m => m.receiverId === currentUser.uid);
            const myConfirmedMatches = myMatches.filter(m => m.status === 'confirmed').length;
            
            const pendingEvidenceMatches = myMatches.filter(m => 
                m.type === 'monetary' && 
                !m.evidenceSubmitted
            ).length;

            const fulfillRate = myReqs.length > 0 ? Math.round((myConfirmedMatches / myReqs.length) * 100) : 0;

            const elReqs = document.getElementById("statMyRequests");
            if (elReqs) elReqs.textContent = myReqs.length;

            const elRecMatches = document.getElementById("statReceiverMatches");
            if (elRecMatches) elRecMatches.textContent = myMatches.length;

            const elEvidence = document.getElementById("statPendingEvidence");
            if (elEvidence) elEvidence.textContent = pendingEvidenceMatches;

            const elRate = document.getElementById("statFulfillRate");
            if (elRate) elRate.textContent = `${fulfillRate}%`;
        }
    }

    function setupDataSubscriptions() {
        const getHelper = () => window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
        const helper = getHelper();
        if (!helper) return;

        const db = helper.db();
        
        const unsubUsers = db.collection("users").onSnapshot(snapshot => {
            usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const fullProfile = usersList.find(u => u.uid === currentUser.uid || u.id === currentUser.uid);
            if (fullProfile) currentUser = { ...currentUser, ...fullProfile };

            const roleStr = (currentUser.role || "").toLowerCase();
            if (roleStr.includes('admin') || currentUser.email.includes("admin")) {
                renderAdminUsers();
                renderAdminApprovals();
                renderAdminRequestApprovals();
            }
            updateOverviewStats();
        });
        unsubscribes.push(unsubUsers);

        const unsubDonations = db.collection("donations").onSnapshot(snapshot => {
            donationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const roleStr = (currentUser.role || "").toLowerCase();

            if (roleStr.includes('donor')) {
                renderDonorListings();
                renderDonorNeeds();
            }
            if (roleStr.includes('admin') || currentUser.email.includes("admin")) {
                renderAdminRequestApprovals();
                renderAdminDirectory();
            }
            renderAllAvailableItems();
            renderChatMatchesList();
            updateOverviewStats();
        });
        unsubscribes.push(unsubDonations);

        const unsubRequests = db.collection("requests").onSnapshot(snapshot => {
            requestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const roleStr = (currentUser.role || "").toLowerCase();

            if (roleStr.includes('receiver')) renderReceiverRequests();
            else if (roleStr.includes('donor')) renderDonorNeeds();
            if (roleStr.includes('admin') || currentUser.email.includes("admin")) {
                renderAdminRequestApprovals();
                renderAdminDirectory();
            }
            renderHistory();
            renderChatMatchesList();
            checkMonetaryEvidenceSLAs();
            updateOverviewStats();
        });
        unsubscribes.push(unsubRequests);

        const unsubAnnouncements = db.collection("announcements").onSnapshot(snapshot => {
            announcementsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderAnnouncements();
        });
        unsubscribes.push(unsubAnnouncements);

        const unsubNotifications = db.collection("notifications").onSnapshot(snapshot => {
            notificationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                                           .filter(n => n.userId === currentUser.uid);
            renderNotifications();
        });
        unsubscribes.push(unsubNotifications);

        const unsubMatches = db.collection("matches").onSnapshot(snapshot => {
            matchesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const roleStr = (currentUser.role || "").toLowerCase();

            if (roleStr.includes('donor')) renderDonorMatches();
            else if (roleStr.includes('receiver')) renderReceiverMatches();
            if (activeChatMatchId) {
                const match = matchesList.find(m => m.id === activeChatMatchId);
                if (match) renderTrackingTimeline(match);
            }
            renderHistory();
            renderChatMatchesList();
            checkMonetaryEvidenceSLAs();
            updateOverviewStats();
        });
        unsubscribes.push(unsubMatches);

        const unsubMessages = db.collection("messages").onSnapshot(snapshot => {
            messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (activeChatMatchId) renderChatMessages();
        });
        unsubscribes.push(unsubMessages);
    }

    function setupRouting() {
        const handleHashChange = () => {
            const hash = window.location.hash || '#overview';
            
            // Highlight active menu item
            document.querySelectorAll("#sidebarMenuList .menu-item").forEach(item => {
                const link = item.querySelector("a");
                if (link && link.getAttribute("href") === hash) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });

            // Switch visible view panel
            document.querySelectorAll(".dashboard-view-panel").forEach(panel => {
                const targetId = hash.replace("#", "") + "-panel";
                if (panel.id === targetId || (hash === "#overview" && panel.id === "overview-panel")) {
                    panel.style.display = "block";
                    panel.classList.add("fade-in");
                } else {
                    panel.style.display = "none";
                }
            });

            const roleStr = (currentUser.role || "").toLowerCase();

            if (hash === '#chat') {
                renderChatMatchesList();
                renderChatMessages();
            } else if (hash === '#system-directory' || hash === '#users') {
                renderAdminUsers();
                renderAdminDirectory();
            } else if (hash === '#needs-catalogue') {
                renderDonorNeeds();
            } else if (hash === '#available-items') {
                renderAllAvailableItems();
            } else if (hash === '#history') {
                renderHistory();
            } else if (hash === '#notifications') {
                renderNotifications();
            } else if (hash === '#matching') {
                if (roleStr.includes('donor')) renderDonorMatches();
                else if (roleStr.includes('receiver')) renderReceiverMatches();
                initLeafletMap();
            }
            updateOverviewStats();
        };

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();
    }

    function renderNotifications() {
        const container = document.getElementById("notificationsListContainer");
        const dot = document.getElementById("notiDot");
        
        const unread = notificationsList.filter(n => !n.read);
        if (dot) dot.style.display = unread.length > 0 ? "inline-block" : "none";
        if (!container) return;
        
        if (notificationsList.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding: 40px; text-align: center; background: #FFFFFF;">
                    <h4 style="color: var(--color-teal-primary); font-size: 1.1rem; margin-bottom: 8px;">No Active Alerts</h4>
                    <p style="color: var(--color-text-muted); font-size: 0.9rem;">You are up to date! System notifications and donation match alerts will appear here automatically.</p>
                </div>
            `;
            return;
        }

        const sorted = [...notificationsList].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        container.innerHTML = sorted.map(n => {
            const date = new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            return `
                <div class="glass-panel" style="padding: 16px 20px; margin-bottom: 12px; border-left: 5px solid ${n.read ? 'var(--color-border)' : 'var(--color-teal-primary)'}; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="markNotificationRead('${n.id}')">
                    <div>
                        <div style="font-size: 0.95rem; font-weight: ${n.read ? '600' : '800'}; color: var(--color-teal-primary); margin-bottom: 4px;">${n.message}</div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${date}</div>
                    </div>
                    ${n.read ? `<span class="badge badge-info" style="font-size:0.7rem;">Read</span>` : `<span class="badge badge-success" style="font-size:0.7rem;">New Alert</span>`}
                </div>
            `;
        }).join("");
    }

    window.markNotificationRead = async (notiId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("notifications").doc(notiId).update({ read: true });
            updateOverviewStats();
        } catch (err) {
            console.error("Error marking notification read:", err);
        }
    };

    const reqTypeSelect = document.getElementById("reqType");
    if (reqTypeSelect) {
        const toggleReqTypeFields = () => {
            const val = reqTypeSelect.value;
            const secPhys = document.getElementById("secReqPhysical");
            const secMon = document.getElementById("secReqMonetary");
            const secVol = document.getElementById("secReqVolunteer");

            if (secPhys) secPhys.style.display = val === 'physical' ? 'block' : 'none';
            if (secMon) secMon.style.display = val === 'monetary' ? 'block' : 'none';
            if (secVol) secVol.style.display = val === 'volunteer' ? 'block' : 'none';
        };

        reqTypeSelect.addEventListener("change", toggleReqTypeFields);
        toggleReqTypeFields();
    }

    const formRequestMaterials = document.getElementById("formRequestMaterials");
    if (formRequestMaterials) {
        formRequestMaterials.addEventListener("submit", async (e) => {
            e.preventDefault();
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const reqType = document.getElementById("reqType").value;
            const itemName = document.getElementById("reqItemName").value.trim();
            const category = document.getElementById("reqCategory").value;
            const description = document.getElementById("reqDescription").value.trim();

            if (!itemName || !category || !description) {
                showToast("Please complete all required request fields.", "warning");
                return;
            }

            const isHospital = currentUser.receiverCategory === 'Hospital';

            let requestDoc = {
                receiverId: currentUser.uid,
                receiverName: currentUser.name,
                receiverCategory: currentUser.receiverCategory || 'Organisation',
                district: currentUser.district || 'Colombo',
                reqType,
                itemName,
                category,
                description,
                status: "pending_admin",
                quantityReceived: 0,
                amountReceived: 0,
                volunteersAssigned: 0,
                createdAt: new Date().toISOString()
            };

            if (reqType === 'physical') {
                requestDoc.quantityRequired = parseInt(document.getElementById("reqQuantity")?.value) || 1;
                requestDoc.acceptableCondition = document.getElementById("reqCondition")?.value || "Good";
                requestDoc.urgency = document.getElementById("reqUrgency")?.value || "Medium";
            } else if (reqType === 'monetary') {
                requestDoc.amountRequired = parseFloat(document.getElementById("reqAmount")?.value) || 10000;
                requestDoc.deadline = document.getElementById("reqDeadline")?.value || "";
                requestDoc.bankDetails = currentUser.receiverDetails || null;
            } else if (reqType === 'volunteer') {
                if (isHospital) {
                    requestDoc.isHospitalNonClinical = true;
                    requestDoc.requiresSpecialAdminApproval = true;
                }
                requestDoc.volunteersRequired = parseInt(document.getElementById("reqVolunteersCount")?.value) || 5;
                requestDoc.volDateTime = document.getElementById("reqVolDateTime")?.value || "";
                requestDoc.volLocation = document.getElementById("reqVolLocation")?.value || currentUser.district;
                requestDoc.skillsRequired = document.getElementById("reqVolSkills")?.value || "";
                requestDoc.equipmentSupplyMode = document.getElementById("reqEquipmentMode")?.value || "Standard";
                requestDoc.equipmentNeeded = document.getElementById("reqVolEquipmentList")?.value || "";
            }

            try {
                showToast("Submitting request for Admin review...", "info");
                await db.collection("requests").add(requestDoc);
                showToast("Request submitted successfully. Pending Admin review.", "success");
                formRequestMaterials.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Error publishing request.", "danger");
                console.error(err);
            }
        });
    }

    const formPostDonation = document.getElementById("formPostDonation");
    if (formPostDonation) {
        formPostDonation.addEventListener("submit", async (e) => {
            e.preventDefault();
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const itemName = document.getElementById("donItemName").value.trim();
            const category = document.getElementById("donCategory").value;
            const quantity = parseInt(document.getElementById("donQuantity").value) || 1;
            const condition = document.getElementById("donCondition").value;
            const photoUrl = document.getElementById("donPhotoUrl")?.value || "";
            const availability = document.getElementById("donAvailability")?.value || "";
            const deliveryMethod = document.getElementById("donDeliveryMethod").value;
            const description = document.getElementById("donDescription").value.trim();

            try {
                showToast("Submitting material listing for Admin review...", "info");
                await db.collection("donations").add({
                    donorId: currentUser.uid,
                    donorName: currentUser.name,
                    district: currentUser.district || "Colombo",
                    location: currentUser.location || { lat: 6.9271, lng: 79.8612 },
                    itemName,
                    category,
                    quantity,
                    condition,
                    photoUrl,
                    availability,
                    deliveryMethod,
                    description,
                    status: "pending_admin",
                    createdAt: new Date().toISOString()
                });
                showToast("Material listing submitted. Pending Admin approval before publication.", "success");
                formPostDonation.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to post donation.", "danger");
            }
        });
    }

    function renderDonorListings() {
        const body = document.getElementById("donorListingsBody");
        if (!body) return;

        const searchKeyword = (document.getElementById("filterDonorSearch")?.value || "").toLowerCase();
        const statusFilter = document.getElementById("filterDonorStatus")?.value || "all";
        const catFilter = document.getElementById("filterDonorCategory")?.value || "all";

        let myDonations = donationsList.filter(d => d.donorId === currentUser.uid);

        // Sort latest added items first
        myDonations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (searchKeyword) {
            myDonations = myDonations.filter(d => 
                (d.itemName && d.itemName.toLowerCase().includes(searchKeyword)) ||
                (d.category && d.category.toLowerCase().includes(searchKeyword))
            );
        }

        if (statusFilter !== 'all') {
            myDonations = myDonations.filter(d => (d.status || 'pending_admin') === statusFilter);
        }

        if (catFilter !== 'all') {
            myDonations = myDonations.filter(d => d.category === catFilter);
        }

        if (myDonations.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No material listings match the selected filters.</td></tr>`;
            return;
        }

        body.innerHTML = myDonations.map(d => {
            let statusBadge = `<span class="badge badge-warning">Pending Admin</span>`;
            if (d.status === 'available') statusBadge = `<span class="badge badge-success">Approved / Available</span>`;
            else if (d.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected by Admin</span>`;

            return `
                <tr>
                    <td><img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=80&q=80'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
                    <td><strong>${d.itemName}</strong></td>
                    <td>${d.category}</td>
                    <td>${d.quantity} units</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteDonation('${d.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const filterDonorSearch = document.getElementById("filterDonorSearch");
    const filterDonorStatus = document.getElementById("filterDonorStatus");
    const filterDonorCategory = document.getElementById("filterDonorCategory");
    if (filterDonorSearch) filterDonorSearch.addEventListener("input", renderDonorListings);
    if (filterDonorStatus) filterDonorStatus.addEventListener("change", renderDonorListings);
    if (filterDonorCategory) filterDonorCategory.addEventListener("change", renderDonorListings);

    function renderReceiverRequests() {
        const body = document.getElementById("receiverRequestsBody");
        if (!body) return;

        const searchKeyword = (document.getElementById("filterReceiverSearch")?.value || "").toLowerCase();
        const statusFilter = document.getElementById("filterReceiverStatus")?.value || "all";
        const catFilter = document.getElementById("filterReceiverCategory")?.value || "all";

        let myRequests = requestsList.filter(r => r.receiverId === currentUser.uid);

        // Sort latest added items first
        myRequests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (searchKeyword) {
            myRequests = myRequests.filter(r => 
                (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
                (r.category && r.category.toLowerCase().includes(searchKeyword))
            );
        }

        if (statusFilter !== 'all') {
            myRequests = myRequests.filter(r => (r.status || 'pending_admin') === statusFilter);
        }

        if (catFilter !== 'all') {
            myRequests = myRequests.filter(r => r.category === catFilter);
        }

        if (myRequests.length === 0) {
            body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No requests match the selected filters.</td></tr>`;
            return;
        }

        body.innerHTML = myRequests.map(r => {
            let typeBadge = `<span class="badge badge-info">${(r.reqType || 'physical').toUpperCase()}</span>`;
            let targetText = r.quantityRequired ? `${r.quantityRequired} units` : (r.amountRequired ? `LKR ${r.amountRequired}` : `${r.volunteersRequired || 0} volunteers`);
            let fulfilledText = r.quantityReceived ? `${r.quantityReceived} units` : (r.amountReceived ? `LKR ${r.amountReceived}` : `${r.volunteersAssigned || 0} filled`);

            let statusBadge = `<span class="badge badge-warning">Pending Admin</span>`;
            if (r.status === 'published') statusBadge = `<span class="badge badge-success">Approved / Published</span>`;
            else if (r.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected by Admin</span>`;
            else if (r.status === 'fulfilled') statusBadge = `<span class="badge badge-info">Completed</span>`;
            else if (r.status === 'suspended') statusBadge = `<span class="badge badge-danger">Suspended</span>`;

            return `
                <tr>
                    <td>${typeBadge}</td>
                    <td><strong>${r.itemName}</strong></td>
                    <td>${r.category}</td>
                    <td>${targetText}</td>
                    <td>${fulfilledText}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteRequest('${r.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const filterReceiverSearch = document.getElementById("filterReceiverSearch");
    const filterReceiverStatus = document.getElementById("filterReceiverStatus");
    const filterReceiverCategory = document.getElementById("filterReceiverCategory");
    if (filterReceiverSearch) filterReceiverSearch.addEventListener("input", renderReceiverRequests);
    if (filterReceiverStatus) filterReceiverStatus.addEventListener("change", renderReceiverRequests);
    if (filterReceiverCategory) filterReceiverCategory.addEventListener("change", renderReceiverRequests);

    window.deleteDonation = async (donId) => {
        if (!confirm("Are you sure you want to remove this listing?")) return;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("donations").doc(donId).delete();
            showToast("Listing deleted.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to delete.", "danger");
        }
    };

    function renderAdminRequestApprovals() {
        const grid = document.getElementById("adminRequestApprovalsGrid");
        if (!grid) return;

        const pendingReqs = requestsList.filter(r => r.status === 'pending_admin');
        const pendingDons = donationsList.filter(d => d.status === 'pending_admin');

        if (pendingReqs.length === 0 && pendingDons.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 30px;">No pending requests or listings requiring pre-publication review.</div>`;
            return;
        }

        let html = "";

        html += pendingReqs.map(r => {
            const isHospitalVol = (r.receiverCategory === 'Hospital' && r.reqType === 'volunteer');
            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid var(--color-teal-primary);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-info">RECEIVER REQUEST: ${(r.reqType || 'physical').toUpperCase()}</span>
                        <span class="badge badge-warning">${r.district || 'Colombo'}</span>
                    </div>

                    ${isHospitalVol ? `<div class="badge badge-warning" style="width:100%; margin-bottom:10px;">Hospital Non-Clinical Support Approval Required</div>` : ''}

                    <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${r.itemName}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom: 8px;">Receiver: ${r.receiverName} (${r.receiverCategory || 'Receiver'})</div>
                    <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">${r.description}</p>

                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="approveRequest('${r.id}')">Approve & Publish Request</button>
                        <button class="btn btn-danger" style="font-size:0.8rem;" onclick="rejectRequest('${r.id}')">Reject</button>
                    </div>
                </div>
            `;
        }).join("");

        html += pendingDons.map(d => {
            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid #306D29;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-success">DONOR SURPLUS ITEM LISTING</span>
                        <span class="badge badge-warning">${d.district || 'Colombo'}</span>
                    </div>

                    <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${d.itemName}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom: 8px;">Donor: ${d.donorName} | Category: ${d.category}</div>
                    <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">Qty: <strong>${d.quantity} units</strong> | Condition: ${d.condition || 'Good'}</p>

                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="approveDonationListing('${d.id}')">Approve & Publish to Directory</button>
                        <button class="btn btn-danger" style="font-size:0.8rem;" onclick="rejectDonationListing('${d.id}')">Reject</button>
                    </div>
                </div>
            `;
        }).join("");

        grid.innerHTML = html;
    }

    window.approveRequest = async (reqId) => {
        try {
            const req = requestsList.find(r => r.id === reqId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            await db.collection("requests").doc(reqId).update({ status: "published" });

            if (req && req.receiverId) {
                await db.collection("notifications").add({
                    userId: req.receiverId,
                    message: `Great news! Your request "${req.itemName}" has been approved by Admin and is now published to donors.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Request approved and published to Donors.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to approve request.", "danger");
        }
    };

    window.rejectRequest = async (reqId) => {
        try {
            const req = requestsList.find(r => r.id === reqId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            await db.collection("requests").doc(reqId).update({ status: "rejected" });

            if (req && req.receiverId) {
                await db.collection("notifications").add({
                    userId: req.receiverId,
                    message: `Notice: Your support request "${req.itemName}" was reviewed and rejected by Admin.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Request rejected. Notification sent to receiver.", "info");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to reject request.", "danger");
        }
    };

    window.approveDonationListing = async (donId) => {
        try {
            const don = donationsList.find(d => d.id === donId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            await db.collection("donations").doc(donId).update({ status: "available" });

            if (don && don.donorId) {
                await db.collection("notifications").add({
                    userId: don.donorId,
                    message: `Your material listing "${don.itemName}" has been approved by Admin and is now available to receivers.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Donor surplus listing approved and published to Available Items.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to approve donation listing.", "danger");
        }
    };

    window.rejectDonationListing = async (donId) => {
        try {
            const don = donationsList.find(d => d.id === donId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            await db.collection("donations").doc(donId).update({ status: "rejected" });

            if (don && don.donorId) {
                await db.collection("notifications").add({
                    userId: don.donorId,
                    message: `Notice: Your material listing "${don.itemName}" was reviewed and rejected by Admin.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Donor listing rejected.", "info");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to reject donation listing.", "danger");
        }
    };

    function renderReceiverRequests() {
        const body = document.getElementById("receiverRequestsBody");
        if (!body) return;
        
        const myRequests = requestsList.filter(r => r.receiverId === currentUser.uid);
        
        if (myRequests.length === 0) {
            body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No requests submitted yet.</td></tr>`;
            return;
        }

        body.innerHTML = myRequests.map(r => {
            let typeBadge = `<span class="badge badge-info">${(r.reqType || 'physical').toUpperCase()}</span>`;
            let targetText = r.quantityRequired ? `${r.quantityRequired} units` : (r.amountRequired ? `LKR ${r.amountRequired}` : `${r.volunteersRequired || 0} volunteers`);
            let fulfilledText = r.quantityReceived ? `${r.quantityReceived} units` : (r.amountReceived ? `LKR ${r.amountReceived}` : `${r.volunteersAssigned || 0} filled`);

            let statusBadge = `<span class="badge badge-warning">Pending Admin</span>`;
            if (r.status === 'published') statusBadge = `<span class="badge badge-success">Approved / Published</span>`;
            else if (r.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected by Admin</span>`;
            else if (r.status === 'fulfilled') statusBadge = `<span class="badge badge-info">Completed</span>`;
            else if (r.status === 'suspended') statusBadge = `<span class="badge badge-danger">Suspended</span>`;

            return `
                <tr>
                    <td>${typeBadge}</td>
                    <td><strong>${r.itemName}</strong></td>
                    <td>${r.category}</td>
                    <td>${targetText}</td>
                    <td>${fulfilledText}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteRequest('${r.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    window.deleteRequest = async (reqId) => {
        if (!confirm("Are you sure you want to delete this request?")) return;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("requests").doc(reqId).delete();
            showToast("Request deleted.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to delete request.", "danger");
        }
    };

    function renderDonorNeeds() {
        const grid = document.getElementById("donorNeedsGrid");
        if (!grid) return;

        const searchKeyword = (document.getElementById("searchDonorNeeds")?.value || "").toLowerCase();
        const reqTypeFilter = document.getElementById("filterReqType")?.value || "all";
        const catFilter = document.getElementById("filterReqCategory")?.value || "all";
        const districtFilter = document.getElementById("filterReqDistrict")?.value || "all";

        let filtered = requestsList.filter(r => r.status === 'published');

        if (searchKeyword) {
            filtered = filtered.filter(r => 
                (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
                (r.description && r.description.toLowerCase().includes(searchKeyword)) ||
                (r.receiverName && r.receiverName.toLowerCase().includes(searchKeyword))
            );
        }

        if (reqTypeFilter !== 'all') filtered = filtered.filter(r => (r.reqType || 'physical') === reqTypeFilter);
        if (catFilter !== 'all') filtered = filtered.filter(r => r.category === catFilter);
        if (districtFilter !== 'all') filtered = filtered.filter(r => r.district === districtFilter);

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 40px;">No published requests match your criteria.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(r => {
            const reqType = r.reqType || 'physical';
            let actionBtn = '';
            
            if (reqType === 'physical') {
                actionBtn = `<button class="btn btn-primary" style="width:100%; font-size:0.85rem;" onclick="offerPhysicalDonation('${r.id}')">Offer Physical Donation</button>`;
            } else if (reqType === 'monetary') {
                actionBtn = `<button class="btn btn-primary" style="width:100%; font-size:0.85rem;" onclick="openMonetaryModal('${r.id}')">Make Monetary Transfer</button>`;
            } else if (reqType === 'volunteer') {
                actionBtn = `<button class="btn btn-primary" style="width:100%; font-size:0.85rem;" onclick="openVolunteerModal('${r.id}')">Volunteer for Shift</button>`;
            }

            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <span class="badge badge-info">${reqType.toUpperCase()}</span>
                            <span class="badge badge-warning">${r.district || 'Colombo'}</span>
                        </div>

                        <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${r.itemName}</h4>
                        <div style="font-size: 0.8rem; color: var(--color-teal-muted); font-weight: 700; margin-bottom: 8px;">${r.receiverName} (${r.receiverCategory || 'Receiver'})</div>
                        <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 14px; line-height: 1.4;">${r.description}</p>

                        ${reqType === 'physical' ? `
                            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Required: <strong>${r.quantityRequired} units</strong> (Condition: ${r.acceptableCondition || 'Any'})</div>
                        ` : ''}
                        ${reqType === 'monetary' ? `
                            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Target Goal: <strong>LKR ${r.amountRequired}</strong></div>
                        ` : ''}
                        ${reqType === 'volunteer' ? `
                            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 6px;">Volunteers Required: <strong>${r.volunteersRequired}</strong></div>
                            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Equipment: ${r.equipmentNeeded || 'Standard tools'}</div>
                        ` : ''}
                    </div>
                    ${actionBtn}
                </div>
            `;
        }).join("");
    }

    window.offerPhysicalDonation = async (requestId) => {
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;
        const offerQty = prompt(`How many units of "${req.itemName}" would you like to donate?`, "5");
        if (!offerQty || isNaN(offerQty)) return;

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("matches").add({
                requestId: req.id,
                requestName: req.itemName,
                receiverId: req.receiverId,
                receiverName: req.receiverName,
                donorId: currentUser.uid,
                donorName: currentUser.name,
                type: "physical",
                category: req.category,
                quantity: parseInt(offerQty),
                status: "pending_receiver",
                createdAt: new Date().toISOString()
            });
            showToast("Physical donation offer submitted to receiver.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to submit offer.", "danger");
        }
    };

    window.openMonetaryModal = (requestId) => {
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;

        document.getElementById("mdlMonRequestId").value = req.id;
        document.getElementById("mdlMonTitle").textContent = `Monetary Offer: ${req.itemName}`;
        
        const bankBox = document.getElementById("mdlBankDetailsContent");
        const b = req.bankDetails || (usersList.find(u => u.uid === req.receiverId)?.receiverDetails);
        if (b) {
            bankBox.innerHTML = `
                <div><strong>Bank Name:</strong> ${b.bankName || 'N/A'}</div>
                <div><strong>Account Name:</strong> ${b.accountName || 'N/A'}</div>
                <div><strong>Account Number:</strong> ${b.accountNumber || 'N/A'}</div>
                <div><strong>Branch:</strong> ${b.bankBranch || 'N/A'}</div>
            `;
        } else {
            bankBox.innerHTML = `<div>Bank information verified by Admin. Contact representative via messages.</div>`;
        }

        const modal = document.getElementById("modalMonetaryDonation");
        if (modal) modal.classList.add("active");
    };

    const formSubmitMonetaryDonation = document.getElementById("formSubmitMonetaryDonation");
    if (formSubmitMonetaryDonation) {
        formSubmitMonetaryDonation.addEventListener("submit", async (e) => {
            e.preventDefault();
            const reqId = document.getElementById("mdlMonRequestId").value;
            const req = requestsList.find(r => r.id === reqId);
            if (!req) return;

            const amount = parseFloat(document.getElementById("mdlMonAmount").value);
            const date = document.getElementById("mdlMonDate").value;
            const ref = document.getElementById("mdlMonRef").value.trim();
            const receiptUrl = document.getElementById("mdlMonReceiptUrl").value;

            if (!amount || !date || !ref || !receiptUrl) {
                showToast("Please provide payment details and upload transaction receipt.", "warning");
                return;
            }

            try {
                showToast("Submitting monetary donation receipt...", "info");
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                await helper.db().collection("matches").add({
                    requestId: req.id,
                    requestName: req.itemName,
                    receiverId: req.receiverId,
                    receiverName: req.receiverName,
                    donorId: currentUser.uid,
                    donorName: currentUser.name,
                    type: "monetary",
                    amount: amount,
                    transferDate: date,
                    referenceNumber: ref,
                    receiptUrl: receiptUrl,
                    status: "pending_receiver",
                    evidenceSubmitted: false,
                    createdAt: new Date().toISOString()
                });
                showToast("Monetary donation receipt submitted. Awaiting receiver confirmation.", "success");
                document.getElementById("modalMonetaryDonation").classList.remove("active");
                formSubmitMonetaryDonation.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Error submitting payment proof.", "danger");
            }
        });
    }

    function renderAdminUsers() {
        const body = document.getElementById("adminUsersBody");
        if (!body) return;

        const search = (document.getElementById("searchAdminUsers")?.value || "").toLowerCase();
        let filtered = usersList;

        if (search) {
            filtered = filtered.filter(u => 
                (u.name && u.name.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search)) ||
                (u.role && u.role.toLowerCase().includes(search))
            );
        }

        body.innerHTML = filtered.map(u => {
            let statusBadge = `<span class="badge badge-warning">Pending</span>`;
            if (u.status === 'verified') statusBadge = `<span class="badge badge-success">Verified</span>`;
            else if (u.status === 'suspended') statusBadge = `<span class="badge badge-danger">Suspended</span>`;

            return `
                <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td>${(u.role || u.accountType || 'user').toUpperCase()} (${u.donorType || u.receiverCategory || 'User'})</td>
                    <td>${u.district || 'Colombo'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${u.status === 'suspended' ? `
                            <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserStatus('${u.id}', 'verified')">Reactivate</button>
                        ` : `
                            <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserStatus('${u.id}', 'suspended')">Suspend</button>
                        `}
                    </td>
                </tr>
            `;
        }).join("");
    }

    const searchAdminUsers = document.getElementById("searchAdminUsers");
    if (searchAdminUsers) searchAdminUsers.addEventListener("input", renderAdminUsers);

    window.updateUserStatus = async (userId, newStatus) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("users").doc(userId).update({ status: newStatus });
            showToast(`User status updated to ${newStatus}.`, "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to update user status.", "danger");
        }
    };

    function renderAdminApprovals() {
        const grid = document.getElementById("adminApprovalsGrid");
        if (!grid) return;

        const pending = usersList.filter(u => u.status === 'pending');
        const countSpan = document.getElementById("statPendingApprovalsCount");
        if (countSpan) countSpan.textContent = pending.length;

        if (pending.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 30px;">No pending account verifications.</div>`;
            return;
        }

        grid.innerHTML = pending.map(u => {
            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-warning">PENDING VERIFICATION</span>
                        <span style="font-size:0.8rem; font-weight:700; color:var(--color-teal-primary);">${(u.role||u.accountType||'user').toUpperCase()}</span>
                    </div>

                    <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${u.name}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 8px;">Email: ${u.email} | Phone: ${u.phone || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">District: <strong>${u.district || 'Colombo'}</strong></div>

                    <div style="display:flex; gap:10px; margin-top:16px;">
                        <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="updateUserStatus('${u.id}', 'verified')">Approve Account</button>
                        <button class="btn btn-danger" style="font-size:0.8rem;" onclick="updateUserStatus('${u.id}', 'rejected')">Reject</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    async function checkMonetaryEvidenceSLAs() {
        if (!matchesList || matchesList.length === 0) return;
        const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
        const db = helper.db();

        const monetaryMatches = matchesList.filter(m => m.type === 'monetary' && m.status === 'confirmed');
        let pendingEvidenceCount = 0;

        for (let match of monetaryMatches) {
            if (match.evidenceSubmitted) continue;
            pendingEvidenceCount++;
        }

        const statSpan = document.getElementById("statPendingEvidence");
        if (statSpan) statSpan.textContent = pendingEvidenceCount;
    }

    function renderReceiverMatches() {
        const container = document.getElementById("receiverMatchesContainer");
        if (!container) return;

        const myMatches = matchesList.filter(m => m.receiverId === currentUser.uid);

        if (myMatches.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 30px;">No incoming donor offers yet.</div>`;
            return;
        }

        container.innerHTML = myMatches.map(m => {
            let statusBadge = `<span class="badge badge-warning">${m.status}</span>`;
            if (m.status === 'confirmed') statusBadge = `<span class="badge badge-success">Confirmed</span>`;

            let details = '';
            if (m.type === 'physical') {
                details = `Offered Quantity: <strong>${m.quantity} units</strong>`;
            } else if (m.type === 'monetary') {
                details = `Amount: <strong>LKR ${m.amount}</strong> | Ref: ${m.referenceNumber} | <a href="${m.receiptUrl}" target="_blank" style="color:var(--color-teal-primary); font-weight:700;">View Receipt</a>`;
            }

            let evidenceBtn = '';
            if (m.type === 'monetary') {
                if (m.evidenceSubmitted) {
                    evidenceBtn = `<a href="${m.evidenceUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">View Uploaded Evidence</a>`;
                } else {
                    evidenceBtn = `<button class="btn btn-warning" style="font-size:0.75rem; padding:4px 8px;" onclick="uploadUtilisationEvidence('${m.id}')">Upload 14-Day Evidence</button>`;
                }
            }

            return `
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 6px;">From Donor: <strong>${m.donorName}</strong></div>
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">${details}</div>

                    <div style="display:flex; gap:8px; align-items:center;">
                        ${m.status === 'pending_receiver' ? `
                            <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem;" onclick="confirmOffer('${m.id}')">Accept & Confirm Receipt</button>
                        ` : ''}
                        ${evidenceBtn}
                    </div>
                </div>
            `;
        }).join("");
    }

    window.confirmOffer = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("matches").doc(matchId).update({
                status: "confirmed",
                confirmedAt: new Date().toISOString()
            });
            showToast("Donation offer confirmed. Notification sent to donor.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to confirm offer.", "danger");
        }
    };

    function renderDonorMatches() {
        const container = document.getElementById("donorMatchesContainer");
        if (!container) return;

        const myOffers = matchesList.filter(m => m.donorId === currentUser.uid);

        if (myOffers.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 30px;">You have not submitted any offers yet.</div>`;
            return;
        }

        container.innerHTML = myOffers.map(m => {
            let statusBadge = `<span class="badge badge-warning">${m.status}</span>`;
            if (m.status === 'confirmed') statusBadge = `<span class="badge badge-success">Confirmed by Receiver</span>`;

            return `
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700;">To Receiver: ${m.receiverName}</div>
                </div>
            `;
        }).join("");
    }

    function renderAllAvailableItems() {
        const grid = document.getElementById("allAvailableItemsGrid");
        if (!grid) return;

        const search = (document.getElementById("searchAllAvailableItems")?.value || "").toLowerCase();
        let filtered = donationsList.filter(d => d.status === 'available');

        if (search) {
            filtered = filtered.filter(d => 
                (d.itemName && d.itemName.toLowerCase().includes(search)) ||
                (d.category && d.category.toLowerCase().includes(search)) ||
                (d.donorName && d.donorName.toLowerCase().includes(search))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 30px;">No approved available material donations found.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(d => `
            <div class="glass-panel" style="padding: 12px; background: #FFFFFF; border-radius: 8px; border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&q=80'}" style="width: 100%; height: 95px; border-radius: 6px; object-fit: cover; margin-bottom: 8px;">
                    <h4 style="font-size: 0.85rem; font-weight: 800; color: var(--color-teal-primary); margin-bottom: 4px; line-height: 1.2;">${d.itemName}</h4>
                    <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 4px;">Category: <strong>${d.category}</strong></div>
                    <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 6px;">Qty: <strong>${d.quantity} units</strong></div>
                </div>
                <div style="font-size: 0.75rem; color: var(--color-teal-muted); font-weight: 700; border-top: 1px solid #F5EFE0; padding-top: 6px;">
                    Donor: ${d.donorName} (${d.district || 'Colombo'})
                </div>
            </div>
        `).join("");
    }

    const searchAllAvailableItems = document.getElementById("searchAllAvailableItems");
    if (searchAllAvailableItems) searchAllAvailableItems.addEventListener("input", renderAllAvailableItems);

    function renderHistory() {
        const header = document.getElementById("historyTableHeader");
        const body = document.getElementById("historyTableBody");
        if (!header || !body) return;

        header.innerHTML = `
            <th>Date</th>
            <th>Item / Request</th>
            <th>Type</th>
            <th>Donor / Receiver</th>
            <th>Status</th>
            <th>Receipt / Evidence</th>
        `;

        const completedMatches = matchesList.filter(m => 
            m.donorId === currentUser.uid || m.receiverId === currentUser.uid || (currentUser.role || "").includes('admin')
        );

        if (completedMatches.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No transaction records in history archive.</td></tr>`;
            return;
        }

        body.innerHTML = completedMatches.map(m => {
            const date = new Date(m.createdAt).toLocaleDateString();
            const partner = currentUser.uid === m.donorId ? `Receiver: ${m.receiverName}` : `Donor: ${m.donorName}`;
            let docs = '-';
            if (m.type === 'monetary') {
                docs = `
                    <div style="display:flex; gap:6px;">
                        ${m.receiptUrl ? `<a href="${m.receiptUrl}" target="_blank" style="color:var(--color-teal-primary); font-weight:700; font-size:0.75rem;">Receipt</a>` : ''}
                        ${m.evidenceUrl ? `<a href="${m.evidenceUrl}" target="_blank" style="color:var(--color-teal-muted); font-weight:700; font-size:0.75rem;">Evidence</a>` : ''}
                    </div>
                `;
            }

            return `
                <tr>
                    <td>${date}</td>
                    <td><strong>${m.requestName}</strong></td>
                    <td><span class="badge badge-info">${(m.type || 'physical').toUpperCase()}</span></td>
                    <td>${partner}</td>
                    <td><span class="badge badge-success">${m.status}</span></td>
                    <td>${docs}</td>
                </tr>
            `;
        }).join("");
    }

    function renderAnnouncements() {
        const containers = document.querySelectorAll("#announcementsContainer");
        containers.forEach(container => {
            if (!container) return;
            if (announcementsList.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 20px;">No active announcements.</div>`;
                return;
            }
            container.innerHTML = announcementsList.map(a => `
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FBF5DD; border-left: 4px solid var(--color-teal-primary);">
                    <h4 style="font-size: 0.95rem; color: var(--color-teal-primary); margin-bottom: 4px;">${a.title}</h4>
                    <p style="font-size: 0.85rem; color: var(--color-text-dark);">${a.content}</p>
                </div>
            `).join("");
        });
    }

    const formPublishAnnouncement = document.getElementById("formPublishAnnouncement");
    if (formPublishAnnouncement) {
        formPublishAnnouncement.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("annTitle").value.trim();
            const content = document.getElementById("annContent").value.trim();
            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                await helper.db().collection("announcements").add({
                    title,
                    content,
                    createdAt: new Date().toISOString()
                });
                showToast("Announcement published.", "success");
                formPublishAnnouncement.reset();
            } catch (err) {
                showToast("Failed to publish announcement.", "danger");
            }
        });
    }

    function renderChatMatchesList() {
        const container = document.getElementById("chatMatchesList");
        if (!container) return;

        const chatMatches = matchesList.filter(m => m.donorId === currentUser.uid || m.receiverId === currentUser.uid);

        if (chatMatches.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 20px; font-size:0.85rem;">No active connections for chat.</div>`;
            return;
        }

        container.innerHTML = chatMatches.map(m => {
            const partner = currentUser.uid === m.donorId ? m.receiverName : m.donorName;
            const activeClass = m.id === activeChatMatchId ? 'active' : '';
            return `
                <div class="chat-item ${activeClass}" onclick="selectChatMatch('${m.id}')">
                    <div style="font-weight: 700; color: var(--color-teal-primary); font-size: 0.9rem;">${partner}</div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">${m.requestName} (${(m.type||'physical').toUpperCase()})</div>
                </div>
            `;
        }).join("");
    }

    window.selectChatMatch = (matchId) => {
        activeChatMatchId = matchId;
        const match = matchesList.find(m => m.id === matchId);
        if (match) {
            const partner = currentUser.uid === match.donorId ? match.receiverName : match.donorName;
            const peerName = document.getElementById("chatPeerName");
            if (peerName) peerName.textContent = partner;
            renderTrackingTimeline(match);
        }
        renderChatMatchesList();
        renderChatMessages();
    };

    function renderTrackingTimeline(match) {
        const container = document.getElementById("trackingStatusTimeline");
        if (!container) return;

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; font-size: 0.8rem; font-weight:700;">
                <span style="color:var(--color-teal-primary)">1. Offer</span>
                <span>2. Confirmed</span>
                <span>3. 14D SLA</span>
                <span>4. Completed</span>
            </div>
        `;
    }

    function renderChatMessages() {
        const container = document.getElementById("chatMessagesContainer");
        if (!container || !activeChatMatchId) return;

        const msgs = messagesList.filter(m => m.matchId === activeChatMatchId)
                                .sort((a,b) => new Date(a.createdAt) - new Date(a.createdAt));

        if (msgs.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 30px; font-size:0.85rem;">No messages yet. Send a message below.</div>`;
            return;
        }

        container.innerHTML = msgs.map(m => {
            const isOutgoing = m.senderId === currentUser.uid;
            return `
                <div class="message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
                    ${m.text}
                </div>
            `;
        }).join("");

        container.scrollTop = container.scrollHeight;
    }

    const btnSendChatMessage = document.getElementById("btnSendChatMessage");
    const chatMessageInput = document.getElementById("chatMessageInput");
    if (btnSendChatMessage && chatMessageInput) {
        const sendMsg = async () => {
            const text = chatMessageInput.value.trim();
            if (!text || !activeChatMatchId) return;

            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                await helper.db().collection("messages").add({
                    matchId: activeChatMatchId,
                    senderId: currentUser.uid,
                    senderName: currentUser.name,
                    text,
                    createdAt: new Date().toISOString()
                });
                chatMessageInput.value = "";
            } catch (err) {
                showToast("Failed to send message.", "danger");
            }
        };

        btnSendChatMessage.addEventListener("click", sendMsg);
        chatMessageInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') sendMsg();
        });
    }

    function initLeafletMap() {
        const container = document.getElementById("liveSimulatedMap");
        if (!container || leafletMap) return;

        try {
            const defaultLat = currentUser.location ? currentUser.location.lat : 6.9271;
            const defaultLng = currentUser.location ? currentUser.location.lng : 79.8612;

            leafletMap = L.map('liveSimulatedMap').setView([defaultLat, defaultLng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap);

            L.marker([defaultLat, defaultLng]).addTo(leafletMap)
                .bindPopup(`<b>${currentUser.name}</b><br>Your Location`)
                .openPopup();
        } catch (err) {
            console.error("Map initialization error:", err);
        }
    }

    function renderAdminDirectory() {
        const donGrid = document.getElementById("adminDonationsGrid");
        const reqGrid = document.getElementById("adminRequestsGrid");
        if (!donGrid || !reqGrid) return;

        const searchDon = (document.getElementById("searchAdminDonations")?.value || "").toLowerCase();
        const searchReq = (document.getElementById("searchAdminRequests")?.value || "").toLowerCase();

        let dons = donationsList;
        if (searchDon) dons = dons.filter(d => d.itemName.toLowerCase().includes(searchDon));

        let reqs = requestsList;
        if (searchReq) reqs = reqs.filter(r => r.itemName.toLowerCase().includes(searchReq));

        donGrid.innerHTML = dons.map(d => `
            <div class="glass-panel" style="padding: 10px 14px; background: #FFFFFF; font-size: 0.85rem;">
                <strong>${d.itemName}</strong> (${d.category}) - Qty: ${d.quantity} | Donor: ${d.donorName} (${d.status.toUpperCase()})
            </div>
        `).join("");

        reqGrid.innerHTML = reqs.map(r => `
            <div class="glass-panel" style="padding: 10px 14px; background: #FFFFFF; font-size: 0.85rem;">
                <strong>${r.itemName}</strong> (${(r.reqType||'physical').toUpperCase()}) | Receiver: ${r.receiverName} (${r.status.toUpperCase()})
            </div>
        `).join("");
    }

    init();
});
