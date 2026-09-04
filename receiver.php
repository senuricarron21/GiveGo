<!-- Google Maps JavaScript API Assets -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBy8_Ic4K9OEPV6P6aKdm0w95A3qvLFudE&libraries=places,geometry&callback=onGoogleMapsLoaded" async defer></script>

<!-- Receiver Dashboard Panel -->
<!-- 1. OVERVIEW SECTION -->
<div id="overview-panel" class="dashboard-view-panel">
    <!-- Stats Cards Grid -->
    <div class="stats-grid">
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>My Requests</h3>
                <div class="stat-number" id="statMyRequests">0</div>
            </div>
        </div>
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>Matched Offers</h3>
                <div class="stat-number" id="statReceiverMatches">0</div>
            </div>
        </div>
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>Utilisation Pending</h3>
                <div class="stat-number" id="statPendingEvidence">0</div>
            </div>
        </div>
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>Fulfillment Rate</h3>
                <div class="stat-number" id="statFulfillRate">0%</div>
            </div>
        </div>
    </div>

    <!-- Quick action layout -->
    <div class="dashboard-grid">
        <!-- Post New Request Card -->
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header">
                <h3 class="card-title">Create Donation Request</h3>
                <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">ADMIN REVIEW REQUIRED</span>
            </div>
            <form id="formRequestMaterials">
                <!-- 1. Request Type (At the very top) -->
                <div class="form-group" id="groupReqType">
                    <label class="form-label" for="reqType">Request Type</label>
                    <select class="form-control form-select" id="reqType" required style="font-weight: 700;">
                        <option value="physical">Physical Item Request</option>
                        <option value="monetary">Monetary Donation Request</option>
                        <option value="volunteer">Volunteer Support Request</option>
                    </select>
                </div>

                <!-- 2. Category (Below Request Type - Only visible for Physical items) -->
                <div class="form-group" id="groupReqCategory">
                    <label class="form-label" for="reqCategory">Category</label>
                    <select class="form-control form-select" id="reqCategory" required>
                        <option value="Food & Nutrition">Food & Dry Rations</option>
                        <option value="Education Supplies">Education & Learning Materials</option>
                        <option value="Medical Supplies">Medical & Healthcare Supplies</option>
                        <option value="Clothing & Personal Care">Clothing & Personal Care</option>
                        <option value="Household & Furniture">Household Essentials & Furniture</option>
                        <option value="Electronics & IT Equipment">Electronics & IT Equipment</option>
                        <option value="Emergency Relief">Emergency Disaster Relief</option>
                        <option value="Animal Welfare Supplies">Animal Food & Veterinary Care</option>
                        <option value="General">General / Maintenance</option>
                        <option value="Other Supplies">Other Supplies & Essentials</option>
                    </select>
                </div>

                <!-- 3. Item / Need Title (Below Category - Only visible for Physical items) -->
                <div class="form-group" id="groupReqItemName">
                    <label class="form-label" id="lblReqItemName" for="reqItemName">Item / Need Title</label>
                    <input type="text" class="form-control" id="reqItemName" placeholder="e.g. ICU Hospital Linens / Rice Packs" required>
                </div>

                <!-- 4. Physical Request Specific Fields -->
                <div id="secReqPhysical">
                    <div class="grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">Unit of Measure</label>
                            <select class="form-control form-select" id="reqUnit">
                                <option value="Units">Units / Pieces</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="g">Grams (g)</option>
                                <option value="L">Liters (L)</option>
                                <option value="Packs">Packs / Bags</option>
                                <option value="Boxes">Boxes / Crates</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Required Quantity</label>
                            <input type="number" class="form-control" id="reqQuantity" min="1" value="10">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Acceptable Condition</label>
                            <select class="form-control form-select" id="reqCondition">
                                <option value="Brand New">Brand New Only</option>
                                <option value="Gently Used">Gently Used / Good</option>
                                <option value="Any Condition">Any Usable Condition</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 5. Monetary Request Specific Fields -->
                <div id="secReqMonetary" style="display: none;">
                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label">Required Amount (LKR)</label>
                            <input type="number" class="form-control" id="reqAmount" min="500" step="500" placeholder="e.g. 50000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Target Deadline</label>
                            <input type="date" class="form-control" id="reqDeadline">
                        </div>
                    </div>
                    <div class="glass-panel" style="padding: 16px; margin-bottom: 20px; background: #FBF5DD; border: 1px solid var(--color-border-dark); border-radius: 8px;">
                        <h4 style="font-size: 0.9rem; color: var(--color-primary); margin-bottom: 6px;">Verified Receiver Bank Details</h4>
                        <div id="recBankDetailsDisplay" style="font-size: 0.85rem; color: var(--color-text-body);">
                            Bank information from your admin-verified profile will be shown to verified donors for direct fund transfers.
                        </div>
                    </div>
                </div>

                <!-- 6. Volunteer Request Specific Fields -->
                <div id="secReqVolunteer" style="display: none;">
                    <div id="hospitalVolunteerAlert" class="badge badge-warning" style="display: none; width: 100%; padding: 10px; margin-bottom: 16px; font-size: 0.8rem; text-transform: none;">
                        Hospital Notice: Standard volunteer requests are restricted for hospitals. Submitting this request flags it for Administrator approval of Non-Clinical Support.
                    </div>
                    <div class="grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">Volunteers Needed</label>
                            <input type="number" class="form-control" id="reqVolunteersCount" min="1" value="5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Activity Date & Time</label>
                            <input type="datetime-local" class="form-control" id="reqVolDateTime">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Location / District</label>
                            <input type="text" class="form-control" id="reqVolLocation" placeholder="e.g. Kandy Premises">
                        </div>
                    </div>
                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label">Skill / Age Requirements</label>
                            <input type="text" class="form-control" id="reqVolSkills" placeholder="e.g. Basic Gardening, 18+ years">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Equipment Supply Mode</label>
                            <select class="form-control form-select" id="reqEquipmentMode">
                                <option value="provided_by_org">Provided by Organisation</option>
                                <option value="volunteers_must_bring">Volunteers Must Bring Equipment</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Equipment Needed (Specify items and required quantities)</label>
                        <input type="text" class="form-control" id="reqVolEquipmentList" placeholder="e.g. 3 Ekel Brooms, 2 Garden Cutters, 5 Gloves">
                    </div>
                </div>

                <!-- 7. Purpose / Detailed Instructions -->
                <div class="form-group">
                    <label class="form-label">Purpose / Detailed Instructions</label>
                    <textarea class="form-control" id="reqDescription" rows="3" placeholder="Explain the cause, beneficiaries, and safety guidelines..." required></textarea>
                </div>

                <button class="btn btn-primary" type="submit" style="width: 100%; font-size: 1rem; font-weight: 800; padding: 12px;">
                    Submit Request for Admin Approval
                </button>
            </form>
        </div>

        <!-- Announcements Panel -->
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header">
                <h3 class="card-title">System Announcements</h3>
            </div>
            <div id="announcementsContainer" style="max-height: 420px; overflow-y: auto;">
                <!-- Filled dynamically by app.js -->
            </div>
        </div>
    </div>
</div>

<!-- 2. MY REQUESTS SECTION -->
<div id="requests-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px; background: #FFFFFF;">
        <div class="card-header">
            <h3 class="card-title">Manage Published & Pending Requests</h3>
            <!-- Receiver Filter Bar -->
            <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                <input class="form-control" type="text" id="filterReceiverSearch" oninput="window.renderReceiverRequests && window.renderReceiverRequests()" placeholder="Search my requests..." style="max-width: 200px;">
                <select class="form-control form-select" id="filterReceiverStatus" onchange="window.renderReceiverRequests && window.renderReceiverRequests()" style="max-width: 180px;">
                    <option value="all">All Statuses</option>
                    <option value="pending_admin">Pending Admin</option>
                    <option value="published">Approved / Published</option>
                    <option value="rejected">Rejected by Admin</option>
                    <option value="fulfilled">Completed</option>
                </select>
                <select class="form-control form-select" id="filterReceiverCategory" onchange="window.renderReceiverRequests && window.renderReceiverRequests()" style="max-width: 220px;">
                    <option value="all">All Categories</option>
                    <option value="Food & Nutrition">Food & Dry Rations</option>
                    <option value="Clothing & Personal Care">Clothing & Personal Care</option>
                    <option value="Education Supplies">Books & Education</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="General">General / Maintenance</option>
                    <option value="Emergency Relief">Emergency Relief</option>
                    <option value="Household & Furniture">Furniture</option>
                    <option value="Electronics & IT Equipment">Electronics & IT</option>
                </select>
                <select class="form-control form-select" id="sortReceiverOrder" onchange="window.renderReceiverRequests && window.renderReceiverRequests()" style="max-width: 180px; font-weight:700;">
                    <option value="latest">Latest Added First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>
        </div>
        <div style="overflow-x: auto;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Target</th>
                        <th>Fulfilled</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="receiverRequestsBody">
                    <!-- Filled dynamically by app.js -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- 3. INVENTORY LOOKUP SECTION -->
<div id="inventory-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px; background: #FFFFFF;">
        <div class="card-header">
            <h3 class="card-title">Browse Available Donations Directory</h3>
            <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">LIVE DIRECTORY</span>
        </div>
        <div style="margin-bottom: 20px;">
            <input type="text" id="searchReceiverInventory" class="form-control" placeholder="Search available inventory..." style="max-width: 350px;">
        </div>
        <div class="grid-cols-3" id="receiverInventoryGrid" style="gap: 20px; margin-top: 10px;">
            <!-- Filled dynamically by app.js -->
        </div>
    </div>
</div>

<!-- 4. MATCHING SECTION -->
<div id="matching-panel" class="dashboard-view-panel" style="display: none;">
    <div class="dashboard-grid">
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header">
                <h3 class="card-title">Donation Matches For You</h3>
                <span class="badge badge-success">Algorithm Active</span>
            </div>
            <div id="receiverMatchesContainer" style="max-height: 500px; overflow-y: auto;">
                <!-- Filled dynamically by app.js -->
            </div>
        </div>
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header">
                <h3 class="card-title">Real-Time Distance Map</h3>
            </div>
            <div class="map-container" id="liveSimulatedMap"></div>
            <small style="color: var(--color-text-muted); display: block; margin-top: 12px; text-align: center;">
                Calculates geographic distance (in km) between your facility and matching donors.
            </small>
        </div>
    </div>
</div>

<!-- 5. CHAT/MESSAGES SECTION (Two-Panel ChatGPT Style) -->
<div id="chat-panel" class="dashboard-view-panel" style="display: none;">
    <div class="chat-container-two-panel glass-panel">
        <!-- Left Sidebar: Conversations List -->
        <aside class="chat-sidebar-pane">
            <div class="chat-sidebar-header">
                <h3 class="chat-sidebar-title">Messages</h3>
                <input type="text" id="chatSearchConversations" class="form-control chat-search-input" placeholder="Search conversations..." oninput="window.filterChatConversations && window.filterChatConversations(this.value)">
            </div>
            <div class="chat-conversations-list" id="chatMatchesList">
                <!-- Populated dynamically by app.js -->
            </div>
        </aside>

        <!-- Right Main: Active Conversation -->
        <section class="chat-main-pane">
            <!-- Active Conversation Window (Shown when conversation is selected) -->
            <div id="chatActiveWindow" class="chat-active-window" style="display: none;">
                <div class="chat-active-header">
                    <div class="chat-active-user-info">
                        <div class="profile-avatar chat-active-avatar" id="chatPeerAvatar"></div>
                        <div>
                            <h4 class="chat-active-peer-name" id="chatPeerName">Select Conversation</h4>
                            <div class="chat-active-meta" id="chatPeerMeta">Active Discussion</div>
                        </div>
                    </div>
                </div>
                <div class="chat-messages-area" id="chatMessagesContainer">
                    <!-- Populated dynamically by app.js -->
                </div>
                <form class="chat-input-bar" id="formChatMessage" onsubmit="event.preventDefault(); window.sendActiveChatMessage && window.sendActiveChatMessage();">
                    <input type="text" class="form-control chat-text-input" id="chatMessageInput" placeholder="Type a message..." autocomplete="off" required>
                    <button type="submit" class="btn btn-primary chat-send-btn" id="btnSendChatMessage">
                        <span>Send</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
            </div>

            <!-- Empty Placeholder (Shown when NO conversation is selected) -->
            <div id="chatEmptyPlaceholder" class="chat-empty-placeholder">
                <div class="chat-empty-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h3 class="chat-empty-title">Select a Conversation</h3>
                <p class="chat-empty-text">Choose a donor from the list on the left to view messages and coordinate donation details.</p>
            </div>
        </section>
    </div>
</div>

<!-- 6. NOTIFICATIONS SECTION -->
<div id="notifications-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
        <div class="card-header">
            <h3 class="card-title">Alerts & Compliance Log</h3>
        </div>
        <div id="notificationsListContainer" style="max-height: 500px; overflow-y: auto;">
            <!-- Filled dynamically by app.js -->
        </div>
    </div>
</div>
 