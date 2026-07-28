// GiveGo Main Application Controller
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
                window.location.href = "index.php";
                return;
            }
            currentUser = user;
            
            try {
                const db = window.firebaseHelper.db();
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

    function updateOverviewStats() {
        if (!currentUser) return;

        const roleStr = (currentUser.role || currentUser.accountType || "").toLowerCase();
        const emailStr = (currentUser.email || "").toLowerCase();

        const isAdmin = roleStr.includes("admin") || emailStr.includes("admin") || currentUser.uid === '9TVzT4p6IESEaalgHQ0xuptUqVk2';
        const isDonor = roleStr.includes("donor");
        const isReceiver = roleStr.includes("receiver");

        // --- 1. Admin Overview Metrics ---
        if (isAdmin) {
            const pendingAccountVerifications = usersList.filter(u => u.status === 'pending').length;
            const pendingRequestApprovals = requestsList.filter(r => r.status === 'pending_admin').length;
            const pendingDonationApprovals = donationsList.filter(d => d.status === 'pending_admin').length;
            const totalPendingApprovals = pendingAccountVerifications + pendingRequestApprovals + pendingDonationApprovals;
            
            const totalSystemRequests = requestsList.length;
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
        const db = window.firebaseHelper.db();
        
        const unsubUsers = db.collection("users").onSnapshot(snapshot => {
            usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const fullProfile = usersList.find(u => u.uid === currentUser.uid || u.id === currentUser.uid);
            if (fullProfile) currentUser = { ...currentUser, ...fullProfile };

            const roleStr = (currentUser.role || "").toLowerCase();
            if (roleStr === 'admin' || currentUser.email.includes("admin")) {
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

            if (roleStr === 'donor') {
                renderDonorListings();
                renderDonorNeeds();
            } else if (roleStr === 'receiver') {
                renderReceiverInventory();
            }
            if (roleStr === 'admin' || currentUser.email.includes("admin")) {
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

            if (roleStr === 'receiver') renderReceiverRequests();
            else if (roleStr === 'donor') renderDonorNeeds();
            if (roleStr === 'admin' || currentUser.email.includes("admin")) {
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

            if (roleStr === 'donor') renderDonorMatches();
            else if (roleStr === 'receiver') renderReceiverMatches();
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
            
            document.querySelectorAll(".menu-item").forEach(item => {
                const link = item.querySelector("a");
                if (link && link.getAttribute("href") === hash) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });

            document.querySelectorAll(".dashboard-view-panel").forEach(panel => {
                if ("#" + panel.id === hash + "-panel" || (hash === "#overview" && panel.id === "overview-panel")) {
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
            } else if (hash === '#system-directory') {
                renderAdminDirectory();
            } else if (hash === '#needs-catalogue') {
                renderDonorNeeds();
            } else if (hash === '#available-items') {
                renderAllAvailableItems();
            } else if (hash === '#history') {
                renderHistory();
            } else if (hash === '#matching') {
                if (roleStr === 'donor') renderDonorMatches();
                else if (roleStr === 'receiver') renderReceiverMatches();
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
        if (dot) dot.style.display = unread.length > 0 ? "block" : "none";
        if (!container) return;
        
        if (notificationsList.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--color-text-muted); padding: 40px;">No active alerts. You are up to date.</div>`;
            return;
        }

        const sorted = [...notificationsList].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        container.innerHTML = sorted.map(n => {
            const date = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="glass-panel" style="padding: 14px 18px; margin-bottom: 10px; border-left: 4px solid ${n.read ? 'var(--color-border-dark)' : 'var(--color-primary)'}; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.9rem; font-weight: ${n.read ? '500' : '700'}; color: var(--color-primary);">${n.message}</div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">${date}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    const formRequestMaterials = document.getElementById("formRequestMaterials");
    if (formRequestMaterials) {
        formRequestMaterials.addEventListener("submit", async (e) => {
            e.preventDefault();
            const db = window.firebaseHelper.db();

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
                requestDoc.quantityRequired = parseInt(document.getElementById("reqQuantity").value) || 1;
                requestDoc.acceptableCondition = document.getElementById("reqCondition").value;
                requestDoc.urgency = document.getElementById("reqUrgency").value;
            } else if (reqType === 'monetary') {
                requestDoc.amountRequired = parseFloat(document.getElementById("reqAmount").value) || 10000;
                requestDoc.deadline = document.getElementById("reqDeadline").value || "";
                requestDoc.bankDetails = currentUser.receiverDetails || null;
            } else if (reqType === 'volunteer') {
                if (isHospital) {
                    requestDoc.isHospitalNonClinical = true;
                    requestDoc.requiresSpecialAdminApproval = true;
                }
                requestDoc.volunteersRequired = parseInt(document.getElementById("reqVolunteersCount").value) || 5;
                requestDoc.volDateTime = document.getElementById("reqVolDateTime").value || "";
                requestDoc.volLocation = document.getElementById("reqVolLocation").value || currentUser.district;
                requestDoc.skillsRequired = document.getElementById("reqVolSkills").value || "";
                requestDoc.equipmentSupplyMode = document.getElementById("reqEquipmentMode").value;
                requestDoc.equipmentNeeded = document.getElementById("reqVolEquipmentList").value || "";
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

    // DONOR: Post surplus material listing -> pending_admin
    const formPostDonation = document.getElementById("formPostDonation");
    if (formPostDonation) {
        formPostDonation.addEventListener("submit", async (e) => {
            e.preventDefault();
            const db = window.firebaseHelper.db();
            const itemName = document.getElementById("donItemName").value.trim();
            const category = document.getElementById("donCategory").value;
            const quantity = parseInt(document.getElementById("donQuantity").value) || 1;
            const condition = document.getElementById("donCondition").value;
            const photoUrl = document.getElementById("donPhotoUrl").value || "";
            const availability = document.getElementById("donAvailability").value || "";
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
                document.getElementById("itemPhotoPreview").style.display = "none";
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to post donation.", "danger");
            }
        });
    }

    function renderDonorListings() {
        const body = document.getElementById("donorListingsBody");
        if (!body) return;
        const myDonations = donationsList.filter(d => d.donorId === currentUser.uid);

        if (myDonations.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 30px;">No material listings posted yet.</td></tr>`;
            return;
        }

        body.innerHTML = myDonations.map(d => {
            let statusBadge = `<span class="badge badge-warning">Pending Admin</span>`;
            if (d.status === 'available') statusBadge = `<span class="badge badge-success">Approved / Available</span>`;
            else if (d.status === 'rejected') statusBadge = `<span class="badge badge-danger">Rejected</span>`;

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

    window.deleteDonation = async (donId) => {
        if (!confirm("Are you sure you want to remove this listing?")) return;
        try {
            await window.firebaseHelper.db().collection("donations").doc(donId).delete();
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

        // Pending Receiver Requests
        html += pendingReqs.map(r => {
            const isHospitalVol = (r.receiverCategory === 'Hospital' && r.reqType === 'volunteer');
            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid var(--color-primary);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-info">RECEIVER REQUEST: ${(r.reqType || 'physical').toUpperCase()}</span>
                        <span class="badge badge-warning">${r.district || 'Colombo'}</span>
                    </div>

                    ${isHospitalVol ? `<div class="badge badge-warning" style="width:100%; margin-bottom:10px;">Hospital Non-Clinical Support Approval Required</div>` : ''}

                    <h4 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 4px;">${r.itemName}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-secondary); font-weight:700; margin-bottom: 8px;">Receiver: ${r.receiverName} (${r.receiverCategory || 'Receiver'})</div>
                    <p style="font-size: 0.85rem; color: var(--color-text-body); margin-bottom: 12px;">${r.description}</p>

                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-primary" style="flex-grow:1; font-size:0.8rem;" onclick="approveRequest('${r.id}')">Approve & Publish Request</button>
                        <button class="btn btn-danger" style="font-size:0.8rem;" onclick="rejectRequest('${r.id}')">Reject</button>
                    </div>
                </div>
            `;
        }).join("");

        // Pending Donor Material Listings
        html += pendingDons.map(d => {
            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF; border-left: 4px solid var(--color-secondary);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-success">DONOR SURPLUS ITEM LISTING</span>
                        <span class="badge badge-warning">${d.district || 'Colombo'}</span>
                    </div>

                    <h4 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 4px;">${d.itemName}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-secondary); font-weight:700; margin-bottom: 8px;">Donor: ${d.donorName} | Category: ${d.category}</div>
                    <p style="font-size: 0.85rem; color: var(--color-text-body); margin-bottom: 12px;">Qty: <strong>${d.quantity} units</strong> | Condition: ${d.condition || 'Good'}</p>

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
            await window.firebaseHelper.db().collection("requests").doc(reqId).update({ status: "published" });
            showToast("Request approved and published to Donors.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to approve request.", "danger");
        }
    };

    window.rejectRequest = async (reqId) => {
        try {
            await window.firebaseHelper.db().collection("requests").doc(reqId).update({ status: "rejected" });
            showToast("Request rejected.", "info");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to reject request.", "danger");
        }
    };

    window.approveDonationListing = async (donId) => {
        try {
            await window.firebaseHelper.db().collection("donations").doc(donId).update({ status: "available" });
            showToast("Donor surplus listing approved and published to Available Items.", "success");
            updateOverviewStats();
        } catch (err) {
            showToast("Failed to approve donation listing.", "danger");
        }
    };

    window.rejectDonationListing = async (donId) => {
        try {
            await window.firebaseHelper.db().collection("donations").doc(donId).update({ status: "rejected" });
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
            if (r.status === 'published') statusBadge = `<span class="badge badge-success">Published</span>`;
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
            await window.firebaseHelper.db().collection("requests").doc(reqId).delete();
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
        const urgencyFilter = document.getElementById("filterReqUrgency")?.value || "all";

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
        if (urgencyFilter !== 'all') filtered = filtered.filter(r => (r.urgency || 'Medium') === urgencyFilter);

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

                        <h4 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 4px;">${r.itemName}</h4>
                        <div style="font-size: 0.8rem; color: var(--color-secondary); font-weight: 700; margin-bottom: 8px;">${r.receiverName} (${r.receiverCategory || 'Receiver'})</div>
                        <p style="font-size: 0.85rem; color: var(--color-text-body); margin-bottom: 14px; line-height: 1.4;">${r.description}</p>

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

    ["searchDonorNeeds", "filterReqType", "filterReqCategory", "filterReqDistrict", "filterReqUrgency"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", renderDonorNeeds);
        if (el && id === "searchDonorNeeds") el.addEventListener("input", renderDonorNeeds);
    });

    const btnResetFilters = document.getElementById("btnResetFilters");
    if (btnResetFilters) {
        btnResetFilters.addEventListener("click", () => {
            document.getElementById("searchDonorNeeds").value = "";
            document.getElementById("filterReqType").value = "all";
            document.getElementById("filterReqCategory").value = "all";
            document.getElementById("filterReqDistrict").value = "all";
            document.getElementById("filterReqUrgency").value = "all";
            renderDonorNeeds();
        });
    }

    window.offerPhysicalDonation = async (requestId) => {
        const req = requestsList.find(r => r.id === requestId);
        if (!req) return;
        const offerQty = prompt(`How many units of "${req.itemName}" would you like to donate?`, "5");
        if (!offerQty || isNaN(offerQty)) return;

        try {
            await window.firebaseHelper.db().collection("matches").add({
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
                await window.firebaseHelper.db().collection("matches").add({
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

        document.getElementById("mdlVolRequestId").value = req.id;
        document.getElementById("mdlVolTitle").textContent = `Volunteer Offer: ${req.itemName}`;
        document.getElementById("mdlVolEquipmentRequiredNotice").textContent = req.equipmentNeeded ? 
            `Required by Organisation: ${req.equipmentNeeded}` : "Specify any equipment you can bring.";

        const modal = document.getElementById("modalVolunteerOffer");
        if (modal) modal.classList.add("active");
    };

    const formSubmitVolunteerOffer = document.getElementById("formSubmitVolunteerOffer");
    if (formSubmitVolunteerOffer) {
        formSubmitVolunteerOffer.addEventListener("submit", async (e) => {
            e.preventDefault();
            const reqId = document.getElementById("mdlVolRequestId").value;
            const req = requestsList.find(r => r.id === reqId);
            if (!req) return;

            const volCount = parseInt(document.getElementById("mdlVolCount").value) || 1;
            const availability = document.getElementById("mdlVolAvailability").value.trim();
            const skills = document.getElementById("mdlVolSkills").value.trim();
            const equipmentProvided = document.getElementById("mdlVolEquipmentProvided").value.trim();

            try {
                showToast("Submitting volunteer offer...", "info");
                await window.firebaseHelper.db().collection("matches").add({
                    requestId: req.id,
                    requestName: req.itemName,
                    receiverId: req.receiverId,
                    receiverName: req.receiverName,
                    donorId: currentUser.uid,
                    donorName: currentUser.name,
                    type: "volunteer",
                    volunteersCount: volCount,
                    availability: availability,
                    skills: skills,
                    equipmentProvided: equipmentProvided,
                    status: "pending_receiver",
                    createdAt: new Date().toISOString()
                });
                showToast("Volunteer offer submitted to receiver.", "success");
                document.getElementById("modalVolunteerOffer").classList.remove("active");
                formSubmitVolunteerOffer.reset();
                updateOverviewStats();
            } catch (err) {
                showToast("Failed to submit volunteer offer.", "danger");
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
                    <td>${u.role.toUpperCase()} (${u.donorType || u.receiverCategory || 'User'})</td>
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
            await window.firebaseHelper.db().collection("users").doc(userId).update({ status: newStatus });
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
            let docLinks = '';
            if (u.accountType === 'donor_org' && u.orgDetails) {
                docLinks = `<a href="${u.orgDetails.brDocUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">View Business Reg Doc</a>`;
            } else if (u.accountType === 'receiver' && u.receiverDetails) {
                docLinks = `
                    <div style="display:flex; gap:8px; margin-top:6px;">
                        <a href="${u.receiverDetails.registrationDocUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">Reg Cert</a>
                        <a href="${u.receiverDetails.bankDocUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">Bank Proof</a>
                    </div>
                `;
            }

            return `
                <div class="glass-panel" style="padding: 20px; background: #FFFFFF;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span class="badge badge-warning">PENDING VERIFICATION</span>
                        <span style="font-size:0.8rem; font-weight:700; color:var(--color-primary);">${u.role.toUpperCase()}</span>
                    </div>

                    <h4 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 4px;">${u.name}</h4>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 8px;">Email: ${u.email} | Phone: ${u.phone || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: var(--color-text-body); margin-bottom: 12px;">District: <strong>${u.district || 'Colombo'}</strong> (${u.receiverCategory || u.donorType || 'User'})</div>

                    ${docLinks}

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
        const db = window.firebaseHelper.db();

        const monetaryMatches = matchesList.filter(m => m.type === 'monetary' && m.status === 'confirmed');
        let pendingEvidenceCount = 0;

        for (let match of monetaryMatches) {
            if (match.evidenceSubmitted) continue;
            pendingEvidenceCount++;

            const confirmedTime = new Date(match.confirmedAt || match.createdAt).getTime();
            const now = new Date().getTime();
            const daysElapsed = (now - confirmedTime) / (1000 * 3600 * 24);

            if (daysElapsed >= 7 && daysElapsed < 14 && !match.day7ReminderSent) {
                await db.collection("matches").doc(match.id).update({ day7ReminderSent: true });
                await db.collection("notifications").add({
                    userId: match.receiverId,
                    message: `Reminder: Fund utilisation evidence required for "${match.requestName}" within 14 days of receipt confirmation.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }

            if (daysElapsed >= 14 && !match.day14SuspensionApplied) {
                await db.collection("matches").doc(match.id).update({ day14SuspensionApplied: true });
                await db.collection("users").doc(match.receiverId).update({ status: "suspended" });

                const userReqs = requestsList.filter(r => r.receiverId === match.receiverId && r.status === 'published');
                for (let r of userReqs) {
                    await db.collection("requests").doc(r.id).update({ status: "suspended" });
                }

                await db.collection("notifications").add({
                    userId: match.receiverId,
                    message: `ACCOUNT SUSPENDED: 14-day monetary utilisation evidence deadline missed for "${match.requestName}". Contact Administrator for review.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            }
        }

        const statSpan = document.getElementById("statPendingEvidence");
        if (statSpan) statSpan.textContent = pendingEvidenceCount;
    }

    window.uploadUtilisationEvidence = async (matchId) => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".pdf,.png,.jpg,.jpeg";

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);
            showToast("Uploading utilisation evidence...", "info");

            try {
                const response = await fetch("api/upload_handler.php", {
                    method: "POST",
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    await window.firebaseHelper.db().collection("matches").doc(matchId).update({
                        evidenceSubmitted: true,
                        evidenceUrl: result.filePath,
                        evidenceUploadedAt: new Date().toISOString()
                    });
                    showToast("Utilisation evidence submitted successfully.", "success");
                    updateOverviewStats();
                } else {
                    showToast(result.error || "Upload failed.", "danger");
                }
            } catch (err) {
                showToast("Error uploading evidence file.", "danger");
            }
        };

        fileInput.click();
    };

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
                details = `Amount: <strong>LKR ${m.amount}</strong> | Ref: ${m.referenceNumber} | <a href="${m.receiptUrl}" target="_blank" style="color:var(--color-primary); font-weight:700;">View Receipt</a>`;
            } else if (m.type === 'volunteer') {
                details = `Volunteers: <strong>${m.volunteersCount}</strong> | Shift: ${m.availability} | Equipment Brought: <strong>${m.equipmentProvided || 'None'}</strong>`;
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
                        <span style="font-weight:700; color:var(--color-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 6px;">From Donor: <strong>${m.donorName}</strong></div>
                    <div style="font-size: 0.85rem; color: var(--color-text-body); margin-bottom: 12px;">${details}</div>

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
            await window.firebaseHelper.db().collection("matches").doc(matchId).update({
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
                        <span style="font-weight:700; color:var(--color-primary);">${m.requestName}</span>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--color-secondary); font-weight:700;">To Receiver: ${m.receiverName}</div>
                    ${m.type === 'monetary' && m.evidenceSubmitted ? `
                        <div style="margin-top:8px;"><a href="${m.evidenceUrl}" target="_blank" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 8px;">View Receiver Utilisation Evidence</a></div>
                    ` : ''}
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
            <div class="glass-panel" style="padding: 18px; background: #FFFFFF;">
                <img src="${d.photoUrl || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=300&q=80'}" style="width: 100%; height: 140px; border-radius: var(--radius-sm); object-fit: cover; margin-bottom: 12px;">
                <h4 style="font-size: 1rem; color: var(--color-primary); margin-bottom: 4px;">${d.itemName}</h4>
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 6px;">Category: ${d.category} | Qty: ${d.quantity}</div>
                <div style="font-size: 0.8rem; color: var(--color-secondary); font-weight:700;">Donor: ${d.donorName} (${d.district || 'Colombo'})</div>
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
            m.donorId === currentUser.uid || m.receiverId === currentUser.uid || currentUser.role === 'admin'
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
                        ${m.receiptUrl ? `<a href="${m.receiptUrl}" target="_blank" style="color:var(--color-primary); font-weight:700; font-size:0.75rem;">Receipt</a>` : ''}
                        ${m.evidenceUrl ? `<a href="${m.evidenceUrl}" target="_blank" style="color:var(--color-secondary); font-weight:700; font-size:0.75rem;">Evidence</a>` : ''}
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
                <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; background: #FBF5DD; border-left: 4px solid var(--color-primary);">
                    <h4 style="font-size: 0.95rem; color: var(--color-primary); margin-bottom: 4px;">${a.title}</h4>
                    <p style="font-size: 0.85rem; color: var(--color-text-body);">${a.content}</p>
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
                await window.firebaseHelper.db().collection("announcements").add({
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
                    <div style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">${partner}</div>
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

        let step1 = 'completed', step2 = 'active', step3 = '', step4 = '';
        if (match.status === 'confirmed') { step2 = 'completed'; step3 = 'active'; }
        if (match.evidenceSubmitted) { step3 = 'completed'; step4 = 'completed'; }

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 15px 0; font-size: 0.8rem; font-weight:700;">
                <span style="color:var(--color-primary)">1. Offer</span>
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
                await window.firebaseHelper.db().collection("messages").add({
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
