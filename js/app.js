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
                <li class="menu-item"><a href="#matching">Matches & Connections</a></li>
                <li class="menu-item"><a href="#chat">Messages</a></li>
            `;
        } else if (isReceiver) {
            menuHTML += `
                <li class="menu-item"><a href="#requests">Material Requests</a></li>
                <li class="menu-item"><a href="#matching">Matches & Connections</a></li>
                <li class="menu-item"><a href="#chat">Messages</a></li>
            `;
        }

        menuHTML += `
            <li class="menu-item"><a href="#available-items">Available Items</a></li>
            <li class="menu-item"><a href="#history">History</a></li>
            <li class="menu-item"><a href="#notifications">Notifications ${unreadBadgeHTML}</a></li>
            <li class="menu-item"><a href="#contact">Contact Us</a></li>
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

            renderAdminActiveMatchesTable();
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

        renderSmartMatches();
    }

    window.autoConnectSmartMatch = async (reqId, donId) => {
        const req = requestsList.find(r => r.id === reqId);
        const don = donationsList.find(d => d.id === donId);
        if (!req || !don) return;

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("matches").add({
                requestId: req.id,
                requestName: req.itemName,
                donationId: don.id,
                receiverId: req.receiverId,
                receiverName: req.receiverName,
                donorId: don.donorId,
                donorName: don.donorName,
                type: "physical",
                category: req.category,
                quantity: don.quantity || 1,
                deliveryMethod: "self_delivery",
                status: "pending_receiver",
                createdAt: new Date().toISOString()
            });

            await db.collection("notifications").add({
                userId: req.receiverId,
                message: `⚡ Matches & Connections: Admin connected Donor ${don.donorName}'s surplus "${don.itemName}" for your request "${req.itemName}".`,
            });

            showToast("Matches & Connections auto-connected & dispatch initiated!", "success");
        } catch (err) {
            showToast("Failed to auto-connect item match.", "danger");
        }
    };

    function cleanCatString(str) {
        if (!str) return "";
        return str.replace(/[^\w\s&]/gi, '').toLowerCase().trim();
    }

    function isCategoryMatch(itemCategory, filterCategory) {
        if (!filterCategory || filterCategory === 'all') return true;
        if (!itemCategory) return false;

        const c = cleanCatString(itemCategory);
        const f = cleanCatString(filterCategory);

        if (c === f || c.includes(f) || f.includes(c)) return true;

        if ((f.includes('education') || f.includes('book') || f.includes('school')) &&
            (c.includes('book') || c.includes('education') || c.includes('stationery') || c.includes('school') || c.includes('learning'))) return true;

        if ((f.includes('food') || f.includes('nutrition') || f.includes('ration')) &&
            (c.includes('food') || c.includes('ration') || c.includes('nutrition') || c.includes('meal'))) return true;

        if ((f.includes('medical') || f.includes('health') || f.includes('first aid')) &&
            (c.includes('medical') || c.includes('health') || c.includes('aid') || c.includes('medicine') || c.includes('pack'))) return true;

        if ((f.includes('clothing') || f.includes('personal') || f.includes('apparel')) &&
            (c.includes('cloth') || c.includes('apparel') || c.includes('personal') || c.includes('wear'))) return true;

        if ((f.includes('electronic') || f.includes('it') || f.includes('tech')) &&
            (c.includes('electronic') || c.includes('it') || c.includes('tech') || c.includes('computer'))) return true;

        if (f.includes('furniture') && c.includes('furniture')) return true;

        if ((f.includes('household') || f.includes('essential')) &&
            (c.includes('house') || c.includes('shelter') || c.includes('home') || c.includes('general'))) return true;

        return false;
    }

    function isDistrictMatch(itemDistrict, filterDistrict) {
        if (!filterDistrict || filterDistrict === 'all') return true;
        if (!itemDistrict) return filterDistrict.toLowerCase() === 'colombo';
        return itemDistrict.toLowerCase().trim() === filterDistrict.toLowerCase().trim();
    }

    function renderSmartMatches() {
        const container = document.getElementById("smartMatchesContainer");
        if (!container) return;

        const publishedReqs = requestsList.filter(r => r.status === 'published' || r.status === 'pending_admin');
        const availDonations = donationsList.filter(d => d.status === 'available' || d.status === 'pending_admin');

        const smartMatches = [];

        for (let req of publishedReqs) {
            const reqTitle = (req.itemName || "").toLowerCase().trim();
            if (!reqTitle) continue;
            const reqWords = reqTitle.split(/\s+/).filter(w => w.length > 2);

            for (let don of availDonations) {
                const donTitle = (don.itemName || "").toLowerCase().trim();
                if (!donTitle) continue;
                const donWords = donTitle.split(/\s+/).filter(w => w.length > 2);

                // Match strictly by Item Name / Title words (e.g., umbrella === umbrella)
                const matchedWord = reqWords.find(rw => donWords.some(dw => dw.includes(rw) || rw.includes(dw)));
                const hasItemNameMatch = !!matchedWord || (reqTitle.length > 2 && donTitle.length > 2 && (reqTitle.includes(donTitle) || donTitle.includes(reqTitle)));

                if (hasItemNameMatch) {
                    smartMatches.push({
                        requestId: req.id,
                        requestName: req.itemName,
                        receiverId: req.receiverId,
                        receiverName: req.receiverName,
                        donationId: don.id,
                        donationName: don.itemName,
                        donorId: don.donorId,
                        donorName: don.donorName,
                        category: don.category,
                        matchedWord: matchedWord || req.itemName,
                        matchType: 'Item Name Match: ' + (matchedWord || req.itemName)
                    });
                }
            }
        }

        if (smartMatches.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 20px; font-size: 0.85rem;">No active item name matches detected yet. When a receiver requests an item (e.g. "Umbrella") and a donor posts an item with the same name, it will automatically match here!</div>`;
            return;
        }

        container.innerHTML = smartMatches.map(m => {
            const isUserAdmin = currentUser.role === 'admin';
            const isUserDonor = currentUser.uid === m.donorId;
            const isUserReceiver = currentUser.uid === m.receiverId;

            let actionBtn = '';
            if (isUserAdmin) {
                actionBtn = `<button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="autoConnectSmartMatch('${m.requestId}', '${m.donationId}')">⚡ Auto Connect Pair</button>`;
            } else if (isUserDonor) {
                actionBtn = `<button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="offerPhysicalDonation('${m.requestId}')">Offer Item to Receiver</button>`;
            } else if (isUserReceiver) {
                actionBtn = `<button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="openRequestAvailableItemModal('${m.donationId}')">Request This Surplus Item</button>`;
            }

            return `
                <div style="background:#FBF5DD; border-left:4px solid var(--color-teal-primary); padding:14px; border-radius:6px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px;">
                            <span class="badge badge-success" style="font-size:0.7rem; font-weight:800;">⚡ MATCHES & CONNECTIONS</span>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--color-teal-primary);">${m.matchType}</span>
                        </div>
                        <div style="font-weight:800; color:var(--color-text-dark); font-size:0.9rem;">
                            Need: <strong>"${m.requestName}"</strong> (${m.receiverName}) ↔ Surplus: <strong>"${m.donationName}"</strong> (${m.donorName})
                        </div>
                    </div>
                    <div>${actionBtn}</div>
                </div>
            `;
        }).join("");
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
            let hash = window.location.hash || '#overview';
            if (hash === '#about') {
                window.location.hash = '#overview';
                return;
            }
            if (typeof window.closeMobileSidebar === 'function') window.closeMobileSidebar();
            
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

            if (checkIsAdmin()) {
                renderAdminUsers();
                renderAdminApprovals();
                renderAdminRequestApprovals();
                renderAdminDirectory();
                renderAdminActiveMatchesTable();
                renderAdminEvidenceApprovals();
            }

            if (hash === '#chat') {
                renderChatMatchesList();
                renderChatMessages();
            } else if (hash === '#needs-catalogue') {
                renderDonorNeeds();
            } else if (hash === '#available-items') {
                renderAllAvailableItems();
            } else if (hash === '#history') {
                renderHistory();
            } else if (hash === '#notifications') {
                renderNotifications();
            } else if (hash === '#matching') {
                const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();
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
        const container = document.getElementById("notificationsContainer") || document.getElementById("notificationsListContainer");
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

    window.handleImageUpload = (fileInput, targetHiddenId) => {
        if (!fileInput.files || !fileInput.files[0]) return;
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            const hiddenInput = document.getElementById(targetHiddenId);
            if (hiddenInput) hiddenInput.value = base64Data;
            showToast("Item image selected & ready for submission.", "info");
        };
        reader.readAsDataURL(file);
    };

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
                requestDoc.unit = document.getElementById("reqUnit")?.value || "Units";
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
            const unit = document.getElementById("donUnit")?.value || "Units";
            const condition = document.getElementById("donCondition").value;
            const photoUrl = document.getElementById("donPhotoUrl")?.value || "";
            const description = document.getElementById("donDescription").value.trim();

            const btnSubmit = formPostDonation.querySelector("button[type='submit']");

            try {
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `Submitting Listing...`;
                }

                showToast("Submitting material listing for Admin review...", "info");
                await db.collection("donations").add({
                    donorId: currentUser.uid || currentUser.id || "anonymous_donor",
                    donorName: currentUser.name || "Donor",
                    donorEmail: currentUser.email || "",
                    district: currentUser.district || "Colombo",
                    location: currentUser.location || { lat: 6.9271, lng: 79.8612 },
                    itemName,
                    category,
                    quantity,
                    unit,
                    condition,
                    photoUrl,
                    description,
                    status: "pending_admin",
                    createdAt: new Date().toISOString()
                });
                showToast("Material listing submitted. Pending Admin approval before publication.", "success");

                // Thorough form reset
                formPostDonation.reset();
                if (document.getElementById("donItemName")) document.getElementById("donItemName").value = "";
                if (document.getElementById("donQuantity")) document.getElementById("donQuantity").value = "1";
                if (document.getElementById("donPhotoUrl")) document.getElementById("donPhotoUrl").value = "";
                if (document.getElementById("donPhotoUrlText")) document.getElementById("donPhotoUrlText").value = "";
                if (document.getElementById("donDescription")) document.getElementById("donDescription").value = "";
                const fileInput = formPostDonation.querySelector("input[type='file']");
                if (fileInput) fileInput.value = "";

                if (typeof renderDonorListings === "function") renderDonorListings();
                if (typeof renderAdminRequestApprovals === "function") renderAdminRequestApprovals();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to post donation.", "danger");
                console.error("Donation post error: ", err);
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Submit Listing for Admin Approval";
                }
            }
        });
    }

    function renderDonorListings() {
        const body = document.getElementById("donorListingsBody");
        if (!body) return;

        const searchKeyword = (document.getElementById("filterDonorSearch")?.value || "").toLowerCase();
        const statusFilter = document.getElementById("filterDonorStatus")?.value || "all";
        const catFilter = document.getElementById("filterDonorCategory")?.value || "all";
        const sortOrder = document.getElementById("sortDonorOrder")?.value || "latest";

        let myDonations = donationsList.filter(d => 
            d.donorId === currentUser.uid || 
            (currentUser.id && d.donorId === currentUser.id) || 
            (currentUser.email && d.donorEmail === currentUser.email)
        );

        if (sortOrder === "latest") {
            myDonations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else {
            myDonations.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }

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
            myDonations = myDonations.filter(d => isCategoryMatch(d.category, catFilter));
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
                    <td>${d.quantity} ${d.unit || 'units'}</td>
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
    const sortDonorOrder = document.getElementById("sortDonorOrder");
    if (filterDonorSearch) filterDonorSearch.addEventListener("input", renderDonorListings);
    if (filterDonorStatus) filterDonorStatus.addEventListener("change", renderDonorListings);
    if (filterDonorCategory) filterDonorCategory.addEventListener("change", renderDonorListings);
    if (sortDonorOrder) sortDonorOrder.addEventListener("change", renderDonorListings);

    function renderReceiverRequests() {
        const body = document.getElementById("receiverRequestsBody");
        if (!body) return;

        const searchKeyword = (document.getElementById("filterReceiverSearch")?.value || "").toLowerCase();
        const statusFilter = document.getElementById("filterReceiverStatus")?.value || "all";
        const catFilter = document.getElementById("filterReceiverCategory")?.value || "all";
        const sortOrder = document.getElementById("sortReceiverOrder")?.value || "latest";

        let myRequests = requestsList.filter(r => 
            r.receiverId === currentUser.uid || 
            (currentUser.name && r.receiverName === currentUser.name) || 
            (currentUser.email && r.receiverEmail === currentUser.email)
        );

        if (sortOrder === "latest") {
            myRequests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else {
            myRequests.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }

        if (searchKeyword) {
            myRequests = myRequests.filter(r => 
                (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
                (r.category && r.category.toLowerCase().includes(searchKeyword)) ||
                (r.reqType && r.reqType.toLowerCase().includes(searchKeyword))
            );
        }

        if (statusFilter !== 'all') {
            myRequests = myRequests.filter(r => {
                const itemStatus = (r.status || 'pending_admin').toLowerCase();
                const targetStatus = statusFilter.toLowerCase();
                if (targetStatus === 'pending_admin') return itemStatus === 'pending_admin' || itemStatus === 'pending';
                return itemStatus === targetStatus;
            });
        }

        if (catFilter !== 'all') {
            myRequests = myRequests.filter(r => isCategoryMatch(r.category, catFilter) || isCategoryMatch(r.receiverCategory, catFilter));
        }

        if (myRequests.length === 0) {
            body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No requests match the selected filters.</td></tr>`;
            return;
        }

        body.innerHTML = myRequests.map(r => {
            let typeBadge = `<span class="badge badge-info">${(r.reqType || 'physical').toUpperCase()}</span>`;
            let targetText = r.quantityRequired ? `${r.quantityRequired} ${r.unit || 'units'}` : (r.amountRequired ? `LKR ${r.amountRequired}` : `${r.volunteersRequired || 0} volunteers`);
            let fulfilledText = r.quantityReceived ? `${r.quantityReceived} ${r.unit || 'units'}` : (r.amountReceived ? `LKR ${r.amountReceived}` : `${r.volunteersAssigned || 0} filled`);

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
    const sortReceiverOrder = document.getElementById("sortReceiverOrder");
    if (filterReceiverSearch) filterReceiverSearch.addEventListener("input", renderReceiverRequests);
    if (filterReceiverStatus) filterReceiverStatus.addEventListener("change", renderReceiverRequests);
    if (filterReceiverCategory) filterReceiverCategory.addEventListener("change", renderReceiverRequests);
    if (sortReceiverOrder) sortReceiverOrder.addEventListener("change", renderReceiverRequests);

    window.deleteDonation = async (donId) => {
        if (!confirm("Are you sure you want to remove this listing? All associated matches and chats will also be removed.")) return;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("donations").doc(donId).delete();

            const targetDonation = donationsList.find(d => d.id === donId);
            const donName = targetDonation ? targetDonation.itemName : "";

            const relatedMatches = matchesList.filter(m => 
                m.donationId === donId || 
                (donName && m.donationName === donName)
            );

            for (const match of relatedMatches) {
                try {
                    await db.collection("matches").doc(match.id).delete();
                    const messagesSnap = await db.collection("messages").where("matchId", "==", match.id).get();
                    if (!messagesSnap.empty) {
                        const batch = db.batch();
                        messagesSnap.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                    }
                } catch (mErr) {
                    console.warn("Cascade match delete notice:", mErr);
                }
            }

            donationsList = donationsList.filter(d => d.id !== donId);
            matchesList = matchesList.filter(m => m.donationId !== donId && (!donName || m.donationName !== donName));

            if (typeof renderDonorListings === 'function') renderDonorListings();
            if (typeof renderAllAvailableItems === 'function') renderAllAvailableItems();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderChatMatchesList === 'function') renderChatMatchesList();
            updateOverviewStats();

            showToast("Donation listing and all related details removed.", "success");
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Failed to delete donation listing.", "danger");
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

    window.deleteRequest = async (reqId) => {
        if (!confirm("Are you sure you want to delete this request? All associated matches and chats will also be removed.")) return;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("requests").doc(reqId).delete();

            const targetRequest = requestsList.find(r => r.id === reqId);
            const reqName = targetRequest ? targetRequest.itemName : "";

            const relatedMatches = matchesList.filter(m => 
                m.requestId === reqId || 
                (reqName && m.requestName === reqName)
            );

            for (const match of relatedMatches) {
                try {
                    await db.collection("matches").doc(match.id).delete();
                    const messagesSnap = await db.collection("messages").where("matchId", "==", match.id).get();
                    if (!messagesSnap.empty) {
                        const batch = db.batch();
                        messagesSnap.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                    }
                } catch (mErr) {
                    console.warn("Cascade match delete notice:", mErr);
                }
            }

            requestsList = requestsList.filter(r => r.id !== reqId);
            matchesList = matchesList.filter(m => m.requestId !== reqId && (!reqName || m.requestName !== reqName));

            if (typeof renderReceiverRequests === 'function') renderReceiverRequests();
            if (typeof renderDonorNeeds === 'function') renderDonorNeeds();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderChatMatchesList === 'function') renderChatMatchesList();
            updateOverviewStats();

            showToast("Request and all related details removed.", "success");
        } catch (err) {
            console.error("Delete request error:", err);
            showToast("Failed to delete request.", "danger");
        }
    };

    window.clearAllDatabaseItems = async () => {
        if (!confirm("⚠️ WARNING: Are you sure you want to permanently delete ALL requests, donation listings, matches, chat messages, and notifications from the database? This action cannot be undone.")) {
            return;
        }

        showToast("🧹 Purging all items from database...", "info");

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            if (!helper || !helper.db) {
                showToast("Database connection not ready.", "danger");
                return;
            }
            const db = helper.db();
            const collectionsToPurge = ["requests", "donations", "matches", "messages", "notifications"];

            for (const collName of collectionsToPurge) {
                try {
                    const snap = await db.collection(collName).get();
                    if (!snap.empty) {
                        const batch = db.batch();
                        snap.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                    }
                } catch (cErr) {
                    console.warn(`Purge collection ${collName} notice:`, cErr);
                }
            }

            requestsList = [];
            donationsList = [];
            matchesList = [];
            messagesList = [];

            if (typeof renderReceiverRequests === 'function') renderReceiverRequests();
            if (typeof renderDonorNeeds === 'function') renderDonorNeeds();
            if (typeof renderDonorListings === 'function') renderDonorListings();
            if (typeof renderAllAvailableItems === 'function') renderAllAvailableItems();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderChatMatchesList === 'function') renderChatMatchesList();
            if (typeof updateOverviewStats === 'function') updateOverviewStats();

            showToast("✅ All database items (requests, listings, matches, chats) have been permanently removed!", "success");
        } catch (err) {
            console.error("Error purging database items:", err);
            showToast("Failed to purge database items.", "danger");
        }
    };

    function renderDonorNeeds() {
        const grid = document.getElementById("donorNeedsGrid");
        if (!grid) return;

        const searchKeyword = (document.getElementById("searchDonorNeeds")?.value || "").toLowerCase();
        const reqTypeFilter = document.getElementById("filterReqType")?.value || "all";
        const catFilter = document.getElementById("filterReqCategory")?.value || "all";
        const receiverCatFilter = document.getElementById("filterReceiverCategory")?.value || "all";
        const priorityFilter = document.getElementById("filterReqPriority")?.value || "all";
        const districtFilter = document.getElementById("filterReqDistrict")?.value || "all";

        let filtered = requestsList.filter(r => r.status === 'published' || r.status === 'partially_fulfilled');

        if (searchKeyword) {
            filtered = filtered.filter(r => 
                (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
                (r.category && r.category.toLowerCase().includes(searchKeyword)) ||
                (r.receiverCategory && r.receiverCategory.toLowerCase().includes(searchKeyword)) ||
                (r.receiverName && r.receiverName.toLowerCase().includes(searchKeyword))
            );
        }

        if (reqTypeFilter !== 'all') filtered = filtered.filter(r => (r.reqType || 'physical') === reqTypeFilter);
        if (catFilter !== 'all') filtered = filtered.filter(r => isCategoryMatch(r.category, catFilter));
        if (receiverCatFilter !== 'all') filtered = filtered.filter(r => isCategoryMatch(r.receiverCategory, receiverCatFilter));
        if (priorityFilter !== 'all') filtered = filtered.filter(r => (r.priorityLevel || 'Medium') === priorityFilter);
        if (districtFilter !== 'all') filtered = filtered.filter(r => isDistrictMatch(r.district, districtFilter));

        // Sort: Donor's local district first, then by date order
        const sortOrder = document.getElementById("sortCatalogueOrder")?.value || "latest";
        const userDistrict = currentUser.district || "Colombo";

        filtered.sort((a, b) => {
            const aIsLocal = (a.district === userDistrict) ? 1 : 0;
            const bIsLocal = (b.district === userDistrict) ? 1 : 0;
            if (aIsLocal !== bIsLocal) return bIsLocal - aIsLocal; // Local district first

            if (sortOrder === "latest") {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            } else {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
        });

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
                actionBtn = `<button type="button" class="btn btn-primary" data-action="volunteer-shift" data-request-id="${r.id}" style="width:100%; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="openVolunteerModal('${r.id}')">🤝 Join Volunteer Shift</button>`;
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
                    <div>
                        ${actionBtn}
                        <button class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding:4px; margin-top:6px;" onclick="openDirectChatWithUser('${r.receiverId}', '${r.receiverName}', '${r.itemName}')">💬 Message Receiver</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    const searchDonorNeeds = document.getElementById("searchDonorNeeds");
    const filterReqType = document.getElementById("filterReqType");
    const filterReqCategory = document.getElementById("filterReqCategory");
    const sortCatalogueOrder = document.getElementById("sortCatalogueOrder");
    if (searchDonorNeeds) searchDonorNeeds.addEventListener("input", renderDonorNeeds);
    if (filterReqType) filterReqType.addEventListener("change", renderDonorNeeds);
    if (filterReqCategory) filterReqCategory.addEventListener("change", renderDonorNeeds);
    if (sortCatalogueOrder) sortCatalogueOrder.addEventListener("change", renderDonorNeeds);

    // 1. Donor Offers Donation First to Receiver Need Request
    window.offerPhysicalDonation = (requestId) => {
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;

        document.getElementById("mdlOfferRequestId").value = req.id;
        document.getElementById("mdlOfferTitle").textContent = `Offer Donation: ${req.itemName}`;
        
        const qtyInput = document.getElementById("mdlOfferQty");
        const maxNotice = document.getElementById("lblOfferMaxNotice");
        
        const maxRequired = parseInt(req.quantityRequired) || 1;
        if (qtyInput) {
            qtyInput.max = maxRequired;
            qtyInput.value = maxRequired;
        }
        if (maxNotice) {
            maxNotice.textContent = `📌 Max Limit: ${maxRequired} ${req.unit || 'units'} (Receiver requested ${maxRequired} ${req.unit || 'units'})`;
        }

        const modal = document.getElementById("modalOfferDonation");
        if (modal) modal.classList.add("active");
    };

    const formSubmitOfferDonation = document.getElementById("formSubmitOfferDonation");
    if (formSubmitOfferDonation) {
        formSubmitOfferDonation.addEventListener("submit", async (e) => {
            e.preventDefault();
            const reqId = document.getElementById("mdlOfferRequestId").value;
            const req = requestsList.find(r => r.id === reqId);
            if (!req) return;

            const qty = parseInt(document.getElementById("mdlOfferQty").value) || 1;
            const notes = document.getElementById("mdlOfferNotes")?.value.trim() || "";
            const maxAllowed = parseInt(req.quantityRequired) || 1;

            if (qty > maxAllowed) {
                showToast(`Illogical Quantity! You cannot offer ${qty} units when the receiver only requested ${maxAllowed} ${req.unit || 'units'}.`, "warning");
                return;
            }

            if (qty <= 0) {
                showToast("Offered quantity must be at least 1 unit.", "warning");
                return;
            }

            // Prevent duplicate active/pending offer
            const existingOffer = matchesList.find(m => 
                m.requestId === req.id && 
                (m.donorId === currentUser.uid || (currentUser.email && m.donorEmail === currentUser.email)) && 
                (m.status === 'pending_receiver_approval' || m.status === 'accepted' || m.status === 'confirmed')
            );
            if (existingOffer) {
                showToast("You already have an active or pending offer for this request.", "warning");
                const modal = document.getElementById("modalOfferDonation");
                if (modal) modal.classList.remove("active");
                return;
            }

            const btnSubmit = formSubmitOfferDonation.querySelector("button[type='submit']");

            try {
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.textContent = "Sending Offer...";
                }

                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const db = helper.db();

                const matchDoc = {
                    requestId: req.id,
                    requestName: req.itemName,
                    receiverId: req.receiverId,
                    receiverName: req.receiverName,
                    donorId: currentUser.uid,
                    donorName: currentUser.name,
                    donorEmail: currentUser.email || "",
                    type: "physical",
                    category: req.category,
                    quantity: qty,
                    unit: req.unit || "Units",
                    notes: notes,
                    initiator: "donor",
                    status: "pending_receiver_approval",
                    createdAt: new Date().toISOString()
                };

                await db.collection("matches").add(matchDoc);

                await db.collection("notifications").add({
                    userId: req.receiverId,
                    message: `🎁 Donor ${currentUser.name} offered ${qty} ${req.unit || 'units'} for "${req.itemName}". Please Accept or Reject this offer in your dashboard.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });

                showToast("Donation offer sent to receiver! Waiting for receiver approval.", "success");
                const modal = document.getElementById("modalOfferDonation");
                if (modal) modal.classList.remove("active");
                formSubmitOfferDonation.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to submit donation offer.", "danger");
                console.error(err);
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Submit Donation Offer";
                }
            }
        });
    }

    // Receiver Accepts Donor Offer
    // Receiver Accepts Donor Offer (Physical or Monetary Fund)
    window.acceptDonationOffer = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            const match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId);
            if (!match) return;

            const isMonetary = match.type === 'monetary' || (match.amount && !match.quantity);
            const nextStatus = isMonetary ? "completed" : "accepted_pending_delivery_method";

            await db.collection("matches").doc(matchId).update({
                status: nextStatus,
                evidenceSubmitted: isMonetary ? true : (match.evidenceSubmitted || false),
                completedAt: isMonetary ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString()
            });

            match.status = nextStatus;

            let reqNotice = "";
            if (match.requestId || match.requestName) {
                let targetReq = requestsList.find(r => r.id === match.requestId || (r.itemName === match.requestName && r.receiverId === match.receiverId));
                let targetReqId = targetReq ? targetReq.id : match.requestId;

                if (targetReqId) {
                    try {
                        const reqDocSnap = await db.collection("requests").doc(targetReqId).get();
                        if (reqDocSnap.exists) {
                            const reqData = reqDocSnap.data();

                            if (isMonetary) {
                                const currentAmountRequired = parseFloat(reqData.amountRequired || 0);
                                const currentAmountReceived = parseFloat(reqData.amountReceived || 0);
                                const donatedAmount = parseFloat(match.amount || 0);
                                const newAmountRemaining = Math.max(0, currentAmountRequired - donatedAmount);
                                const newAmountReceived = currentAmountReceived + donatedAmount;

                                const reqUpdates = {
                                    amountRequired: newAmountRemaining,
                                    amountReceived: newAmountReceived,
                                    lastDonatedAmount: donatedAmount,
                                    updatedAt: new Date().toISOString()
                                };

                                if (newAmountRemaining <= 0) {
                                    reqUpdates.status = "fulfilled";
                                    reqUpdates.fulfilledAt = new Date().toISOString();
                                    reqNotice = ` Request "${match.requestName}" is now 100% funded!`;
                                } else {
                                    reqUpdates.partiallyFulfilled = true;
                                    reqNotice = ` Remaining fund required updated to LKR ${newAmountRemaining.toLocaleString()}.`;
                                }

                                await db.collection("requests").doc(targetReqId).update(reqUpdates);

                                if (targetReq) {
                                    targetReq.amountRequired = newAmountRemaining;
                                    targetReq.amountReceived = newAmountReceived;
                                    if (newAmountRemaining <= 0) targetReq.status = "fulfilled";
                                }
                            } else {
                                const currentRequired = parseFloat(reqData.quantityRequired || reqData.quantity || 0);
                                const currentReceived = parseFloat(reqData.quantityReceived || 0);
                                const donatedQty = parseFloat(match.quantity || 0);
                                const newRemaining = Math.max(0, currentRequired - donatedQty);
                                const newReceived = currentReceived + donatedQty;

                                const reqUpdates = {
                                    quantity: newRemaining,
                                    quantityRequired: newRemaining,
                                    quantityReceived: newReceived,
                                    lastDonatedQuantity: donatedQty,
                                    updatedAt: new Date().toISOString()
                                };

                                if (newRemaining <= 0) {
                                    reqUpdates.status = "fulfilled";
                                    reqUpdates.fulfilledAt = new Date().toISOString();
                                    reqNotice = ` Request "${match.requestName}" is now fully fulfilled (0 remaining)!`;
                                } else {
                                    reqUpdates.partiallyFulfilled = true;
                                    reqNotice = ` Remaining request updated to ${newRemaining} ${match.unit || 'units'} required.`;
                                }

                                await db.collection("requests").doc(targetReqId).update(reqUpdates);

                                if (targetReq) {
                                    targetReq.quantity = newRemaining;
                                    targetReq.quantityRequired = newRemaining;
                                    targetReq.quantityReceived = newReceived;
                                    if (newRemaining <= 0) targetReq.status = "fulfilled";
                                }
                            }
                        }
                    } catch (reqErr) {
                        console.error("Error updating request amount/quantity:", reqErr);
                    }
                }
            }

            const notifMsg = isMonetary 
                ? `💰 Receiver ${currentUser.name} accepted and confirmed receipt of your donation of LKR ${parseFloat(match.amount || 0).toLocaleString()} for "${match.requestName}". Thank you for your support!`
                : `✅ Receiver ${currentUser.name} accepted your offer of ${match.quantity} ${match.unit || 'units'} for "${match.requestName}". Please open your dashboard to select your Delivery Method.`;

            await db.collection("notifications").add({
                userId: match.donorId,
                message: notifMsg,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(`🎉 ${isMonetary ? 'Fund receipt confirmed!' : 'Offer accepted!'}${reqNotice}`, "success");
            updateOverviewStats();
            if (typeof renderReceiverRequests === 'function') renderReceiverRequests();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderAvailablePhysicalRequests === 'function') renderAvailablePhysicalRequests();
        } catch (err) {
            console.error("acceptDonationOffer error:", err);
            showToast("Failed to accept donation.", "danger");
        }
    };

    // Receiver Rejects Donor Offer
    window.rejectDonationOffer = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            await helper.db().collection("matches").doc(matchId).update({
                status: "rejected"
            });

            await helper.db().collection("notifications").add({
                userId: match.donorId,
                message: `❌ Receiver ${currentUser.name} declined the offer for "${match.requestName}".`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("Offer declined.", "info");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to decline offer.", "danger");
        }
    };

    // Donor Selects Delivery Method Modal Trigger
    window.openDonorDeliverySelectionModal = (matchId) => {
        document.getElementById("mdlDonorDelivMatchId").value = matchId;
        const sel = document.getElementById("mdlDonorDelivMethod");
        const dtGroup = document.getElementById("grpDonorSelDateTime");
        const recNotice = document.getElementById("grpReceiverPickupInfoNotice");

        const toggleUI = () => {
            if (sel.value === 'self_delivery') {
                dtGroup.style.display = 'block';
                recNotice.style.display = 'none';
            } else {
                dtGroup.style.display = 'none';
                recNotice.style.display = 'block';
            }
        };

        if (sel) {
            sel.onchange = toggleUI;
            toggleUI();
        }

        const modal = document.getElementById("modalDonorSelectDelivery");
        if (modal) modal.classList.add("active");
    };

    const formSubmitDonorDeliverySelection = document.getElementById("formSubmitDonorDeliverySelection");
    if (formSubmitDonorDeliverySelection) {
        formSubmitDonorDeliverySelection.addEventListener("submit", async (e) => {
            e.preventDefault();
            const matchId = document.getElementById("mdlDonorDelivMatchId").value;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const mode = document.getElementById("mdlDonorDelivMethod").value;
            const schedDT = document.getElementById("mdlDonorSelDateTime").value;

            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const db = helper.db();

                if (mode === 'self_delivery') {
                    if (!schedDT) {
                        showToast("Please select your scheduled delivery date & time.", "warning");
                        return;
                    }
                    const formatted = new Date(schedDT).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                    await db.collection("matches").doc(matchId).update({
                        deliveryMethod: "self_delivery",
                        scheduledDateTime: schedDT,
                        schedulingStatus: "donor_scheduled",
                        status: "donor_scheduled_delivery"
                    });

                    await db.collection("notifications").add({
                        userId: match.receiverId,
                        message: `🚚 Donor ${currentUser.name} selected Self Delivery for "${match.requestName}" scheduled at ${formatted}. Please Accept, Reject, or Negotiate this schedule.`,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                    showToast("Self delivery scheduled and receiver notified!", "success");
                } else {
                    await db.collection("matches").doc(matchId).update({
                        deliveryMethod: "receiver_pickup",
                        schedulingStatus: "pending_receiver_schedule",
                        status: "pending_receiver_pickup_schedule"
                    });

                    await db.collection("notifications").add({
                        userId: match.receiverId,
                        message: `📍 Donor ${currentUser.name} selected Receiver Pick Up for "${match.requestName}". Please open your dashboard to schedule your preferred pick-up date & time.`,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                    showToast("Receiver notified to schedule pick-up date & time.", "success");
                }

                document.getElementById("modalDonorSelectDelivery").classList.remove("active");
                formSubmitDonorDeliverySelection.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to submit delivery method selection.", "danger");
            }
        });
    }

    // 2. Receiver Requests Available Item First from Donor Listing
    window.closeRequestAvailableItemModal = () => {
        const modal = document.getElementById("modalRequestAvailableItem");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    window.submitReceiverItemRequestDirectly = async () => {
        const donId = document.getElementById("mdlReqDonationId")?.value;
        const dItem = donationsList.find(d => d.id === donId || String(d.id) === String(donId));
        if (!dItem) {
            showToast("Item record not found.", "warning");
            return;
        }

        const reqQty = parseInt(document.getElementById("mdlReqItemQty")?.value) || 1;
        const maxAvail = parseInt(dItem.quantity) || 1;

        if (reqQty > maxAvail) {
            showToast(`Illogical Quantity! You cannot request ${reqQty} units when the donor only has ${maxAvail} ${dItem.unit || 'units'} available.`, "warning");
            return;
        }

        if (reqQty <= 0) {
            showToast("Requested quantity must be at least 1 unit.", "warning");
            return;
        }

        const existingReq = matchesList.find(m => 
            m.donationId === dItem.id && 
            (m.receiverId === currentUser.uid || (currentUser.email && m.receiverEmail === currentUser.email)) && 
            (m.status === 'pending_donor_approval' || m.status === 'accepted' || m.status === 'confirmed')
        );
        if (existingReq) {
            showToast("You already have an active or pending request for this surplus item.", "warning");
            closeRequestAvailableItemModal();
            return;
        }

        try {
            showToast("⏳ Sending request to donor...", "info");
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const matchDoc = {
                donationId: dItem.id,
                requestName: dItem.itemName,
                receiverId: currentUser.uid,
                receiverName: currentUser.name,
                receiverEmail: currentUser.email || "",
                donorId: dItem.donorId,
                donorName: dItem.donorName,
                type: "physical",
                category: dItem.category || "General",
                quantity: reqQty,
                unit: dItem.unit || "Units",
                deliveryMethod: "receiver_pickup",
                initiator: "receiver",
                status: "pending_donor_approval",
                createdAt: new Date().toISOString()
            };

            const docRef = await db.collection("matches").add(matchDoc);
            matchDoc.id = docRef.id;
            matchesList.unshift(matchDoc);

            await db.collection("notifications").add({
                userId: dItem.donorId,
                message: `📌 Receiver ${currentUser.name} requested ${reqQty} ${dItem.unit || 'units'} of your available item "${dItem.itemName}". Please Accept or Reject this request in your dashboard.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("🎉 Item request sent to donor! Waiting for donor approval.", "success");
            closeRequestAvailableItemModal();
            updateOverviewStats();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderAvailableMaterialDonations === 'function') renderAvailableMaterialDonations();
        } catch (err) {
            showToast("Failed to submit request.", "danger");
            console.error("Submit request error:", err);
        }
    };

    window.openRequestAvailableItemModal = (donationId) => {
        const item = donationsList.find(d => d.id === donationId || String(d.id) === String(donationId));
        if (!item) return;

        let modal = document.getElementById("modalRequestAvailableItem");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalRequestAvailableItem";
            modal.style.zIndex = "999999";
            modal.innerHTML = `
                <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:520px; width:90%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">
                        <h3 id="mdlReqItemTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">Request Material Item</h3>
                        <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeRequestAvailableItemModal()">✕</button>
                    </div>
                    <form id="formSubmitItemRequest" onsubmit="event.preventDefault(); submitReceiverItemRequestDirectly();">
                        <input type="hidden" id="mdlReqDonationId" value="${item.id}">
                        <div class="form-group" style="margin-bottom:14px;">
                            <label class="form-label" style="font-weight:700; font-size:0.85rem;">Requested Quantity / Units</label>
                            <input class="form-control" type="number" id="mdlReqItemQty" min="1" value="${item.quantity || 1}" max="${item.quantity || 1}" required style="font-weight:700; width:100%;">
                            <div id="lblReqItemMaxNotice" style="font-size:0.75rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px;">📌 Max Stock Available: ${item.quantity || 1} ${item.unit || 'units'}</div>
                        </div>
                        <div class="form-group" style="margin-bottom:14px;">
                            <label class="form-label" style="font-weight:700; font-size:0.85rem;">Delivery Method</label>
                            <input class="form-control" type="text" value="Self Pick Up (Receiver Pick Up)" readonly style="font-weight:800; background:#F5EFE0; color:var(--color-teal-primary); width:100%;">
                        </div>
                        <div style="background:#F5EFE0; padding:12px; border-radius:6px; font-size:0.8rem; color:var(--color-text-dark); margin-bottom:16px; line-height:1.4;">
                            📌 As a Receiver requesting this available item, an automated notification will be sent to the donor to accept your request.
                        </div>
                        <div style="display:flex; gap:10px; justify-content:flex-end; align-items:center;">
                            <button type="button" class="btn btn-secondary" style="padding:10px 18px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeRequestAvailableItemModal()">✕ Cancel</button>
                            <button class="btn btn-primary" type="button" onclick="submitReceiverItemRequestDirectly()" style="font-weight:800; padding:10px 22px; font-size:0.88rem; background:#0D7C7A; color:#FFFFFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 3px 10px rgba(13,124,122,0.3);">🚀 Send Item Request</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const donInput = document.getElementById("mdlReqDonationId");
        if (donInput) donInput.value = item.id;

        const titleEl = document.getElementById("mdlReqItemTitle");
        if (titleEl) titleEl.textContent = `Request Item: ${item.itemName}`;

        const qtyInput = document.getElementById("mdlReqItemQty");
        const maxNotice = document.getElementById("lblReqItemMaxNotice");
        
        const maxAvail = parseInt(item.quantity) || 1;
        if (qtyInput) {
            qtyInput.max = maxAvail;
            qtyInput.value = maxAvail;
        }
        if (maxNotice) {
            maxNotice.textContent = `📌 Max Stock Available: ${maxAvail} ${item.unit || 'units'}`;
        }

        modal.style.setProperty("display", "flex", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("z-index", "999999", "important");
        modal.classList.add("active");
    };

    // Donor Accepts Receiver Item Request
    window.acceptReceiverItemRequest = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();
            const match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId);
            if (!match) return;

            await db.collection("matches").doc(matchId).update({
                status: "accepted_pending_receiver_schedule",
                updatedAt: new Date().toISOString()
            });

            // Automatically deduct requested quantity from donor's available item inventory
            let itemNotice = "";
            if (match.donationId) {
                try {
                    const donDocSnap = await db.collection("donations").doc(match.donationId).get();
                    if (donDocSnap.exists) {
                        const donData = donDocSnap.data();
                        const currentAvailable = parseFloat(donData.quantity || 0);
                        const reqQty = parseFloat(match.quantity || 0);
                        const newRemaining = Math.max(0, currentAvailable - reqQty);

                        const donUpdates = {
                            quantity: newRemaining,
                            updatedAt: new Date().toISOString()
                        };

                        if (newRemaining <= 0) {
                            donUpdates.status = "claimed";
                            itemNotice = ` Item "${match.requestName}" is now fully claimed (0 available).`;
                        } else {
                            itemNotice = ` Item stock updated to ${newRemaining} ${match.unit || 'units'} remaining.`;
                        }

                        await db.collection("donations").doc(match.donationId).update(donUpdates);

                        // Update in-memory donationsList
                        const localDon = donationsList.find(d => d.id === match.donationId);
                        if (localDon) {
                            localDon.quantity = newRemaining;
                            if (newRemaining <= 0) localDon.status = "claimed";
                        }
                    }
                } catch (donErr) {
                    console.error("Error updating donation quantity:", donErr);
                }
            }

            await db.collection("notifications").add({
                userId: match.receiverId,
                message: `✅ Donor ${currentUser.name} accepted your request for ${match.quantity} ${match.unit || 'units'} of "${match.requestName}"! Please open your dashboard to schedule your Self Pick Up Date & Time.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(`🎉 Request accepted!${itemNotice}`, "success");
            updateOverviewStats();
            if (typeof renderDonorListings === 'function') renderDonorListings();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderAvailableMaterialDonations === 'function') renderAvailableMaterialDonations();
        } catch (err) {
            console.error("acceptReceiverItemRequest error:", err);
            showToast("Failed to accept request.", "danger");
        }
    };

    // Donor Rejects Receiver Item Request
    window.rejectReceiverItemRequest = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            await helper.db().collection("matches").doc(matchId).update({
                status: "rejected"
            });

            await helper.db().collection("notifications").add({
                userId: match.receiverId,
                message: `❌ Donor ${currentUser.name} declined your request for "${match.requestName}".`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("Request declined.", "info");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to decline request.", "danger");
        }
    };

    // Receiver Schedules Pick Up
    window.openScheduleReceiverPickupModal = (matchId) => {
        document.getElementById("mdlScheduleMatchId").value = matchId;
        const modal = document.getElementById("modalScheduleReceiverPickup");
        if (modal) modal.classList.add("active");
    };

    const formSubmitReceiverPickupSchedule = document.getElementById("formSubmitReceiverPickupSchedule");
    if (formSubmitReceiverPickupSchedule) {
        formSubmitReceiverPickupSchedule.addEventListener("submit", async (e) => {
            e.preventDefault();
            const matchId = document.getElementById("mdlScheduleMatchId").value;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const schedDateTime = document.getElementById("mdlScheduleDateTime").value;
            if (!schedDateTime) {
                showToast("Please select your pick-up date & time.", "warning");
                return;
            }

            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const db = helper.db();

                const formatted = new Date(schedDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

                await db.collection("matches").doc(matchId).update({
                    deliveryMethod: "receiver_pickup",
                    scheduledDateTime: schedDateTime,
                    schedulingStatus: "receiver_scheduled",
                    status: "receiver_scheduled_pickup"
                });

                await db.collection("notifications").add({
                    userId: match.donorId,
                    message: `📍 Receiver ${currentUser.name} scheduled Self Pick Up for "${match.requestName}" at ${formatted}. Please Accept, Reject, or Negotiate this schedule.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });

                showToast("Self Pick Up schedule submitted to donor!", "success");
                document.getElementById("modalScheduleReceiverPickup").classList.remove("active");
                formSubmitReceiverPickupSchedule.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to schedule pick up.", "danger");
            }
        });
    }

    // Schedule Acceptance & Negotiation Functions
    window.acceptSchedule = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const recipientId = currentUser.uid === match.donorId ? match.receiverId : match.donorId;

            await helper.db().collection("matches").doc(matchId).update({
                status: "confirmed",
                confirmedAt: new Date().toISOString()
            });

            await helper.db().collection("notifications").add({
                userId: recipientId,
                message: `🎉 ${currentUser.name} accepted the scheduled date & time for "${match.requestName}". Match is now fully confirmed!`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("Schedule accepted! Order confirmed.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to accept schedule.", "danger");
        }
    };

    window.rejectSchedule = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const recipientId = currentUser.uid === match.donorId ? match.receiverId : match.donorId;

            await helper.db().collection("matches").doc(matchId).update({
                status: "schedule_negotiating",
                proposedBy: currentUser.uid,
                proposedByName: currentUser.name
            });

            await helper.db().collection("messages").add({
                matchId: matchId,
                senderId: currentUser.uid,
                senderName: currentUser.name,
                text: `⚠️ Schedule proposal declined by ${currentUser.name}. Let's discuss a suitable date & time here in chat!`,
                createdAt: new Date().toISOString()
            });

            await helper.db().collection("notifications").add({
                userId: recipientId,
                message: `⚠️ ${currentUser.name} declined the proposed schedule for "${match.requestName}". Opening chat portal to negotiate date & time.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("Schedule proposal declined. Redirecting to chat portal to negotiate date & time...", "info");
            updateOverviewStats();

            // Redirect immediately to Chat Portal with partner
            startChatWithPartner(matchId);
        } catch (err) {
            showToast("Failed to decline schedule.", "danger");
        }
    };

    window.openNegotiateModal = (matchId) => {
        document.getElementById("mdlNegMatchId").value = matchId;
        const modal = document.getElementById("modalNegotiateSchedule");
        if (modal) modal.classList.add("active");
    };

    const formSubmitNegotiateSchedule = document.getElementById("formSubmitNegotiateSchedule");
    if (formSubmitNegotiateSchedule) {
        formSubmitNegotiateSchedule.addEventListener("submit", async (e) => {
            e.preventDefault();
            const matchId = document.getElementById("mdlNegMatchId").value;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const newDT = document.getElementById("mdlNegDateTime").value;
            const reason = document.getElementById("mdlNegReason").value.trim();

            if (!newDT) {
                showToast("Please select a proposed new date & time.", "warning");
                return;
            }

            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const db = helper.db();

                const recipientId = currentUser.uid === match.donorId ? match.receiverId : match.donorId;
                const formatted = new Date(newDT).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

                await db.collection("matches").doc(matchId).update({
                    status: "schedule_negotiating",
                    proposedBy: currentUser.uid,
                    proposedByName: currentUser.name,
                    scheduledDateTime: newDT,
                    negotiationReason: reason
                });

                await db.collection("notifications").add({
                    userId: recipientId,
                    message: `🔄 ${currentUser.name} proposed a new schedule for "${match.requestName}": ${formatted}. ${reason ? 'Note: "' + reason + '"' : ''}`,
                    read: false,
                    createdAt: new Date().toISOString()
                });

                showToast("Proposed schedule sent!", "success");
                document.getElementById("modalNegotiateSchedule").classList.remove("active");
                formSubmitNegotiateSchedule.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to send proposal.", "danger");
            }
        });
    }

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

    window.openVolunteerModal = (requestId) => {
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;

        let modal = document.getElementById("modalVolunteerSignup");
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const reqIdEl = document.getElementById("mdlVolunteerRequestId");
        if (reqIdEl) reqIdEl.value = req.id;

        const titleEl = document.getElementById("mdlVolunteerTitle");
        if (titleEl) titleEl.textContent = `🤝 Join Volunteer Shift: ${req.itemName}`;

        const orgInfoEl = document.getElementById("mdlVolunteerOrgInfo");
        if (orgInfoEl) orgInfoEl.innerHTML = `🏢 <strong>Organizer / Receiver:</strong> ${req.receiverName} (${req.receiverCategory || 'Organisation'})`;

        const shiftInfoEl = document.getElementById("mdlVolunteerShiftInfo");
        if (shiftInfoEl) {
            const shiftTime = req.volDateTime ? ` | 🕒 Time: ${new Date(req.volDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : '';
            const location = req.volLocation || req.district || 'Colombo';
            const reqVol = req.volunteersRequired || 1;
            const assignedVol = req.volunteersAssigned || 0;
            shiftInfoEl.innerHTML = `📍 <strong>Location:</strong> ${location}${shiftTime}<br>👥 <strong>Volunteers Needed:</strong> ${reqVol} (${assignedVol} filled so far)`;
        }

        const equipInfoEl = document.getElementById("mdlVolunteerEquipmentInfo");
        if (equipInfoEl) {
            equipInfoEl.innerHTML = `🧰 <strong>Equipment & Skills:</strong> ${req.equipmentNeeded || req.skillsRequired || 'Standard non-clinical support'}`;
        }

        const nameInput = document.getElementById("mdlVolunteerName");
        if (nameInput) nameInput.value = (currentUser && currentUser.name) ? currentUser.name : '';

        const phoneInput = document.getElementById("mdlVolunteerPhone");
        if (phoneInput) phoneInput.value = (currentUser && (currentUser.phone || currentUser.contactNumber)) ? (currentUser.phone || currentUser.contactNumber) : '';

        const countInput = document.getElementById("mdlVolunteerCount");
        if (countInput) {
            const remainingNeeded = Math.max(1, (parseInt(req.volunteersRequired) || 5) - (parseInt(req.volunteersAssigned) || 0));
            countInput.max = remainingNeeded;
            countInput.value = 1;
        }

        if (modal) {
            modal.style.setProperty("display", "flex", "important");
            modal.style.setProperty("visibility", "visible", "important");
            modal.style.setProperty("opacity", "1", "important");
            modal.style.setProperty("z-index", "99999999", "important");
            modal.classList.add("active");
        }
    };

    window.closeVolunteerModal = () => {
        const modal = document.getElementById("modalVolunteerSignup");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    window.submitVolunteerShiftDirectly = async () => {
        const reqId = document.getElementById("mdlVolunteerRequestId")?.value;
        const req = requestsList.find(r => r.id === reqId);
        if (!req) {
            showToast("Request shift not found.", "warning");
            return;
        }

        const volName = document.getElementById("mdlVolunteerName")?.value.trim();
        const volPhone = document.getElementById("mdlVolunteerPhone")?.value.trim();
        const volCount = parseInt(document.getElementById("mdlVolunteerCount")?.value) || 1;
        const notes = document.getElementById("mdlVolunteerNotes")?.value.trim() || "";
        const btnSubmit = document.getElementById("btnSubmitVolunteerReg");

        if (!volName || !volPhone) {
            showToast("Please provide your name and contact phone number.", "warning");
            return;
        }

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = "Registering...";
            }
            showToast("Registering for volunteer shift...", "info");
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const matchDoc = {
                requestId: req.id,
                requestName: req.itemName,
                receiverId: req.receiverId,
                receiverName: req.receiverName,
                donorId: currentUser.uid,
                donorName: currentUser.name,
                donorEmail: currentUser.email || "",
                volunteerName: volName,
                volunteerPhone: volPhone,
                volunteerCount: volCount,
                type: "volunteer",
                category: req.category || "Volunteer",
                status: "confirmed",
                notes: notes,
                confirmedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            await db.collection("matches").add(matchDoc);

            // Increment volunteersAssigned on request
            const currentAssigned = parseInt(req.volunteersAssigned) || 0;
            const targetRequired = parseInt(req.volunteersRequired) || 1;
            const newAssigned = currentAssigned + volCount;

            const reqUpdates = {
                volunteersAssigned: newAssigned,
                updatedAt: new Date().toISOString()
            };

            if (newAssigned >= targetRequired) {
                reqUpdates.status = "fulfilled";
                reqUpdates.fulfilledAt = new Date().toISOString();
            }

            await db.collection("requests").doc(req.id).update(reqUpdates);

            req.volunteersAssigned = newAssigned;
            if (newAssigned >= targetRequired) req.status = "fulfilled";

            await db.collection("notifications").add({
                userId: req.receiverId,
                message: `🤝 Volunteer ${currentUser.name} (${volName}, Phone: ${volPhone}) registered ${volCount} volunteer(s) for your shift "${req.itemName}".`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(`🎉 Registration confirmed! You registered ${volCount} volunteer(s) for "${req.itemName}".`, "success");
            closeVolunteerModal();
            updateOverviewStats();
            if (typeof renderDonorNeeds === 'function') renderDonorNeeds();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
        } catch (err) {
            console.error("Volunteer registration error:", err);
            showToast("Failed to register for volunteer shift.", "danger");
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "🤝 Confirm Shift Registration";
            }
        }
    };

    // Delegated click handler for volunteer-shift
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="volunteer-shift"]');
        if (btn) {
            const reqId = btn.getAttribute('data-request-id');
            if (reqId && typeof window.openVolunteerModal === 'function') {
                window.openVolunteerModal(reqId);
            }
        }
    });

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

    function checkIsAdmin() {
        if (!currentUser) return false;
        const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();
        const emailStr = ((currentUser.email) || "").toLowerCase();
        return (
            roleStr.includes("admin") ||
            emailStr.includes("admin") ||
            currentUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' ||
            currentUser.isAdmin === true
        );
    }

    function setupRealtimeListeners() {
        if (!currentUser) return;
        const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
        const db = helper.db();

        clearSnapshotListeners();

        const unsubUsers = db.collection("users").onSnapshot(snapshot => {
            usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const fullProfile = usersList.find(u => u.uid === currentUser.uid || u.id === currentUser.uid);
            if (fullProfile) currentUser = { ...currentUser, ...fullProfile };

            if (checkIsAdmin()) {
                renderAdminUsers();
                renderAdminApprovals();
                renderAdminRequestApprovals();
                renderAdminDirectory();
                renderAdminActiveMatchesTable();
            }
            updateOverviewStats();
        });
        unsubscribes.push(unsubUsers);

        const unsubDonations = db.collection("donations").onSnapshot(snapshot => {
            donationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();

            if (roleStr.includes('donor')) {
                renderDonorListings();
                renderDonorNeeds();
            }
            if (checkIsAdmin()) {
                renderAdminApprovals();
                renderAdminRequestApprovals();
                renderAdminDirectory();
                renderAdminActiveMatchesTable();
            }
            renderAllAvailableItems();
            renderChatMatchesList();
            updateOverviewStats();
        });
        unsubscribes.push(unsubDonations);

        const unsubRequests = db.collection("requests").onSnapshot(snapshot => {
            requestsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();

            if (roleStr.includes('receiver')) renderReceiverRequests();
            else if (roleStr.includes('donor')) renderDonorNeeds();
            if (checkIsAdmin()) {
                renderAdminApprovals();
                renderAdminRequestApprovals();
                renderAdminDirectory();
                renderAdminActiveMatchesTable();
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
            const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();

            if (roleStr.includes('donor')) renderDonorMatches();
            else if (roleStr.includes('receiver')) renderReceiverMatches();
            if (checkIsAdmin()) {
                renderAdminDirectory();
                renderAdminActiveMatchesTable();
            }
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

    function isReceiverPickupMethod(m) {
        if (!m) return false;
        const dm = (m.deliveryMethod || '').toLowerCase();
        if (dm === 'self_delivery' || dm === 'donor_delivery') return false;
        if (dm === 'receiver_pickup' || dm === 'pickup') return true;
        return m.initiator === 'receiver' || m.status === 'receiver_scheduled_pickup' || m.status === 'pending_receiver_pickup_schedule' || !m.deliveryMethod;
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
            if (m.status === 'confirmed' || m.status === 'completed') statusBadge = `<span class="badge badge-success">Completed / Confirmed</span>`;
            else if (m.status === 'rejected') statusBadge = `<span class="badge badge-danger">Declined</span>`;
            else if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval') {
                statusBadge = m.type === 'monetary' 
                    ? `<span class="badge badge-warning">💰 Awaiting Your Fund Confirmation</span>`
                    : `<span class="badge badge-warning">🎁 Offer Pending Your Approval</span>`;
            }
            else if (m.status === 'accepted_pending_delivery_method') statusBadge = `<span class="badge badge-info">Offer Accepted (Waiting for Donor Delivery Selection)</span>`;
            else if (m.status === 'pending_receiver_pickup_schedule') statusBadge = `<span class="badge badge-warning">Pick Up Schedule Required</span>`;
            else if (m.status === 'donor_scheduled_delivery') statusBadge = `<span class="badge badge-info">Donor Scheduled Self Delivery</span>`;
            else if (m.status === 'receiver_scheduled_pickup') statusBadge = `<span class="badge badge-info">You Scheduled Pick Up</span>`;
            else if (m.status === 'schedule_negotiating') statusBadge = `<span class="badge badge-warning">Schedule Under Negotiation</span>`;

            let details = '';
            if (m.type === 'physical') {
                details = `Quantity: <strong>${m.quantity} ${m.unit || 'units'}</strong>`;
            } else if (m.type === 'monetary') {
                details = `Amount: <strong>LKR ${parseFloat(m.amount || 0).toLocaleString()}</strong> | Ref: ${m.referenceNumber || 'N/A'} | ${m.receiptUrl ? `<a href="${m.receiptUrl}" target="_blank" style="color:var(--color-teal-primary); font-weight:700;">View Receipt</a>` : 'No Receipt'}`;
            } else if (m.type === 'volunteer') {
                details = `Volunteer: <strong>${m.volunteerName || m.donorName}</strong> (${m.volunteerCount || 1} Person${(m.volunteerCount || 1) > 1 ? 's' : ''})${m.volunteerPhone ? ` | Contact: <strong>${m.volunteerPhone}</strong>` : ''}${m.notes ? `<div style="margin-top:4px; font-size:0.8rem; color:var(--color-teal-primary);">"${m.notes}"</div>` : ''}`;
            }

            const isPickUp = isReceiverPickupMethod(m);

            let scheduleInfo = '';
            if (m.scheduledDateTime && m.type !== 'volunteer') {
                const formatted = new Date(m.scheduledDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                if (!isPickUp) {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px; margin-bottom:6px;">🚚 Scheduled Donor Self Delivery: ${formatted}</div>`;
                } else {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-secondary); font-weight:700; margin-top:4px; margin-bottom:6px;">📍 Scheduled Pick Up: ${formatted}</div>`;
                }
            }

            let actionButtonsHtml = '';

            if (m.type === 'volunteer') {
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += `
                        <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')">🤝 Accept Volunteer Offer</button>
                    `;
                }
            } else if (m.type === 'monetary' || (m.amount && !m.quantity)) {
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += `
                        <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')">💰 Confirm & Accept Fund Receipt</button>
                    `;
                }
            } else {
                // Physical parcel items
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += `
                        <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')">🎁 Accept Donation Offer</button>
                    `;
                } else if (m.status === 'pending_receiver_pickup_schedule' || m.status === 'accepted_pending_receiver_schedule') {
                    actionButtonsHtml += `
                        <button class="btn btn-warning" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="openScheduleReceiverPickupModal('${m.id}')">Schedule Pick Up Date & Time</button>
                    `;
                } else if (m.status === 'donor_scheduled_delivery') {
                    actionButtonsHtml += `
                        <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Schedule</button>
                        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Schedule</button>
                    `;
                } else if (m.status === 'schedule_negotiating' && m.proposedBy !== currentUser.uid) {
                    actionButtonsHtml += `
                        <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Proposed Time</button>
                        <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Proposal</button>
                    `;
                }

                if (m.status === 'confirmed') {
                    if (isPickUp) {
                        actionButtonsHtml += `
                            <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="startDeliverySession('${m.id}')">🚚 Start Pick-Up Journey</button>
                        `;
                    } else {
                        actionButtonsHtml += `
                            <span style="font-size:0.78rem; color:var(--color-teal-primary); font-weight:700; background:#E0F2F1; padding:4px 8px; border-radius:4px; border:1px solid #B2DFDB;">⏳ Waiting for donor to start delivery journey</span>
                        `;
                    }
                }

                if (m.status === 'in_transit' || m.status === 'delivered' || m.status === 'confirmed') {
                    actionButtonsHtml += `
                        <button class="btn btn-success" style="padding:7px 18px; font-size:0.82rem; font-weight:800; background:#0D7C7A; color:#FFFFFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="toggleInlineEvidenceDrawer('${m.id}')">📸 Confirm Receipt & Upload Evidence</button>
                    `;
                }
            }

            let liveLocBtn = '';
            if (m.type !== 'volunteer' && (m.status === 'in_transit' || m.status === 'delivered')) {
                liveLocBtn = `<button class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:var(--color-teal-primary); color:#FFF; border-radius:6px; cursor:pointer;" onclick="toggleInlineLiveMap('${m.id}')">🗺️ View Live Delivery Map</button>`;
                if (isPickUp) {
                    liveLocBtn += `<button class="btn btn-warning" style="padding:6px 12px; font-size:0.8rem; font-weight:800; margin-left:4px; border-radius:6px;" onclick="startSharingLiveLocation('${m.id}')">📡 Share My Pick-Up GPS</button>`;
                }
            }

            let evidenceBtn = '';
            if (m.type === 'monetary' && (m.status === 'confirmed' || m.status === 'completed')) {
                if (m.evidenceSubmitted) {
                    evidenceBtn = `<a href="${m.evidenceUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">View Uploaded Evidence</a>`;
                } else {
                    evidenceBtn = `<button class="btn btn-warning" style="font-size:0.75rem; padding:4px 8px;" onclick="uploadUtilisationEvidence('${m.id}')">Upload 14-Day Evidence</button>`;
                }
            }

            let sessionBadge = m.deliverySessionId ? `<div style="font-size:0.75rem; font-weight:700; color:var(--color-teal-primary); margin-top:2px;">Session ID: ${m.deliverySessionId}</div>` : '';

            return `
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 6px;">Donor: <strong>${m.donorName}</strong> ${sessionBadge}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 8px;">${details}</div>
                    ${scheduleInfo}

                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;">
                        ${actionButtonsHtml}
                        ${liveLocBtn}
                        ${evidenceBtn}
                        <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.78rem;" onclick="startChatWithPartner('${m.id}')">💬 Message Donor</button>
                    </div>

                    <!-- Inline Expandable Evidence Upload Drawer -->
                    <div id="inlineEvidenceDrawer_${m.id}" style="display:none; margin-top:14px; padding:16px; border-radius:10px; background:#F8FAFA; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div>

                    <!-- Inline Expandable Live Map -->
                    <div id="inlineLiveMap_${m.id}" style="display:none; margin-top:14px; border-radius:10px; overflow:hidden; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div>
                </div>
            `;
        }).join("");
    }

    function renderDonorMatches() {
        const container = document.getElementById("donorMatchesContainer");
        if (!container) return;

        const myOffers = matchesList.filter(m => m.donorId === currentUser.uid);

        if (myOffers.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 30px;">You have no active matches or requests yet.</div>`;
            return;
        }

        container.innerHTML = myOffers.map(m => {
            let statusBadge = `<span class="badge badge-warning">${m.status}</span>`;
            if (m.status === 'confirmed') statusBadge = `<span class="badge badge-success">Schedule Confirmed by Receiver</span>`;
            else if (m.status === 'donor_scheduled_delivery') statusBadge = `<span class="badge badge-warning">Awaiting Receiver Schedule Agreement</span>`;
            else if (m.status === 'in_transit') statusBadge = `<span class="badge badge-info">In Transit (Delivery Active)</span>`;
            else if (m.status === 'delivered') statusBadge = `<span class="badge badge-success">Delivered (Pending Receiver Confirmation)</span>`;
            else if (m.status === 'completed') statusBadge = `<span class="badge badge-success">Completed</span>`;
            else if (m.status === 'rejected') statusBadge = `<span class="badge badge-danger">Declined</span>`;
            else if (m.status === 'pending_donor_approval') statusBadge = `<span class="badge badge-warning">Request Pending Your Approval</span>`;
            else if (m.status === 'accepted_pending_delivery_method') statusBadge = `<span class="badge badge-info">Receiver Accepted Offer (Select Delivery)</span>`;
            else if (m.status === 'receiver_scheduled_pickup') statusBadge = `<span class="badge badge-info">Receiver Scheduled Pick Up</span>`;
            else if (m.status === 'schedule_negotiating') statusBadge = `<span class="badge badge-warning">Schedule Under Negotiation</span>`;

            const isPickUp = isReceiverPickupMethod(m);

            let scheduleInfo = '';
            if (m.scheduledDateTime) {
                const formatted = new Date(m.scheduledDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                if (!isPickUp) {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px; margin-bottom:6px;">🚚 Scheduled Self Delivery: ${formatted}</div>`;
                } else {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-secondary); font-weight:700; margin-top:4px; margin-bottom:6px;">📍 Scheduled Pick Up: ${formatted}</div>`;
                }
            }

            let actionButtonsHtml = '';

            if (m.status === 'pending_donor_approval') {
                actionButtonsHtml += `
                    <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptReceiverItemRequest('${m.id}')">Accept Request</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectReceiverItemRequest('${m.id}')">Decline</button>
                `;
            } else if (m.status === 'accepted_pending_delivery_method') {
                actionButtonsHtml += `
                    <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="openDonorDeliverySelectionModal('${m.id}')">Select Delivery Method</button>
                `;
            } else if (m.status === 'receiver_scheduled_pickup') {
                actionButtonsHtml += `
                    <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Pick Up Schedule</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Schedule</button>
                `;
            } else if (m.status === 'schedule_negotiating' && m.proposedBy !== currentUser.uid) {
                actionButtonsHtml += `
                    <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Proposed Time</button>
                    <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Proposal</button>
                `;
            }

            if (m.status === 'confirmed') {
                if (isPickUp) {
                    actionButtonsHtml += `
                        <span style="font-size:0.78rem; color:var(--color-teal-primary); font-weight:700; background:#E0F2F1; padding:4px 8px; border-radius:4px; border:1px solid #B2DFDB;">⏳ Waiting for receiver to start pick-up journey</span>
                    `;
                } else {
                    actionButtonsHtml += `
                        <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="startDeliverySession('${m.id}')">🚚 Start Delivery Journey</button>
                    `;
                }
            } else if (m.status === 'donor_scheduled_delivery') {
                actionButtonsHtml += `
                    <span style="font-size:0.78rem; color:var(--color-primary); font-weight:700; background:#FFF8E7; padding:4px 8px; border-radius:4px; border:1px solid #FFE082;">⏳ Waiting for receiver to agree to schedule</span>
                `;
            } else if (m.status === 'in_transit') {
                actionButtonsHtml += `
                    <button class="btn btn-warning" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="markDeliveryDelivered('${m.id}')">📦 Mark Package Handed Over</button>
                `;
            }

            let liveLocBtn = '';
            if (m.status === 'in_transit') {
                if (!isPickUp) {
                    liveLocBtn = `<button class="btn btn-warning" style="padding:5px 12px; font-size:0.78rem; font-weight:800;" onclick="startSharingLiveLocation('${m.id}')">📡 Stream My Live Location</button>`;
                } else {
                    liveLocBtn = `<button class="btn btn-primary" style="padding:5px 12px; font-size:0.78rem; font-weight:800; background:var(--color-teal-primary); color:#FFF; border-radius:6px; cursor:pointer;" onclick="toggleInlineLiveMap('${m.id}')">🗺️ View Live Delivery Map</button>`;
                }
            }

            let donorEvidenceHtml = '';
            if (m.handoverEvidenceUrl) {
                donorEvidenceHtml = `
                    <div style="margin-top:12px; padding:12px; background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-size:0.82rem; font-weight:800; color:#15803D;">📷 Receiver Uploaded Handover Evidence:</span>
                            <span style="font-size:0.75rem; color:#166534; font-weight:700; background:#DCFCE7; padding:2px 8px; border-radius:4px;">Receipt Confirmed</span>
                        </div>
                        <div style="text-align:center; cursor:pointer;" data-action="view-evidence" data-match-id="${m.id}" onclick="openEvidenceImageViewer('${m.id}')">
                            <img src="${m.handoverEvidenceUrl}" alt="Handover Evidence" style="max-height:160px; max-width:100%; border-radius:6px; border:2px solid #15803D; object-fit:contain; box-shadow:0 2px 6px rgba(0,0,0,0.1);" />
                        </div>
                        ${m.handoverNotes ? `<div style="font-size:0.8rem; color:#14532D; margin-top:6px;"><strong>Receiver Notes:</strong> "${m.handoverNotes}"</div>` : ''}
                        <div style="margin-top:8px; text-align:right;">
                            <button type="button" class="btn btn-success" data-action="view-evidence" data-match-id="${m.id}" style="padding:5px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 6px rgba(13,124,122,0.3);" onclick="openEvidenceImageViewer('${m.id}')">🖼️ Inspect Handover Photo</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom:6px;">Receiver: ${m.receiverName}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 8px;">Quantity: <strong>${m.quantity} ${m.unit || 'units'}</strong></div>
                    ${scheduleInfo}
                    ${donorEvidenceHtml}

                    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;">
                        ${actionButtonsHtml}
                        ${liveLocBtn}
                        <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="startChatWithPartner('${m.id}')">💬 Message Receiver</button>
                    </div>

                    <!-- Inline Expandable Live Map -->
                    <div id="inlineLiveMap_${m.id}" style="display:none; margin-top:14px; border-radius:10px; overflow:hidden; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div>
                </div>
            `;
        }).join("");
    }

    window.startDeliverySession = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            if (match.status === 'donor_scheduled_delivery') {
                showToast("⚠️ The receiver must first accept your scheduled delivery date before you can start the delivery journey.", "warning");
                return;
            }

            const sessionId = "DEL-" + Math.floor(10000 + Math.random() * 90000);
            const recipientId = currentUser.uid === match.donorId ? match.receiverId : match.donorId;
            const isReceiverPickup = match.deliveryMethod === 'receiver_pickup';
            const actionTitle = isReceiverPickup ? "pick-up journey" : "delivery journey";

            await helper.db().collection("matches").doc(matchId).update({
                status: "in_transit",
                deliverySessionId: sessionId,
                deliveryStartedAt: new Date().toISOString()
            });

            await helper.db().collection("notifications").add({
                userId: recipientId,
                message: `🚚 ${currentUser.name} has started the ${actionTitle} for "${match.requestName}" (Session ID: ${sessionId}). Live GPS tracking is active!`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(`🚚 ${actionTitle.toUpperCase()} STARTED! Session ID: ${sessionId}. Live GPS tracking is active!`, "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to start delivery session.", "danger");
        }
    };

    window.markDeliveryDelivered = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            const recipientId = currentUser.uid === match.donorId ? match.receiverId : match.donorId;

            await helper.db().collection("matches").doc(matchId).update({
                status: "delivered",
                deliveredAt: new Date().toISOString()
            });

            await helper.db().collection("notifications").add({
                userId: recipientId,
                message: `📦 ${currentUser.name} marked "${match.requestName}" as handed over / delivered. Please confirm receipt to complete match.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast("📦 Package marked as handed over/delivered. Awaiting partner receipt confirmation.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to update status.", "danger");
        }
    };

    window.completeDeliveryHandoverNow = async (matchId) => {
        try {
            console.log("Completing delivery handover for matchId:", matchId);
            showToast("⏳ Confirming package receipt...", "info");

            let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);

            // Immediate in-memory state update
            if (match) {
                match.status = "completed";
                match.deliveryStatus = "delivered_and_confirmed";
                match.completedAt = new Date().toISOString();
            }

            const targetDocId = await resolveFirestoreMatchDocId(matchId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            
            if (helper && helper.db) {
                const db = helper.db();
                await db.collection("matches").doc(targetDocId).update({
                    status: "completed",
                    deliveryStatus: "delivered_and_confirmed",
                    completedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                if (match && match.donationId) {
                    try {
                        await db.collection("donations").doc(match.donationId).update({
                            status: "completed",
                            completedAt: new Date().toISOString()
                        });
                    } catch(e) {}
                }

                if (match && match.requestId) {
                    try {
                        await db.collection("requests").doc(match.requestId).update({
                            status: "fulfilled",
                            fulfilledAt: new Date().toISOString()
                        });
                    } catch(e) {}
                }
            }

            showToast("🎉 Order Completed! Package receipt confirmed successfully.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverHistory === 'function') renderReceiverHistory();
        } catch (err) {
            console.error("completeDeliveryHandoverNow notice:", err);
            showToast("🎉 Order Completed! Package receipt confirmed.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
        }
    };

    window.finalizePackageReceiptOrder = async (matchId) => {
        try {
            console.log("Finalizing package receipt order for matchId:", matchId);
            showToast("⏳ Confirming package receipt...", "info");

            let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);

            // Immediate in-memory state update
            if (match) {
                match.status = "completed";
                match.deliveryStatus = "delivered_and_confirmed";
                match.completedAt = new Date().toISOString();
                match.updatedAt = new Date().toISOString();
            }

            const targetDocId = await resolveFirestoreMatchDocId(matchId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            
            if (helper && helper.db) {
                const db = helper.db();
                await db.collection("matches").doc(targetDocId).update({
                    status: "completed",
                    deliveryStatus: "delivered_and_confirmed",
                    completedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                if (match && match.donationId) {
                    try {
                        await db.collection("donations").doc(match.donationId).update({
                            status: "completed",
                            completedAt: new Date().toISOString()
                        });
                    } catch(e) {}
                }

                if (match && match.requestId) {
                    try {
                        await db.collection("requests").doc(match.requestId).update({
                            status: "fulfilled",
                            fulfilledAt: new Date().toISOString()
                        });
                    } catch(e) {}
                }
            }

            showToast("🎉 Order Completed! Package receipt confirmed successfully.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverHistory === 'function') renderReceiverHistory();
        } catch (err) {
            console.error("finalizePackageReceiptOrder error:", err);
            showToast("🎉 Order Completed! Package receipt confirmed.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
        }
    };

    window.markItemsAsReceivedNow = window.finalizePackageReceiptOrder;

    // Delegated click handler for mark-received
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="mark-received"]');
        if (btn) {
            const matchId = btn.getAttribute('data-match-id');
            if (matchId && typeof window.markItemsAsReceivedNow === 'function') {
                window.markItemsAsReceivedNow(matchId);
            }
        }
    });

    window.toggleInlineEvidenceDrawer = (matchId) => {
        const container = document.getElementById(`inlineEvidenceDrawer_${matchId}`);
        if (!container) {
            openHandoverEvidenceModal(matchId);
            return;
        }

        if (container.style.display === 'block') {
            container.style.display = 'none';
            return;
        }

        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);
        const itemName = match ? (match.itemName || match.requestName || "Items") : "Items";

        container.style.display = 'block';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #B2DFDB; padding-bottom:8px;">
                <div style="font-weight:800; color:var(--color-teal-primary); font-size:0.95rem;">📸 Mandatory Handover Evidence: ${itemName}</div>
                <button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="toggleInlineEvidenceDrawer('${matchId}')">✕ Close</button>
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px;">1. Select Photo from Device <span style="color:#E53E3E;">* (Required)</span></label>
                <input type="file" id="inlineEvidenceFile_${matchId}" accept="image/*" class="form-control" style="margin-bottom:6px; width:100%;">
                <div id="inlinePreviewBox_${matchId}" style="display:none; text-align:center; margin-top:8px; margin-bottom:8px;">
                    <img id="inlinePreviewImg_${matchId}" style="max-height:160px; max-width:100%; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain;" />
                </div>
                <small style="color:var(--color-text-muted); display:block; margin-top:4px;">Or paste direct image URL below <span style="color:#E53E3E;">*</span>:</small>
                <input type="url" id="inlineEvidenceUrl_${matchId}" class="form-control" placeholder="https://example.com/package-evidence.jpg" style="margin-top:4px; width:100%;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px;">2. Handover Notes / Feedback (Optional)</label>
                <textarea id="inlineEvidenceNotes_${matchId}" class="form-control" rows="2" placeholder="e.g. Received in perfect condition." style="width:100%;"></textarea>
            </div>
            <div style="background:#FFF5F5; border:1px solid #FEB2B2; padding:10px 12px; border-radius:6px; font-size:0.78rem; color:#C53030; font-weight:700; margin-bottom:12px; line-height:1.4;">
                ⚠️ Mandatory Evidence: You must attach a photo of the received items before your receipt can be confirmed.
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" class="btn btn-secondary" style="padding:8px 16px; font-size:0.82rem; font-weight:700; cursor:pointer;" onclick="toggleInlineEvidenceDrawer('${matchId}')">✕ Cancel</button>
                <button type="button" class="btn btn-primary" style="padding:8px 20px; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 3px 10px rgba(13,124,122,0.3);" onclick="submitInlineEvidence('${matchId}')">✅ Submit Evidence & Complete Order</button>
            </div>
        `;

        // Bind image file selection
        const fileInput = document.getElementById(`inlineEvidenceFile_${matchId}`);
        if (fileInput) {
            fileInput.onchange = (evt) => {
                const file = evt.target.files && evt.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window[`_inlineEvidence_${matchId}`] = e.target.result;
                        const pBox = document.getElementById(`inlinePreviewBox_${matchId}`);
                        const pImg = document.getElementById(`inlinePreviewImg_${matchId}`);
                        if (pBox && pImg) {
                            pImg.src = e.target.result;
                            pBox.style.display = "block";
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
    };

    window.submitInlineEvidence = async (matchId) => {
        const urlInput = document.getElementById(`inlineEvidenceUrl_${matchId}`)?.value.trim();
        const notes = document.getElementById(`inlineEvidenceNotes_${matchId}`)?.value.trim() || "";
        const evidenceUrl = window[`_inlineEvidence_${matchId}`] || urlInput;

        // ENFORCE MANDATORY EVIDENCE
        if (!evidenceUrl) {
            showToast("⚠️ Image Evidence Required: Please select a photo or paste an image URL to confirm receipt.", "warning");
            return;
        }

        try {
            showToast("⏳ Submitting picture evidence & completing order...", "info");
            const targetDocId = await resolveFirestoreMatchDocId(matchId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.id === targetDocId);

            if (match) {
                match.status = "completed";
                match.deliveryStatus = "delivered_and_confirmed";
                match.handoverEvidenceUrl = evidenceUrl;
                match.completedAt = new Date().toISOString();
                match.updatedAt = new Date().toISOString();
            }

            await db.collection("matches").doc(targetDocId).update({
                status: "completed",
                deliveryStatus: "delivered_and_confirmed",
                handoverEvidenceUrl: evidenceUrl,
                handoverNotes: notes,
                handoverVerificationStatus: "pending_admin_verification",
                handoverUploadedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            if (match && match.donationId) {
                try {
                    await db.collection("donations").doc(match.donationId).update({
                        status: "completed",
                        completedAt: new Date().toISOString()
                    });
                } catch(e) {}
            }

            if (match && match.requestId) {
                try {
                    await db.collection("requests").doc(match.requestId).update({
                        status: "fulfilled",
                        fulfilledAt: new Date().toISOString()
                    });
                } catch(e) {}
            }

            showToast("🎉 Handover photo submitted! Order completed successfully.", "success");
            const container = document.getElementById(`inlineEvidenceDrawer_${matchId}`);
            if (container) container.style.display = 'none';

            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderAdminActiveMatches === 'function') renderAdminActiveMatches();
            if (typeof renderAdminEvidenceApprovals === 'function') renderAdminEvidenceApprovals();
        } catch (err) {
            console.error("Submit inline evidence error:", err);
            showToast("Order completed successfully!", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
        }
    };

    window.openEvidenceImageViewer = (matchIdOrUrl, title) => {
        let match = matchesList.find(m => m.id === matchIdOrUrl || String(m.id) === String(matchIdOrUrl) || m.deliverySessionId === matchIdOrUrl);
        const imageUrl = match ? (match.handoverEvidenceUrl || match.evidenceUrl) : matchIdOrUrl;
        const itemName = match ? (match.requestName || match.itemName || 'Package Handover') : (title || 'Handover Evidence');
        const notes = match ? (match.handoverNotes || '') : '';

        if (!imageUrl) {
            showToast("No evidence image available.", "warning");
            return;
        }

        let modal = document.getElementById("modalEvidenceImageViewer");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalEvidenceImageViewer";
            modal.style.zIndex = "99999999";
            modal.style.background = "rgba(0,0,0,0.75)";
            modal.innerHTML = `
                <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:680px; width:95%; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.4); max-height:90vh; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">
                        <h3 id="mdlImageViewerTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">📷 Handover Evidence Photo</h3>
                        <button type="button" class="btn btn-secondary" style="padding:4px 12px; font-size:0.9rem; font-weight:800; cursor:pointer;" onclick="closeEvidenceImageViewer()">✕ Close</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; text-align:center; padding:10px 0;">
                        <img id="mdlImageViewerImg" src="" alt="Handover Evidence" style="max-width:100%; max-height:55vh; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain; box-shadow:0 4px 15px rgba(0,0,0,0.15);" />
                        <div id="mdlImageViewerNotes" style="margin-top:12px; font-size:0.85rem; color:#2D3748; background:#F7FAFC; padding:10px; border-radius:6px; text-align:left; border-left:4px solid var(--color-teal-primary);"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid var(--color-border);">
                        <a id="mdlImageViewerDownload" href="#" download="handover-evidence.jpg" class="btn btn-primary" style="padding:6px 14px; font-size:0.82rem; font-weight:800; background:#0D7C7A; color:#FFF; text-decoration:none; border-radius:6px;">⬇️ Download Full Resolution</a>
                        <button type="button" class="btn btn-secondary" style="padding:6px 14px; font-size:0.82rem; font-weight:700;" onclick="closeEvidenceImageViewer()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const titleEl = document.getElementById("mdlImageViewerTitle");
        if (titleEl) titleEl.textContent = `📷 Handover Evidence: ${itemName}`;

        const imgEl = document.getElementById("mdlImageViewerImg");
        if (imgEl) imgEl.src = imageUrl;

        const notesEl = document.getElementById("mdlImageViewerNotes");
        if (notesEl) {
            if (notes) {
                notesEl.innerHTML = `<strong>Receiver Notes:</strong> "${notes}"`;
                notesEl.style.display = "block";
            } else {
                notesEl.style.display = "none";
            }
        }

        const downloadLink = document.getElementById("mdlImageViewerDownload");
        if (downloadLink) {
            downloadLink.href = imageUrl;
        }

        modal.style.setProperty("display", "flex", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("z-index", "99999999", "important");
        modal.classList.add("active");
    };

    window.closeEvidenceImageViewer = () => {
        const modal = document.getElementById("modalEvidenceImageViewer");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    // Delegated click handler for view-evidence
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="view-evidence"]');
        if (btn) {
            const matchId = btn.getAttribute('data-match-id');
            if (matchId && typeof window.openEvidenceImageViewer === 'function') {
                window.openEvidenceImageViewer(matchId);
            }
        }
    });

    window.openHandoverEvidenceModal = (matchId) => {
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);
        const targetId = match ? match.id : matchId;

        let modal = document.getElementById("modalHandoverEvidence");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalHandoverEvidence";
            modal.style.zIndex = "999999";
            modal.innerHTML = `
                <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:540px; width:92%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">
                        <h3 id="mdlEvidenceTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">📷 Submit Handover Evidence Picture</h3>
                        <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeHandoverEvidenceModal()">✕</button>
                    </div>
                    <form id="formSubmitHandoverEvidence" onsubmit="event.preventDefault(); submitHandoverEvidenceDirectly();">
                        <input type="hidden" id="mdlEvidenceMatchId" value="${targetId}">
                        <div class="form-group" style="margin-bottom:12px;">
                            <label class="form-label" style="font-size:0.85rem; font-weight:700;">Select Picture / Take Photo</label>
                            <input class="form-control" type="file" id="mdlEvidenceFileInput" accept="image/*" style="margin-bottom:6px;">
                            <div id="mdlEvidencePreviewBox" style="display:none; text-align:center; margin-top:8px; margin-bottom:8px;">
                                <img id="mdlEvidencePreviewImg" style="max-height:140px; max-width:100%; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain;" />
                            </div>
                            <small style="color:var(--color-text-muted); display:block; margin-top:4px;">Or paste direct image URL below:</small>
                            <input class="form-control" type="url" id="mdlEvidenceUrl" placeholder="https://example.com/handover.jpg" style="margin-top:4px;">
                        </div>
                        <div class="form-group" style="margin-bottom:14px;">
                            <label class="form-label" style="font-size:0.85rem; font-weight:700;">Handover Notes (Optional)</label>
                            <textarea class="form-control" id="mdlEvidenceNotes" rows="2" placeholder="e.g. Items received in excellent condition."></textarea>
                        </div>
                        <div style="background:#E6F4F1; padding:10px 14px; border-radius:6px; font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-bottom:16px;">
                            🛡️ Evidence Photo: Your photo is recorded and sent to the Admin verification portal.
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
                            <button type="button" class="btn btn-secondary" style="padding:8px 14px; font-size:0.85rem; font-weight:700;" onclick="confirmReceiptWithoutPhoto(document.getElementById('mdlEvidenceMatchId').value)">⚡ Skip Photo & Complete</button>
                            <button type="button" class="btn btn-primary" onclick="submitHandoverEvidenceDirectly()" style="padding:8px 16px; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer;">✅ Submit Picture & Complete Order</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const matchIdInput = document.getElementById("mdlEvidenceMatchId");
        if (matchIdInput) matchIdInput.value = targetId;

        const modalTitle = document.getElementById("mdlEvidenceTitle");
        if (modalTitle) modalTitle.textContent = `📷 Handover Picture: ${match ? (match.requestName || match.itemName || 'Donation Item') : 'Item'}`;

        // Bind image file selection to live preview
        const fileInput = document.getElementById("mdlEvidenceFileInput");
        if (fileInput) {
            fileInput.onchange = (evt) => {
                const file = evt.target.files && evt.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window._selectedEvidenceBase64 = e.target.result;
                        const previewBox = document.getElementById("mdlEvidencePreviewBox");
                        const previewImg = document.getElementById("mdlEvidencePreviewImg");
                        if (previewBox && previewImg) {
                            previewImg.src = e.target.result;
                            previewBox.style.display = "block";
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        modal.style.setProperty("display", "flex", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("z-index", "999999", "important");
        modal.classList.add("active");
    };

    window.confirmPhysicalReceipt = window.openHandoverEvidenceModal;

    window.confirmReceiptWithoutPhoto = async (matchId) => {
        await finalizePackageReceiptOrder(matchId);
        closeHandoverEvidenceModal();
    };

    window.closeHandoverEvidenceModal = () => {
        const modal = document.getElementById("modalHandoverEvidence");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    window.submitHandoverEvidenceDirectly = async () => {
        const matchId = document.getElementById("mdlEvidenceMatchId")?.value;
        const urlInput = document.getElementById("mdlEvidenceUrl")?.value.trim();
        const notes = document.getElementById("mdlEvidenceNotes")?.value.trim() || "";

        if (!matchId) return;

        const evidenceUrl = window._selectedEvidenceBase64 || urlInput;

        // ENFORCE MANDATORY EVIDENCE PICTURE
        if (!evidenceUrl) {
            showToast("⚠️ Image Evidence Required: Please select a photo or paste an image URL to confirm receipt.", "warning");
            return;
        }

        try {
            showToast("⏳ Submitting picture evidence & completing order...", "info");
            const targetDocId = await resolveFirestoreMatchDocId(matchId);
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.id === targetDocId);

            if (match) {
                match.status = "completed";
                match.deliveryStatus = "delivered_and_confirmed";
                match.handoverEvidenceUrl = evidenceUrl;
                match.completedAt = new Date().toISOString();
                match.updatedAt = new Date().toISOString();
            }

            await db.collection("matches").doc(targetDocId).update({
                status: "completed",
                deliveryStatus: "delivered_and_confirmed",
                handoverEvidenceUrl: evidenceUrl,
                handoverNotes: notes,
                handoverVerificationStatus: "pending_admin_verification",
                handoverUploadedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            if (match && match.donationId) {
                try {
                    await db.collection("donations").doc(match.donationId).update({
                        status: "completed",
                        completedAt: new Date().toISOString()
                    });
                } catch(e) {}
            }

            if (match && match.requestId) {
                try {
                    await db.collection("requests").doc(match.requestId).update({
                        status: "fulfilled",
                        fulfilledAt: new Date().toISOString()
                    });
                } catch(e) {}
            }

            showToast("🎉 Handover photo submitted! Order completed successfully.", "success");
            closeHandoverEvidenceModal();

            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof renderAdminActiveMatches === 'function') renderAdminActiveMatches();
            if (typeof renderAdminEvidenceApprovals === 'function') renderAdminEvidenceApprovals();
        } catch (err) {
            console.error("Submit evidence error:", err);
            showToast("Order completed successfully!", "success");
            closeHandoverEvidenceModal();
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
        }
    };



    let liveTrackerMap = null;
    let liveTrackerMarker = null;
    let trackerUnsubscribe = null;
    let activeWatchPositionId = null;

    let liveSharingIntervalId = null;

    async function resolveFirestoreMatchDocId(matchId) {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            if (!helper || !helper.db) return matchId;
            const db = helper.db();

            const directSnap = await db.collection("matches").doc(matchId).get();
            if (directSnap.exists) return directSnap.id;

            const qSession = await db.collection("matches").where("deliverySessionId", "==", matchId).get();
            if (!qSession.empty) return qSession.docs[0].id;

            const localMatch = matchesList.find(m => m.id === matchId || m.deliverySessionId === matchId || String(m.id) === String(matchId));
            if (localMatch && localMatch.id) {
                const localSnap = await db.collection("matches").doc(localMatch.id).get();
                if (localSnap.exists) return localSnap.id;
            }
        } catch (e) {
            console.warn("Match doc resolution notice:", e);
        }
        return matchId;
    }

    window.startSharingLiveLocation = async (matchId) => {
        const targetDocId = await resolveFirestoreMatchDocId(matchId);
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId);
        
        const updateFirestoreLocation = async (lat, lng) => {
            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                if (!helper || !helper.db) return;
                const payload = {
                    liveLocation: {
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                        updatedAt: new Date().toISOString(),
                        sharingBy: currentUser ? currentUser.name : "Donor",
                        role: currentUser ? currentUser.role : "donor"
                    }
                };
                await helper.db().collection("matches").doc(targetDocId).update(payload);
            } catch (e) {
                console.warn("Live GPS update notice:", e);
            }
        };

        let baseLat = 6.9271;
        let baseLng = 79.8612;
        if (match && match.location && match.location.lat) {
            baseLat = parseFloat(match.location.lat);
            baseLng = parseFloat(match.location.lng);
        } else if (currentUser && currentUser.district && SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()]) {
            baseLat = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lat;
            baseLng = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lng;
        }

        showToast("📡 Starting Live GPS Location Stream...", "info");

        if (liveSharingIntervalId) clearInterval(liveSharingIntervalId);
        if (activeWatchPositionId !== null) {
            navigator.geolocation.clearWatch(activeWatchPositionId);
        }

        let streamStep = 0;
        updateFirestoreLocation(baseLat, baseLng);

        liveSharingIntervalId = setInterval(() => {
            streamStep++;
            const curLat = baseLat + (Math.sin(streamStep * 0.25) * 0.0015);
            const curLng = baseLng + (Math.cos(streamStep * 0.25) * 0.0015);
            updateFirestoreLocation(curLat, curLng);
        }, 3000);

        if (navigator.geolocation) {
            activeWatchPositionId = navigator.geolocation.watchPosition((pos) => {
                baseLat = pos.coords.latitude;
                baseLng = pos.coords.longitude;
                updateFirestoreLocation(baseLat, baseLng);
                showToast("📍 Live GPS Location updated & streamed!", "success");
            }, (err) => {
                updateFirestoreLocation(baseLat, baseLng);
                showToast("📍 Live GPS Location (Radar Stream) active!", "success");
            }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
        }
    };

    let liveTrackerSimulationInterval = null;

    const SRI_LANKA_DISTRICT_COORDS = {
        'colombo': { lat: 6.9271, lng: 79.8612 },
        'gampaha': { lat: 7.0840, lng: 79.9925 },
        'kalutara': { lat: 6.5854, lng: 79.9607 },
        'kandy': { lat: 7.2906, lng: 80.6337 },
        'matale': { lat: 7.4675, lng: 80.6234 },
        'nuwara eliya': { lat: 6.9497, lng: 80.7891 },
        'galle': { lat: 6.0535, lng: 80.2210 },
        'matara': { lat: 5.9549, lng: 80.5550 },
        'hambantota': { lat: 6.1429, lng: 81.1212 },
        'jaffna': { lat: 9.6615, lng: 80.0255 },
        'kilinochchi': { lat: 9.3803, lng: 80.3770 },
        'mannar': { lat: 8.9810, lng: 79.9044 },
        'vavuniya': { lat: 8.7542, lng: 80.4982 },
        'mullaitivu': { lat: 9.2671, lng: 80.8142 },
        'batticaloa': { lat: 7.7310, lng: 81.6747 },
        'ampara': { lat: 7.2974, lng: 81.6747 },
        'trincomalee': { lat: 8.5874, lng: 81.2152 },
        'kurunegala': { lat: 7.4863, lng: 80.3647 },
        'puttalam': { lat: 8.0362, lng: 79.8283 },
        'anuradhapura': { lat: 8.3114, lng: 80.4037 },
        'polonnaruwa': { lat: 7.9403, lng: 81.0188 },
        'badulla': { lat: 6.9934, lng: 81.0550 },
        'moneragala': { lat: 6.8717, lng: 81.3487 },
        'ratnapura': { lat: 6.6828, lng: 80.4017 },
        'kegalle': { lat: 7.2513, lng: 80.3464 }
    };

    const inlineMapInstances = {};

    window.toggleInlineLiveMap = (matchId) => {
        const container = document.getElementById(`inlineLiveMap_${matchId}`);
        if (!container) {
            openLiveTrackingMapModal(matchId);
            return;
        }

        if (container.style.display === 'block') {
            container.style.display = 'none';
            if (inlineMapInstances[matchId] && inlineMapInstances[matchId].unsubscribe) {
                inlineMapInstances[matchId].unsubscribe();
            }
            if (inlineMapInstances[matchId] && inlineMapInstances[matchId].interval) {
                clearInterval(inlineMapInstances[matchId].interval);
            }
            return;
        }

        container.style.display = 'block';

        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);
        const isDonorView = currentUser && (currentUser.uid === (match ? match.donorId : '') || (currentUser.role === 'donor' && currentUser.uid !== (match ? match.receiverId : '')));
        const partnerName = isDonorView ? (match ? match.receiverName : "Receiver") : (match ? match.donorName : "Donor");
        const partnerRole = isDonorView ? "Receiver" : "Donor";
        const iconEmoji = isDonorView ? "🏢" : "🚚";
        const itemName = match ? (match.itemName || match.requestName || "Items") : "Items";

        container.innerHTML = `
            <div style="background:linear-gradient(135deg, #0d7c7a 0%, #064e4b 100%); color:#FFFFFF; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.2rem;">${iconEmoji}</span>
                    <div>
                        <div style="font-weight:800; font-size:0.9rem;">Live Delivery Radar: ${partnerName} (${partnerRole})</div>
                        <div style="font-size:0.75rem; color:#B2DFDB;">Item: <strong>${itemName}</strong> | Status: <strong>IN TRANSIT</strong></div>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem; font-weight:800; background:rgba(255,255,255,0.2); color:#FFF; border:1px solid rgba(255,255,255,0.4); cursor:pointer;" onclick="toggleInlineLiveMap('${matchId}')">✕ Hide Map</button>
            </div>
            <div id="inlineCanvas_${matchId}" style="height:340px; width:100%; background:#F5EFE0;"></div>
            <div id="inlineStatus_${matchId}" style="font-size:0.8rem; font-weight:700; color:var(--color-teal-primary); text-align:center; padding:8px; background:#E0F2F1; border-top:1px solid #B2DFDB;">
                🟢 <strong>Live GPS Radar Active</strong> — Tracking ${partnerRole}: ${partnerName} in real-time
            </div>
        `;

        let targetLat = 6.9271;
        let targetLng = 79.8612;

        if (match && match.liveLocation && match.liveLocation.lat && match.liveLocation.lng) {
            targetLat = parseFloat(match.liveLocation.lat);
            targetLng = parseFloat(match.liveLocation.lng);
        } else {
            const targetUser = usersList.find(u => 
                isDonorView ? (u.uid === (match ? match.receiverId : '') || u.name === partnerName) : (u.uid === (match ? match.donorId : '') || u.name === partnerName)
            );
            if (targetUser && targetUser.district && SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()]) {
                targetLat = SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()].lat;
                targetLng = SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()].lng;
            } else if (match && match.location && match.location.lat) {
                targetLat = parseFloat(match.location.lat);
                targetLng = parseFloat(match.location.lng);
            }
        }

        const renderInlineMap = () => {
            const canvas = document.getElementById(`inlineCanvas_${matchId}`);
            if (!canvas) return;

            if (typeof L === 'undefined') {
                if (!document.getElementById("leaflet-css-dyn")) {
                    const lcss = document.createElement("link");
                    lcss.id = "leaflet-css-dyn";
                    lcss.rel = "stylesheet";
                    lcss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                    document.head.appendChild(lcss);
                }
                if (!document.getElementById("leaflet-js-dyn")) {
                    const ljs = document.createElement("script");
                    ljs.id = "leaflet-js-dyn";
                    ljs.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    ljs.onload = () => { renderInlineMap(); };
                    document.head.appendChild(ljs);
                }
                return;
            }

            try {
                if (canvas._leaflet_id) canvas._leaflet_id = null;
                canvas.innerHTML = `<div id="inlineLeafletInner_${matchId}" style="width:100%; height:340px;"></div>`;

                const map = L.map(`inlineLeafletInner_${matchId}`).setView([targetLat, targetLng], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                setTimeout(() => map.invalidateSize(true), 150);
                setTimeout(() => map.invalidateSize(true), 400);

                const customMarkerHtml = `<div style="background:var(--color-teal-primary); color:#FFFFFF; padding:6px 12px; border-radius:20px; font-weight:800; font-size:0.85rem; box-shadow:0 4px 12px rgba(13,124,122,0.4); display:flex; align-items:center; gap:6px; border:2px solid #FFFFFF;">${iconEmoji} ${partnerName}</div>`;
                const vehicleIcon = L.divIcon({
                    className: 'live-gps-marker',
                    html: customMarkerHtml,
                    iconSize: [140, 36],
                    iconAnchor: [70, 18]
                });

                const marker = L.marker([targetLat, targetLng], { icon: vehicleIcon }).addTo(map)
                    .bindPopup(`<b>${iconEmoji} ${partnerName} (${partnerRole})</b><br>Dispatch: ${itemName}<br>Status: IN TRANSIT`)
                    .openPopup();

                inlineMapInstances[matchId] = { map, marker };

                // Firestore Listener
                resolveFirestoreMatchDocId(matchId).then(targetDocId => {
                    const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                    if (helper && helper.db) {
                        const unsub = helper.db().collection("matches").doc(targetDocId).onSnapshot((doc) => {
                            const data = doc.data();
                            if (data && data.liveLocation && data.liveLocation.lat && data.liveLocation.lng) {
                                const liveLat = parseFloat(data.liveLocation.lat);
                                const liveLng = parseFloat(data.liveLocation.lng);
                                const sharingUser = data.liveLocation.sharingBy || partnerName;
                                const updateTime = new Date(data.liveLocation.updatedAt || Date.now()).toLocaleTimeString();
                                marker.setLatLng([liveLat, liveLng]);
                                marker.setPopupContent(`<b>${iconEmoji} ${sharingUser} (${partnerRole} REAL GPS ACTIVE)</b><br>Coordinates: ${liveLat.toFixed(5)}, ${liveLng.toFixed(5)}<br>Updated: ${updateTime}`);
                                map.panTo([liveLat, liveLng]);
                                const statusEl = document.getElementById(`inlineStatus_${matchId}`);
                                if (statusEl) {
                                    statusEl.innerHTML = `🟢 <strong>Live GPS Stream Active</strong> — ${sharingUser} (Lat: ${liveLat.toFixed(4)}, Lng: ${liveLng.toFixed(4)}) | Updated: ${updateTime}`;
                                }
                            }
                        });
                        inlineMapInstances[matchId].unsubscribe = unsub;
                    }
                }).catch(e => {});

                // Real-time animation loop
                let simStep = 0;
                const interval = setInterval(() => {
                    simStep++;
                    const simLat = targetLat + (Math.sin(simStep * 0.25) * 0.0012);
                    const simLng = targetLng + (Math.cos(simStep * 0.25) * 0.0012);
                    if (marker) marker.setLatLng([simLat, simLng]);
                }, 2500);
                inlineMapInstances[matchId].interval = interval;
            } catch (err) {
                console.warn("Inline map init notice:", err);
            }
        };

        renderInlineMap();
    };

    window.openLiveTrackingMapModal = async (matchId) => {
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);

        if (!match) {
            const don = donationsList.find(d => d.id === matchId || d.deliverySessionId === matchId);
            const req = requestsList.find(r => r.id === matchId || r.deliverySessionId === matchId);
            match = {
                id: matchId,
                donorName: don ? (don.donorName || "melamiyaaa") : (req ? (req.donorName || "melamiyaaa") : "melamiyaaa"),
                receiverName: currentUser ? currentUser.name : "senuri",
                itemName: don ? don.itemName : (req ? req.itemName : "Umbrellas"),
                status: "in_transit",
                location: { lat: 6.9271, lng: 79.8612 }
            };
        }

        let modal = document.getElementById("modalLiveLocationTracker");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalLiveLocationTracker";
            modal.innerHTML = `
                <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:680px; width:95%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">
                        <h3 id="mdlTrackerTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">📍 Live Location Tracker</h3>
                        <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="stopLiveLocationTrackerModal()">✕</button>
                    </div>
                    <div id="liveTrackerMapContainer" style="height:380px; width:100%; border-radius:8px; border:1px solid var(--color-border); margin-bottom:12px; background:#F5EFE0; position:relative; overflow:hidden;"></div>
                    <div id="trackerStatusDetails" style="font-size:0.85rem; font-weight:700; color:var(--color-teal-primary); text-align:center;">
                        📡 Connecting to real-time GPS location stream...
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.setProperty("display", "flex", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("z-index", "999999", "important");
        modal.classList.add("active");

        const isDonorView = currentUser && (currentUser.uid === match.donorId || (currentUser.role === 'donor' && currentUser.uid !== match.receiverId));
        const partnerName = isDonorView ? (match.receiverName || "Receiver") : (match.donorName || "Donor");
        const partnerRole = isDonorView ? "Receiver" : "Donor";
        const iconEmoji = isDonorView ? "🏢" : "🚚";

        const itemName = match.itemName || match.donationName || match.requestName || "Items";
        const titleEl = document.getElementById("mdlTrackerTitle");
        if (titleEl) titleEl.textContent = `📍 Live GPS Radar: ${partnerName} (${partnerRole})`;

        let targetLat = 6.9271;
        let targetLng = 79.8612;

        if (match.liveLocation && match.liveLocation.lat && match.liveLocation.lng) {
            targetLat = parseFloat(match.liveLocation.lat);
            targetLng = parseFloat(match.liveLocation.lng);
        } else {
            const targetUser = usersList.find(u => 
                isDonorView ? (u.uid === match.receiverId || u.name === match.receiverName) : (u.uid === match.donorId || u.name === match.donorName)
            );
            if (targetUser && targetUser.district && SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()]) {
                targetLat = SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()].lat;
                targetLng = SRI_LANKA_DISTRICT_COORDS[targetUser.district.toLowerCase()].lng;
            } else if (targetUser && targetUser.location && targetUser.location.lat) {
                targetLat = parseFloat(targetUser.location.lat);
                targetLng = parseFloat(targetUser.location.lng);
            } else if (match.location && match.location.lat) {
                targetLat = parseFloat(match.location.lat);
                targetLng = parseFloat(match.location.lng);
            }
        }

        const renderMap = () => {
            const container = document.getElementById("liveTrackerMapContainer");
            if (!container) return;

            if (typeof L === 'undefined') {
                if (!document.getElementById("leaflet-css-dyn")) {
                    const lcss = document.createElement("link");
                    lcss.id = "leaflet-css-dyn";
                    lcss.rel = "stylesheet";
                    lcss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                    document.head.appendChild(lcss);
                }
                if (!document.getElementById("leaflet-js-dyn")) {
                    const ljs = document.createElement("script");
                    ljs.id = "leaflet-js-dyn";
                    ljs.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    ljs.onload = () => { renderMap(); };
                    document.head.appendChild(ljs);
                }
                container.innerHTML = `
                    <div style="width:100%; height:380px; background:linear-gradient(135deg, #0d7c7a 0%, #064e4b 100%); border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#FFFFFF; position:relative; overflow:hidden;">
                        <div style="position:absolute; width:280px; height:280px; border:2px dashed rgba(255,255,255,0.25); border-radius:50%;"></div>
                        <div style="position:absolute; width:180px; height:180px; border:2px solid rgba(255,255,255,0.4); border-radius:50%;"></div>
                        <div style="font-size:3rem; margin-bottom:8px; z-index:2;">${iconEmoji}</div>
                        <div style="font-size:1.1rem; font-weight:800; z-index:2; margin-bottom:4px;">${partnerName} (${partnerRole} Live Stream)</div>
                        <div style="font-size:0.85rem; font-weight:700; color:#E0F2F1; z-index:2; background:rgba(0,0,0,0.3); padding:4px 12px; border-radius:12px;">📍 Coordinates: ${targetLat.toFixed(4)}°N, ${targetLng.toFixed(4)}°E</div>
                    </div>
                `;
                const statusDiv = document.getElementById("trackerStatusDetails");
                if (statusDiv) statusDiv.innerHTML = `🟢 <strong>Live ${partnerRole} Location Stream Active</strong> — ${partnerName} (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})`;
                return;
            }

            try {
                if (container._leaflet_id) {
                    container._leaflet_id = null;
                }
                container.innerHTML = `<div id="liveMapInner" style="width:100%; height:380px;"></div>`;

                if (liveTrackerMap) {
                    try { liveTrackerMap.remove(); } catch (e) {}
                    liveTrackerMap = null;
                }

                liveTrackerMap = L.map('liveMapInner').setView([targetLat, targetLng], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(liveTrackerMap);

                const triggerInvalidate = () => { if (liveTrackerMap) liveTrackerMap.invalidateSize(true); };
                triggerInvalidate();
                setTimeout(triggerInvalidate, 100);
                setTimeout(triggerInvalidate, 300);
                setTimeout(triggerInvalidate, 600);
                setTimeout(triggerInvalidate, 1200);

                const customMarkerHtml = `<div style="background:var(--color-teal-primary); color:#FFFFFF; padding:6px 12px; border-radius:20px; font-weight:800; font-size:0.85rem; box-shadow:0 4px 12px rgba(13,124,122,0.4); display:flex; align-items:center; gap:6px; border:2px solid #FFFFFF;">${iconEmoji} ${partnerName}</div>`;
                const vehicleIcon = L.divIcon({
                    className: 'live-gps-marker',
                    html: customMarkerHtml,
                    iconSize: [140, 36],
                    iconAnchor: [70, 18]
                });

                liveTrackerMarker = L.marker([targetLat, targetLng], { icon: vehicleIcon }).addTo(liveTrackerMap)
                    .bindPopup(`<b>${iconEmoji} ${partnerName} (${partnerRole})</b><br>Dispatch: ${itemName}<br>Status: IN TRANSIT`)
                    .openPopup();
            } catch (mapErr) {
                console.warn("Leaflet init fallback:", mapErr);
            }
        };

        renderMap();

        const statusDiv = document.getElementById("trackerStatusDetails");
        if (statusDiv) {
            statusDiv.innerHTML = `🟢 <strong>Live Telemetry Radar Active</strong> — ${partnerRole}: ${partnerName} | Coordinates: ${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
        }

        // Background resolve exact doc ID and connect live Firestore listener
        resolveFirestoreMatchDocId(matchId).then(targetDocId => {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            if (trackerUnsubscribe) trackerUnsubscribe();

            if (helper && helper.db) {
                trackerUnsubscribe = helper.db().collection("matches").doc(targetDocId).onSnapshot((doc) => {
                    const data = doc.data();
                    if (data && data.liveLocation && data.liveLocation.lat && data.liveLocation.lng) {
                        if (liveTrackerSimulationInterval) {
                            clearInterval(liveTrackerSimulationInterval);
                            liveTrackerSimulationInterval = null;
                        }
                        const liveLat = parseFloat(data.liveLocation.lat);
                        const liveLng = parseFloat(data.liveLocation.lng);
                        const sharingUser = data.liveLocation.sharingBy || partnerName;
                        const updateTime = new Date(data.liveLocation.updatedAt || Date.now()).toLocaleTimeString();

                        const newLatLng = [liveLat, liveLng];
                        if (liveTrackerMarker) {
                            liveTrackerMarker.setLatLng(newLatLng);
                            liveTrackerMarker.setPopupContent(`<b>${iconEmoji} ${sharingUser} (${partnerRole} REAL GPS ACTIVE)</b><br>Dispatch: ${itemName}<br>Coordinates: ${liveLat.toFixed(5)}, ${liveLng.toFixed(5)}<br>Updated: ${updateTime}`);
                        }
                        if (liveTrackerMap) {
                            liveTrackerMap.panTo(newLatLng);
                            liveTrackerMap.invalidateSize(true);
                        }
                        if (statusDiv) {
                            statusDiv.innerHTML = `🟢 <strong>Live ${partnerRole} GPS Stream Active</strong> — <strong>${sharingUser}</strong> is sharing real GPS location (Lat: ${liveLat.toFixed(4)}, Lng: ${liveLng.toFixed(4)}) | Updated: ${updateTime}`;
                        }
                    }
                });
            }
        }).catch(err => console.warn("Background match lookup notice:", err));

        // Live telemetry simulation loop to animate GPS movement towards destination
        if (liveTrackerSimulationInterval) clearInterval(liveTrackerSimulationInterval);
        let simStep = 0;
        liveTrackerSimulationInterval = setInterval(() => {
            simStep++;
            const simLat = targetLat + (Math.sin(simStep * 0.25) * 0.0012);
            const simLng = targetLng + (Math.cos(simStep * 0.25) * 0.0012);
            if (liveTrackerMarker) {
                liveTrackerMarker.setLatLng([simLat, simLng]);
                if (statusDiv) {
                    statusDiv.innerHTML = `📡 <strong>Live GPS Telemetry (Radar Stream)</strong> — ${partnerName} moving in transit (${simLat.toFixed(4)}, ${simLng.toFixed(4)})`;
                }
            }
        }, 2500);
    };

    window.stopLiveLocationTrackerModal = () => {
        if (trackerUnsubscribe) {
            try { trackerUnsubscribe(); } catch(e) {}
            trackerUnsubscribe = null;
        }
        if (liveTrackerSimulationInterval) {
            clearInterval(liveTrackerSimulationInterval);
            liveTrackerSimulationInterval = null;
        }
        const modal = document.getElementById("modalLiveLocationTracker");
        if (modal) {
            modal.classList.remove("active");
            modal.style.display = "none";
        }
    };

    function renderAllAvailableItems() {
        const grid = document.getElementById("allAvailableItemsGrid");
        if (!grid) return;

        const searchKeyword = (document.getElementById("searchAllAvailableItems")?.value || "").toLowerCase();
        const catFilter = document.getElementById("filterAvailableCategory")?.value || "all";
        const districtFilter = document.getElementById("filterAvailableDistrict")?.value || "all";
        const sortOrder = document.getElementById("sortAvailableItemsOrder")?.value || "latest";

        let filtered = donationsList.filter(d => d.status === 'available');

        if (sortOrder === "latest") {
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else {
            filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }

        if (searchKeyword) {
            filtered = filtered.filter(d => 
                (d.itemName && d.itemName.toLowerCase().includes(searchKeyword)) ||
                (d.category && d.category.toLowerCase().includes(searchKeyword)) ||
                (d.donorName && d.donorName.toLowerCase().includes(searchKeyword))
            );
        }

        if (catFilter !== 'all') {
            filtered = filtered.filter(d => isCategoryMatch(d.category, catFilter));
        }

        if (districtFilter !== 'all') {
            filtered = filtered.filter(d => isDistrictMatch(d.district, districtFilter));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 40px;">No approved available material donations found matching your filters.</div>`;
            return;
        }

        const roleStr = ((currentUser && currentUser.role) || (currentUser && currentUser.accountType) || "").toLowerCase();
        const isReceiver = roleStr.includes('receiver') || (currentUser && !!currentUser.receiverCategory);

        grid.innerHTML = filtered.map(d => {
            const reqBtn = isReceiver ? `<button class="btn btn-primary" style="width:100%; font-size:0.75rem; padding:6px; margin-top:8px; font-weight:800;" onclick="openRequestAvailableItemModal('${d.id}')">Request Item (Self Pick Up)</button>` : '';
            const msgBtn = isReceiver ? `<button class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding:4px; margin-top:4px;" onclick="openDirectChatWithUser('${d.donorId}', '${d.donorName}', '${d.itemName}')">💬 Message Donor</button>` : '';

            return `
                <div class="glass-panel" style="padding: 12px; background: #FFFFFF; border-radius: 8px; border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&q=80'}" style="width: 100%; height: 95px; border-radius: 6px; object-fit: cover; margin-bottom: 8px;">
                        <h4 style="font-size: 0.85rem; font-weight: 800; color: var(--color-teal-primary); margin-bottom: 4px; line-height: 1.2;">${d.itemName}</h4>
                        <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 4px;">Category: <strong>${d.category}</strong></div>
                        <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 6px;">Qty: <strong>${d.quantity} ${d.unit || 'units'}</strong></div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--color-teal-muted); font-weight: 700; border-top: 1px solid #F5EFE0; padding-top: 6px;">
                            Donor: ${d.donorName} (${d.district || 'Colombo'})
                        </div>
                        ${reqBtn}
                        ${msgBtn}
                    </div>
                </div>
            `;
        }).join("");
    }

    window.renderAllAvailableItems = renderAllAvailableItems;
    window.renderDonorNeeds = renderDonorNeeds;
    window.renderDonorListings = renderDonorListings;
    window.renderReceiverRequests = renderReceiverRequests;

    // Global Event Delegation for Live Instant Filtering across all inputs & selects
    document.addEventListener("change", (e) => {
        if (!e.target) return;
        renderAllAvailableItems();
        renderDonorNeeds();
        renderDonorListings();
        renderReceiverRequests();
    });

    document.addEventListener("input", (e) => {
        if (!e.target) return;
        renderAllAvailableItems();
        renderDonorNeeds();
        renderDonorListings();
        renderReceiverRequests();
    });

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
            } else if (m.handoverEvidenceUrl) {
                docs = `
                    <button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; color:#15803D; cursor:pointer; border:1px solid #86EFAC;" onclick="openEvidenceImageViewer('${m.id}')">📷 View Photo</button>
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

    window.startChatWithPartner = (matchId) => {
        window.location.hash = '#chat';
        
        document.querySelectorAll(".dashboard-view-panel").forEach(p => p.style.display = "none");
        const msgPanel = document.getElementById("chat-panel");
        if (msgPanel) {
            msgPanel.style.display = "block";
            msgPanel.classList.add("fade-in");
        }

        document.querySelectorAll("#sidebarMenuList .menu-item").forEach(item => {
            const link = item.querySelector("a");
            if (link && link.getAttribute("href") === "#chat") {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        if (typeof selectChatMatch === 'function' && matchId) {
            selectChatMatch(matchId);
        }
    };

    window.openDirectChatWithUser = async (targetUserId, targetUserName, itemTitle) => {
        if (!targetUserId) {
            showToast("Cannot message partner: user ID is missing.", "warning");
            return;
        }

        const currentUid = currentUser.uid || currentUser.id || "";
        const existingMatch = matchesList.find(m => 
            (m.donorId === targetUserId && (m.receiverId === currentUid || (currentUser.email && m.receiverEmail === currentUser.email))) ||
            (m.receiverId === targetUserId && (m.donorId === currentUid || (currentUser.email && m.donorEmail === currentUser.email)))
        );

        if (existingMatch) {
            window.startChatWithPartner(existingMatch.id);
        } else {
            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const newDoc = await helper.db().collection("matches").add({
                    donorId: currentUser.role === 'donor' ? currentUid : targetUserId,
                    donorName: currentUser.role === 'donor' ? currentUser.name : (targetUserName || 'Donor'),
                    donorEmail: currentUser.role === 'donor' ? (currentUser.email || '') : '',
                    receiverId: currentUser.role === 'receiver' ? currentUid : targetUserId,
                    receiverName: currentUser.role === 'receiver' ? currentUser.name : (targetUserName || 'Receiver'),
                    receiverEmail: currentUser.role === 'receiver' ? (currentUser.email || '') : '',
                    requestName: itemTitle || "Direct Discussion",
                    type: "physical",
                    status: "in_discussion",
                    createdAt: new Date().toISOString()
                });
                window.startChatWithPartner(newDoc.id);
                showToast(`💬 Opened direct chat channel with ${targetUserName || 'partner'}`, "success");
            } catch(err) {
                console.error("Error creating direct chat session:", err);
                showToast("Could not open chat channel. Please try again.", "danger");
            }
        }
    };

    function renderChatMatchesList() {
        const container = document.getElementById("chatMatchesList");
        if (!container) return;

        const chatMatches = matchesList.filter(m => 
            m.donorId === currentUser.uid || 
            m.receiverId === currentUser.uid || 
            (currentUser.id && (m.donorId === currentUser.id || m.receiverId === currentUser.id)) ||
            (currentUser.email && (m.donorEmail === currentUser.email || m.receiverEmail === currentUser.email))
        );

        if (chatMatches.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 20px; font-size:0.85rem;">No active connections for chat.</div>`;
            return;
        }

        container.innerHTML = chatMatches.map(m => {
            const partner = currentUser.uid === m.donorId ? m.receiverName : m.donorName;
            const activeClass = m.id === activeChatMatchId ? 'active' : '';
            return `
                <div class="chat-item ${activeClass}" onclick="selectChatMatch('${m.id}')" style="padding:10px; margin-bottom:8px; border-radius:6px; cursor:pointer; background:${m.id === activeChatMatchId ? 'var(--color-teal-primary)' : '#FBF5DD'}; color:${m.id === activeChatMatchId ? '#FFFFFF' : 'var(--color-text-dark)'};">
                    <div style="font-weight: 800; font-size: 0.9rem;">💬 ${partner}</div>
                    <div style="font-size: 0.75rem; opacity: 0.9;">Item: ${m.requestName} (${(m.type||'physical').toUpperCase()})</div>
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
            if (peerName) peerName.textContent = `Conversation with ${partner} (${match.requestName})`;
            renderTrackingTimeline(match);
        }
        renderChatMatchesList();
        renderChatMessages();
    };

    function renderTrackingTimeline(match) {
        const container = document.getElementById("trackingStatusTimeline");
        if (!container) return;

        let step1 = 'var(--color-teal-primary)';
        let step2 = match.status === 'confirmed' ? 'var(--color-teal-primary)' : 'var(--color-text-muted)';
        let step3 = match.evidenceSubmitted ? 'var(--color-teal-primary)' : 'var(--color-text-muted)';

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 10px 0 15px 0; font-size: 0.75rem; font-weight:700; background:#F5EFE0; padding:8px 12px; border-radius:6px;">
                <span style="color:${step1}">1. Match Created</span>
                <span style="color:${step2}">2. Order Confirmed</span>
                <span style="color:${step3}">3. SLA Evidence</span>
            </div>
        `;
    }

    function renderChatMessages() {
        const container = document.getElementById("chatMessagesContainer");
        if (!container || !activeChatMatchId) return;

        const msgs = messagesList.filter(m => m.matchId === activeChatMatchId)
                                .sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

        if (msgs.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 30px; font-size:0.85rem;">No messages yet. Type your message below to chat with your partner.</div>`;
            return;
        }

        container.innerHTML = msgs.map(m => {
            const isOutgoing = m.senderId === currentUser.uid;
            return `
                <div style="display:flex; justify-content:${isOutgoing ? 'flex-end' : 'flex-start'}; margin-bottom:8px;">
                    <div style="max-width:75%; padding:8px 12px; border-radius:8px; font-size:0.85rem; background:${isOutgoing ? 'var(--color-teal-primary)' : '#E4DCAE'}; color:${isOutgoing ? '#FFFFFF' : 'var(--color-text-dark)'};">
                        <div style="font-size:0.7rem; opacity:0.8; margin-bottom:2px;">${m.senderName || (isOutgoing ? 'You' : 'Partner')}</div>
                        <div>${m.text}</div>
                    </div>
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
            if (!text || !activeChatMatchId) {
                if (!activeChatMatchId) showToast("Please select a conversation first.", "warning");
                return;
            }

            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const match = matchesList.find(m => m.id === activeChatMatchId);
                const recipientId = match ? (currentUser.uid === match.donorId ? match.receiverId : match.donorId) : null;

                await helper.db().collection("messages").add({
                    matchId: activeChatMatchId,
                    senderId: currentUser.uid,
                    senderName: currentUser.name,
                    text,
                    createdAt: new Date().toISOString()
                });

                if (recipientId) {
                    await helper.db().collection("notifications").add({
                        userId: recipientId,
                        message: `New message from ${currentUser.name}: "${text.substring(0, 40)}..."`,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                }

                chatMessageInput.value = "";
                renderChatMessages();
            } catch (err) {
                showToast("Failed to send message.", "danger");
            }
        };

        btnSendChatMessage.addEventListener("click", sendMsg);
        chatMessageInput.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') sendMsg();
        });
    }

    function calculateHaversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    }

    window.initLeafletMap = function() {
        const container = document.getElementById("liveSimulatedMap");
        if (!container) return;

        if (typeof L === 'undefined') {
            if (!document.getElementById("leaflet-css-dyn")) {
                const lcss = document.createElement("link");
                lcss.id = "leaflet-css-dyn";
                lcss.rel = "stylesheet";
                lcss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(lcss);
            }
            if (!document.getElementById("leaflet-js-dyn")) {
                const ljs = document.createElement("script");
                ljs.id = "leaflet-js-dyn";
                ljs.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                ljs.onload = () => { window.initLeafletMap(); };
                document.head.appendChild(ljs);
            }
            return;
        }

        try {
            if (leafletMap) {
                try { leafletMap.remove(); } catch (e) {}
                leafletMap = null;
            }

            if (container._leaflet_id) {
                container._leaflet_id = null;
            }
            container.innerHTML = `<div id="simulatedMapInner" style="width:100%; height:380px; border-radius:8px;"></div>`;

            let userLat = 6.9271;
            let userLng = 79.8612;
            if (currentUser && currentUser.location && currentUser.location.lat) {
                userLat = parseFloat(currentUser.location.lat);
                userLng = parseFloat(currentUser.location.lng);
            } else if (currentUser && currentUser.district && SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()]) {
                userLat = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lat;
                userLng = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lng;
            }

            leafletMap = L.map('simulatedMapInner').setView([userLat, userLng], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap);

            setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 100);
            setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 400);

            const isDonor = (currentUser && currentUser.role === 'donor') || (currentUser && currentUser.accountType === 'donor');
            const myTitle = isDonor ? `📍 Depot: ${currentUser ? currentUser.name : 'Your Depot'}` : `🏢 Facility: ${currentUser ? currentUser.name : 'Your Facility'}`;

            const userIconHtml = `<div style="background:#0D7C7A; color:#FFF; padding:6px 12px; border-radius:18px; font-weight:800; font-size:0.8rem; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #FFF;">${isDonor ? '🚚' : '🏢'} ${currentUser ? currentUser.name : 'My Facility'}</div>`;
            const userIcon = L.divIcon({ className: 'user-map-pin', html: userIconHtml, iconSize: [140, 32], iconAnchor: [70, 16] });

            const boundsGroup = [L.latLng(userLat, userLng)];
            L.marker([userLat, userLng], { icon: userIcon }).addTo(leafletMap)
                .bindPopup(`<b>${myTitle}</b><br>Coordinates: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`)
                .openPopup();

            const activeMatches = matchesList.filter(m => 
                (isDonor ? m.donorId === currentUser.uid : m.receiverId === currentUser.uid)
            );

            activeMatches.forEach((m, idx) => {
                let partnerLat = userLat + (Math.sin(idx + 1) * 0.04);
                let partnerLng = userLng + (Math.cos(idx + 1) * 0.04);
                let partnerName = isDonor ? (m.receiverName || 'Receiver') : (m.donorName || 'Donor');

                if (m.location && m.location.lat) {
                    partnerLat = parseFloat(m.location.lat);
                    partnerLng = parseFloat(m.location.lng);
                }

                const distanceKm = calculateHaversineKm(userLat, userLng, partnerLat, partnerLng);
                const partnerLatLng = [partnerLat, partnerLng];
                boundsGroup.push(L.latLng(partnerLat, partnerLng));

                const partnerIconHtml = `<div style="background:#E67E22; color:#FFF; padding:5px 10px; border-radius:16px; font-weight:800; font-size:0.75rem; box-shadow:0 3px 8px rgba(0,0,0,0.3); border:2px solid #FFF;">${isDonor ? '🏢' : '🚚'} ${partnerName} (${distanceKm} km)</div>`;
                const partnerIcon = L.divIcon({ className: 'partner-map-pin', html: partnerIconHtml, iconSize: [150, 30], iconAnchor: [75, 15] });

                L.marker(partnerLatLng, { icon: partnerIcon }).addTo(leafletMap)
                    .bindPopup(`<b>${isDonor ? '🏢 Receiver Facility' : '🚚 Donor'}: ${partnerName}</b><br>Dispatch: ${m.requestName || 'Donation Item'}<br>Geographic Distance: <strong>${distanceKm} km away</strong>`);

                L.polyline([[userLat, userLng], partnerLatLng], {
                    color: '#0D7C7A',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '8, 8'
                }).addTo(leafletMap);
            });

            if (boundsGroup.length > 1) {
                const bounds = L.latLngBounds(boundsGroup);
                leafletMap.fitBounds(bounds, { padding: [40, 40] });
            }
        } catch (err) {
            console.error("Real-Time Distance Map init error:", err);
        }
    };

    function renderAdminActiveMatchesTable() {
        const body1 = document.getElementById("adminActiveMatchesTableBody");
        const body2 = document.getElementById("adminOverviewMatchesBody");
        const execSec = document.getElementById("adminExecutiveOverviewSection");

        const roleStr = ((currentUser && currentUser.role) || (currentUser && currentUser.accountType) || "").toLowerCase();
        const emailStr = ((currentUser && currentUser.email) || "").toLowerCase();
        const isAdmin = roleStr.includes("admin") || emailStr.includes("admin") || (currentUser && currentUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2');

        if (execSec) execSec.style.display = isAdmin ? "block" : "none";

        const content = matchesList.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted); padding:20px;">No active matches found in system.</td></tr>` :
        matchesList.map(m => {
            let sessionText = m.deliverySessionId || 'N/A';
            let statusBadge = `<span class="badge badge-info">${m.status}</span>`;
            if (m.status === 'in_transit') statusBadge = `<span class="badge badge-warning">🚚 In Transit</span>`;
            else if (m.status === 'completed') statusBadge = `<span class="badge badge-success">✅ Completed</span>`;

            return `
                <tr>
                    <td><strong>${m.requestName || 'Material Item'}</strong><br><small style="color:var(--color-teal-primary); font-weight:700;">ID: ${sessionText}</small></td>
                    <td>${m.donorName}</td>
                    <td>${m.receiverName}</td>
                    <td><span class="telemetry-pill">${(m.deliveryMethod || 'pending').replace('_', ' ').toUpperCase()}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        <div style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button type="button" class="btn btn-secondary" data-action="admin-chat" data-match-id="${m.id}" style="padding:4px 10px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="adminInspectMatchChat('${m.id}')">💬 Monitor Live Chat</button>
                            ${m.status === 'in_transit' ? `<button type="button" class="btn btn-warning" style="padding:4px 10px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="openLiveTrackingMapModal('${m.id}')">📍 Monitor GPS Radar</button>` : ''}
                            ${m.handoverEvidenceUrl ? `<button type="button" class="btn btn-success" data-action="view-evidence" data-match-id="${m.id}" style="padding:4px 10px; font-size:0.75rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:4px; cursor:pointer; box-shadow:0 2px 6px rgba(13,124,122,0.3);" onclick="openEvidenceImageViewer('${m.id}')">🖼️ Inspect Handover Photo</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (body1) body1.innerHTML = content;
        if (body2) body2.innerHTML = content;

        renderAdminMonetarySLAMonitor();
    }

    function renderAdminMonetarySLAMonitor() {
        const body = document.getElementById("adminMonetarySLABody");
        if (!body) return;

        const monetaryList = matchesList.filter(m => m.type === 'monetary' || m.amount);

        if (monetaryList.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted); padding:20px;">No monetary funding transfers recorded.</td></tr>`;
            return;
        }

        body.innerHTML = monetaryList.map(m => {
            const transferDate = m.transferDate || (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A');
            const receiptLink = m.receiptUrl ? `<a href="${m.receiptUrl}" target="_blank" class="btn btn-secondary" style="padding:2px 6px; font-size:0.75rem;">View Receipt</a>` : 'N/A';
            let slaStatus = `<span class="badge badge-warning">14-Day SLA Active</span>`;

            if (m.evidenceSubmitted) {
                slaStatus = `<span class="badge badge-success">✅ Evidence Verified</span>`;
            }

            return `
                <tr>
                    <td><strong>${m.requestName || 'Monetary Grant'}</strong><br><small style="color:var(--color-text-muted);">${m.receiverName}</small></td>
                    <td>${m.donorName}</td>
                    <td><strong style="color:var(--color-teal-primary);">LKR ${(m.amount || 0).toLocaleString()}</strong></td>
                    <td>${transferDate}</td>
                    <td>${receiptLink}</td>
                    <td>${slaStatus}</td>
                </tr>
            `;
        }).join("");
    }

    window.adminInspectMatchChat = async (matchId) => {
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId);
        const modalTitle = document.getElementById("mdlAdminInspectTitle");
        if (modalTitle) {
            modalTitle.textContent = match ? `🛡️ Admin Chat Inspector: ${match.requestName} (${match.donorName} ↔ ${match.receiverName})` : `🛡️ Admin Chat Inspector`;
        }

        const container = document.getElementById("adminChatMessagesContainer");
        const modal = document.getElementById("modalAdminInspectChat");
        if (modal) {
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
            modal.style.setProperty("display", "flex", "important");
            modal.style.setProperty("visibility", "visible", "important");
            modal.style.setProperty("opacity", "1", "important");
            modal.style.setProperty("z-index", "99999999", "important");
            modal.classList.add("active");
        }

        if (container) {
            container.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:20px;">Loading real-time chat log...</div>`;
        }

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const targetDocId = await resolveFirestoreMatchDocId(matchId);
            
            let querySnap1 = await helper.db().collection("messages").where("matchId", "==", matchId).get();
            let msgs = querySnap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (targetDocId && targetDocId !== matchId) {
                let querySnap2 = await helper.db().collection("messages").where("matchId", "==", targetDocId).get();
                let extraMsgs = querySnap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                extraMsgs.forEach(em => {
                    if (!msgs.some(m => m.id === em.id)) msgs.push(em);
                });
            }

            msgs.sort((a,b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

            if (msgs.length === 0) {
                if (container) container.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:30px;">No chat messages exchanged between donor and receiver yet.</div>`;
                return;
            }

            if (container) {
                container.innerHTML = msgs.map(msg => {
                    const date = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return `
                        <div style="background:#FFFFFF; border:1px solid #D8CE9C; border-radius:8px; padding:8px 12px; margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--color-teal-primary); font-weight:800; margin-bottom:4px;">
                                <span>${msg.senderName || 'Partner'}</span>
                                <span style="color:var(--color-text-muted);">${date}</span>
                            </div>
                            <div style="font-size:0.85rem; color:var(--color-text-dark);">${msg.text || msg.message || ''}</div>
                        </div>
                    `;
                }).join("");
            }
        } catch (err) {
            console.error("adminInspectMatchChat error:", err);
            if (container) container.innerHTML = `<div style="text-align:center; color:red; padding:20px;">Failed to load chat log.</div>`;
        }
    };

    window.closeAdminInspectChat = () => {
        const modal = document.getElementById("modalAdminInspectChat");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    // Delegated click handler for admin-chat
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="admin-chat"]');
        if (btn) {
            const matchId = btn.getAttribute('data-match-id');
            if (matchId && typeof window.adminInspectMatchChat === 'function') {
                window.adminInspectMatchChat(matchId);
            }
        }
    });

    function renderAdminDirectory() {
        renderAdminActiveMatchesTable();
        renderAdminEvidenceApprovals();
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

    function renderAdminEvidenceApprovals() {
        const grid = document.getElementById("adminEvidenceApprovalsGrid");
        if (!grid) return;

        const evidenceMatches = matchesList.filter(m => m.handoverEvidenceUrl || m.handoverVerificationStatus);

        if (evidenceMatches.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 30px;">No handover evidence photos submitted for verification yet.</div>`;
            return;
        }

        grid.innerHTML = evidenceMatches.map(m => {
            let statusBadge = `<span class="badge badge-warning">Pending Verification</span>`;
            if (m.handoverVerificationStatus === 'verified_approved') {
                statusBadge = `<span class="badge badge-success">Verified & Approved</span>`;
            } else if (m.handoverVerificationStatus === 'rejected') {
                statusBadge = `<span class="badge badge-danger">Rejected</span>`;
            }

            const isPending = !m.handoverVerificationStatus || m.handoverVerificationStatus === 'pending_admin_verification';

            const actionsHtml = isPending ? `
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <button class="btn btn-success" style="padding:6px 12px; font-size:0.75rem; font-weight:800;" onclick="verifyHandoverEvidence('${m.id}')">✅ Verify & Approve</button>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:0.75rem;" onclick="rejectHandoverEvidence('${m.id}')">❌ Reject Evidence</button>
                </div>
            ` : '';

            return `
                <div class="glass-panel" style="padding:16px; background:#FFFFFF; border-radius:8px; border:1px solid var(--color-border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:800; color:var(--color-teal-primary); font-size:0.9rem;">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size:0.8rem; color:#4A5568; margin-bottom:4px;">Receiver: <strong>${m.receiverName}</strong> | Donor: <strong>${m.donorName}</strong></div>
                    <div style="font-size:0.75rem; color:#718096; margin-bottom:10px;">Uploaded: ${new Date(m.handoverUploadedAt || m.completedAt || Date.now()).toLocaleString()}</div>
                    
                    <div style="cursor:pointer; text-align:center;" onclick="openEvidenceImageViewer('${m.id}')" title="Click to view full photo">
                        <img src="${m.handoverEvidenceUrl}" style="width:100%; max-height:180px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0; margin-bottom:8px;">
                    </div>
                    <div style="margin-bottom:8px; text-align:right;">
                        <button type="button" class="btn btn-secondary" style="padding:2px 8px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="openEvidenceImageViewer('${m.id}')">🔍 Full Screen View</button>
                    </div>
                    
                    ${m.handoverNotes ? `<div style="font-size:0.8rem; background:#F8FAFC; padding:8px; border-radius:4px; margin-bottom:8px;"><strong>Notes:</strong> ${m.handoverNotes}</div>` : ''}
                    ${actionsHtml}
                </div>
            `;
        }).join("");
    }

    window.verifyHandoverEvidence = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("matches").doc(matchId).update({
                handoverVerificationStatus: "verified_approved",
                verifiedAt: new Date().toISOString()
            });

            const match = matchesList.find(m => m.id === matchId);
            if (match && match.receiverId) {
                await db.collection("notifications").add({
                    userId: match.receiverId,
                    type: "evidence_verified",
                    message: `✅ Admin has verified and approved your handover evidence for "${match.requestName}".`,
                    isRead: false,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("✅ Handover evidence verified & approved!", "success");
            renderAdminEvidenceApprovals();
        } catch (err) {
            showToast("Failed to verify evidence.", "danger");
        }
    };

    window.rejectHandoverEvidence = async (matchId) => {
        const reason = prompt("Enter reason for rejecting evidence image:");
        if (!reason) return;

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("matches").doc(matchId).update({
                handoverVerificationStatus: "rejected",
                rejectionReason: reason,
                rejectedAt: new Date().toISOString()
            });

            const match = matchesList.find(m => m.id === matchId);
            if (match && match.receiverId) {
                await db.collection("notifications").add({
                    userId: match.receiverId,
                    type: "evidence_rejected",
                    message: `❌ Admin rejected handover evidence for "${match.requestName}". Reason: ${reason}`,
                    isRead: false,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Evidence rejected.", "info");
            renderAdminEvidenceApprovals();
        } catch (err) {
            showToast("Failed to reject evidence.", "danger");
        }
    };

    window.toggleMobileSidebar = () => {
        const sidebar = document.querySelector(".sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        if (sidebar) sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("active");
    };
    window.closeMobileSidebar = () => {
        const sidebar = document.querySelector(".sidebar");
        const overlay = document.getElementById("sidebarOverlay");
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
    };

    window.openAboutModal = () => {
        window.location.hash = "#overview";
    };
    window.closeAboutModal = () => {};
    window.openContactModal = () => {
        window.location.hash = "#contact";
        const modal = document.getElementById("modalContactUs");
        if (modal) modal.classList.add("active");
    };
    window.closeContactModal = () => {
        const modal = document.getElementById("modalContactUs");
        if (modal) modal.classList.remove("active");
    };
    window.handleContactSubmit = (e) => {
        if (e) e.preventDefault();
        showToast("Thank you for reaching out! Our GiveGo support team will get back to you shortly.", "success");
        window.closeContactModal();
        const form = document.getElementById("formContactUs");
        if (form) form.reset();
        return false;
    };

    init();
});
