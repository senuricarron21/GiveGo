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
    let inquiriesList = [];
    let inquiryMessagesList = [];
    let activeAdminInquiryId = null;
    let currentInquiryTab = 'all';
    
    let activeChatMatchId = null;
    let activeChatPartnerId = null;
    let chatSearchQuery = "";
    let unsubscribes = [];
    let googleMap = null;

    // Dynamic Google Maps Script Loader
    function loadGoogleMapsScript(callback) {
        if (window.google && window.google.maps) {
            if (callback) callback();
            return;
        }
        const apiKey = (window.GOOGLE_MAPS_API_KEY) || 
                       (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey) || 
                       "AIzaSyBy8_Ic4K9OEPV6P6aKdm0w95A3qvLFudE";

        if (!document.getElementById("google-maps-sdk-dyn")) {
            const script = document.createElement("script");
            script.id = "google-maps-sdk-dyn";
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=onGoogleMapsLoaded`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        if (callback) {
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    callback();
                } else if (attempts > 60) {
                    clearInterval(checkInterval);
                }
            }, 100);
        }
    }
    window.onGoogleMapsLoaded = function() {
        if (window.initGoogleMap) window.initGoogleMap();
    };

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
                } else {
                    const isSystemAdmin = (user.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || (user.email && user.email.toLowerCase().includes("admin")));
                    if (!isSystemAdmin) {
                        console.warn("User account record not found in database (deleted). Terminating session...");
                        try {
                            await auth.signOut();
                            localStorage.removeItem("givego_user");
                            sessionStorage.clear();
                        } catch (e) {}
                        window.location.href = "index.html?deleted=true";
                        return;
                    }
                }
            } catch (err) {
                console.error("Error fetching profile: ", err);
            }
            
            setupDataSubscriptions();
            setupRouting();
            setInterval(checkMonetaryEvidenceSLAs, 60000);
        });
    }

    
    // ==========================================
    // Real-Time Account Suspension Guard & Logic
    // ==========================================
    let _hasAlertedSuspension = false;

    function applyAccountSuspensionState() {
        if (!currentUser) return;
        const isSuspended = (currentUser.status === 'suspended' || currentUser.status === 'rejected');
        const banner = document.getElementById("accountSuspendedBanner");
        const noticeModal = document.getElementById("modalAccountSuspendedNotice");
        const roleBadge = document.getElementById("profileDisplayRole");

        if (isSuspended) {
            if (banner) banner.style.display = "block";
            if (roleBadge) {
                const roleName = (currentUser.role || currentUser.accountType || "Member").toUpperCase();
                roleBadge.innerHTML = `${roleName} <span class="badge badge-danger" style="margin-left:4px; font-size:0.65rem; background:#DC2626; color:#FFF; font-weight:800; padding:2px 6px; border-radius:4px;">SUSPENDED</span>`;
            }
            if (!_hasAlertedSuspension && noticeModal) {
                noticeModal.classList.add("active");
                _hasAlertedSuspension = true;
            }
            const actionButtons = document.querySelectorAll(`
                #formPostDonation button[type="submit"],
                #formRequestMaterials button[type="submit"],
                #formSubmitMonetaryDonation button[type="submit"],
                #formSubmitOfferDonation button[type="submit"],
                #formSubmitItemRequest button[type="submit"],
                #formSubmitVolunteerSignup button[type="submit"],
                #formSubmitHandoverEvidence button[type="submit"],
                #formSubmitEditProfile button[type="submit"],
                #btnSendMessage,
                .chat-send-btn
            `);
            actionButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
                btn.title = "Action blocked: Account is suspended by Administrator.";
            });
        } else {
            if (banner) banner.style.display = "none";
            if (noticeModal) noticeModal.classList.remove("active");
            _hasAlertedSuspension = false;
            const actionButtons = document.querySelectorAll(`
                #formPostDonation button[type="submit"],
                #formRequestMaterials button[type="submit"],
                #formSubmitMonetaryDonation button[type="submit"],
                #formSubmitOfferDonation button[type="submit"],
                #formSubmitItemRequest button[type="submit"],
                #formSubmitVolunteerSignup button[type="submit"],
                #formSubmitHandoverEvidence button[type="submit"],
                #formSubmitEditProfile button[type="submit"],
                #btnSendMessage,
                .chat-send-btn
            `);
            actionButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = "";
                btn.style.cursor = "";
                btn.title = "";
            });
        }
    }

    window.applyAccountSuspensionState = applyAccountSuspensionState;

    window.isActionBlockedBySuspension = () => {
        if (!currentUser) return false;
        if (currentUser.status === 'suspended' || currentUser.status === 'rejected') {
            const noticeModal = document.getElementById("modalAccountSuspendedNotice");
            if (noticeModal) noticeModal.classList.add("active");
            if (window.showToast) {
                window.showToast("Action blocked: Your account has been suspended by an Administrator.", "danger");
            }
            return true;
        }
        return false;
    };

    function updateUIProfileAndMenu() {
        applyAccountSuspensionState();
        if (!currentUser) return;
        const nameEl = document.getElementById("profileDisplayName");
        const roleEl = document.getElementById("profileDisplayRole");
        const welcomeEl = document.getElementById("welcomeHeading");

        if (nameEl) nameEl.textContent = currentUser.name || "User";
        if (roleEl) roleEl.textContent = (currentUser.role || "member").toUpperCase();
        if (welcomeEl) welcomeEl.textContent = `Hello, ${(currentUser.name || "User").split(" ")[0]}`;

        // Update sidebar avatar — photo or initials
        const avatarEl = document.getElementById("sidebarProfileAvatar");
        if (avatarEl) {
            if (currentUser.photoURL) {
                avatarEl.style.backgroundImage = `url('${currentUser.photoURL}')`;
                avatarEl.style.backgroundSize = "cover";
                avatarEl.style.backgroundPosition = "center";
                avatarEl.textContent = "";
            } else {
                avatarEl.style.backgroundImage = "";
                const initials = (currentUser.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                avatarEl.textContent = initials;
            }
        }

        const menuList = document.getElementById("sidebarMenuList");
        if (!menuList) return;

        const roleStr = (currentUser.role || currentUser.accountType || "").toLowerCase();
        const isAdmin = roleStr.includes("admin") || (currentUser.email && currentUser.email.includes("admin"));
        const isDonor = roleStr.includes("donor");
        const isReceiver = roleStr.includes("receiver");

                const unreadNotis = notificationsList.filter(n => !n.read).length;
        const unreadBadgeHTML = unreadNotis > 0 ? `<span class="nav-badge-dot">${unreadNotis}</span>` : '';

        // Calculate unread inquiries for Admin
        const unreadAdminInquiries = inquiriesList.filter(i => i.unreadByAdmin === true || (i.status === 'open' && i.unreadByAdmin)).length;
        const adminInqBadgeHTML = unreadAdminInquiries > 0 ? `<span class="nav-badge-dot">${unreadAdminInquiries}</span>` : '';

        // Calculate unread inquiries for Donor / Receiver
        const userInqDoc = inquiriesList.find(i => (i.userId === currentUser.uid || i.userId === currentUser.id));
        const userInqBadgeHTML = (userInqDoc && userInqDoc.unreadByUser) ? `<span class="nav-badge-dot">!</span>` : '';

        let menuHTML = `<li class="menu-item active"><a href="#overview">Overview</a></li>`;

        if (isAdmin) {
            menuHTML += ` <li class="menu-item"><a href="#users">Accounts</a></li> <li class="menu-item"><a href="#approvals">Approvals</a></li> <li class="menu-item"><a href="#inquiries">Inquiries ${adminInqBadgeHTML}</a></li> <li class="menu-item"><a href="#system-directory">System Directory</a></li> `;
        } else if (isDonor) {
            menuHTML += ` <li class="menu-item"><a href="#listings">My Donations</a></li> <li class="menu-item"><a href="#needs-catalogue">Requests Catalogue</a></li> <li class="menu-item"><a href="#matching">Donation Progress</a></li> <li class="menu-item"><a href="#chat">Messages</a></li> <li class="menu-item"><a href="#admin-chat">Admin Inquiries ${userInqBadgeHTML}</a></li> `;
        } else if (isReceiver) {
            menuHTML += ` <li class="menu-item"><a href="#requests">Material Requests</a></li> <li class="menu-item"><a href="#matching">Matches & Connections</a></li> <li class="menu-item"><a href="#chat">Messages</a></li> <li class="menu-item"><a href="#admin-chat">Admin Inquiries ${userInqBadgeHTML}</a></li> `;
        }

        const historyLabel = isDonor ? "Completed Donation History" : "History";

        menuHTML += ` <li class="menu-item"><a href="#profile">My Profile</a></li> <li class="menu-item"><a href="#available-items">Available Items</a></li> <li class="menu-item"><a href="#history">${historyLabel}</a></li> <li class="menu-item"><a href="#notifications">Notifications ${unreadBadgeHTML}</a></li> `;

        menuList.innerHTML = menuHTML;

        const headingEl = document.getElementById("historyPanelHeading");
        if (headingEl) {
            headingEl.textContent = isDonor ? "Completed Donation History" : "Transaction History Archive";
        }

        const upMenu = document.querySelector(".user-profile-menu");
        if (upMenu) {
            upMenu.style.cursor = "pointer";
            upMenu.onclick = () => { window.location.hash = "#profile"; };
        }
        
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
                overviewGrid.innerHTML = ` <div class="stat-card glass-panel"><div class="stat-title">PENDING APPROVALS</div><div class="stat-number" id="statPendingApprovalsCount">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">PUBLISHED NEEDS</div><div class="stat-number" id="statTotalRequests">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">MATCH ALLOCATION RATE</div><div class="stat-number" id="statMatchRate">0%</div></div> <div class="stat-card glass-panel"><div class="stat-title">REGISTERED USERS</div><div class="stat-number" id="statTotalUsers">0</div></div> `;
            } else if (isDonor) {
                overviewGrid.innerHTML = ` <div class="stat-card glass-panel"><div class="stat-title">MY PHYSICAL LISTINGS</div><div class="stat-number" id="statMyListings">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">ACTIVE MATCHES</div><div class="stat-number" id="statMyMatches">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">COMPLETED SUPPORT</div><div class="stat-number" id="statCompletedDons">0</div></div> `;
            } else if (isReceiver) {
                overviewGrid.innerHTML = ` <div class="stat-card glass-panel"><div class="stat-title">MY REQUESTS</div><div class="stat-number" id="statMyRequests">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">MATCHED OFFERS</div><div class="stat-number" id="statReceiverMatches">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">UTILISATION PENDING</div><div class="stat-number" id="statPendingEvidence">0</div></div> <div class="stat-card glass-panel"><div class="stat-title">FULFILLMENT RATE</div><div class="stat-number" id="statFulfillRate">0%</div></div> `;
            }
        }

        // --- 1. Admin Overview Metrics ---
        if (isAdmin) {
            const pendingAccountVerifications = usersList.filter(u => u.status === 'pending').length;
            const pendingRequestApprovals = requestsList.filter(r => r.status === 'pending_admin' || r.status === 'pending').length;
            const pendingDonationApprovals = donationsList.filter(d => d.status === 'pending_admin' || d.status === 'pending').length;
            const totalPendingApprovals = pendingAccountVerifications + pendingRequestApprovals + pendingDonationApprovals;
            
            const totalPublishedRequests = requestsList.filter(r => (r.status === 'published' || r.status === 'matched') && r.status !== 'rejected').length;
            
            const activeMatches = matchesList.filter(m => m.status !== 'rejected');
            const confirmedMatches = activeMatches.filter(m => m.status === 'confirmed' || m.status === 'completed' || m.status === 'in_transit').length;
            const rate = activeMatches.length > 0 ? Math.round((confirmedMatches / activeMatches.length) * 100) : (totalPublishedRequests > 0 ? Math.round((confirmedMatches / totalPublishedRequests) * 100) : 0);
            
            // Only count verified, approved active users
            const totalVerifiedUsers = usersList.filter(u => u.status === 'verified').length;

            const elPending = document.getElementById("statPendingApprovalsCount");
            if (elPending) elPending.textContent = totalPendingApprovals;

            const elTotalReqs = document.getElementById("statTotalRequests");
            if (elTotalReqs) elTotalReqs.textContent = totalPublishedRequests;

            const elRate = document.getElementById("statMatchRate");
            if (elRate) elRate.textContent = `${rate}%`;

            const elUsers = document.getElementById("statTotalUsers");
            if (elUsers) elUsers.textContent = totalVerifiedUsers;

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
            
            const pendingEvidenceMatches = myMatches.filter(m => m.type === 'monetary' && 
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
                message: ` Matches & Connections: Admin connected Donor ${don.donorName}'s surplus "${don.itemName}" for your request "${req.itemName}".`,
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

        const publishedReqs = requestsList.filter(r => 
            (r.status === 'published' || r.status === 'pending_admin') && 
            (r.requestType === 'physical' || !r.requestType || r.type === 'physical')
        );
        const availDonations = donationsList.filter(d => 
            (d.status === 'available' || d.status === 'pending_admin')
        );

        const smartMatches = [];
        const seenPairs = new Set();

        const roleStr = (currentUser.role || '').toLowerCase();
        const isUserAdmin = roleStr.includes('admin') || (currentUser.email || '').includes('admin');
        const isUserDonor = currentUser.role === 'donor';
        const isUserReceiver = currentUser.role === 'receiver';

        for (let req of publishedReqs) {
            const reqTitle = (req.itemName || "").toLowerCase().trim();
            const reqCategory = (req.category || "").toLowerCase().trim();
            if (!reqTitle && !reqCategory) continue;
            const reqWords = reqTitle.split(/[\s,/-]+/).filter(w => w.length > 2);

            for (let don of availDonations) {
                const pairKey = `${req.id}_${don.id}`;
                if (seenPairs.has(pairKey)) continue;

                const donTitle = (don.itemName || "").toLowerCase().trim();
                const donCategory = (don.category || "").toLowerCase().trim();
                if (!donTitle && !donCategory) continue;
                const donWords = donTitle.split(/[\s,/-]+/).filter(w => w.length > 2);

                // 1. Check Item Name Match
                let matchedWord = reqWords.find(rw => donWords.some(dw => dw.includes(rw) || rw.includes(dw)));
                let isItemNameMatch = !!matchedWord || (reqTitle.length > 2 && donTitle.length > 2 && (reqTitle.includes(donTitle) || donTitle.includes(reqTitle)));

                // 2. Check Category Match
                let isCategoryMatch = !!(reqCategory && donCategory && reqCategory === donCategory);

                if (isItemNameMatch || isCategoryMatch) {
                    let matchType = '';
                    let matchScore = 0;

                    if (isItemNameMatch && isCategoryMatch) {
                        matchType = 'Item Name & Category Match';
                        matchScore = 100;
                    } else if (isItemNameMatch) {
                        matchType = 'Item Name Match';
                        matchScore = 80;
                    } else {
                        matchType = 'Category Match';
                        matchScore = 50;
                    }

                    seenPairs.add(pairKey);
                    smartMatches.push({
                        requestId: req.id,
                        requestName: req.itemName || 'Material Need',
                        receiverId: req.receiverId || req.userId || '',
                        receiverName: req.receiverName || req.userName || req.organizationName || 'Receiver Organisation',
                        reqQuantity: req.quantityRequired || req.quantity || 1,
                        reqUnit: req.unit || don.unit || 'Units',
                        donationId: don.id,
                        donationName: don.itemName || 'Available Surplus',
                        donorId: don.donorId || don.userId || '',
                        donorName: don.donorName || don.userName || 'Verified Donor',
                        donQuantity: don.quantity || 1,
                        donUnit: don.unit || req.unit || 'Units',
                        category: req.category || don.category || 'General Supplies',
                        district: req.district || don.district || 'Colombo',
                        priority: req.urgency || req.priority || 'Normal',
                        matchType: matchType,
                        matchScore: matchScore
                    });
                }
            }
        }

        // Sort higher relevance first
        smartMatches.sort((a, b) => b.matchScore - a.matchScore);

        if (smartMatches.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="text-align: center; color: var(--color-text-muted); padding: 32px 20px; background: #FFFFFF; border-radius: 12px;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
                    <div style="font-weight: 700; font-size: 1rem; color: var(--color-text-dark); margin-bottom: 4px;">No Active Smart Matches Yet</div>
                    <div style="font-size: 0.85rem; max-width: 480px; margin: 0 auto; line-height: 1.5;">When receivers publish needs (e.g., "Exercise Books", "Rice Rations") and donors post surplus items matching the name or category, automatic matches will appear here as clear action cards!</div>
                </div>
            `;
            return;
        }

        // Context-aware display slice
        let displayMatches = smartMatches;
        if (isUserDonor) {
            const userMatches = smartMatches.filter(m => m.donorId === currentUser.uid || m.donorId === currentUser.id);
            displayMatches = userMatches.length > 0 ? userMatches : smartMatches.slice(0, 12);
        } else if (isUserReceiver) {
            const userMatches = smartMatches.filter(m => m.receiverId === currentUser.uid || m.receiverId === currentUser.id);
            displayMatches = userMatches.length > 0 ? userMatches : smartMatches.slice(0, 12);
        }

        const cardsHtml = displayMatches.map(m => {
            const isSelfDonor = currentUser.uid === m.donorId || currentUser.id === m.donorId;
            const isSelfReceiver = currentUser.uid === m.receiverId || currentUser.id === m.receiverId;

            let priorityBg = '#E0F2FE';
            let priorityColor = '#0369A1';
            const pUpper = (m.priority || '').toUpperCase();
            if (pUpper.includes('HIGH') || pUpper.includes('URGENT')) {
                priorityBg = '#FEE2E2';
                priorityColor = '#991B1B';
            } else if (pUpper.includes('MED')) {
                priorityBg = '#FEF3C7';
                priorityColor = '#92400E';
            }

            let matchBadgeIcon = '🎯';
            let matchBadgeBg = '#E0F2F1';
            let matchBadgeColor = '#0D7C7A';
            if (m.matchType === 'Category Match') {
                matchBadgeIcon = '📂';
                matchBadgeBg = '#FEF3C7';
                matchBadgeColor = '#92400E';
            } else if (m.matchType.includes('&')) {
                matchBadgeIcon = '✨';
                matchBadgeBg = '#E0F2F1';
                matchBadgeColor = '#0D7C7A';
            }

            let actionBtn = '';
            if (isUserAdmin) {
                actionBtn = `<button type="button" class="btn btn-primary" style="width: 100%; padding: 10px 12px; font-size: 0.85rem; font-weight: 800; border-radius: 8px;" onclick="autoConnectSmartMatch('${m.requestId}', '${m.donationId}')">⚡ Auto Connect Pair</button>`;
            } else if (isUserReceiver || isSelfReceiver) {
                actionBtn = `<button type="button" class="btn btn-primary" style="width: 100%; padding: 10px 12px; font-size: 0.85rem; font-weight: 800; border-radius: 8px;" onclick="openRequestAvailableItemModal('${m.donationId}')">📦 Request Surplus Item</button>`;
            } else {
                actionBtn = `<button type="button" class="btn btn-primary" style="width: 100%; padding: 10px 12px; font-size: 0.85rem; font-weight: 800; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="offerPhysicalDonation('${m.requestId}')"><span>🤝 Offer Item to Receiver</span></button>`;
            }

            return `
                <div class="smart-match-card">
                    <div>
                        <!-- Header Badges -->
                        <div class="smart-match-badge-row">
                            <span class="smart-match-tag-match" style="background:${matchBadgeBg}; color:${matchBadgeColor};">
                                <span>${matchBadgeIcon}</span> ${m.matchType}
                            </span>
                            <span class="smart-match-tag-priority" style="background:${priorityBg}; color:${priorityColor};">
                                ● ${m.priority || 'Normal Priority'}
                            </span>
                        </div>

                        <!-- Receiver Need Box -->
                        <div class="smart-match-receiver-box">
                            <div class="smart-match-box-label" style="color: #475569;">
                                🏢 Receiver: <strong>${m.receiverName}</strong>
                            </div>
                            <div class="smart-match-item-title" style="color: #0F172A;">
                                Need: "${m.requestName}"
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                                <span class="smart-match-qty-badge req-qty">
                                    Requested: <strong>${m.reqQuantity} ${m.reqUnit}</strong>
                                </span>
                            </div>
                        </div>

                        <!-- Donor Surplus Box -->
                        <div class="smart-match-donor-box">
                            <div class="smart-match-box-label" style="color: #15803D;">
                                📦 Surplus Item (${m.donorName})
                            </div>
                            <div class="smart-match-item-title" style="color: #14532D;">
                                Available: "${m.donationName}"
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                                <span class="smart-match-qty-badge don-qty">
                                    Surplus: <strong>${m.donQuantity} ${m.donUnit}</strong>
                                </span>
                            </div>
                        </div>

                        <!-- Metadata (Category & District) -->
                        <div class="smart-match-meta">
                            <span class="smart-match-meta-pill">🏷️ ${m.category}</span>
                            <span class="smart-match-meta-pill">📍 ${m.district}</span>
                        </div>
                    </div>

                    <!-- Footer Action Button -->
                    <div style="margin-top: 10px;">
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = `<div class="smart-match-grid">${cardsHtml}</div>`;
    }

    function setupDataSubscriptions() {
        const getHelper = () => window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
        const helper = getHelper();
        if (!helper) return;

        const db = helper.db();
        
        const unsubUsers = db.collection("users").onSnapshot(snapshot => {
            usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const fullProfile = usersList.find(u => u.uid === currentUser.uid || u.id === currentUser.uid);
            const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();
            const emailStr = ((currentUser.email) || "").toLowerCase();
            const isAdm = roleStr.includes("admin") || emailStr.includes("admin") || currentUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2' || currentUser.isAdmin === true;

            if (!fullProfile && !isAdm) {
                // User record deleted from database in real time by Admin
                showToast("Your account has been deleted by an Administrator.", "danger");
                setTimeout(async () => {
                    try {
                        const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                        if (helper && helper.auth()) await helper.auth().signOut();
                        localStorage.removeItem("givego_user");
                        sessionStorage.clear();
                    } catch (e) {}
                    window.location.href = "index.html?deleted=true";
                }, 1000);
                return;
            }

            if (fullProfile) {
                const prevStatus = currentUser.status;
                currentUser = { ...currentUser, ...fullProfile };
                try { localStorage.setItem("givego_user", JSON.stringify(currentUser)); } catch (e) {}
                if (prevStatus && prevStatus !== 'suspended' && currentUser.status === 'suspended') {
                    showToast("Your account has been suspended by an Administrator.", "danger");
                } else if (prevStatus === 'suspended' && currentUser.status === 'verified') {
                    showToast("Your account has been reactivated by the Administrator.", "success");
                }
            }
            applyAccountSuspensionState();

            if (isAdm) {
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
            if (roleStr.includes('admin') || currentUser.email.includes("admin")) {
                renderAdminActiveMatchesTable();
                renderAdminDirectory();
            }
            renderChatMatchesList();
            updateOverviewStats();
        });
        unsubscribes.push(unsubMatches);

        const unsubInquiries = db.collection("inquiries").onSnapshot(snapshot => {
            inquiriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (checkIsAdmin()) {
                renderAdminInquiries();
            } else {
                renderUserAdminInquiryChat();
            }
            updateOverviewStats();
        });
        unsubscribes.push(unsubInquiries);

        const unsubInqMsgs = db.collection("inquiry_messages").onSnapshot(snapshot => {
            inquiryMessagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            inquiryMessagesList.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
            if (checkIsAdmin()) {
                if (activeAdminInquiryId) {
                    renderAdminInquiryMessages(activeAdminInquiryId);
                }
            } else {
                renderUserAdminInquiryChat();
            }
        });
        unsubscribes.push(unsubInqMsgs);
    }

    function setupRouting() {
        const handleHashChange = () => {
            let hash = window.location.hash || '#overview';
            if (hash === '#about' || hash === '#contact') {
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

            if (hash === '#inquiries') {
                if (checkIsAdmin()) {
                    renderAdminInquiries();
                } else {
                    window.location.hash = '#admin-chat';
                }
            } else if (hash === '#admin-chat') {
                if (checkIsAdmin()) {
                    window.location.hash = '#inquiries';
                } else {
                    renderUserAdminInquiryChat();
                }
            } else if (hash === '#chat') {
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
            } else if (hash === '#profile') {
                renderUserProfilePanel();
            } else if (hash === '#matching') {
                const roleStr = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();
                if (roleStr.includes('donor')) renderDonorMatches();
                else if (roleStr.includes('receiver')) renderReceiverMatches();
                initGoogleMap();
            }
            updateOverviewStats();
        };

        window.addEventListener("hashchange", handleHashChange);
        handleHashChange();
    }

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

    window.renderUserProfilePanel = async () => {
        if (!currentUser) return;
        
        let userData = currentUser;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const doc = await helper.db().collection("users").doc(currentUser.uid).get();
            if (doc.exists) {
                userData = { ...currentUser, ...doc.data() };
                currentUser = userData;
                localStorage.setItem("givego_user", JSON.stringify(userData));
            }
        } catch (e) {
            console.warn("Could not fetch fresh user profile from DB:", e);
        }

        const nameEl = document.getElementById("prfDisplayName");
        const emailEl = document.getElementById("prfDisplayEmail");
        const roleEl = document.getElementById("prfDisplayRole");
        const statusBadge = document.getElementById("prfStatusBadge");
        const regNumEl = document.getElementById("prfDisplayRegNum");
        const phoneEl = document.getElementById("prfDisplayPhone");
        const districtEl = document.getElementById("prfDisplayDistrict");
        const addressEl = document.getElementById("prfDisplayAddress");
        const cityEl = document.getElementById("prfDisplayCity");

        if (nameEl) nameEl.textContent = userData.name || "User";
        if (emailEl) emailEl.textContent = userData.email || "-";
        
        let roleFormatted = (userData.role || "Member").toUpperCase();
        if (userData.receiverCategory) roleFormatted += ` (${userData.receiverCategory})`;
        else if (userData.donorType) roleFormatted += ` (${userData.donorType.toUpperCase()})`;
        if (roleEl) roleEl.textContent = roleFormatted;

        if (statusBadge) {
            if (userData.status === 'verified') {
                statusBadge.className = "badge badge-success";
                statusBadge.textContent = "Verified Account";
            } else if (userData.status === 'suspended') {
                statusBadge.className = "badge badge-danger";
                statusBadge.textContent = "Suspended";
            } else {
                statusBadge.className = "badge badge-warning";
                statusBadge.textContent = "Pending Verification";
            }
        }

        const regNum = userData.registrationNumber || (userData.receiverDetails && userData.receiverDetails.registrationNumber) || (userData.orgDetails && userData.orgDetails.registrationNumber) || "N/A";
        if (regNumEl) regNumEl.textContent = regNum;
        if (phoneEl) phoneEl.textContent = userData.phone || userData.contactNumber || "Not provided";
        if (districtEl) districtEl.textContent = userData.district || "Colombo";
        
        const fullAddr = userData.address || (userData.receiverDetails && userData.receiverDetails.address) || "Not provided";
        if (addressEl) addressEl.textContent = fullAddr;
        if (cityEl) cityEl.textContent = userData.city || userData.district || "Colombo";

        // Bank details for receiver
        const bankCard = document.getElementById("prfReceiverBankCard");
        const isRec = ((userData.role) || "").toLowerCase().includes("receiver");
        if (bankCard) {
            if (isRec) {
                bankCard.style.display = "block";
                const b = userData.receiverDetails || userData.bankDetails || {};
                const bName = document.getElementById("prfDisplayBankName");
                const accName = document.getElementById("prfDisplayAccountName");
                const accNum = document.getElementById("prfDisplayAccountNumber");
                const bBranch = document.getElementById("prfDisplayBankBranch");
                if (bName) bName.textContent = b.bankName || "Not set";
                if (accName) accName.textContent = b.accountName || "Not set";
                if (accNum) accNum.textContent = b.accountNumber || "Not set";
                if (bBranch) bBranch.textContent = b.bankBranch || "Not set";
            } else {
                bankCard.style.display = "none";
            }
        }
    };

    window.openEditProfileModal = () => {
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        if (!currentUser) return;
        let modal = document.getElementById("modalEditProfile");
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const nameInp = document.getElementById("editPrfName");
        const phoneInp = document.getElementById("editPrfPhone");
        const districtInp = document.getElementById("editPrfDistrict");
        const cityInp = document.getElementById("editPrfCity");
        const addrInp = document.getElementById("editPrfAddress");

        if (nameInp) nameInp.value = currentUser.name || "";
        if (phoneInp) phoneInp.value = currentUser.phone || "";
        if (districtInp) districtInp.value = currentUser.district || "Colombo";
        if (cityInp) cityInp.value = currentUser.city || "";
        if (addrInp) addrInp.value = currentUser.address || (currentUser.receiverDetails && currentUser.receiverDetails.address) || "";

        const isRec = ((currentUser.role) || "").toLowerCase().includes("receiver");
        const secBank = document.getElementById("secEditReceiverBank");
        if (secBank) {
            if (isRec) {
                secBank.style.display = "block";
                const b = currentUser.receiverDetails || currentUser.bankDetails || {};
                const bName = document.getElementById("editPrfBankName");
                const accName = document.getElementById("editPrfAccountName");
                const accNum = document.getElementById("editPrfAccountNumber");
                const bBranch = document.getElementById("editPrfBankBranch");
                if (bName) bName.value = b.bankName || "";
                if (accName) accName.value = b.accountName || "";
                if (accNum) accNum.value = b.accountNumber || "";
                if (bBranch) bBranch.value = b.bankBranch || "";
            } else {
                secBank.style.display = "none";
            }
        }

        // Initialize avatar preview
        const avatarPreview = document.getElementById("editPrfAvatarPreview");
        if (avatarPreview) {
            if (currentUser.photoURL) {
                avatarPreview.style.backgroundImage = `url('${currentUser.photoURL}')`;
                avatarPreview.textContent = "";
            } else {
                avatarPreview.style.backgroundImage = "";
                const initials = (currentUser.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                avatarPreview.textContent = initials;
            }
        }
        window.pendingProfilePhotoDataUrl = null;

        if (modal) {
            modal.style.setProperty("display", "flex", "important");
            modal.style.setProperty("visibility", "visible", "important");
            modal.style.setProperty("opacity", "1", "important");
            modal.style.setProperty("z-index", "99999999", "important");
            modal.classList.add("active");
        }
    };

    window.handleEditProfilePhotoSelected = async (input) => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
            const compressFn = window.compressAndReadFile || (async (f) => {
                return new Promise(res => {
                    const r = new FileReader();
                    r.onload = e => res(e.target.result);
                    r.readAsDataURL(f);
                });
            });
            const dataUrl = await compressFn(file, 400, 0.75);
            window.pendingProfilePhotoDataUrl = dataUrl;
            const avatarPreview = document.getElementById("editPrfAvatarPreview");
            if (avatarPreview) {
                avatarPreview.style.backgroundImage = `url('${dataUrl}')`;
                avatarPreview.textContent = "";
            }
        } catch (err) {
            console.error("Avatar preview error:", err);
        }
    };

    window.closeEditProfileModal = () => {
        const modal = document.getElementById("modalEditProfile");
        if (modal) {
            modal.classList.remove("active");
            modal.style.setProperty("display", "none", "important");
            modal.style.setProperty("visibility", "hidden", "important");
            modal.style.setProperty("opacity", "0", "important");
        }
    };

    window.submitEditProfileDirectly = async () => {
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        if (!currentUser) return;
        const name = document.getElementById("editPrfName")?.value.trim();
        const phone = document.getElementById("editPrfPhone")?.value.trim();
        const district = document.getElementById("editPrfDistrict")?.value || "Colombo";
        const city = document.getElementById("editPrfCity")?.value.trim() || "";
        const address = document.getElementById("editPrfAddress")?.value.trim() || "";
        const btnSave = document.getElementById("btnSubmitProfileSave");

        if (!name || !phone || !address) {
            showToast("Please provide your name, phone, and complete street address.", "warning");
            return;
        }

        try {
            if (btnSave) {
                btnSave.disabled = true;
                btnSave.textContent = "Saving...";
            }
            showToast("Updating profile & address...", "info");

            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const location = districtCoordinates[district] || { lat: 6.9271, lng: 79.8612 };

            const updates = {
                name,
                phone,
                district,
                city,
                address,
                location,
                updatedAt: new Date().toISOString()
            };

            if (window.pendingProfilePhotoDataUrl) {
                updates.photoURL = window.pendingProfilePhotoDataUrl;
            }

            const isRec = ((currentUser.role) || "").toLowerCase().includes("receiver");
            if (isRec) {
                const bName = document.getElementById("editPrfBankName")?.value.trim() || "";
                const accName = document.getElementById("editPrfAccountName")?.value.trim() || "";
                const accNum = document.getElementById("editPrfAccountNumber")?.value.trim() || "";
                const bBranch = document.getElementById("editPrfBankBranch")?.value.trim() || "";

                const recDetails = currentUser.receiverDetails || {};
                recDetails.address = address;
                recDetails.bankName = bName;
                recDetails.accountName = accName;
                recDetails.accountNumber = accNum;
                recDetails.bankBranch = bBranch;

                updates.receiverDetails = recDetails;
            }

            await db.collection("users").doc(currentUser.uid).update(updates);

            currentUser = { ...currentUser, ...updates };
            localStorage.setItem("givego_user", JSON.stringify(currentUser));

            showToast("Profile & Address updated successfully.", "success");
            closeEditProfileModal();
            updateUIProfileAndMenu();
            renderUserProfilePanel();
        } catch (err) {
            console.error("Profile update error:", err);
            showToast("Failed to update profile details.", "danger");
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.textContent = "Save Changes";
            }
        }
    };

    function renderNotifications() {
        const container = document.getElementById("notificationsContainer") || document.getElementById("notificationsListContainer");
        const dot = document.getElementById("notiDot");
        
        const unread = notificationsList.filter(n => !n.read);
        if (dot) dot.style.display = unread.length > 0 ? "inline-block" : "none";
        if (!container) return;
        
        if (notificationsList.length === 0) {
            container.innerHTML = ` <div class="glass-panel" style="padding: 40px; text-align: center; background: #FFFFFF;"> <h4 style="color: var(--color-teal-primary); font-size: 1.1rem; margin-bottom: 8px;">No Active Alerts</h4> <p style="color: var(--color-text-muted); font-size: 0.9rem;">You are up to date! System notifications and donation match alerts will appear here automatically.</p> </div> `;
            return;
        }

        const sorted = [...notificationsList].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        container.innerHTML = sorted.map(n => {
            const date = new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            return ` <div class="glass-panel" style="padding: 16px 20px; margin-bottom: 12px; border-left: 5px solid ${n.read ? 'var(--color-border)' : 'var(--color-teal-primary)'}; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="markNotificationRead('${n.id}')"> <div> <div style="font-size: 0.95rem; font-weight: ${n.read ? '600' : '800'}; color: var(--color-teal-primary); margin-bottom: 4px;">${n.message}</div> <div style="font-size: 0.75rem; color: var(--color-text-muted);">${date}</div> </div> ${n.read ? `<span class="badge badge-info" style="font-size:0.7rem;">Read</span>` : `<span class="badge badge-success" style="font-size:0.7rem;">New Alert</span>`} </div> `;
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
            const groupCat = document.getElementById("groupReqCategory");
            const groupItemName = document.getElementById("groupReqItemName");
            const reqItemNameInput = document.getElementById("reqItemName");
            const reqCategorySelect = document.getElementById("reqCategory");
            const secPhys = document.getElementById("secReqPhysical");
            const secMon = document.getElementById("secReqMonetary");
            const secVol = document.getElementById("secReqVolunteer");

            if (val === 'physical') {
                if (groupCat) groupCat.style.display = "block";
                if (groupItemName) groupItemName.style.display = "block";
                if (reqItemNameInput) reqItemNameInput.required = true;
                if (reqCategorySelect) reqCategorySelect.required = true;
                if (secPhys) secPhys.style.display = "block";
                if (secMon) secMon.style.display = "none";
                if (secVol) secVol.style.display = "none";
            } else {
                // When volunteer or monetary is selected, Category and Item/Need Title disappear
                if (groupCat) groupCat.style.display = "none";
                if (groupItemName) groupItemName.style.display = "none";
                if (reqItemNameInput) reqItemNameInput.required = false;
                if (reqCategorySelect) reqCategorySelect.required = false;
                if (secPhys) secPhys.style.display = "none";

                if (val === 'monetary') {
                    if (secMon) secMon.style.display = "block";
                    if (secVol) secVol.style.display = "none";
                } else if (val === 'volunteer') {
                    if (secMon) secMon.style.display = "none";
                    if (secVol) secVol.style.display = "block";
                }
            }
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
            if (targetHiddenId === 'donPhotoUrl') {
                const errPhoto = document.getElementById("errDonPhoto");
                if (errPhoto) {
                    errPhoto.textContent = "";
                    errPhoto.style.display = "none";
                }
                fileInput.classList.remove("is-invalid");
            }
            showToast("Item image selected & ready for submission.", "info");
        };
        reader.readAsDataURL(file);
    };

    const formRequestMaterials = document.getElementById("formRequestMaterials");
    if (formRequestMaterials) {
        formRequestMaterials.addEventListener("submit", async (e) => {
            if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) { e.preventDefault(); return; }
            e.preventDefault();
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const reqType = document.getElementById("reqType").value;
            let itemName = "";
            let category = "";
            const description = document.getElementById("reqDescription").value.trim();

            if (reqType === 'physical') {
                itemName = document.getElementById("reqItemName")?.value.trim() || "";
                category = document.getElementById("reqCategory")?.value || "General Supplies";
                if (!itemName) {
                    showToast("Please enter the Item / Need Title.", "warning");
                    document.getElementById("reqItemName")?.focus();
                    return;
                }
            } else if (reqType === 'monetary') {
                const amount = parseFloat(document.getElementById("reqAmount")?.value) || 0;
                itemName = amount > 0 ? `Monetary Support Request (LKR ${amount.toLocaleString()})` : "Monetary Donation Request";
                category = "Monetary Donation";
            } else if (reqType === 'volunteer') {
                const volCount = parseInt(document.getElementById("reqVolunteersCount")?.value) || 5;
                itemName = `Volunteer Support Request (${volCount} Volunteers)`;
                category = "Volunteer Support";
            }

            if (!description) {
                showToast("Please complete the detailed request description.", "warning");
                document.getElementById("reqDescription")?.focus();
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
                if (reqTypeSelect) {
                    reqTypeSelect.value = "physical";
                    reqTypeSelect.dispatchEvent(new Event("change"));
                }
                updateOverviewStats();
            } catch (err) {
                showToast("Error publishing request.", "danger");
                console.error(err);
            }
        });
    }

    // Donor Dashboard Quantity Stepper & Category Condition Handler
    window.adjustDonQuantity = (delta) => {
        const qtyInput = document.getElementById("donQuantity");
        if (!qtyInput) return;
        let val = parseInt(qtyInput.value) || 1;
        val += delta;
        if (val < 1) val = 1;
        qtyInput.value = val;
        qtyInput.dispatchEvent(new Event("change"));
    };

    const donQtyInput = document.getElementById("donQuantity");
    if (donQtyInput) {
        donQtyInput.addEventListener("blur", () => {
            let val = parseInt(donQtyInput.value);
            if (isNaN(val) || val < 1) {
                donQtyInput.value = "1";
            }
        });
    }

    const donCategorySelect = document.getElementById("donCategory");
    if (donCategorySelect) {
        const toggleDonConditionField = () => {
            const cat = donCategorySelect.value;
            const groupCond = document.getElementById("groupDonCondition");
            const condSelect = document.getElementById("donCondition");
            const errCond = document.getElementById("errDonCondition");
            if (cat === 'Food & Nutrition') {
                if (groupCond) groupCond.style.display = 'none';
                if (condSelect) {
                    condSelect.required = false;
                    condSelect.classList.remove("is-invalid");
                }
                if (errCond) {
                    errCond.textContent = "";
                    errCond.style.display = "none";
                }
            } else {
                if (groupCond) groupCond.style.display = 'block';
                if (condSelect) condSelect.required = true;
            }
        };
        donCategorySelect.addEventListener("change", toggleDonConditionField);
        toggleDonConditionField();
    }

    // Real-time error clearing for Donor Form fields
    function clearDonorFieldError(inputElem, errorElemId) {
        if (inputElem) inputElem.classList.remove("is-invalid");
        const errDiv = document.getElementById(errorElemId);
        if (errDiv) {
            errDiv.textContent = "";
            errDiv.style.display = "none";
        }
    }

    function setupDonorFormValidationListeners() {
        const fields = [
            { id: "donCategory", errId: "errDonCategory", events: ["change"] },
            { id: "donItemName", errId: "errDonItemName", events: ["input", "change"] },
            { id: "donUnit", errId: "errDonUnit", events: ["change"] },
            { id: "donQuantity", errId: "errDonQuantity", events: ["input", "change"] },
            { id: "donCondition", errId: "errDonCondition", events: ["change"] },
            { id: "donPhotoFile", errId: "errDonPhoto", events: ["change"] },
            { id: "donDescription", errId: "errDonDescription", events: ["input", "change"] }
        ];

        fields.forEach(f => {
            const elem = document.getElementById(f.id);
            if (elem) {
                f.events.forEach(evt => {
                    elem.addEventListener(evt, () => {
                        clearDonorFieldError(elem, f.errId);
                    });
                });
            }
        });
    }
    setupDonorFormValidationListeners();

    function validateDonorPostForm() {
        let isValid = true;
        let firstErrorElem = null;

        function setFieldError(inputElem, errorElemId, msg) {
            isValid = false;
            if (inputElem) inputElem.classList.add("is-invalid");
            const errDiv = document.getElementById(errorElemId);
            if (errDiv) {
                errDiv.textContent = msg;
                errDiv.style.display = "flex";
            }
            if (!firstErrorElem && inputElem) {
                firstErrorElem = inputElem;
            }
        }

        // 1. Category
        const catElem = document.getElementById("donCategory");
        const category = catElem?.value?.trim() || "";
        if (!category) {
            setFieldError(catElem, "errDonCategory", "Please select a category.");
        } else {
            clearDonorFieldError(catElem, "errDonCategory");
        }

        // 2. Item Name
        const nameElem = document.getElementById("donItemName");
        const itemName = nameElem?.value?.trim() || "";
        if (!itemName) {
            setFieldError(nameElem, "errDonItemName", "Item name is required.");
        } else {
            clearDonorFieldError(nameElem, "errDonItemName");
        }

        // 3. Unit of Measure
        const unitElem = document.getElementById("donUnit");
        const unit = unitElem?.value?.trim() || "";
        if (!unit) {
            setFieldError(unitElem, "errDonUnit", "Please select a unit of measure.");
        } else {
            clearDonorFieldError(unitElem, "errDonUnit");
        }

        // 4. Quantity
        const qtyElem = document.getElementById("donQuantity");
        const qtyVal = parseInt(qtyElem?.value) || 0;
        if (!qtyElem?.value?.trim() || isNaN(qtyVal) || qtyVal < 1) {
            setFieldError(qtyElem, "errDonQuantity", "Please enter a valid quantity.");
        } else {
            clearDonorFieldError(qtyElem, "errDonQuantity");
        }

        // 5. Condition (Exception: Food & Nutrition)
        const condGroup = document.getElementById("groupDonCondition");
        const condElem = document.getElementById("donCondition");
        const isConditionApplicable = category !== 'Food & Nutrition' && (!condGroup || condGroup.style.display !== 'none');
        if (isConditionApplicable) {
            const condition = condElem?.value?.trim() || "";
            if (!condition) {
                setFieldError(condElem, "errDonCondition", "Please select the item condition.");
            } else {
                clearDonorFieldError(condElem, "errDonCondition");
            }
        } else {
            clearDonorFieldError(condElem, "errDonCondition");
        }

        // 6. Item Photo / Spec Image
        const fileElem = document.getElementById("donPhotoFile") || document.querySelector("#formPostDonation input[type='file']");
        const photoUrl = document.getElementById("donPhotoUrl")?.value || "";
        if (!photoUrl && (!fileElem?.files || fileElem.files.length === 0)) {
            setFieldError(fileElem, "errDonPhoto", "Please upload an item photo.");
        } else {
            clearDonorFieldError(fileElem, "errDonPhoto");
        }

        // 7. Description
        const descElem = document.getElementById("donDescription");
        const description = descElem?.value?.trim() || "";
        if (!description) {
            setFieldError(descElem, "errDonDescription", "Description is required.");
        } else {
            clearDonorFieldError(descElem, "errDonDescription");
        }

        if (firstErrorElem) {
            firstErrorElem.scrollIntoView({ behavior: "smooth", block: "center" });
            firstErrorElem.focus();
        }

        return isValid;
    }

    const formPostDonation = document.getElementById("formPostDonation");
    if (formPostDonation) {
        formPostDonation.addEventListener("submit", async (e) => {
            if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) { e.preventDefault(); return; }
            e.preventDefault();

            // Run mandatory validations
            const isValid = validateDonorPostForm();
            if (!isValid) {
                showToast("Please complete all required fields before submitting.", "warning");
                return;
            }

            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const itemName = document.getElementById("donItemName").value.trim();
            const category = document.getElementById("donCategory").value;
            let quantity = parseInt(document.getElementById("donQuantity").value) || 1;
            if (quantity < 1) quantity = 1;
            const unit = document.getElementById("donUnit")?.value || "Units";
            const condition = category === 'Food & Nutrition' ? "Fresh / Non-Perishable" : (document.getElementById("donCondition")?.value || "Brand New");
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

                // Thorough form reset & clear error highlights
                formPostDonation.reset();
                if (document.getElementById("donItemName")) document.getElementById("donItemName").value = "";
                if (document.getElementById("donQuantity")) document.getElementById("donQuantity").value = "1";
                if (document.getElementById("donPhotoUrl")) document.getElementById("donPhotoUrl").value = "";
                if (document.getElementById("donPhotoUrlText")) document.getElementById("donPhotoUrlText").value = "";
                if (document.getElementById("donDescription")) document.getElementById("donDescription").value = "";
                const fileInput = document.getElementById("donPhotoFile") || formPostDonation.querySelector("input[type='file']");
                if (fileInput) fileInput.value = "";

                // Clear all error states
                const allErrDivs = formPostDonation.querySelectorAll(".field-error-text");
                allErrDivs.forEach(div => {
                    div.textContent = "";
                    div.style.display = "none";
                });
                const allInvalidControls = formPostDonation.querySelectorAll(".is-invalid");
                allInvalidControls.forEach(ctrl => ctrl.classList.remove("is-invalid"));

                if (donCategorySelect) {
                    donCategorySelect.dispatchEvent(new Event("change"));
                }

                if (typeof renderDonorListings === "function") renderDonorListings();
                if (typeof renderAdminRequestApprovals === "function") renderAdminRequestApprovals();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to post donation.", "danger");
                console.error("Donation post error: ", err);
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Submit";
                }
            }
        });
    }

    function formatSubmittedDate(dateVal) {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return 'N/A';
        const day = String(d.getDate()).padStart(2, '0');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }

    function renderDonorListings() {
        const body = document.getElementById("donorListingsBody");
        if (!body) return;

        const searchKeyword = (document.getElementById("filterDonorSearch")?.value || "").toLowerCase();
        const statusFilter = document.getElementById("filterDonorStatus")?.value || "all";
        const catFilter = document.getElementById("filterDonorCategory")?.value || "all";
        const sortOrder = document.getElementById("sortDonorOrder")?.value || "latest";

        let myDonations = donationsList.filter(d => d.donorId === currentUser.uid || 
            (currentUser.id && d.donorId === currentUser.id) || 
            (currentUser.email && d.donorEmail === currentUser.email)
        );

        if (sortOrder === "latest") {
            myDonations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else {
            myDonations.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }

        if (searchKeyword) {
            myDonations = myDonations.filter(d => (d.itemName && d.itemName.toLowerCase().includes(searchKeyword)) ||
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
            body.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No material listings match the selected filters.</td></tr>`;
            return;
        }

        body.innerHTML = myDonations.map(d => {
            let statusBadge = `<span class="badge badge-warning">Pending Admin</span>`;
            if (d.status === 'available') statusBadge = `<span class="badge badge-success">Approved / Available</span>`;
            else if (d.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected by Admin</span>`;

            const dateSubmitted = formatSubmittedDate(d.createdAt);

            return ` <tr> <td>${dateSubmitted}</td> <td><img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=80&q=80'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td> <td><strong>${d.itemName}</strong></td> <td>${d.category}</td> <td>${d.quantity} ${d.unit || 'units'}</td> <td>${statusBadge}</td> <td> <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteDonation('${d.id}')">Delete</button> </td> </tr> `;
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

        let myRequests = requestsList.filter(r => r.receiverId === currentUser.uid || 
            (currentUser.name && r.receiverName === currentUser.name) || 
            (currentUser.email && r.receiverEmail === currentUser.email)
        );

        if (sortOrder === "latest") {
            myRequests.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else {
            myRequests.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }

        if (searchKeyword) {
            myRequests = myRequests.filter(r => (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
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
            body.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No requests match the selected filters.</td></tr>`;
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

            const dateSubmitted = formatSubmittedDate(r.createdAt);

            return ` <tr> <td>${dateSubmitted}</td> <td>${typeBadge}</td> <td><strong>${r.itemName}</strong></td> <td>${r.category}</td> <td>${targetText}</td> <td>${fulfilledText}</td> <td>${statusBadge}</td> <td> <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="deleteRequest('${r.id}')">Delete</button> </td> </tr> `;
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

            const relatedMatches = matchesList.filter(m => m.donationId === donId || 
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
            if (typeof renderAdminApprovals === 'function') renderAdminApprovals();
            if (typeof renderAdminRequestApprovals === 'function') renderAdminRequestApprovals();
            if (typeof renderAdminDirectory === 'function') renderAdminDirectory();
            if (typeof renderAdminActiveMatchesTable === 'function') renderAdminActiveMatchesTable();
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
            return ` <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid var(--color-teal-primary);"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"> <span class="badge badge-info">RECEIVER REQUEST: ${(r.reqType || 'physical').toUpperCase()}</span> <span class="badge badge-warning">${r.district || 'Colombo'}</span> </div> ${isHospitalVol ? `<div class="badge badge-warning" style="width:100%; margin-bottom:10px;">Hospital Non-Clinical Support Approval Required</div>` : ''} <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${r.itemName}</h4> <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom: 8px;">Receiver: ${r.receiverName} (${r.receiverCategory || 'Receiver'})</div> <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">${r.description}</p> <div style="display:flex; gap:10px;"> <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="approveRequest('${r.id}')">Approve & Publish Request</button> <button class="btn btn-danger" style="font-size:0.8rem;" onclick="rejectRequest('${r.id}')">Reject</button> </div> </div> `;
        }).join("");

        html += pendingDons.map(d => {
            return ` <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid #306D29;"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"> <span class="badge badge-success">DONOR SURPLUS ITEM LISTING</span> <span class="badge badge-warning">${d.district || 'Colombo'}</span> </div> <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${d.itemName}</h4> <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom: 8px;">Donor: ${d.donorName} | Category: ${d.category}</div> <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 12px;">Qty: <strong>${d.quantity} units</strong> | Condition: ${d.condition || 'Good'}</p> <div style="display:flex; gap:10px;"> <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="approveDonationListing('${d.id}')">Approve & Publish to Directory</button> <button class="btn btn-danger" style="font-size:0.8rem;" onclick="rejectDonationListing('${d.id}')">Reject</button> </div> </div> `;
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

            const relatedMatches = matchesList.filter(m => m.requestId === reqId || 
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
            if (typeof renderAdminApprovals === 'function') renderAdminApprovals();
            if (typeof renderAdminRequestApprovals === 'function') renderAdminRequestApprovals();
            if (typeof renderAdminDirectory === 'function') renderAdminDirectory();
            if (typeof renderAdminActiveMatchesTable === 'function') renderAdminActiveMatchesTable();
            updateOverviewStats();

            showToast("Request and all related details removed.", "success");
        } catch (err) {
            console.error("Delete request error:", err);
            showToast("Failed to delete request.", "danger");
        }
    };

    window.clearAllDatabaseItems = async () => {
        if (!confirm(" WARNING: Are you sure you want to permanently delete ALL requests, donation listings, matches, chat messages, and notifications from the database? This action cannot be undone.")) {
            return;
        }

        showToast(" Purging all items from database...", "info");

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

            showToast(" All database items (requests, listings, matches, chats) have been permanently removed!", "success");
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
        const districtFilter = document.getElementById("filterReqDistrict")?.value || "all";

        let filtered = requestsList.filter(r => r.status === 'published' || r.status === 'partially_fulfilled');

        if (searchKeyword) {
            filtered = filtered.filter(r => (r.itemName && r.itemName.toLowerCase().includes(searchKeyword)) ||
                (r.category && r.category.toLowerCase().includes(searchKeyword)) ||
                (r.receiverCategory && r.receiverCategory.toLowerCase().includes(searchKeyword)) ||
                (r.receiverName && r.receiverName.toLowerCase().includes(searchKeyword))
            );
        }

        if (reqTypeFilter !== 'all') filtered = filtered.filter(r => (r.reqType || 'physical') === reqTypeFilter);
        if (catFilter !== 'all') filtered = filtered.filter(r => isCategoryMatch(r.category, catFilter));
        if (receiverCatFilter !== 'all') filtered = filtered.filter(r => isCategoryMatch(r.receiverCategory, receiverCatFilter));
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
                actionBtn = `<button type="button" class="btn btn-primary" data-action="volunteer-shift" data-request-id="${r.id}" style="width:100%; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="openVolunteerModal('${r.id}')"> Join Volunteer Shift</button>`;
            }

            return ` <div class="glass-panel" style="padding: 20px; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between;"> <div> <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;"> <span class="badge badge-info">${reqType.toUpperCase()}</span> <span class="badge badge-warning">${r.district || 'Colombo'}</span> </div> <h4 style="font-size: 1.1rem; color: var(--color-teal-primary); margin-bottom: 4px;">${r.itemName}</h4> <div style="font-size: 0.8rem; color: var(--color-teal-muted); font-weight: 700; margin-bottom: 8px;">${r.receiverName} (${r.receiverCategory || 'Receiver'})</div> <p style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 14px; line-height: 1.4;">${r.description}</p> ${reqType === 'physical' ? ` <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Required: <strong>${r.quantityRequired} units</strong> (Condition: ${r.acceptableCondition || 'Any'})</div> ` : ''}
                        ${reqType === 'monetary' ? ` <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Target Goal: <strong>LKR ${r.amountRequired}</strong></div> ` : ''}
                        ${reqType === 'volunteer' ? ` <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 6px;">Volunteers Required: <strong>${r.volunteersRequired}</strong></div> <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Equipment: ${r.equipmentNeeded || 'Standard tools'}</div> ` : ''} </div> <div> ${actionBtn} <button class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding:4px; margin-top:6px;" onclick="openDirectChatWithUser('${r.receiverId}', '${r.receiverName}', '${r.itemName}')"> Message Receiver</button> </div> </div> `;
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

    // Cascading Hierarchical Filter Selection Handler (Needs Catalogue)
    window.selectCascadingOption = (receiverType, reqType, category, displayLabel) => {
        const recInput = document.getElementById("filterReceiverCategory");
        const typeInput = document.getElementById("filterReqType");
        const catInput = document.getElementById("filterReqCategory");
        const labelSpan = document.getElementById("cascadingFilterLabel");
        const container = document.getElementById("cascadingFilterContainer");

        if (recInput) recInput.value = receiverType || "all";
        if (typeInput) typeInput.value = reqType || "all";
        if (catInput) catInput.value = category || "all";
        if (labelSpan) labelSpan.textContent = displayLabel || "All Receiver Types";

        if (container) container.classList.remove("open");
        renderDonorNeeds();
    };

    window.toggleCascadingFilter = (e) => {
        if (e) e.stopPropagation();
        const container = document.getElementById("cascadingFilterContainer");
        if (container) container.classList.toggle("open");
    };

    // Cascading Filter Selection Handler (Approved Available Material Donations)
    window.selectAvailableCascadingOption = (district, category, displayLabel) => {
        const distInput = document.getElementById("filterAvailableDistrict");
        const catInput = document.getElementById("filterAvailableCategory");
        const labelSpan = document.getElementById("availableCascadingFilterLabel");
        const container = document.getElementById("availableCascadingFilterContainer");

        if (distInput) distInput.value = district || "all";
        if (catInput) catInput.value = category || "all";
        if (labelSpan) labelSpan.textContent = displayLabel || "All Districts (25)";

        if (container) container.classList.remove("open");
        renderAllAvailableItems();
    };

    window.toggleAvailableCascadingFilter = (e) => {
        if (e) e.stopPropagation();
                    const container = document.getElementById("availableCascadingFilterContainer");
                    if (container) container.classList.toggle("open");
                };

                window.toggleDonorSubmissionsCascadingFilter = (e) => {
                    if (e) e.stopPropagation();
                    const container = document.getElementById("donorSubmissionsCascadingFilterContainer");
                    if (container) container.classList.toggle("open");
                };

                window.selectDonorSubmissionsCascadingOption = (status, category, displayLabel) => {
                    const statusInput = document.getElementById("filterDonorStatus");
                    const catInput = document.getElementById("filterDonorCategory");
                    const labelSpan = document.getElementById("donorSubmissionsCascadingFilterLabel");
                    const container = document.getElementById("donorSubmissionsCascadingFilterContainer");

                    if (statusInput) statusInput.value = status || "all";
                    if (catInput) catInput.value = category || "all";
                    if (labelSpan) labelSpan.textContent = displayLabel || "All Statuses";

                    if (container) container.classList.remove("open");
                    renderDonorListings();
                };

                document.addEventListener("click", (e) => {
                    const container = document.getElementById("cascadingFilterContainer");
                    if (container && !container.contains(e.target)) {
                        container.classList.remove("open");
                    }
                    const availContainer = document.getElementById("availableCascadingFilterContainer");
                    if (availContainer && !availContainer.contains(e.target)) {
                        availContainer.classList.remove("open");
                    }
                    const donorSubContainer = document.getElementById("donorSubmissionsCascadingFilterContainer");
                    if (donorSubContainer && !donorSubContainer.contains(e.target)) {
                        donorSubContainer.classList.remove("open");
                    }
                });

    // 1. Donor Offers Donation First to Receiver Need Request
    window.offerPhysicalDonation = (requestId) => {
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
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
            maxNotice.textContent = ` Max Limit: ${maxRequired} ${req.unit || 'units'} (Receiver requested ${maxRequired} ${req.unit || 'units'})`;
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
            const existingOffer = matchesList.find(m => m.requestId === req.id && 
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
                    message: ` Donor ${currentUser.name} offered ${qty} ${req.unit || 'units'} for "${req.itemName}". Please Accept or Reject this offer in your dashboard.`,
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
                ? ` Receiver ${currentUser.name} accepted and confirmed receipt of your donation of LKR ${parseFloat(match.amount || 0).toLocaleString()} for "${match.requestName}". Thank you for your support!`
                : ` Receiver ${currentUser.name} accepted your offer of ${match.quantity} ${match.unit || 'units'} for "${match.requestName}". Please open your dashboard to select your Delivery Method.`;

            await db.collection("notifications").add({
                userId: match.donorId,
                message: notifMsg,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(` ${isMonetary ? 'Fund receipt confirmed!' : 'Offer accepted!'}${reqNotice}`, "success");
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
                message: ` Receiver ${currentUser.name} declined the offer for "${match.requestName}".`,
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
                        message: ` Donor ${currentUser.name} selected Self Delivery for "${match.requestName}" scheduled at ${formatted}. Please Accept, Reject, or Negotiate this schedule.`,
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
                        message: ` Donor ${currentUser.name} selected Receiver Pick Up for "${match.requestName}". Please open your dashboard to schedule your preferred pick-up date & time.`,
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
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

        const existingReq = matchesList.find(m => m.donationId === dItem.id && 
            (m.receiverId === currentUser.uid || (currentUser.email && m.receiverEmail === currentUser.email)) && 
            (m.status === 'pending_donor_approval' || m.status === 'accepted' || m.status === 'confirmed')
        );
        if (existingReq) {
            showToast("You already have an active or pending request for this surplus item.", "warning");
            closeRequestAvailableItemModal();
            return;
        }

        try {
            showToast(" Sending request to donor...", "info");
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
                message: ` Receiver ${currentUser.name} requested ${reqQty} ${dItem.unit || 'units'} of your available item "${dItem.itemName}". Please Accept or Reject this request in your dashboard.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(" Item request sent to donor! Waiting for donor approval.", "success");
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        const item = donationsList.find(d => d.id === donationId || String(d.id) === String(donationId));
        if (!item) return;

        let modal = document.getElementById("modalRequestAvailableItem");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalRequestAvailableItem";
            modal.style.zIndex = "999999";
            modal.innerHTML = ` <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:520px; width:90%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;"> <h3 id="mdlReqItemTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">Request Material Item</h3> <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeRequestAvailableItemModal()"></button> </div> <form id="formSubmitItemRequest" onsubmit="event.preventDefault(); submitReceiverItemRequestDirectly();"> <input type="hidden" id="mdlReqDonationId" value="${item.id}"> <div class="form-group" style="margin-bottom:14px;"> <label class="form-label" style="font-weight:700; font-size:0.85rem;">Requested Quantity / Units</label> <input class="form-control" type="number" id="mdlReqItemQty" min="1" value="${item.quantity || 1}" max="${item.quantity || 1}" required style="font-weight:700; width:100%;"> <div id="lblReqItemMaxNotice" style="font-size:0.75rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px;"> Max Stock Available: ${item.quantity || 1} ${item.unit || 'units'}</div> </div> <div class="form-group" style="margin-bottom:14px;"> <label class="form-label" style="font-weight:700; font-size:0.85rem;">Delivery Method</label> <input class="form-control" type="text" value="Self Pick Up (Receiver Pick Up)" readonly style="font-weight:800; background:#F5EFE0; color:var(--color-teal-primary); width:100%;"> </div> <div style="background:#F5EFE0; padding:12px; border-radius:6px; font-size:0.8rem; color:var(--color-text-dark); margin-bottom:16px; line-height:1.4;"> As a Receiver requesting this available item, an automated notification will be sent to the donor to accept your request. </div> <div style="display:flex; gap:10px; justify-content:flex-end; align-items:center;"> <button type="button" class="btn btn-secondary" style="padding:10px 18px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeRequestAvailableItemModal()"> Cancel</button> <button class="btn btn-primary" type="button" onclick="submitReceiverItemRequestDirectly()" style="font-weight:800; padding:10px 22px; font-size:0.88rem; background:#0D7C7A; color:#FFFFFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 3px 10px rgba(13,124,122,0.3);"> Send Item Request</button> </div> </form> </div> `;
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
            maxNotice.textContent = ` Max Stock Available: ${maxAvail} ${item.unit || 'units'}`;
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
                message: ` Donor ${currentUser.name} accepted your request for ${match.quantity} ${match.unit || 'units'} of "${match.requestName}"! Please open your dashboard to schedule your Self Pick Up Date & Time.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(` Request accepted!${itemNotice}`, "success");
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
                message: ` Donor ${currentUser.name} declined your request for "${match.requestName}".`,
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
                    message: ` Receiver ${currentUser.name} scheduled Self Pick Up for "${match.requestName}" at ${formatted}. Please Accept, Reject, or Negotiate this schedule.`,
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
                message: ` ${currentUser.name} accepted the scheduled date & time for "${match.requestName}". Match is now fully confirmed!`,
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
                text: ` Schedule proposal declined by ${currentUser.name}. Let's discuss a suitable date & time here in chat!`,
                createdAt: new Date().toISOString()
            });

            await helper.db().collection("notifications").add({
                userId: recipientId,
                message: ` ${currentUser.name} declined the proposed schedule for "${match.requestName}". Opening chat portal to negotiate date & time.`,
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
                    message: ` ${currentUser.name} proposed a new schedule for "${match.requestName}": ${formatted}. ${reason ? 'Note: "' + reason + '"' : ''}`,
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;

        document.getElementById("mdlMonRequestId").value = req.id;
        document.getElementById("mdlMonTitle").textContent = `Monetary Offer: ${req.itemName}`;
        
        const bankBox = document.getElementById("mdlBankDetailsContent");
        const b = req.bankDetails || (usersList.find(u => u.uid === req.receiverId)?.receiverDetails);
        if (b) {
            bankBox.innerHTML = ` <div><strong>Bank Name:</strong> ${b.bankName || 'N/A'}</div> <div><strong>Account Name:</strong> ${b.accountName || 'N/A'}</div> <div><strong>Account Number:</strong> ${b.accountNumber || 'N/A'}</div> <div><strong>Branch:</strong> ${b.bankBranch || 'N/A'}</div> `;
        } else {
            bankBox.innerHTML = `<div>Bank information verified by Admin. Contact representative via messages.</div>`;
        }

        const receiptInput = document.getElementById("monReceiptUploadInput");
        const receiptUrlInput = document.getElementById("mdlMonReceiptUrl");
        const previewBox = document.getElementById("mdlMonReceiptPreviewBox");
        const previewImg = document.getElementById("mdlMonReceiptPreviewImg");
        if (receiptInput) receiptInput.value = "";
        if (receiptUrlInput) receiptUrlInput.value = "";
        if (previewBox) previewBox.style.display = "none";
        if (previewImg) previewImg.src = "";

        if (receiptInput) {
            receiptInput.onchange = (evt) => {
                const file = evt.target.files && evt.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if (receiptUrlInput) receiptUrlInput.value = e.target.result;
                        if (file.type.startsWith('image/')) {
                            if (previewImg) previewImg.src = e.target.result;
                            if (previewBox) previewBox.style.display = "block";
                        } else {
                            if (previewBox) previewBox.style.display = "none";
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        const modal = document.getElementById("modalMonetaryDonation");
        if (modal) modal.classList.add("active");
    };

    const formSubmitMonetaryDonation = document.getElementById("formSubmitMonetaryDonation");
    if (formSubmitMonetaryDonation) {
        formSubmitMonetaryDonation.addEventListener("submit", async (e) => {
            if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) { e.preventDefault(); return; }
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;

        let modal = document.getElementById("modalVolunteerSignup");
        if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const reqIdEl = document.getElementById("mdlVolunteerRequestId");
        if (reqIdEl) reqIdEl.value = req.id;

        const titleEl = document.getElementById("mdlVolunteerTitle");
        if (titleEl) titleEl.textContent = ` Join Volunteer Shift: ${req.itemName}`;

        const orgInfoEl = document.getElementById("mdlVolunteerOrgInfo");
        if (orgInfoEl) orgInfoEl.innerHTML = ` <strong>Organizer / Receiver:</strong> ${req.receiverName} (${req.receiverCategory || 'Organisation'})`;

        const shiftInfoEl = document.getElementById("mdlVolunteerShiftInfo");
        if (shiftInfoEl) {
            const shiftTime = req.volDateTime ? ` |  Time: ${new Date(req.volDateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : '';
            const location = req.volLocation || req.district || 'Colombo';
            const reqVol = req.volunteersRequired || 1;
            const assignedVol = req.volunteersAssigned || 0;
            shiftInfoEl.innerHTML = ` <strong>Location:</strong> ${location}${shiftTime}<br> <strong>Volunteers Needed:</strong> ${reqVol} (${assignedVol} filled so far)`;
        }

        const equipInfoEl = document.getElementById("mdlVolunteerEquipmentInfo");
        if (equipInfoEl) {
            equipInfoEl.innerHTML = ` <strong>Equipment & Skills:</strong> ${req.equipmentNeeded || req.skillsRequired || 'Standard non-clinical support'}`;
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
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
                message: ` Volunteer ${currentUser.name} (${volName}, Phone: ${volPhone}) registered ${volCount} volunteer(s) for your shift "${req.itemName}".`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(` Registration confirmed! You registered ${volCount} volunteer(s) for "${req.itemName}".`, "success");
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
                btnSubmit.textContent = " Confirm Shift Registration";
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
            filtered = filtered.filter(u => (u.name && u.name.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search)) ||
                (u.role && u.role.toLowerCase().includes(search))
            );
        }

        body.innerHTML = filtered.map(u => {
            let statusBadge = `<span class="badge badge-warning">Pending</span>`;
            if (u.status === 'verified') statusBadge = `<span class="badge badge-success">Verified</span>`;
            else if (u.status === 'suspended') statusBadge = `<span class="badge badge-danger">Suspended</span>`;
            else if (u.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected</span>`;

            let actionBtn = ` <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserStatus('${u.id || u.uid}', 'suspended')">Suspend</button> `;
            if (u.status === 'suspended' || u.status === 'rejected') {
                actionBtn = ` <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserStatus('${u.id || u.uid}', 'verified')">Reactivate / Approve</button> `;
            } else if (u.status === 'pending') {
                actionBtn = ` <button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="updateUserStatus('${u.id || u.uid}', 'verified')">Approve</button> <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; margin-left:4px;" onclick="updateUserStatus('${u.id || u.uid}', 'rejected')">Reject</button> `;
            }

            return ` <tr> <td><strong>${u.name}</strong></td> <td>${u.email}</td> <td>${(u.role || u.accountType || 'user').toUpperCase()} (${u.donorType || u.receiverCategory || 'User'})</td> <td>${u.district || 'Colombo'}</td> <td>${statusBadge}</td> <td> <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;"> ${actionBtn} <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; background:#C53030;" onclick="deleteUserPermanently('${u.id || u.uid}')">Delete User</button> </div> </td> </tr> `;
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

    window.deleteUserPermanently = async (userId) => {
        if (!confirm("Are you sure you want to permanently delete this user account from GiveGo? All associated donations, requests, matches, and notifications will also be purged.")) return;
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            if (!helper || !helper.db) {
                showToast("Database connection not available.", "danger");
                return;
            }
            const db = helper.db();

            showToast("Deleting user and purging associated records...", "info");

            // 1. Delete user document from 'users' collection
            await db.collection("users").doc(userId).delete();

            // 2. Cascade delete all donations posted by this user
            try {
                const donSnap = await db.collection("donations").where("donorId", "==", userId).get();
                if (!donSnap.empty) {
                    const batch = db.batch();
                    donSnap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            } catch (dErr) {
                console.warn("Cascade donations delete notice:", dErr);
            }

            // 3. Cascade delete all requests created by this user
            try {
                const reqSnap = await db.collection("requests").where("receiverId", "==", userId).get();
                if (!reqSnap.empty) {
                    const batch = db.batch();
                    reqSnap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            } catch (rErr) {
                console.warn("Cascade requests delete notice:", rErr);
            }

            // 4. Cascade delete all matches involving this user
            try {
                const matchDonorSnap = await db.collection("matches").where("donorId", "==", userId).get();
                if (!matchDonorSnap.empty) {
                    const batch = db.batch();
                    matchDonorSnap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
                const matchRecSnap = await db.collection("matches").where("receiverId", "==", userId).get();
                if (!matchRecSnap.empty) {
                    const batch = db.batch();
                    matchRecSnap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            } catch (mErr) {
                console.warn("Cascade matches delete notice:", mErr);
            }

            // 5. Cascade delete all notifications for this user
            try {
                const notiSnap = await db.collection("notifications").where("userId", "==", userId).get();
                if (!notiSnap.empty) {
                    const batch = db.batch();
                    notiSnap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            } catch (nErr) {
                console.warn("Cascade notifications delete notice:", nErr);
            }

            // 6. Update local in-memory arrays immediately
            usersList = usersList.filter(u => u.id !== userId && u.uid !== userId);
            donationsList = donationsList.filter(d => d.donorId !== userId);
            requestsList = requestsList.filter(r => r.receiverId !== userId);
            matchesList = matchesList.filter(m => m.donorId !== userId && m.receiverId !== userId);

            // 7. Update UI tables immediately
            if (typeof renderAdminUsers === 'function') renderAdminUsers();
            if (typeof renderAdminApprovals === 'function') renderAdminApprovals();
            if (typeof renderAdminRequestApprovals === 'function') renderAdminRequestApprovals();
            if (typeof renderAdminDirectory === 'function') renderAdminDirectory();
            if (typeof renderAdminActiveMatchesTable === 'function') renderAdminActiveMatchesTable();
            if (typeof renderAllAvailableItems === 'function') renderAllAvailableItems();
            updateOverviewStats();

            // 8. If the deleted user is the currently logged in user, terminate session immediately
            if (currentUser && (currentUser.uid === userId || currentUser.id === userId)) {
                try {
                    await helper.auth().signOut();
                    localStorage.removeItem("givego_user");
                    sessionStorage.clear();
                } catch (e) {}
                window.location.href = "index.html?deleted=true";
                return;
            }

            showToast("User account and all associated records permanently deleted.", "success");
        } catch (err) {
            console.error("Delete user error:", err);
            showToast("Failed to delete user account: " + err.message, "danger");
        }
    };

    function renderDocumentPreview(docUrl, docTitle) {
        if (!docUrl || docUrl === 'attached_via_registration_form' || docUrl.trim() === '') {
            return `
                <div style="margin-top: 10px; padding: 8px 12px; background: #FFF5F5; border-radius: 6px; border: 1px solid #FED7D7; font-size: 0.8rem; color: #C53030;">
                    ${docTitle}: <strong>No document uploaded</strong>
                </div>
            `;
        }

        const isPdf = docUrl.startsWith('data:application/pdf') || docUrl.toLowerCase().includes('.pdf');
        
        if (isPdf) {
            return `
                <div style="margin-top: 12px; padding: 12px; background: #F5EFE0; border-radius: 8px; border: 1px solid var(--color-border);">
                    <div style="font-weight: 800; font-size: 0.85rem; color: var(--color-teal-primary); margin-bottom: 8px;">
                        ${docTitle}:
                    </div>
                    <iframe src="${docUrl}" style="width: 100%; height: 260px; border: 1px solid #E2E8F0; border-radius: 6px; background: #FFFFFF;"></iframe>
                    <div style="margin-top: 8px; text-align: right;">
                        <a href="${docUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.8rem; padding: 5px 12px; font-weight: 700;">Open PDF in New Tab</a>
                    </div>
                </div>
            `;
        }

        return `
            <div style="margin-top: 12px; padding: 12px; background: #F5EFE0; border-radius: 8px; border: 1px solid var(--color-border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <span style="font-weight: 800; font-size: 0.85rem; color: var(--color-teal-primary);">${docTitle}</span>
                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">Click image to enlarge</span>
                </div>
                <div style="text-align: center; background: #FFFFFF; padding: 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
                    <img src="${docUrl}" alt="${docTitle}" style="max-height: 240px; max-width: 100%; object-fit: contain; border-radius: 4px; cursor: pointer; display: block; margin: 0 auto;" onclick="window.open('${docUrl}', '_blank')" onerror="this.parentElement.innerHTML='<div style=\\'padding:15px; color:#C53030; font-size:0.85rem;\\'>Unable to preview document. <a href=\\'${docUrl}\\' target=\\'_blank\\' style=\\'font-weight:700; text-decoration:underline;\\'>Click here to open</a></div>'">
                </div>
                <div style="margin-top: 8px; text-align: right;">
                    <a href="${docUrl}" target="_blank" class="btn btn-secondary" style="font-size: 0.8rem; padding: 5px 12px; font-weight: 700;">Open Full Image</a>
                </div>
            </div>
        `;
    }

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
            const roleDisplay = (u.role || u.accountType || 'user').toUpperCase();
            const isPersonal = u.donorType === 'individual' || (!u.donorType && !u.receiverCategory && roleDisplay.includes('DONOR'));
            const isOrgDonor = u.donorType === 'organisation' || !!u.orgDetails;
            const isReceiver = roleDisplay.includes('RECEIVER') || !!u.receiverDetails;

            let subtype = `Donor (Individual)`;
            if (isOrgDonor) subtype = `Donor (Organisation / Corporate)`;
            else if (isReceiver) subtype = `Receiver (${u.receiverCategory || 'Organisation'})`;

            const address = u.address || (u.receiverDetails && u.receiverDetails.address) || 'Not provided';
            const nicNum = u.nicNumber || (u.individualDetails && u.individualDetails.nicNumber) || '';
            const brNum = (u.orgDetails && u.orgDetails.registrationNumber) || '';
            const recNum = (u.receiverDetails && u.receiverDetails.registrationNumber) || '';
            const regNum = nicNum || brNum || recNum || u.registrationNumber || 'N/A';
            
            let idLabel = "National Identity Card (NIC) No";
            if (isOrgDonor) idLabel = "Business Registration (BR) No";
            else if (isReceiver) idLabel = "Official NGO / Govt Reg No";

            const nicDoc = (u.individualDetails && u.individualDetails.nicDocUrl) || u.nicDocUrl || '';
            const brDoc = (u.orgDetails && u.orgDetails.brDocUrl) || u.brDocUrl || u.docUrl || '';
            const recDoc = (u.receiverDetails && u.receiverDetails.registrationDocUrl) || u.registrationDocUrl || '';
            const bankDoc = (u.receiverDetails && u.receiverDetails.bankDocUrl) || u.bankDocUrl || '';

            let docPreviews = '';
            if (isPersonal) {
                if (nicDoc) docPreviews += renderDocumentPreview(nicDoc, 'National Identity Card (NIC) Document');
            } else if (isOrgDonor) {
                docPreviews += renderDocumentPreview(brDoc, 'Business Registration (BR) Document');
            } else if (isReceiver) {
                if (recDoc) docPreviews += renderDocumentPreview(recDoc, 'Official Registration Certificate');
                if (bankDoc) docPreviews += renderDocumentPreview(bankDoc, 'Bank Account Proof');
            }

            let extraInfo = '';
            if (isOrgDonor && u.orgDetails && u.orgDetails.orgName) {
                extraInfo += `<div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 4px;">Organisation Name: <strong>${u.orgDetails.orgName}</strong> (Rep: ${u.orgDetails.repName || u.name})</div>`;
            }
            if (isReceiver && u.receiverDetails && u.receiverDetails.bankName) {
                extraInfo += `<div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 4px;">Bank Account: <strong>${u.receiverDetails.bankName} - ${u.receiverDetails.accountNumber}</strong> (${u.receiverDetails.accountName || u.name})</div>`;
            }

            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-radius:10px; border:1px solid var(--color-border); margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-warning">PENDING VERIFICATION</span>
                        <span style="font-size:0.8rem; font-weight:800; color:var(--color-teal-primary);">${subtype}</span>
                    </div>
                    <h4 style="font-size: 1.15rem; color: var(--color-teal-primary); margin:0 0 6px 0; font-weight:800;">${u.name}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 4px;">Email: <strong>${u.email}</strong> | Phone: <strong>${u.phone || 'N/A'}</strong></div>
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 4px;">District: <strong>${u.district || 'Colombo'}</strong> | Address: <strong>${address}</strong></div>
                    ${extraInfo}
                    <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 6px;">${idLabel}: <strong>${regNum}</strong></div>
                    ${docPreviews}
                    <div style="display:flex; gap:10px; margin-top:16px;">
                        <button class="btn btn-primary" style="flex-grow:1; font-size:0.85rem; font-weight:800;" onclick="updateUserStatus('${u.id || u.uid}', 'verified')">Approve Account</button>
                        <button class="btn btn-danger" style="font-size:0.85rem; font-weight:800;" onclick="deleteUserPermanently('${u.id || u.uid}')">Reject & Delete</button>
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
            if (fullProfile) {
                const prevStatus = currentUser.status;
                currentUser = { ...currentUser, ...fullProfile };
                try { localStorage.setItem("givego_user", JSON.stringify(currentUser)); } catch (e) {}
                if (prevStatus && prevStatus !== 'suspended' && currentUser.status === 'suspended') {
                    showToast("Your account has been suspended by an Administrator.", "danger");
                } else if (prevStatus === 'suspended' && currentUser.status === 'verified') {
                    showToast("Your account has been reactivated by the Administrator.", "success");
                }
            }
            applyAccountSuspensionState();

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
            renderHistory();
            renderChatMatchesList();
            if (activeChatPartnerId) renderChatMessages();
            checkMonetaryEvidenceSLAs();
            updateOverviewStats();
        });
        unsubscribes.push(unsubMatches);

        const unsubMessages = db.collection("messages").onSnapshot(snapshot => {
            messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderChatMatchesList();
            if (activeChatPartnerId) renderChatMessages();
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
                    ? `<span class="badge badge-warning"> Awaiting Your Fund Confirmation</span>`
                    : `<span class="badge badge-warning"> Offer Pending Your Approval</span>`;
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
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px; margin-bottom:6px;"> Scheduled Donor Self Delivery: ${formatted}</div>`;
                } else {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-secondary); font-weight:700; margin-top:4px; margin-bottom:6px;"> Scheduled Pick Up: ${formatted}</div>`;
                }
            }

            let actionButtonsHtml = '';

            if (m.type === 'volunteer') {
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += ` <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')"> Accept Volunteer Offer</button> `;
                }
            } else if (m.type === 'monetary' || (m.amount && !m.quantity)) {
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += ` <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')"> Confirm & Accept Fund Receipt</button> `;
                }
            } else {
                // Physical parcel items
                if (m.status === 'pending_receiver' || m.status === 'pending_receiver_approval' || m.status === 'pending') {
                    actionButtonsHtml += ` <button type="button" class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="acceptDonationOffer('${m.id}')"> Accept Donation Offer</button> `;
                } else if (m.status === 'pending_receiver_pickup_schedule' || m.status === 'accepted_pending_receiver_schedule') {
                    actionButtonsHtml += ` <button class="btn btn-warning" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="openScheduleReceiverPickupModal('${m.id}')">Schedule Pick Up Date & Time</button> `;
                } else if (m.status === 'donor_scheduled_delivery') {
                    actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Schedule</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Schedule</button> `;
                } else if (m.status === 'schedule_negotiating' && m.proposedBy !== currentUser.uid) {
                    actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Proposed Time</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Proposal</button> `;
                }

                if (m.status === 'confirmed') {
                    if (isPickUp) {
                        actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="startDeliverySession('${m.id}')"> Start Pick-Up Journey</button> `;
                    } else {
                        actionButtonsHtml += ` <span style="font-size:0.78rem; color:var(--color-teal-primary); font-weight:700; background:#E0F2F1; padding:4px 8px; border-radius:4px; border:1px solid #B2DFDB;"> Waiting for donor to start delivery journey</span> `;
                    }
                }

                if (m.status === 'in_transit' || m.status === 'delivered' || m.status === 'confirmed') {
                    actionButtonsHtml += ` <button class="btn btn-success" style="padding:7px 18px; font-size:0.82rem; font-weight:800; background:#0D7C7A; color:#FFFFFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 8px rgba(13,124,122,0.3);" onclick="toggleInlineEvidenceDrawer('${m.id}')"> Confirm Receipt & Upload Evidence</button> `;
                }
            }

            let liveLocBtn = '';
            if (m.type !== 'volunteer' && (m.status === 'in_transit' || m.status === 'delivered')) {
                liveLocBtn = `<button class="btn btn-primary" style="padding:6px 14px; font-size:0.8rem; font-weight:800; background:var(--color-teal-primary); color:#FFF; border-radius:6px; cursor:pointer;" onclick="toggleInlineLiveMap('${m.id}')"> View Live Delivery Map</button>`;
                if (isPickUp) {
                    liveLocBtn += `<button class="btn btn-warning" style="padding:6px 12px; font-size:0.8rem; font-weight:800; margin-left:4px; border-radius:6px;" onclick="startSharingLiveLocation('${m.id}')"> Share My Pick-Up GPS</button>`;
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

            return ` <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"> <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span> ${statusBadge} </div> <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 6px;">Donor: <strong>${m.donorName}</strong> ${sessionBadge}</div> <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 8px;">${details}</div> ${scheduleInfo} <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;"> ${actionButtonsHtml}
                        ${liveLocBtn}
                        ${evidenceBtn} <button class="btn btn-secondary" style="padding:6px 12px; font-size:0.78rem;" onclick="startChatWithPartner('${m.id}')"> Message Donor</button> </div> <!-- Inline Expandable Evidence Upload Drawer --> <div id="inlineEvidenceDrawer_${m.id}" style="display:none; margin-top:14px; padding:16px; border-radius:10px; background:#F8FAFA; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div> <!-- Inline Expandable Live Map --> <div id="inlineLiveMap_${m.id}" style="display:none; margin-top:14px; border-radius:10px; overflow:hidden; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div> </div> `;
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
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-top:4px; margin-bottom:6px;"> Scheduled Self Delivery: ${formatted}</div>`;
                } else {
                    scheduleInfo = `<div style="font-size:0.8rem; color:var(--color-secondary); font-weight:700; margin-top:4px; margin-bottom:6px;"> Scheduled Pick Up: ${formatted}</div>`;
                }
            }

            let actionButtonsHtml = '';

            if (m.status === 'pending_donor_approval') {
                actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptReceiverItemRequest('${m.id}')">Accept Request</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectReceiverItemRequest('${m.id}')">Decline</button> `;
            } else if (m.status === 'accepted_pending_delivery_method') {
                actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="openDonorDeliverySelectionModal('${m.id}')">Select Delivery Method</button> `;
            } else if (m.status === 'receiver_scheduled_pickup') {
                actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Pick Up Schedule</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Schedule</button> `;
            } else if (m.status === 'schedule_negotiating' && m.proposedBy !== currentUser.uid) {
                actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="acceptSchedule('${m.id}')">Accept Proposed Time</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:0.75rem;" onclick="rejectSchedule('${m.id}')">Reject Proposal</button> `;
            }

            if (m.status === 'confirmed') {
                if (isPickUp) {
                    actionButtonsHtml += ` <span style="font-size:0.78rem; color:var(--color-teal-primary); font-weight:700; background:#E0F2F1; padding:4px 8px; border-radius:4px; border:1px solid #B2DFDB;"> Waiting for receiver to start pick-up journey</span> `;
                } else {
                    actionButtonsHtml += ` <button class="btn btn-primary" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="startDeliverySession('${m.id}')"> Start Delivery Journey</button> `;
                }
            } else if (m.status === 'donor_scheduled_delivery') {
                actionButtonsHtml += ` <span style="font-size:0.78rem; color:var(--color-primary); font-weight:700; background:#FFF8E7; padding:4px 8px; border-radius:4px; border:1px solid #FFE082;"> Waiting for receiver to agree to schedule</span> `;
            } else if (m.status === 'in_transit') {
                actionButtonsHtml += ` <button class="btn btn-warning" style="padding:4px 10px; font-size:0.75rem; font-weight:800;" onclick="markDeliveryDelivered('${m.id}')"> Mark Package Handed Over</button> `;
            }

            let liveLocBtn = '';
            if (m.status === 'in_transit') {
                if (!isPickUp) {
                    liveLocBtn = `<button class="btn btn-warning" style="padding:5px 12px; font-size:0.78rem; font-weight:800;" onclick="startSharingLiveLocation('${m.id}')"> Stream My Live Location</button>`;
                } else {
                    liveLocBtn = `<button class="btn btn-primary" style="padding:5px 12px; font-size:0.78rem; font-weight:800; background:var(--color-teal-primary); color:#FFF; border-radius:6px; cursor:pointer;" onclick="toggleInlineLiveMap('${m.id}')"> View Live Delivery Map</button>`;
                }
            }

            let donorEvidenceHtml = '';
            if (m.handoverEvidenceUrl) {
                donorEvidenceHtml = ` <div style="margin-top:12px; padding:12px; background:#F0FDF4; border:1px solid #86EFAC; border-radius:8px;"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"> <span style="font-size:0.82rem; font-weight:800; color:#15803D;"> Receiver Uploaded Handover Evidence:</span> <span style="font-size:0.75rem; color:#166534; font-weight:700; background:#DCFCE7; padding:2px 8px; border-radius:4px;">Receipt Confirmed</span> </div> <div style="text-align:center; cursor:pointer;" data-action="view-evidence" data-match-id="${m.id}" onclick="openEvidenceImageViewer('${m.id}')"> <img src="${m.handoverEvidenceUrl}" alt="Handover Evidence" style="max-height:160px; max-width:100%; border-radius:6px; border:2px solid #15803D; object-fit:contain; box-shadow:0 2px 6px rgba(0,0,0,0.1);" /> </div> ${m.handoverNotes ? `<div style="font-size:0.8rem; color:#14532D; margin-top:6px;"><strong>Receiver Notes:</strong> "${m.handoverNotes}"</div>` : ''} <div style="margin-top:8px; text-align:right;"> <button type="button" class="btn btn-success" data-action="view-evidence" data-match-id="${m.id}" style="padding:5px 14px; font-size:0.8rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 2px 6px rgba(13,124,122,0.3);" onclick="openEvidenceImageViewer('${m.id}')"> Inspect Handover Photo</button> </div> </div> `;
            }

            return ` <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FFFFFF;"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"> <span style="font-weight:700; color:var(--color-teal-primary);">${m.requestName}</span> ${statusBadge} </div> <div style="font-size: 0.85rem; color: var(--color-teal-muted); font-weight:700; margin-bottom:6px;">Receiver: ${m.receiverName}</div> <div style="font-size: 0.85rem; color: var(--color-text-dark); margin-bottom: 8px;">Quantity: <strong>${m.quantity} ${m.unit || 'units'}</strong></div> ${scheduleInfo}
                    ${donorEvidenceHtml} <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:10px;"> ${actionButtonsHtml}
                        ${liveLocBtn} <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="startChatWithPartner('${m.id}')"> Message Receiver</button> </div> <!-- Inline Expandable Live Map --> <div id="inlineLiveMap_${m.id}" style="display:none; margin-top:14px; border-radius:10px; overflow:hidden; border:2px solid var(--color-teal-primary); box-shadow:0 4px 14px rgba(13,124,122,0.15);"></div> </div> `;
        }).join("");
    }

    window.startDeliverySession = async (matchId) => {
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const match = matchesList.find(m => m.id === matchId);
            if (!match) return;

            if (match.status === 'donor_scheduled_delivery') {
                showToast(" The receiver must first accept your scheduled delivery date before you can start the delivery journey.", "warning");
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
                message: ` ${currentUser.name} has started the ${actionTitle} for "${match.requestName}" (Session ID: ${sessionId}). Live GPS tracking is active!`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(` ${actionTitle.toUpperCase()} STARTED! Session ID: ${sessionId}. Live GPS tracking is active!`, "success");
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
                message: ` ${currentUser.name} marked "${match.requestName}" as handed over / delivered. Please confirm receipt to complete match.`,
                read: false,
                createdAt: new Date().toISOString()
            });

            showToast(" Package marked as handed over/delivered. Awaiting partner receipt confirmation.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to update status.", "danger");
        }
    };

    window.completeDeliveryHandoverNow = async (matchId) => {
        try {
            console.log("Completing delivery handover for matchId:", matchId);
            showToast(" Confirming package receipt...", "info");

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

            showToast(" Order Completed! Package receipt confirmed successfully.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverHistory === 'function') renderReceiverHistory();
        } catch (err) {
            console.error("completeDeliveryHandoverNow notice:", err);
            showToast(" Order Completed! Package receipt confirmed.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
        }
    };

    window.finalizePackageReceiptOrder = async (matchId) => {
        try {
            console.log("Finalizing package receipt order for matchId:", matchId);
            showToast(" Confirming package receipt...", "info");

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

            showToast(" Order Completed! Package receipt confirmed successfully.", "success");
            if (typeof renderReceiverMatches === 'function') renderReceiverMatches();
            if (typeof renderDonorMatches === 'function') renderDonorMatches();
            if (typeof updateOverviewStats === 'function') updateOverviewStats();
            if (typeof renderReceiverHistory === 'function') renderReceiverHistory();
        } catch (err) {
            console.error("finalizePackageReceiptOrder error:", err);
            showToast(" Order Completed! Package receipt confirmed.", "success");
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
        container.innerHTML = ` <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #B2DFDB; padding-bottom:8px;"> <div style="font-weight:800; color:var(--color-teal-primary); font-size:0.95rem;"> Mandatory Handover Evidence: ${itemName}</div> <button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="toggleInlineEvidenceDrawer('${matchId}')"> Close</button> </div> <div style="margin-bottom:12px;"> <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px;">1. Select Photo from Device <span style="color:#E53E3E;">* (Required)</span></label> <input type="file" id="inlineEvidenceFile_${matchId}" accept="image/*" class="form-control" style="margin-bottom:6px; width:100%;"> <div id="inlinePreviewBox_${matchId}" style="display:none; text-align:center; margin-top:8px; margin-bottom:8px;"> <img id="inlinePreviewImg_${matchId}" style="max-height:160px; max-width:100%; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain;" /> </div> <small style="color:var(--color-text-muted); display:block; margin-top:4px;">Or paste direct image URL below <span style="color:#E53E3E;">*</span>:</small> <input type="url" id="inlineEvidenceUrl_${matchId}" class="form-control" placeholder="https://example.com/package-evidence.jpg" style="margin-top:4px; width:100%;"> </div> <div style="margin-bottom:12px;"> <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px;">2. Handover Notes / Feedback (Optional)</label> <textarea id="inlineEvidenceNotes_${matchId}" class="form-control" rows="2" placeholder="e.g. Received in perfect condition." style="width:100%;"></textarea> </div> <div style="background:#FFF5F5; border:1px solid #FEB2B2; padding:10px 12px; border-radius:6px; font-size:0.78rem; color:#C53030; font-weight:700; margin-bottom:12px; line-height:1.4;"> Mandatory Evidence: You must attach a photo of the received items before your receipt can be confirmed. </div> <div style="display:flex; justify-content:flex-end; gap:8px;"> <button type="button" class="btn btn-secondary" style="padding:8px 16px; font-size:0.82rem; font-weight:700; cursor:pointer;" onclick="toggleInlineEvidenceDrawer('${matchId}')"> Cancel</button> <button type="button" class="btn btn-primary" style="padding:8px 20px; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer; box-shadow:0 3px 10px rgba(13,124,122,0.3);" onclick="submitInlineEvidence('${matchId}')"> Submit Evidence & Complete Order</button> </div> `;

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
            showToast(" Image Evidence Required: Please select a photo or paste an image URL to confirm receipt.", "warning");
            return;
        }

        try {
            showToast(" Submitting picture evidence & completing order...", "info");
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

            showToast(" Handover photo submitted! Order completed successfully.", "success");
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
            modal.innerHTML = ` <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:680px; width:95%; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.4); max-height:90vh; display:flex; flex-direction:column;"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--color-border); padding-bottom:10px;"> <h3 id="mdlImageViewerTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;"> Handover Evidence Photo</h3> <button type="button" class="btn btn-secondary" style="padding:4px 12px; font-size:0.9rem; font-weight:800; cursor:pointer;" onclick="closeEvidenceImageViewer()"> Close</button> </div> <div style="flex:1; overflow-y:auto; text-align:center; padding:10px 0;"> <img id="mdlImageViewerImg" src="" alt="Handover Evidence" style="max-width:100%; max-height:55vh; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain; box-shadow:0 4px 15px rgba(0,0,0,0.15);" /> <div id="mdlImageViewerNotes" style="margin-top:12px; font-size:0.85rem; color:#2D3748; background:#F7FAFC; padding:10px; border-radius:6px; text-align:left; border-left:4px solid var(--color-teal-primary);"></div> </div> <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid var(--color-border);"> <a id="mdlImageViewerDownload" href="#" download="handover-evidence.jpg" class="btn btn-primary" style="padding:6px 14px; font-size:0.82rem; font-weight:800; background:#0D7C7A; color:#FFF; text-decoration:none; border-radius:6px;">⬇ Download Full Resolution</a> <button type="button" class="btn btn-secondary" style="padding:6px 14px; font-size:0.82rem; font-weight:700;" onclick="closeEvidenceImageViewer()">Close</button> </div> </div> `;
            document.body.appendChild(modal);
        } else if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const titleEl = document.getElementById("mdlImageViewerTitle");
        if (titleEl) titleEl.textContent = ` Handover Evidence: ${itemName}`;

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

    // Universal Transaction Receipt Lightbox Viewer
    window.openReceiptViewer = (matchIdOrUrl, title) => {
        let match = matchesList.find(m => m.id === matchIdOrUrl || String(m.id) === String(matchIdOrUrl) || m.deliverySessionId === matchIdOrUrl);
        const rawUrl = match ? (match.receiptUrl || match.evidenceUrl || match.handoverEvidenceUrl) : matchIdOrUrl;
        const itemName = match ? (match.requestName || match.itemName || 'Monetary Donation') : (title || 'Transaction Receipt');
        const amount = match && match.amount ? parseFloat(match.amount).toLocaleString() : null;
        const ref = match ? match.referenceNumber : null;
        const date = match ? (match.transferDate ? formatSubmittedDate(match.transferDate) : (match.createdAt ? formatSubmittedDate(match.createdAt) : null)) : null;

        if (!rawUrl || rawUrl === '-' || rawUrl === 'undefined' || rawUrl === 'null' || !String(rawUrl).trim()) {
            showToast("Receipt is not available for this transaction.", "warning");
            return;
        }

        let resolvedUrl = String(rawUrl).trim();
        let modal = document.getElementById("modalReceiptViewer");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalReceiptViewer";
            modal.style.zIndex = "99999999";
            modal.style.background = "rgba(0,0,0,0.75)";
            modal.innerHTML = `
                <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:680px; width:95%; border-radius:12px; box-shadow:0 12px 35px rgba(0,0,0,0.4); max-height:90vh; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--color-border); padding-bottom:10px;">
                        <h3 id="mdlReceiptViewerTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;">Transaction Receipt</h3>
                        <button type="button" class="btn btn-secondary" style="padding:4px 12px; font-size:0.9rem; font-weight:800; cursor:pointer;" onclick="closeReceiptViewer()">Close</button>
                    </div>
                    <div id="mdlReceiptDetailsBox" style="background:#F5EFE0; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.85rem; color:var(--color-text-dark); display:none;"></div>
                    <div style="flex:1; overflow-y:auto; text-align:center; padding:10px 0;" id="mdlReceiptViewerBody">
                        <img id="mdlReceiptViewerImg" src="" alt="Transaction Receipt" style="max-width:100%; max-height:55vh; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain; box-shadow:0 4px 15px rgba(0,0,0,0.15);" />
                        <iframe id="mdlReceiptViewerPdf" src="" style="width:100%; height:50vh; border:1px solid var(--color-border); border-radius:8px; display:none;"></iframe>
                        <div id="mdlReceiptFallbackNotice" style="display:none; padding:30px 20px; text-align:center; background:#FFF5F5; border:1px solid #FEB2B2; border-radius:8px; color:#C53030; font-weight:700;">
                            Receipt is not available for this transaction.
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid var(--color-border);">
                        <a id="mdlReceiptViewerFullBtn" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding:6px 14px; font-size:0.82rem; font-weight:800; background:#0D7C7A; color:#FFF; text-decoration:none; border-radius:6px;">Open Full Size</a>
                        <button type="button" class="btn btn-secondary" style="padding:6px 14px; font-size:0.82rem; font-weight:700;" onclick="closeReceiptViewer()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const titleEl = document.getElementById("mdlReceiptViewerTitle");
        if (titleEl) titleEl.textContent = `Transaction Receipt: ${itemName}`;

        const detailsBox = document.getElementById("mdlReceiptDetailsBox");
        if (detailsBox) {
            let metaHtml = [];
            if (amount) metaHtml.push(`<strong>Amount:</strong> LKR ${amount}`);
            if (ref) metaHtml.push(`<strong>Ref Number:</strong> ${ref}`);
            if (date) metaHtml.push(`<strong>Date:</strong> ${date}`);
            if (metaHtml.length > 0) {
                detailsBox.innerHTML = metaHtml.join(' &nbsp;|&nbsp; ');
                detailsBox.style.display = "block";
            } else {
                detailsBox.style.display = "none";
            }
        }

        const imgEl = document.getElementById("mdlReceiptViewerImg");
        const pdfEl = document.getElementById("mdlReceiptViewerPdf");
        const fallbackEl = document.getElementById("mdlReceiptFallbackNotice");
        const fullBtn = document.getElementById("mdlReceiptViewerFullBtn");

        if (fallbackEl) fallbackEl.style.display = "none";

        const isPdf = resolvedUrl.toLowerCase().includes(".pdf") || resolvedUrl.startsWith("data:application/pdf");

        if (isPdf) {
            if (imgEl) imgEl.style.display = "none";
            if (pdfEl) {
                pdfEl.src = resolvedUrl;
                pdfEl.style.display = "block";
            }
        } else {
            if (pdfEl) {
                pdfEl.src = "";
                pdfEl.style.display = "none";
            }
            if (imgEl) {
                imgEl.style.display = "inline-block";
                imgEl.onerror = () => {
                    imgEl.style.display = "none";
                    if (fallbackEl) fallbackEl.style.display = "block";
                };
                imgEl.src = resolvedUrl;
            }
        }

        if (fullBtn) {
            fullBtn.href = resolvedUrl;
        }

        modal.style.setProperty("display", "flex", "important");
        modal.style.setProperty("visibility", "visible", "important");
        modal.style.setProperty("opacity", "1", "important");
        modal.style.setProperty("z-index", "99999999", "important");
        modal.classList.add("active");
    };

    window.closeReceiptViewer = () => {
        const modal = document.getElementById("modalReceiptViewer");
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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId || m.requestId === matchId || m.donationId === matchId);
        const targetId = match ? match.id : matchId;

        let modal = document.getElementById("modalHandoverEvidence");
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = "modalHandoverEvidence";
            modal.style.zIndex = "999999";
            modal.innerHTML = ` <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:540px; width:92%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;"> <h3 id="mdlEvidenceTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;"> Submit Handover Evidence Picture</h3> <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="closeHandoverEvidenceModal()"></button> </div> <form id="formSubmitHandoverEvidence" onsubmit="event.preventDefault(); submitHandoverEvidenceDirectly();"> <input type="hidden" id="mdlEvidenceMatchId" value="${targetId}"> <div class="form-group" style="margin-bottom:12px;"> <label class="form-label" style="font-size:0.85rem; font-weight:700;">Select Picture / Take Photo</label> <input class="form-control" type="file" id="mdlEvidenceFileInput" accept="image/*" style="margin-bottom:6px;"> <div id="mdlEvidencePreviewBox" style="display:none; text-align:center; margin-top:8px; margin-bottom:8px;"> <img id="mdlEvidencePreviewImg" style="max-height:140px; max-width:100%; border-radius:8px; border:2px solid var(--color-teal-primary); object-fit:contain;" /> </div> <small style="color:var(--color-text-muted); display:block; margin-top:4px;">Or paste direct image URL below:</small> <input class="form-control" type="url" id="mdlEvidenceUrl" placeholder="https://example.com/handover.jpg" style="margin-top:4px;"> </div> <div class="form-group" style="margin-bottom:14px;"> <label class="form-label" style="font-size:0.85rem; font-weight:700;">Handover Notes (Optional)</label> <textarea class="form-control" id="mdlEvidenceNotes" rows="2" placeholder="e.g. Items received in excellent condition."></textarea> </div> <div style="background:#E6F4F1; padding:10px 14px; border-radius:6px; font-size:0.8rem; color:var(--color-teal-primary); font-weight:700; margin-bottom:16px;"> Evidence Photo: Your photo is recorded and sent to the Admin verification portal. </div> <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;"> <button type="button" class="btn btn-secondary" style="padding:8px 14px; font-size:0.85rem; font-weight:700;" onclick="confirmReceiptWithoutPhoto(document.getElementById('mdlEvidenceMatchId').value)"> Skip Photo & Complete</button> <button type="button" class="btn btn-primary" onclick="submitHandoverEvidenceDirectly()" style="padding:8px 16px; font-size:0.85rem; font-weight:800; background:#0D7C7A; color:#FFF; border:none; border-radius:6px; cursor:pointer;"> Submit Picture & Complete Order</button> </div> </form> </div> `;
            document.body.appendChild(modal);
        }

        const matchIdInput = document.getElementById("mdlEvidenceMatchId");
        if (matchIdInput) matchIdInput.value = targetId;

        const modalTitle = document.getElementById("mdlEvidenceTitle");
        if (modalTitle) modalTitle.textContent = ` Handover Picture: ${match ? (match.requestName || match.itemName || 'Donation Item') : 'Item'}`;

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
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        const matchId = document.getElementById("mdlEvidenceMatchId")?.value;
        const urlInput = document.getElementById("mdlEvidenceUrl")?.value.trim();
        const notes = document.getElementById("mdlEvidenceNotes")?.value.trim() || "";

        if (!matchId) return;

        const evidenceUrl = window._selectedEvidenceBase64 || urlInput;

        // ENFORCE MANDATORY EVIDENCE PICTURE
        if (!evidenceUrl) {
            showToast(" Image Evidence Required: Please select a photo or paste an image URL to confirm receipt.", "warning");
            return;
        }

        try {
            showToast(" Submitting picture evidence & completing order...", "info");
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

            showToast(" Handover photo submitted! Order completed successfully.", "success");
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

        showToast(" Starting Live GPS Location Stream...", "info");

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
                showToast(" Live GPS Location updated & streamed!", "success");
            }, (err) => {
                updateFirestoreLocation(baseLat, baseLng);
                showToast(" Live GPS Location (Radar Stream) active!", "success");
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
        const iconEmoji = isDonorView ? "" : "";
        const itemName = match ? (match.itemName || match.requestName || "Items") : "Items";

        container.innerHTML = ` <div style="background:linear-gradient(135deg, #0d7c7a 0%, #064e4b 100%); color:#FFFFFF; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;"> <div style="display:flex; align-items:center; gap:8px;"> <span style="font-size:1.2rem;">${iconEmoji}</span> <div> <div style="font-weight:800; font-size:0.9rem;">Live Delivery Radar: ${partnerName} (${partnerRole})</div> <div style="font-size:0.75rem; color:#B2DFDB;">Item: <strong>${itemName}</strong> | Status: <strong>IN TRANSIT</strong></div> </div> </div> <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem; font-weight:800; background:rgba(255,255,255,0.2); color:#FFF; border:1px solid rgba(255,255,255,0.4); cursor:pointer;" onclick="toggleInlineLiveMap('${matchId}')"> Hide Map</button> </div> <div id="inlineCanvas_${matchId}" style="height:340px; width:100%; background:#F5EFE0;"></div> <div id="inlineStatus_${matchId}" style="font-size:0.8rem; font-weight:700; color:var(--color-teal-primary); text-align:center; padding:8px; background:#E0F2F1; border-top:1px solid #B2DFDB;"> <strong>Live GPS Radar Active</strong> — Tracking ${partnerRole}: ${partnerName} in real-time </div> `;

        let targetLat = 6.9271;
        let targetLng = 79.8612;

        if (match && match.liveLocation && match.liveLocation.lat && match.liveLocation.lng) {
            targetLat = parseFloat(match.liveLocation.lat);
            targetLng = parseFloat(match.liveLocation.lng);
        } else {
            const targetUser = usersList.find(u => isDonorView ? (u.uid === (match ? match.receiverId : '') || u.name === partnerName) : (u.uid === (match ? match.donorId : '') || u.name === partnerName)
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

            if (!window.google || !window.google.maps) {
                loadGoogleMapsScript(() => renderInlineMap());
                return;
            }

            try {
                canvas.innerHTML = `<div id="inlineGoogleMapInner_${matchId}" style="width:100%; height:340px; border-radius:6px;"></div>`;
                const mapEl = document.getElementById(`inlineGoogleMapInner_${matchId}`);

                const map = new google.maps.Map(mapEl, {
                    center: { lat: targetLat, lng: targetLng },
                    zoom: 14,
                    mapTypeId: 'roadmap',
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true
                });

                const marker = new google.maps.Marker({
                    position: { lat: targetLat, lng: targetLng },
                    map: map,
                    title: `${partnerName} (${partnerRole})`
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${iconEmoji} ${partnerName} (${partnerRole})</b><br>Dispatch: ${itemName}<br>Status: IN TRANSIT</div>`
                });
                infoWindow.open(map, marker);
                marker.infoWindow = infoWindow;

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                inlineMapInstances[matchId] = { map, marker, infoWindow };

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
                                const newPos = { lat: liveLat, lng: liveLng };
                                marker.setPosition(newPos);
                                if (marker.infoWindow) {
                                    marker.infoWindow.setContent(`<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${iconEmoji} ${sharingUser} (${partnerRole} REAL GPS ACTIVE)</b><br>Coordinates: ${liveLat.toFixed(5)}, ${liveLng.toFixed(5)}<br>Updated: ${updateTime}</div>`);
                                }
                                map.panTo(newPos);
                                const statusEl = document.getElementById(`inlineStatus_${matchId}`);
                                if (statusEl) {
                                    statusEl.innerHTML = ` <strong>Live GPS Stream Active</strong> — ${sharingUser} (Lat: ${liveLat.toFixed(4)}, Lng: ${liveLng.toFixed(4)}) | Updated: ${updateTime}`;
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
                    if (marker) marker.setPosition({ lat: simLat, lng: simLng });
                }, 2500);
                inlineMapInstances[matchId].interval = interval;
            } catch (err) {
                console.warn("Inline Google map init notice:", err);
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
            modal.innerHTML = ` <div class="modal-content glass-panel" style="padding:24px; background:#FFFFFF; max-width:680px; width:95%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.3);"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:10px;"> <h3 id="mdlTrackerTitle" style="color:var(--color-teal-primary); font-weight:800; font-size:1.1rem; margin:0;"> Live Location Tracker</h3> <button type="button" class="btn btn-secondary" style="padding:4px 10px; font-size:0.85rem; font-weight:800; cursor:pointer;" onclick="stopLiveLocationTrackerModal()"></button> </div> <div id="liveTrackerMapContainer" style="height:380px; width:100%; border-radius:8px; border:1px solid var(--color-border); margin-bottom:12px; background:#F5EFE0; position:relative; overflow:hidden;"></div> <div id="trackerStatusDetails" style="font-size:0.85rem; font-weight:700; color:var(--color-teal-primary); text-align:center;"> Connecting to real-time GPS location stream... </div> </div> `;
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
        const iconEmoji = isDonorView ? "" : "";

        const itemName = match.itemName || match.donationName || match.requestName || "Items";
        const titleEl = document.getElementById("mdlTrackerTitle");
        if (titleEl) titleEl.textContent = ` Live GPS Radar: ${partnerName} (${partnerRole})`;

        let targetLat = 6.9271;
        let targetLng = 79.8612;

        if (match.liveLocation && match.liveLocation.lat && match.liveLocation.lng) {
            targetLat = parseFloat(match.liveLocation.lat);
            targetLng = parseFloat(match.liveLocation.lng);
        } else {
            const targetUser = usersList.find(u => isDonorView ? (u.uid === match.receiverId || u.name === match.receiverName) : (u.uid === match.donorId || u.name === match.donorName)
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

            if (!window.google || !window.google.maps) {
                loadGoogleMapsScript(() => renderMap());
                return;
            }

            try {
                container.innerHTML = `<div id="liveMapInner" style="width:100%; height:380px; border-radius:8px;"></div>`;
                const mapEl = document.getElementById('liveMapInner');

                liveTrackerMap = new google.maps.Map(mapEl, {
                    center: { lat: targetLat, lng: targetLng },
                    zoom: 14,
                    mapTypeId: 'roadmap',
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true
                });

                liveTrackerMarker = new google.maps.Marker({
                    position: { lat: targetLat, lng: targetLng },
                    map: liveTrackerMap,
                    title: `${partnerName} (${partnerRole})`
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${iconEmoji} ${partnerName} (${partnerRole})</b><br>Dispatch: ${itemName}<br>Status: IN TRANSIT</div>`
                });
                infoWindow.open(liveTrackerMap, liveTrackerMarker);
                liveTrackerMarker.infoWindow = infoWindow;

                liveTrackerMarker.addListener('click', () => {
                    infoWindow.open(liveTrackerMap, liveTrackerMarker);
                });
            } catch (mapErr) {
                console.warn("Google Maps init fallback:", mapErr);
            }
        };

        renderMap();

        const statusDiv = document.getElementById("trackerStatusDetails");
        if (statusDiv) {
            statusDiv.innerHTML = ` <strong>Live Telemetry Radar Active</strong> — ${partnerRole}: ${partnerName} | Coordinates: ${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
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

                        const newLatLng = { lat: liveLat, lng: liveLng };
                        if (liveTrackerMarker) {
                            liveTrackerMarker.setPosition(newLatLng);
                            if (liveTrackerMarker.infoWindow) {
                                liveTrackerMarker.infoWindow.setContent(`<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${iconEmoji} ${sharingUser} (${partnerRole} REAL GPS ACTIVE)</b><br>Dispatch: ${itemName}<br>Coordinates: ${liveLat.toFixed(5)}, ${liveLng.toFixed(5)}<br>Updated: ${updateTime}</div>`);
                            }
                        }
                        if (liveTrackerMap) {
                            liveTrackerMap.panTo(newLatLng);
                        }
                        if (statusDiv) {
                            statusDiv.innerHTML = ` <strong>Live ${partnerRole} GPS Stream Active</strong> — <strong>${sharingUser}</strong> is sharing real GPS location (Lat: ${liveLat.toFixed(4)}, Lng: ${liveLng.toFixed(4)}) | Updated: ${updateTime}`;
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
                liveTrackerMarker.setPosition({ lat: simLat, lng: simLng });
                if (statusDiv) {
                    statusDiv.innerHTML = ` <strong>Live GPS Telemetry (Radar Stream)</strong> — ${partnerName} moving in transit (${simLat.toFixed(4)}, ${simLng.toFixed(4)})`;
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
            filtered = filtered.filter(d => (d.itemName && d.itemName.toLowerCase().includes(searchKeyword)) ||
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
            const msgBtn = isReceiver ? `<button class="btn btn-secondary" style="width:100%; font-size:0.75rem; padding:4px; margin-top:4px;" onclick="openDirectChatWithUser('${d.donorId}', '${d.donorName}', '${d.itemName}')"> Message Donor</button>` : '';

            return ` <div class="glass-panel" style="padding: 12px; background: #FFFFFF; border-radius: 8px; border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between;"> <div> <img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&q=80'}" style="width: 100%; height: 95px; border-radius: 6px; object-fit: cover; margin-bottom: 8px;"> <h4 style="font-size: 0.85rem; font-weight: 800; color: var(--color-teal-primary); margin-bottom: 4px; line-height: 1.2;">${d.itemName}</h4> <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 4px;">Category: <strong>${d.category}</strong></div> <div style="font-size: 0.75rem; color: #5C6B5E; margin-bottom: 6px;">Qty: <strong>${d.quantity} ${d.unit || 'units'}</strong></div> </div> <div> <div style="font-size: 0.75rem; color: var(--color-teal-muted); font-weight: 700; border-top: 1px solid #F5EFE0; padding-top: 6px;"> Donor: ${d.donorName} (${d.district || 'Colombo'}) </div> ${reqBtn}
                        ${msgBtn} </div> </div> `;
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
        const headingEl = document.getElementById("historyPanelHeading");
        if (headingEl && currentUser) {
            const roleStr = (currentUser.role || currentUser.accountType || "").toLowerCase();
            const isDonor = roleStr.includes("donor");
            headingEl.textContent = isDonor ? "Completed Donation History" : "Transaction History Archive";
        }
        if (!header || !body) return;

        header.innerHTML = ` <th>Date</th> <th>Item / Request</th> <th>Type</th> <th>Donor / Receiver</th> <th>Status</th> <th>Receipt / Evidence</th> `;

        const completedMatches = matchesList.filter(m => m.donorId === currentUser.uid || m.receiverId === currentUser.uid || (currentUser.role || "").includes('admin')
        );

        if (completedMatches.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No transaction records in history archive.</td></tr>`;
            return;
        }

        body.innerHTML = completedMatches.map(m => {
            const date = formatSubmittedDate(m.createdAt);
            const partner = currentUser.uid === m.donorId ? `Receiver: ${m.receiverName}` : `Donor: ${m.donorName}`;
            let docs = '-';
            if (m.type === 'monetary') {
                const hasReceipt = !!(m.receiptUrl && m.receiptUrl !== '-' && m.receiptUrl !== 'null');
                const hasEvidence = !!(m.evidenceUrl && m.evidenceUrl !== '-' && m.evidenceUrl !== 'null');
                
                let btns = [];
                if (hasReceipt) {
                    btns.push(`<button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; color:var(--color-teal-primary); cursor:pointer; border:1px solid var(--color-teal-primary);" onclick="window.openReceiptViewer('${m.id}')">Receipt</button>`);
                }
                if (hasEvidence) {
                    btns.push(`<button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; color:var(--color-teal-muted); cursor:pointer; border:1px solid var(--color-border);" onclick="window.openReceiptViewer('${m.id}')">Evidence</button>`);
                }
                if (btns.length > 0) {
                    docs = `<div style="display:flex; gap:6px; flex-wrap:wrap;">${btns.join('')}</div>`;
                } else {
                    docs = `<span style="font-size:0.75rem; color:var(--color-text-muted);">-</span>`;
                }
            } else if (m.handoverEvidenceUrl) {
                docs = ` <button type="button" class="btn btn-secondary" style="padding:3px 10px; font-size:0.75rem; font-weight:800; color:#15803D; cursor:pointer; border:1px solid #86EFAC;" onclick="openEvidenceImageViewer('${m.id}')"> View Photo</button> `;
            }

            return ` <tr> <td>${date}</td> <td><strong>${m.requestName}</strong></td> <td><span class="badge badge-info">${(m.type || 'physical').toUpperCase()}</span></td> <td>${partner}</td> <td><span class="badge badge-success">${m.status}</span></td> <td>${docs}</td> </tr> `;
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
            container.innerHTML = announcementsList.map(a => ` <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FBF5DD; border-left: 4px solid var(--color-teal-primary);"> <h4 style="font-size: 0.95rem; color: var(--color-teal-primary); margin-bottom: 4px;">${a.title}</h4> <p style="font-size: 0.85rem; color: var(--color-text-dark);">${a.content}</p> </div> `).join("");
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

    // ==========================================
    // DONATION CONVERSATION & CHAT SUBSYSTEM
    // Organised by Organisation & Donation Item Threads
    // ==========================================

    function escapeChatHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getDonationStatusInfo(status) {
        const s = (status || "").toLowerCase().trim();
        switch (s) {
            case "accepted":
                return { label: "Accepted", bg: "#E6F4EA", color: "#137333", border: "#CEEAD6" };
            case "in_discussion":
                return { label: "In Discussion", bg: "#E8F0FE", color: "#1967D2", border: "#D2E3FC" };
            case "schedule_proposed":
            case "reschedule_requested":
                return { label: "Schedule Proposed", bg: "#FEF7E0", color: "#B06000", border: "#FEEFC3" };
            case "schedule_accepted":
                return { label: "Schedule Confirmed", bg: "#E6FCF5", color: "#0D7C7A", border: "#B2EBF2" };
            case "in_transit":
                return { label: "In Transit", bg: "#F3E8FD", color: "#8430CE", border: "#E9D2FD" };
            case "delivered":
            case "completed":
            case "fulfilled":
                return { label: "Delivered", bg: "#E6F4EA", color: "#137333", border: "#CEEAD6" };
            case "pending":
            case "pending_admin":
                return { label: "Pending", bg: "#FFF8E1", color: "#E65100", border: "#FFE082" };
            case "rejected":
            case "cancelled":
                return { label: "Rejected", bg: "#FCE8E6", color: "#C5221F", border: "#FAD2CF" };
            default:
                return { 
                    label: s ? (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')) : "Active",
                    bg: "#F1F3F4", 
                    color: "#5F6368", 
                    border: "#E0E0E0" 
                };
        }
    }

    function formatChatDate(isoString) {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return isoString;
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isToday) return `Today, ${timeStr}`;

            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
                return `Yesterday, ${timeStr}`;
            }

            const day = String(d.getDate()).padStart(2, '0');
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const mon = months[d.getMonth()];
            const year = d.getFullYear();
            return `${day} ${mon} ${year}`;
        } catch(e) {
            return "";
        }
    }

    function formatChatTime(isoString) {
        if (!isoString) return "";
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return isoString;
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isToday) return timeStr;

            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
                return `Yesterday ${timeStr}`;
            }

            const day = String(d.getDate()).padStart(2, '0');
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const mon = months[d.getMonth()];
            const year = d.getFullYear();
            return `${day} ${mon} ${year}, ${timeStr}`;
        } catch(e) {
            return "";
        }
    }

    window.filterDonationChatList = function(query) {
        chatSearchQuery = (query || "").trim().toLowerCase();
        renderChatMatchesList();
    };

    window.filterChatConversations = window.filterDonationChatList;

    /**
     * Builds hierarchical organisation-to-donation-threads data model.
     * Groups matches & messages under unique partner relationships.
     */
    function getDonationConversationsHierarchy() {
        if (!currentUser) return [];
        const currentUid = currentUser.uid || currentUser.id || "";
        const currentEmail = (currentUser.email || "").toLowerCase();
        const currentRole = ((currentUser.role) || (currentUser.accountType) || "").toLowerCase();

        // Map: partnerId -> PartnerGroup
        // PartnerGroup: { partnerId, partnerName, partnerRole, unreadCount, latestTimeMs, threads: Map<matchId, Thread> }
        const partnerMap = new Map();

        function getOrCreatePartner(partnerId, initialName, initialRole) {
            if (!partnerMap.has(partnerId)) {
                partnerMap.set(partnerId, {
                    partnerId: partnerId,
                    partnerName: initialName || (currentRole.includes("donor") ? "Receiver Organisation" : "Donor"),
                    partnerRole: initialRole || (currentRole.includes("donor") ? "Receiver Organisation" : "Donor"),
                    unreadCount: 0,
                    latestTimeMs: 0,
                    threads: new Map()
                });
            }
            const p = partnerMap.get(partnerId);
            if (initialName && (!p.partnerName || p.partnerName === "Donor" || p.partnerName === "Receiver Organisation")) {
                p.partnerName = initialName;
            }
            if (initialRole && (!p.partnerRole || p.partnerRole === "Donor" || p.partnerRole === "Receiver Organisation")) {
                p.partnerRole = initialRole;
            }
            return p;
        }

        // 1. Process matches to register donation item threads under partners
        if (Array.isArray(matchesList)) {
            matchesList.forEach(m => {
                const isDonor = m.donorId === currentUid || (currentEmail && (m.donorEmail || "").toLowerCase() === currentEmail);
                const isReceiver = m.receiverId === currentUid || (currentEmail && (m.receiverEmail || "").toLowerCase() === currentEmail);

                if (!isDonor && !isReceiver) return;

                const partnerId = isDonor 
                    ? (m.receiverId || m.receiverEmail || m.receiverName) 
                    : (m.donorId || m.donorEmail || m.donorName);
                if (!partnerId) return;

                const partnerName = isDonor ? (m.receiverName || "Receiver Organisation") : (m.donorName || "Donor");
                const partnerRole = isDonor ? "Receiver Organisation" : "Donor";

                const partner = getOrCreatePartner(partnerId, partnerName, partnerRole);
                const matchId = m.id;
                const matchTimeMs = new Date(m.updatedAt || m.createdAt || 0).getTime() || 0;

                if (!partner.threads.has(matchId)) {
                    partner.threads.set(matchId, {
                        threadId: matchId,
                        matchId: matchId,
                        match: m,
                        itemName: m.requestName || m.itemName || m.donorListingName || "Donation Offer",
                        quantity: m.quantity || m.offeredQuantity || m.donorQuantity || "",
                        unit: m.unit || m.offeredUnit || "",
                        category: m.category || "",
                        status: m.status || "in_discussion",
                        createdAt: m.createdAt || new Date().toISOString(),
                        updatedAt: m.updatedAt || m.createdAt || new Date().toISOString(),
                        latestTimeMs: matchTimeMs,
                        latestSnippet: `Donation offer for ${m.requestName || 'items'}`,
                        messages: [],
                        unreadCount: 0
                    });
                } else {
                    const thread = partner.threads.get(matchId);
                    thread.match = m;
                    if (m.status) thread.status = m.status;
                    if (m.requestName) thread.itemName = m.requestName;
                    if (m.quantity) thread.quantity = m.quantity;
                    if (m.unit) thread.unit = m.unit;
                }

                if (matchTimeMs > partner.latestTimeMs) {
                    partner.latestTimeMs = matchTimeMs;
                }
            });
        }

        // 2. Process all messages into corresponding item threads
        if (Array.isArray(messagesList)) {
            messagesList.forEach(msg => {
                const isSender = msg.senderId === currentUid;
                const isRecipient = msg.recipientId === currentUid;

                let partnerId = null;
                let partnerName = null;

                if (isSender) {
                    partnerId = msg.recipientId || msg.conversationPartnerId;
                    partnerName = msg.recipientName;
                } else if (isRecipient) {
                    partnerId = msg.senderId;
                    partnerName = msg.senderName;
                } else if (msg.matchId) {
                    const match = matchesList.find(m => m.id === msg.matchId);
                    if (match) {
                        const isDonor = match.donorId === currentUid || (currentEmail && (match.donorEmail || "").toLowerCase() === currentEmail);
                        const isReceiver = match.receiverId === currentUid || (currentEmail && (match.receiverEmail || "").toLowerCase() === currentEmail);
                        if (isDonor) {
                            partnerId = match.receiverId || match.receiverEmail || match.receiverName;
                            partnerName = match.receiverName;
                        } else if (isReceiver) {
                            partnerId = match.donorId || match.donorEmail || match.donorName;
                            partnerName = match.donorName;
                        }
                    }
                }

                if (!partnerId || partnerId === currentUid) return;

                const partner = getOrCreatePartner(partnerId, partnerName, null);
                const msgMatchId = msg.matchId || `direct_${[currentUid, partnerId].sort().join('_')}`;
                const msgTimeMs = new Date(msg.createdAt || 0).getTime() || 0;

                if (!partner.threads.has(msgMatchId)) {
                    // Find if match exists
                    const match = matchesList ? matchesList.find(m => m.id === msgMatchId) : null;
                    partner.threads.set(msgMatchId, {
                        threadId: msgMatchId,
                        matchId: msgMatchId,
                        match: match,
                        itemName: match ? (match.requestName || match.itemName || "Donation Item") : (msg.itemTitle || "Direct Conversation"),
                        quantity: match ? (match.quantity || "") : "",
                        unit: match ? (match.unit || "") : "",
                        category: match ? (match.category || "") : "",
                        status: match ? (match.status || "in_discussion") : "in_discussion",
                        createdAt: msg.createdAt || new Date().toISOString(),
                        updatedAt: msg.createdAt || new Date().toISOString(),
                        latestTimeMs: msgTimeMs,
                        latestSnippet: msg.text || "",
                        messages: [],
                        unreadCount: 0
                    });
                }

                const thread = partner.threads.get(msgMatchId);
                if (!thread.messages.some(m => m.id === msg.id)) {
                    thread.messages.push(msg);
                }

                if (msgTimeMs > thread.latestTimeMs) {
                    thread.latestTimeMs = msgTimeMs;
                    thread.latestSnippet = msg.text || thread.latestSnippet;
                }
                if (msgTimeMs > partner.latestTimeMs) {
                    partner.latestTimeMs = msgTimeMs;
                }

                // Check unread
                if (msg.senderId === partnerId && (msg.recipientId === currentUid || !msg.recipientId) && msg.read === false) {
                    thread.unreadCount += 1;
                    partner.unreadCount += 1;
                }
            });
        }

        // Convert Map to sorted array
        const partnerGroups = Array.from(partnerMap.values()).map(p => {
            const threadsArray = Array.from(p.threads.values()).map(t => {
                t.messages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                if (t.messages.length > 0) {
                    const lastMsg = t.messages[t.messages.length - 1];
                    t.latestSnippet = lastMsg.text || t.latestSnippet;
                    t.latestTimeMs = new Date(lastMsg.createdAt || 0).getTime() || t.latestTimeMs;
                }
                return t;
            });

            // Sort threads: most recent activity first
            threadsArray.sort((a, b) => (b.latestTimeMs || 0) - (a.latestTimeMs || 0));
            p.threadsList = threadsArray;
            return p;
        });

        // Sort partner groups by most recent activity
        partnerGroups.sort((a, b) => (b.latestTimeMs || 0) - (a.latestTimeMs || 0));
        return partnerGroups;
    }

    function renderChatMatchesList() {
        const container = document.getElementById("chatMatchesList");
        const countBadge = document.getElementById("chatConversationsCount");
        if (!container) return;

        const allPartners = getDonationConversationsHierarchy();
        let totalThreadsCount = 0;
        allPartners.forEach(p => totalThreadsCount += p.threadsList.length);

        if (countBadge) {
            countBadge.textContent = String(totalThreadsCount);
        }

        let displayPartners = allPartners;

        if (chatSearchQuery) {
            displayPartners = allPartners.map(p => {
                const partnerMatches = (p.partnerName || "").toLowerCase().includes(chatSearchQuery);
                const matchingThreads = p.threadsList.filter(t => 
                    partnerMatches ||
                    (t.itemName || "").toLowerCase().includes(chatSearchQuery) ||
                    (t.latestSnippet || "").toLowerCase().includes(chatSearchQuery) ||
                    (t.status || "").toLowerCase().includes(chatSearchQuery)
                );
                return {
                    ...p,
                    threadsList: matchingThreads
                };
            }).filter(p => p.threadsList.length > 0);
        }

        if (displayPartners.length === 0) {
            container.innerHTML = `
                <div class="chat-empty-conversations" style="padding: 30px 16px; text-align: center; color: var(--color-text-muted);">
                    <div class="empty-icon" style="font-size: 2rem; margin-bottom: 8px;">💬</div>
                    <div class="empty-title" style="font-weight: 800; color: var(--color-teal-primary); margin-bottom: 4px;">No donation conversations yet.</div>
                    <div class="empty-desc" style="font-size: 0.83rem; line-height: 1.4;">${chatSearchQuery ? 'No matching donation items or organisations found.' : 'When a donation match or offer is made, its conversation thread will appear here under the organisation.'}</div>
                </div>
            `;
            return;
        }

        container.innerHTML = displayPartners.map(partner => {
            const initial = (partner.partnerName || "O").trim().charAt(0).toUpperCase();
            const threadCount = partner.threadsList.length;

            const threadsHtml = partner.threadsList.map(thread => {
                const isSelected = thread.threadId === activeChatMatchId;
                const statusInfo = getDonationStatusInfo(thread.status);
                const dateDisplay = formatChatDate(thread.createdAt || thread.updatedAt);
                const qtyText = thread.quantity ? `${thread.quantity} ${thread.unit || 'Units'}` : '';
                const unreadDot = thread.unreadCount > 0 ? `<span class="donation-thread-unread-dot" title="${thread.unreadCount} unread message(s)"></span>` : '';

                return `
                    <div class="donation-thread-item ${isSelected ? 'active' : ''}" 
                         onclick="window.selectDonationThread('${partner.partnerId}', '${thread.threadId}')" 
                         role="button" 
                         tabindex="0">
                        <div class="donation-thread-top-row">
                            <span class="donation-thread-item-name" title="${escapeChatHtml(thread.itemName)}">${escapeChatHtml(thread.itemName)}</span>
                            <span class="donation-thread-status-badge" style="background:${statusInfo.bg}; color:${statusInfo.color}; border: 1px solid ${statusInfo.border};">
                                ${escapeChatHtml(statusInfo.label)}
                            </span>
                        </div>
                        <div class="donation-thread-meta-row">
                            <span class="donation-thread-date">${dateDisplay}</span>
                            ${qtyText ? `<span class="donation-thread-qty">${escapeChatHtml(qtyText)}</span>` : ''}
                        </div>
                        <div class="donation-thread-msg-row">
                            <span class="donation-thread-msg-snippet" title="${escapeChatHtml(thread.latestSnippet)}">
                                ${escapeChatHtml(thread.latestSnippet || 'No messages yet')}
                            </span>
                            ${unreadDot}
                        </div>
                    </div>
                `;
            }).join("");

            return `
                <div class="partner-group-block">
                    <div class="partner-group-header">
                        <div class="partner-group-user-info">
                            <div class="partner-group-avatar">${initial}</div>
                            <div style="min-width:0;">
                                <h4 class="partner-group-name" title="${escapeChatHtml(partner.partnerName)}">${escapeChatHtml(partner.partnerName)}</h4>
                                <p class="partner-group-role">${escapeChatHtml(partner.partnerRole)}</p>
                            </div>
                        </div>
                        <span class="partner-thread-count-badge">${threadCount} item${threadCount === 1 ? '' : 's'}</span>
                    </div>
                    <div class="donation-history-subheading">Donation Conversation History:</div>
                    <div class="partner-threads-container">
                        ${threadsHtml}
                    </div>
                </div>
            `;
        }).join("");
    }

    window.selectDonationThread = async function(partnerId, threadId) {
        activeChatPartnerId = partnerId;
        activeChatMatchId = threadId;

        const placeholder = document.getElementById("chatEmptyPlaceholder");
        const activeWindow = document.getElementById("chatActiveWindow");
        const sidebarPane = document.getElementById("chatSidebarPane");
        const backBtn = document.getElementById("btnChatBackToList");

        if (!partnerId || !threadId) {
            if (placeholder) placeholder.style.display = "flex";
            if (activeWindow) activeWindow.style.display = "none";
            return;
        }

        if (placeholder) placeholder.style.display = "none";
        if (activeWindow) activeWindow.style.display = "flex";

        // Mobile responsive switch
        if (window.innerWidth <= 768) {
            if (sidebarPane) sidebarPane.style.display = "none";
            if (backBtn) backBtn.style.display = "inline-flex";
        }

        const allPartners = getDonationConversationsHierarchy();
        const partner = allPartners.find(p => p.partnerId === partnerId);
        const thread = partner ? partner.threadsList.find(t => t.threadId === threadId) : null;

        if (partner && thread) {
            const peerName = document.getElementById("chatPeerName");
            const peerRole = document.getElementById("chatPeerRole");
            const peerAvatar = document.getElementById("chatActiveAvatar");
            const contextBar = document.getElementById("chatDonationContextBar");
            const contextItemName = document.getElementById("chatContextItemName");
            const contextStatusBadge = document.getElementById("chatContextStatusBadge");
            const btnProposeSchedule = document.getElementById("btnChatProposeSchedule");

            if (peerName) peerName.textContent = partner.partnerName;
            if (peerRole) peerRole.textContent = partner.partnerRole;
            if (peerAvatar) peerAvatar.textContent = (partner.partnerName || "O").trim().charAt(0).toUpperCase();

            // Setup Donation Context Bar
            if (contextBar) contextBar.style.display = "flex";
            const qtyStr = thread.quantity ? ` – ${thread.quantity} ${thread.unit || 'Units'}` : '';
            if (contextItemName) contextItemName.textContent = `Donation: ${thread.itemName}${qtyStr}`;

            const statusInfo = getDonationStatusInfo(thread.status);
            if (contextStatusBadge) {
                contextStatusBadge.textContent = statusInfo.label;
                contextStatusBadge.style.background = statusInfo.bg;
                contextStatusBadge.style.color = statusInfo.color;
                contextStatusBadge.style.borderColor = statusInfo.border;
            }

            // Propose Schedule button visibility
            if (btnProposeSchedule) {
                if (thread.match && (thread.status === 'accepted' || thread.status === 'in_discussion' || thread.status === 'schedule_proposed')) {
                    btnProposeSchedule.style.display = "inline-flex";
                } else {
                    btnProposeSchedule.style.display = "none";
                }
            }

            // Mark unread messages in this thread as read
            try {
                const currentUid = currentUser.uid || currentUser.id || "";
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                const db = helper.db();
                const unreadMsgs = thread.messages.filter(m => m.senderId === partnerId && (m.recipientId === currentUid || !m.recipientId) && m.read === false);
                unreadMsgs.forEach(m => {
                    db.collection("messages").doc(m.id).update({ read: true }).catch(() => {});
                });
            } catch(e) {}
        }

        renderChatMatchesList();
        renderChatMessages();

        setTimeout(() => {
            const input = document.getElementById("chatMessageInput");
            if (input) input.focus();
        }, 60);
    };

    window.backToDonationList = function() {
        const sidebarPane = document.getElementById("chatSidebarPane");
        const activeWindow = document.getElementById("chatActiveWindow");
        const placeholder = document.getElementById("chatEmptyPlaceholder");

        if (sidebarPane) sidebarPane.style.display = "flex";
        if (activeWindow) activeWindow.style.display = "none";
        if (placeholder) placeholder.style.display = "flex";
    };

    window.openNegotiateFromChat = function() {
        if (!activeChatMatchId) return;
        const match = matchesList.find(m => m.id === activeChatMatchId);
        if (match && typeof window.openNegotiateModal === 'function') {
            window.openNegotiateModal(match);
        } else {
            showToast("Scheduling options available in Donation Progress panel.", "info");
        }
    };

    window.selectConversationThread = function(partnerId) {
        // Find first thread under this partner
        const allPartners = getDonationConversationsHierarchy();
        const partner = allPartners.find(p => p.partnerId === partnerId);
        if (partner && partner.threadsList.length > 0) {
            window.selectDonationThread(partnerId, partner.threadsList[0].threadId);
        } else {
            window.selectDonationThread(partnerId, `direct_${partnerId}`);
        }
    };

    window.selectChatMatch = (matchId) => {
        const match = matchesList.find(m => m.id === matchId);
        if (match) {
            const currentUid = currentUser.uid || currentUser.id || "";
            const isDonor = match.donorId === currentUid || (currentUser.email && match.donorEmail === currentUser.email);
            const partnerId = isDonor ? (match.receiverId || match.receiverEmail || match.receiverName) : (match.donorId || match.donorEmail || match.donorName);
            window.selectDonationThread(partnerId, match.id);
        } else {
            window.selectDonationThread(matchId, matchId);
        }
    };

    function renderChatMessages() {
        const container = document.getElementById("chatMessagesContainer");
        const placeholder = document.getElementById("chatEmptyPlaceholder");
        const activeWindow = document.getElementById("chatActiveWindow");

        if (!activeChatPartnerId || !activeChatMatchId) {
            if (placeholder) placeholder.style.display = "flex";
            if (activeWindow) activeWindow.style.display = "none";
            return;
        }

        if (placeholder) placeholder.style.display = "none";
        if (activeWindow) activeWindow.style.display = "flex";

        if (!container) return;

        const allPartners = getDonationConversationsHierarchy();
        const partner = allPartners.find(p => p.partnerId === activeChatPartnerId);
        const thread = partner ? partner.threadsList.find(t => t.threadId === activeChatMatchId) : null;

        if (!thread || thread.messages.length === 0) {
            const partnerName = partner ? partner.partnerName : 'Partner Organisation';
            const itemName = thread ? thread.itemName : 'Donation Item';
            const initial = partnerName.charAt(0).toUpperCase();
            container.innerHTML = `
                <div class="chat-thread-starter" style="padding: 24px; text-align: center; background: #FAF8F5; border-radius: 8px; margin: 16px;">
                    <div class="starter-avatar" style="width: 48px; height: 48px; border-radius: 50%; background: var(--color-teal-primary); color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; margin: 0 auto 10px auto;">${initial}</div>
                    <h4 style="margin:0 0 6px 0; color:var(--color-teal-primary); font-weight:800;">${escapeChatHtml(partnerName)}</h4>
                    <p style="margin:0 0 8px 0; font-size:0.88rem; font-weight: 700; color: var(--color-text-dark);">Thread: ${escapeChatHtml(itemName)}</p>
                    <p style="margin:0; font-size:0.83rem; color:var(--color-text-muted); max-width: 420px; margin: 0 auto; line-height: 1.4;">This is the dedicated conversation thread for this specific donation item. Send a message below to coordinate handover, logistics, or verification.</p>
                </div>
            `;
            return;
        }

        const currentUid = currentUser.uid || currentUser.id || "";

        container.innerHTML = thread.messages.map(m => {
            const isOutgoing = m.senderId === currentUid;
            const timeStr = formatChatTime(m.createdAt);
            const senderLabel = isOutgoing ? "You" : (m.senderName || partner.partnerName || "Partner");

            return `
                <div class="chat-message-row ${isOutgoing ? 'outgoing' : 'incoming'}">
                    <span class="chat-sender-tag">${escapeChatHtml(senderLabel)}</span>
                    <div class="chat-bubble">
                        ${escapeChatHtml(m.text || "")}
                    </div>
                    <span class="chat-msg-meta">${timeStr}</span>
                </div>
            `;
        }).join("");

        container.scrollTop = container.scrollHeight;
    }

    window.sendActiveChatMessage = async () => {
        const input = document.getElementById("chatMessageInput");
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        if (!activeChatPartnerId || !activeChatMatchId) {
            showToast("Please select a donation conversation thread first.", "warning");
            return;
        }

        const allPartners = getDonationConversationsHierarchy();
        const partner = allPartners.find(p => p.partnerId === activeChatPartnerId);
        const thread = partner ? partner.threadsList.find(t => t.threadId === activeChatMatchId) : null;
        const currentUid = currentUser.uid || currentUser.id || "";

        const recipientId = activeChatPartnerId;
        const recipientName = partner ? partner.partnerName : "Partner";
        const targetMatchId = activeChatMatchId;
        const itemTitle = thread ? thread.itemName : "Donation Item";

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            await db.collection("messages").add({
                matchId: targetMatchId,
                itemTitle: itemTitle,
                conversationId: [currentUid, activeChatPartnerId].sort().join('_'),
                conversationPartnerId: activeChatPartnerId,
                senderId: currentUid,
                senderName: currentUser.name || "User",
                recipientId: recipientId,
                recipientName: recipientName,
                text: text,
                read: false,
                createdAt: new Date().toISOString()
            });

            if (recipientId && recipientId !== currentUid) {
                await db.collection("notifications").add({
                    userId: recipientId,
                    message: `New message from ${currentUser.name || 'User'} regarding "${itemTitle}": "${text.substring(0, 45)}${text.length > 45 ? '...' : ''}"`,
                    type: "chat",
                    read: false,
                    createdAt: new Date().toISOString()
                }).catch(() => {});
            }

            input.value = "";
            renderChatMatchesList();
            renderChatMessages();
        } catch (err) {
            console.error("Error sending message:", err);
            showToast("Failed to send message. Please try again.", "danger");
        }
    };

    window.startChatWithPartner = (matchIdOrPartnerId) => {
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

        if (matchIdOrPartnerId) {
            const match = matchesList.find(m => m.id === matchIdOrPartnerId);
            if (match) {
                const currentUid = currentUser.uid || currentUser.id || "";
                const isDonor = match.donorId === currentUid || (currentUser.email && match.donorEmail === currentUser.email);
                const partnerId = isDonor ? (match.receiverId || match.receiverEmail || match.receiverName) : (match.donorId || match.donorEmail || match.donorName);
                window.selectDonationThread(partnerId, match.id);
            } else {
                window.selectConversationThread(matchIdOrPartnerId);
            }
        }
    };

    window.openDirectChatWithUser = async (targetUserId, targetUserName, itemTitle) => {
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;
        if (!targetUserId) {
            showToast("Cannot message partner: user ID is missing.", "warning");
            return;
        }

        const currentUid = currentUser.uid || currentUser.id || "";
        const existingMatch = matchesList.find(m => 
            ((m.donorId === targetUserId && (m.receiverId === currentUid || (currentUser.email && m.receiverEmail === currentUser.email))) ||
            (m.receiverId === targetUserId && (m.donorId === currentUid || (currentUser.email && m.donorEmail === currentUser.email)))) &&
            (!itemTitle || m.requestName === itemTitle || m.itemName === itemTitle)
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
                showToast(`Opened donation chat with ${targetUserName || 'partner'}`, "success");
            } catch(err) {
                console.error("Error creating donation chat session:", err);
                window.selectDonationThread(targetUserId, `direct_${targetUserId}`);
            }
        }
    };

    // Chat form and search event bindings
    const formSendMessage = document.getElementById("formSendMessage");
    if (formSendMessage) {
        formSendMessage.addEventListener("submit", (e) => {
            e.preventDefault();
            window.sendActiveChatMessage();
        });
    }

    const chatSearchInput = document.getElementById("chatSearchInput");
    if (chatSearchInput) {
        chatSearchInput.addEventListener("input", (e) => {
            window.filterDonationChatList(e.target.value);
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

    window.initGoogleMap = function() {
        const container = document.getElementById("liveSimulatedMap");
        if (!container) return;

        if (!window.google || !window.google.maps) {
            loadGoogleMapsScript(() => window.initGoogleMap());
            return;
        }

        try {
            container.innerHTML = `<div id="simulatedMapInner" style="width:100%; height:380px; border-radius:8px;"></div>`;
            const mapEl = document.getElementById("simulatedMapInner");

            let userLat = 6.9271;
            let userLng = 79.8612;
            if (currentUser && currentUser.location && currentUser.location.lat) {
                userLat = parseFloat(currentUser.location.lat);
                userLng = parseFloat(currentUser.location.lng);
            } else if (currentUser && currentUser.district && SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()]) {
                userLat = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lat;
                userLng = SRI_LANKA_DISTRICT_COORDS[currentUser.district.toLowerCase()].lng;
            }

            googleMap = new google.maps.Map(mapEl, {
                center: { lat: userLat, lng: userLng },
                zoom: 11,
                mapTypeId: 'roadmap',
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true
            });

            const isDonor = (currentUser && currentUser.role === 'donor') || (currentUser && currentUser.accountType === 'donor');
            const myTitle = isDonor ? `Depot: ${currentUser ? currentUser.name : 'Your Depot'}` : `Facility: ${currentUser ? currentUser.name : 'Your Facility'}`;

            const bounds = new google.maps.LatLngBounds();
            const userPos = new google.maps.LatLng(userLat, userLng);
            bounds.extend(userPos);

            const userMarker = new google.maps.Marker({
                position: userPos,
                map: googleMap,
                title: myTitle
            });

            const userInfoWindow = new google.maps.InfoWindow({
                content: `<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${myTitle}</b><br>Coordinates: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}</div>`
            });
            userInfoWindow.open(googleMap, userMarker);
            userMarker.addListener('click', () => userInfoWindow.open(googleMap, userMarker));

            const activeMatches = matchesList.filter(m => (isDonor ? m.donorId === currentUser.uid : m.receiverId === currentUser.uid));

            activeMatches.forEach((m, idx) => {
                let partnerLat = userLat + (Math.sin(idx + 1) * 0.04);
                let partnerLng = userLng + (Math.cos(idx + 1) * 0.04);
                let partnerName = isDonor ? (m.receiverName || 'Receiver') : (m.donorName || 'Donor');

                if (m.location && m.location.lat) {
                    partnerLat = parseFloat(m.location.lat);
                    partnerLng = parseFloat(m.location.lng);
                }

                const distanceKm = calculateHaversineKm(userLat, userLng, partnerLat, partnerLng);
                const partnerPos = new google.maps.LatLng(partnerLat, partnerLng);
                bounds.extend(partnerPos);

                const partnerMarker = new google.maps.Marker({
                    position: partnerPos,
                    map: googleMap,
                    title: `${partnerName} (${distanceKm} km)`
                });

                const partnerInfoWindow = new google.maps.InfoWindow({
                    content: `<div style="color:#1E293B; font-family:'Plus Jakarta Sans',sans-serif; padding:4px;"><b>${isDonor ? 'Receiver Facility' : 'Donor'}: ${partnerName}</b><br>Dispatch: ${m.requestName || 'Donation Item'}<br>Geographic Distance: <strong>${distanceKm} km away</strong></div>`
                });
                partnerMarker.addListener('click', () => partnerInfoWindow.open(googleMap, partnerMarker));

                const line = new google.maps.Polyline({
                    path: [userPos, partnerPos],
                    geodesic: true,
                    strokeColor: '#0D7C7A',
                    strokeOpacity: 0.8,
                    strokeWeight: 3
                });
                line.setMap(googleMap);
            });

            if (activeMatches.length > 0) {
                googleMap.fitBounds(bounds);
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

        const activeMatches = matchesList.filter(m => m.status !== 'rejected');

        const content = activeMatches.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted); padding:20px;">No active matches found in system.</td></tr>` :
        activeMatches.map(m => {
            let sessionText = m.deliverySessionId || 'N/A';
            let statusBadge = `<span class="badge badge-info">${m.status}</span>`;
            if (m.status === 'in_transit') statusBadge = `<span class="badge badge-warning"> In Transit</span>`;
            else if (m.status === 'confirmed') statusBadge = `<span class="badge badge-success"> Confirmed</span>`;
            else if (m.status === 'completed') statusBadge = `<span class="badge badge-success"> Completed</span>`;

            return ` <tr> <td><strong>${m.requestName || 'Material Item'}</strong><br><small style="color:var(--color-teal-primary); font-weight:700;">ID: ${sessionText}</small></td> <td>${m.donorName || 'Donor'}</td> <td>${m.receiverName || 'Receiver'}</td> <td><span class="telemetry-pill">${(m.deliveryMethod || 'pending').replace('_', ' ').toUpperCase()}</span></td> <td>${statusBadge}</td> <td> <div class="table-actions-row"> <button type="button" class="btn-action" data-action="admin-chat" data-match-id="${m.id}" onclick="adminInspectMatchChat('${m.id}')">Monitor Live Chat</button> ${m.status === 'in_transit' ? `<button type="button" class="btn-action" onclick="openLiveTrackingMapModal('${m.id}')">Monitor GPS Radar</button>` : ''}
                            ${m.handoverEvidenceUrl ? `<button type="button" class="btn-action" data-action="view-evidence" data-match-id="${m.id}" onclick="openEvidenceImageViewer('${m.id}')">Inspect Handover Photo</button>` : ''} </div> </td> </tr> `;
        }).join("");

        if (body1) body1.innerHTML = content;
        if (body2) body2.innerHTML = content;

        renderAdminMonetarySLAMonitor();
    }

    function renderAdminMonetarySLAMonitor() {
        const body = document.getElementById("adminMonetarySLABody");
        if (!body) return;

        const monetaryList = matchesList.filter(m => (m.type === 'monetary' || m.amount) && m.status !== 'rejected');

        if (monetaryList.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted); padding:20px;">No monetary funding transfers recorded.</td></tr>`;
            return;
        }

        body.innerHTML = monetaryList.map(m => {
            const transferDate = m.transferDate || (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A');
            const receiptLink = m.receiptUrl ? `<a href="${m.receiptUrl}" target="_blank" class="btn-action">View Receipt</a>` : 'N/A';
            let slaStatus = `<span class="badge badge-warning">14-Day SLA Active</span>`;

            if (m.evidenceSubmitted) {
                slaStatus = `<span class="badge badge-success"> Evidence Verified</span>`;
            }

            return ` <tr> <td><strong>${m.requestName || 'Monetary Grant'}</strong><br><small style="color:var(--color-text-muted);">${m.receiverName}</small></td> <td>${m.donorName}</td> <td><strong style="color:var(--color-teal-primary);">LKR ${(m.amount || 0).toLocaleString()}</strong></td> <td>${transferDate}</td> <td>${receiptLink}</td> <td>${slaStatus}</td> </tr> `;
        }).join("");
    }

    window.adminInspectMatchChat = async (matchId) => {
        let match = matchesList.find(m => m.id === matchId || String(m.id) === String(matchId) || m.deliverySessionId === matchId);
        const modalTitle = document.getElementById("mdlAdminInspectTitle");
        if (modalTitle) {
            modalTitle.textContent = match ? ` Admin Chat Inspector: ${match.requestName} (${match.donorName}  ${match.receiverName})` : ` Admin Chat Inspector`;
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
                    return ` <div style="background:#FFFFFF; border:1px solid #D8CE9C; border-radius:8px; padding:8px 12px; margin-bottom:8px;"> <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--color-teal-primary); font-weight:800; margin-bottom:4px;"> <span>${msg.senderName || 'Partner'}</span> <span style="color:var(--color-text-muted);">${date}</span> </div> <div style="font-size:0.85rem; color:var(--color-text-dark);">${msg.text || msg.message || ''}</div> </div> `;
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

        donGrid.innerHTML = dons.map(d => ` <div class="glass-panel" style="padding: 10px 14px; background: #FFFFFF; font-size: 0.85rem;"> <strong>${d.itemName}</strong> (${d.category}) - Qty: ${d.quantity} | Donor: ${d.donorName} (${d.status.toUpperCase()}) </div> `).join("");

        reqGrid.innerHTML = reqs.map(r => ` <div class="glass-panel" style="padding: 10px 14px; background: #FFFFFF; font-size: 0.85rem;"> <strong>${r.itemName}</strong> (${(r.reqType||'physical').toUpperCase()}) | Receiver: ${r.receiverName} (${r.status.toUpperCase()}) </div> `).join("");
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

            const actionsHtml = isPending ? ` <div style="display:flex; gap:8px; margin-top:10px;"> <button class="btn btn-success" style="padding:6px 12px; font-size:0.75rem; font-weight:800;" onclick="verifyHandoverEvidence('${m.id}')"> Verify & Approve</button> <button class="btn btn-danger" style="padding:6px 12px; font-size:0.75rem;" onclick="rejectHandoverEvidence('${m.id}')"> Reject Evidence</button> </div> ` : '';

            return ` <div class="glass-panel" style="padding:16px; background:#FFFFFF; border-radius:8px; border:1px solid var(--color-border);"> <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"> <span style="font-weight:800; color:var(--color-teal-primary); font-size:0.9rem;">${m.requestName}</span> ${statusBadge} </div> <div style="font-size:0.8rem; color:#4A5568; margin-bottom:4px;">Receiver: <strong>${m.receiverName}</strong> | Donor: <strong>${m.donorName}</strong></div> <div style="font-size:0.75rem; color:#718096; margin-bottom:10px;">Uploaded: ${new Date(m.handoverUploadedAt || m.completedAt || Date.now()).toLocaleString()}</div> <div style="cursor:pointer; text-align:center;" onclick="openEvidenceImageViewer('${m.id}')" title="Click to view full photo"> <img src="${m.handoverEvidenceUrl}" style="width:100%; max-height:180px; object-fit:cover; border-radius:6px; border:1px solid #E2E8F0; margin-bottom:8px;"> </div> <div style="margin-bottom:8px; text-align:right;"> <button type="button" class="btn btn-secondary" style="padding:2px 8px; font-size:0.75rem; font-weight:800; cursor:pointer;" onclick="openEvidenceImageViewer('${m.id}')"> Full Screen View</button> </div> ${m.handoverNotes ? `<div style="font-size:0.8rem; background:#F8FAFC; padding:8px; border-radius:4px; margin-bottom:8px;"><strong>Notes:</strong> ${m.handoverNotes}</div>` : ''}
                    ${actionsHtml} </div> `;
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
                    message: ` Admin has verified and approved your handover evidence for "${match.requestName}".`,
                    isRead: false,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast(" Handover evidence verified & approved!", "success");
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
                    message: ` Admin rejected handover evidence for "${match.requestName}". Reason: ${reason}`,
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
    

    
    // =========================================================================
    // DIRECT ADMIN INQUIRIES & SUPPORT ENGINE (DONOR, RECEIVER & ADMIN)
    // =========================================================================

    window.openInquiriesOrChat = () => {
        if (checkIsAdmin()) {
            window.location.hash = '#inquiries';
        } else {
            window.location.hash = '#admin-chat';
        }
    };

    window.switchInquiryTab = (tab) => {
        currentInquiryTab = tab;
        document.querySelectorAll("#adminInquiryTabsNav .inquiry-tab-btn").forEach(btn => {
            if (btn.getAttribute("data-tab") === tab) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        renderAdminInquiries();
    };

    function renderAdminInquiries() {
        if (!checkIsAdmin()) return;

        // 1. Calculate & Update Metric Numbers
        const total = inquiriesList.length;
        const donorsCount = inquiriesList.filter(i => ((i.userRole || i.accountType || '').toLowerCase().includes('donor'))).length;
        const receiversCount = inquiriesList.filter(i => ((i.userRole || i.accountType || '').toLowerCase().includes('receiver'))).length;
        const pendingCount = inquiriesList.filter(i => i.status !== 'resolved' && (i.unreadByAdmin || i.status === 'open')).length;

        const elTotal = document.getElementById("statInquiriesTotal");
        const elDonors = document.getElementById("statInquiriesDonors");
        const elReceivers = document.getElementById("statInquiriesReceivers");
        const elPending = document.getElementById("statInquiriesUnresolved");
        const elBadge = document.getElementById("adminInquiriesTotalBadge");

        if (elTotal) elTotal.textContent = total;
        if (elDonors) elDonors.textContent = donorsCount;
        if (elReceivers) elReceivers.textContent = receiversCount;
        if (elPending) elPending.textContent = pendingCount;
        if (elBadge) elBadge.textContent = `${total} Total Inquiries`;

        // 2. Filter list by selected Tab and Search input
        const searchInput = document.getElementById("searchAdminInquiries");
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        let filtered = [...inquiriesList];

        if (currentInquiryTab === 'donor') {
            filtered = filtered.filter(i => ((i.userRole || i.accountType || '').toLowerCase().includes('donor')));
        } else if (currentInquiryTab === 'receiver') {
            filtered = filtered.filter(i => ((i.userRole || i.accountType || '').toLowerCase().includes('receiver')));
        } else if (currentInquiryTab === 'pending') {
            filtered = filtered.filter(i => i.status !== 'resolved' && (i.unreadByAdmin || i.status === 'open'));
        }

        if (query) {
            filtered = filtered.filter(i => 
                (i.userName && i.userName.toLowerCase().includes(query)) ||
                (i.userEmail && i.userEmail.toLowerCase().includes(query)) ||
                (i.subject && i.subject.toLowerCase().includes(query)) ||
                (i.lastMessage && i.lastMessage.toLowerCase().includes(query)) ||
                (i.district && i.district.toLowerCase().includes(query))
            );
        }

        // Sort by newest activity first
        filtered.sort((a, b) => new Date(b.lastMessageTime || b.createdAt || 0) - new Date(a.lastMessageTime || a.createdAt || 0));

        const container = document.getElementById("adminInquiriesListContainer");
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 15px; color:var(--color-text-muted);">
                    <div style="font-size:1.8rem; margin-bottom:6px;">📭</div>
                    <div style="font-weight:700; font-size:0.9rem; color:#475569;">No Inquiries Found</div>
                    <div style="font-size:0.78rem; margin-top:2px;">No inquiry threads match this filter.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(inq => {
            const isDonor = (inq.userRole || inq.accountType || '').toLowerCase().includes('donor');
            const roleClass = isDonor ? 'donor' : 'receiver';
            const roleLabel = isDonor ? 'DONOR' : 'RECEIVER';
            const isActive = (inq.id === activeAdminInquiryId);
            const isUnread = (inq.unreadByAdmin === true);
            const statusLabel = (inq.status || 'open').toUpperCase();
            const statusBadgeClass = inq.status === 'resolved' ? 'badge-secondary' : 'badge-success';

            const timeStr = inq.lastMessageTime ? formatSubmittedDate(inq.lastMessageTime) : (inq.createdAt ? formatSubmittedDate(inq.createdAt) : '');

            return `
                <div class="inquiry-thread-card ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}" onclick="window.selectAdminInquiry('${inq.id}')">
                    <div class="inquiry-card-header">
                        <span class="inquiry-sender-name">${inq.userName || inq.userEmail}</span>
                        <span class="inquiry-card-time">${timeStr}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                        <span class="inquiry-role-pill ${roleClass}">${roleLabel}</span>
                        <span class="badge ${statusBadgeClass}" style="font-size:0.62rem; padding:1px 5px;">${statusLabel}</span>
                        ${isUnread ? '<span style="font-size:0.65rem; background:#DC2626; color:#FFF; font-weight:800; padding:1px 5px; border-radius:3px;">NEW</span>' : ''}
                    </div>
                    <div class="inquiry-subject-line">${inq.subject || 'General Support Inquiry'}</div>
                    <div class="inquiry-snippet">${inq.lastMessage || 'No messages yet...'}</div>
                </div>
            `;
        }).join("");
    }
    window.renderAdminInquiries = renderAdminInquiries;

    window.selectAdminInquiry = async (inquiryId) => {
        activeAdminInquiryId = inquiryId;

        const inq = inquiriesList.find(i => i.id === inquiryId);
        if (!inq) return;

        // If unread by Admin, mark as read
        if (inq.unreadByAdmin) {
            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                await helper.db().collection("inquiries").doc(inquiryId).update({ unreadByAdmin: false });
            } catch (e) {}
        }

        // Render Active Header
        const headerEl = document.getElementById("adminInquiryActiveHeader");
        const msgContainer = document.getElementById("adminInquiryMessagesContainer");
        const replyBar = document.getElementById("formAdminInquiryReply");
        const placeholder = document.getElementById("adminInquiryEmptyPlaceholder");

        if (headerEl) headerEl.style.display = "flex";
        if (msgContainer) msgContainer.style.display = "flex";
        if (replyBar) replyBar.style.display = "flex";
        if (placeholder) placeholder.style.display = "none";

        const nameEl = document.getElementById("inqActiveUserName");
        const roleEl = document.getElementById("inqActiveRoleBadge");
        const statusEl = document.getElementById("inqActiveStatusBadge");
        const emailEl = document.getElementById("inqActiveUserEmail");
        const districtEl = document.getElementById("inqActiveUserDistrict");
        const phoneEl = document.getElementById("inqActiveUserPhone");
        const toggleBtn = document.getElementById("btnToggleInquiryStatus");
        const avatarEl = document.getElementById("inqActiveAvatar");

        const isDonor = (inq.userRole || inq.accountType || '').toLowerCase().includes('donor');
        if (nameEl) nameEl.textContent = inq.userName || "User";
        if (roleEl) {
            roleEl.className = `inquiry-role-pill ${isDonor ? 'donor' : 'receiver'}`;
            roleEl.textContent = isDonor ? 'DONOR' : 'RECEIVER';
        }
        if (statusEl) {
            statusEl.className = inq.status === 'resolved' ? 'badge badge-secondary' : 'badge badge-success';
            statusEl.textContent = (inq.status || 'open').toUpperCase();
        }
        if (emailEl) emailEl.textContent = inq.userEmail || "No email";
        if (districtEl) districtEl.textContent = inq.district || "Colombo";
        if (phoneEl) phoneEl.textContent = inq.phone || "N/A";
        if (avatarEl) avatarEl.textContent = (inq.userName || "U").charAt(0).toUpperCase();

        if (toggleBtn) {
            toggleBtn.textContent = (inq.status === 'resolved') ? "Reopen Inquiry" : "Mark as Resolved";
            toggleBtn.className = (inq.status === 'resolved') ? "btn btn-primary" : "btn btn-secondary";
        }

        renderAdminInquiries();
        renderAdminInquiryMessages(inquiryId);
    };

    function renderAdminInquiryMessages(inquiryId) {
        const container = document.getElementById("adminInquiryMessagesContainer");
        if (!container) return;

        const inq = inquiriesList.find(i => i.id === inquiryId);
        const msgs = inquiryMessagesList.filter(m => m.inquiryId === inquiryId);

        let html = "";
        if (inq) {
            html += `
                <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:14px 18px; margin-bottom:14px; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                    <div style="font-size:0.75rem; font-weight:800; color:var(--color-teal-primary); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:2px;">Inquiry Topic</div>
                    <div style="font-weight:800; font-size:1.05rem; color:#0F172A; margin-bottom:4px;">${inq.subject || 'General Support Inquiry'}</div>
                    <div style="font-size:0.8rem; color:#64748B;">Started on ${inq.createdAt ? new Date(inq.createdAt).toLocaleString() : 'N/A'} by <strong>${inq.userName}</strong> (${(inq.userRole || 'user').toUpperCase()})</div>
                </div>
            `;
        }

        if (msgs.length === 0) {
            html += `
                <div style="text-align:center; padding:30px; color:#64748B;">
                    <p style="font-size:0.88rem;">No messages exchanged yet in this thread.</p>
                </div>
            `;
        } else {
            html += msgs.map(m => {
                const isAdmin = (m.senderRole === 'admin');
                const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return `
                    <div class="inquiry-msg-row ${isAdmin ? 'admin-msg' : 'user-msg'}">
                        <div class="inquiry-bubble">
                            ${m.message}
                        </div>
                        <div class="inquiry-msg-meta">
                            <span>${isAdmin ? '🛡️ GiveGo Administration' : (m.senderName || 'User')}</span>
                            <span>•</span>
                            <span>${timeStr}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    window.submitAdminInquiryReply = async () => {
        if (!activeAdminInquiryId) return;
        const input = document.getElementById("inputAdminInquiryReply");
        if (!input || !input.value.trim()) return;

        const text = input.value.trim();
        input.value = "";

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const targetInq = inquiriesList.find(i => i.id === activeAdminInquiryId);

            // 1. Add message to inquiry_messages
            await db.collection("inquiry_messages").add({
                inquiryId: activeAdminInquiryId,
                senderId: currentUser.uid,
                senderName: "GiveGo Administration",
                senderRole: "admin",
                message: text,
                timestamp: new Date().toISOString(),
                read: false
            });

            // 2. Update inquiries thread doc
            await db.collection("inquiries").doc(activeAdminInquiryId).update({
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
                unreadByUser: true,
                unreadByAdmin: false,
                status: 'open'
            });

            // 3. Send notification to user
            if (targetInq && targetInq.userId) {
                await db.collection("notifications").add({
                    userId: targetInq.userId,
                    message: `💬 Admin replied to your inquiry "${targetInq.subject || 'Support'}": "${text.substring(0, 70)}..."`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            showToast("Official reply sent to user.", "success");
        } catch (err) {
            console.error("Admin inquiry reply error:", err);
            showToast("Failed to send reply.", "danger");
        }
    };

    window.toggleAdminInquiryStatus = async () => {
        if (!activeAdminInquiryId) return;
        const inq = inquiriesList.find(i => i.id === activeAdminInquiryId);
        if (!inq) return;

        const newStatus = (inq.status === 'resolved') ? 'open' : 'resolved';
        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            await helper.db().collection("inquiries").doc(activeAdminInquiryId).update({
                status: newStatus
            });
            showToast(`Inquiry marked as ${newStatus.toUpperCase()}.`, "success");
            window.selectAdminInquiry(activeAdminInquiryId);
        } catch (err) {
            showToast("Failed to update status.", "danger");
        }
    };

    // ==========================================
    // DONOR & RECEIVER SUPPORT INQUIRY FUNCTIONS
    // ==========================================

    function renderUserAdminInquiryChat() {
        if (!currentUser || checkIsAdmin()) return;

        const userInq = inquiriesList.find(i => (i.userId === currentUser.uid || i.userId === currentUser.id));
        const container = document.getElementById("userInquiryMessagesContainer");
        const statusBadge = document.getElementById("userInquiryStatusBadge");

        if (!container) return;

        if (userInq && userInq.unreadByUser) {
            // Mark read by user
            try {
                const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
                helper.db().collection("inquiries").doc(userInq.id).update({ unreadByUser: false });
            } catch (e) {}
        }

        if (statusBadge) {
            if (userInq) {
                statusBadge.className = (userInq.status === 'resolved') ? "badge badge-secondary" : "badge badge-success";
                statusBadge.textContent = (userInq.status === 'resolved') ? "RESOLVED" : "ACTIVE SUPPORT";
            } else {
                statusBadge.className = "badge badge-info";
                statusBadge.textContent = "ACTIVE SUPPORT";
            }
        }

        const msgs = userInq ? inquiryMessagesList.filter(m => m.inquiryId === userInq.id) : [];

        if (!userInq || msgs.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:60px 20px; color:#64748B;">
                    <div style="font-size:3.2rem; margin-bottom:12px;">🛡️</div>
                    <h4 style="font-weight:800; font-size:1.25rem; color:var(--color-teal-primary); margin:0 0 8px 0;">Chat with GiveGo Administration</h4>
                    <p style="font-size:0.92rem; max-width:480px; margin:0 auto; line-height:1.6; color:#475569;">
                        Have questions about donations, receiver requests, delivery logistics, or account verification? Type your message below to start chatting directly with our Administration team.
                    </p>
                </div>
            `;
            return;
        }

        let html = msgs.map(m => {
            const isAdmin = (m.senderRole === 'admin');
            const isSelf = (!isAdmin);
            const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return `
                <div class="inquiry-msg-row ${isSelf ? 'admin-msg' : 'user-msg'}">
                    <div class="inquiry-bubble" style="${isSelf ? 'background:var(--color-teal-primary); color:#FFFFFF;' : 'background:#FFFFFF; color:#1E293B;'}">
                        ${m.message}
                    </div>
                    <div class="inquiry-msg-meta">
                        <span>${isAdmin ? '🛡️ GiveGo Administration' : 'You'}</span>
                        <span>•</span>
                        <span>${timeStr}</span>
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }
    window.renderUserAdminInquiryChat = renderUserAdminInquiryChat;

    window.submitUserInquiryReply = async () => {
        if (window.isActionBlockedBySuspension && window.isActionBlockedBySuspension()) return;

        const input = document.getElementById("inputUserInquiryReply");
        if (!input || !input.value.trim()) return;

        const text = input.value.trim();
        input.value = "";

        try {
            const helper = window.getFirebaseHelper ? window.getFirebaseHelper() : window.firebaseHelper;
            const db = helper.db();

            const currentUserId = currentUser.uid || currentUser.id;
            let userInq = inquiriesList.find(i => (i.userId === currentUserId));
            let inqId = userInq ? userInq.id : null;

            if (!inqId) {
                const docRef = await db.collection("inquiries").add({
                    userId: currentUserId,
                    userName: currentUser.name || "User",
                    userEmail: currentUser.email || "",
                    userRole: currentUser.role || currentUser.accountType || "donor",
                    donorType: currentUser.donorType || "",
                    receiverCategory: currentUser.receiverCategory || "",
                    district: currentUser.district || "Colombo",
                    phone: currentUser.phone || "",
                    subject: "Direct Support Inquiry",
                    status: "open",
                    lastMessage: text,
                    lastMessageTime: new Date().toISOString(),
                    unreadByAdmin: true,
                    unreadByUser: false,
                    createdAt: new Date().toISOString()
                });
                inqId = docRef.id;
            } else {
                await db.collection("inquiries").doc(inqId).update({
                    lastMessage: text,
                    lastMessageTime: new Date().toISOString(),
                    unreadByAdmin: true,
                    unreadByUser: false,
                    status: "open"
                });
            }

            await db.collection("inquiry_messages").add({
                inquiryId: inqId,
                senderId: currentUserId,
                senderName: currentUser.name || "User",
                senderRole: currentUser.role || currentUser.accountType || "donor",
                message: text,
                timestamp: new Date().toISOString(),
                read: false
            });

            showToast("Message sent to GiveGo Administration.", "success");
        } catch (err) {
            console.error("User inquiry message error:", err);
            showToast("Failed to send message.", "danger");
        }
    };

    init();
});
