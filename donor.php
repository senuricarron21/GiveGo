<!-- Leaflet Map Assets -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>

<!-- Donor Dashboard Panel -->
<!-- 1. OVERVIEW SECTION -->
<div id="overview-panel" class="dashboard-view-panel">
    <!-- Stats Cards Grid -->
    <div class="stats-grid">
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>My Physical Listings</h3>
                <div class="stat-number" id="statMyListings">0</div>
            </div>
        </div>
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>Active Matches</h3>
                <div class="stat-number" id="statMyMatches">0</div>
            </div>
        </div>
        <div class="glass-panel stat-card">
            <div class="stat-info">
                <h3>Completed Support</h3>
                <div class="stat-number" id="statCompletedDons">0</div>
            </div>
        </div>
    </div>

    <!-- Quick action layout -->
    <div class="dashboard-grid">
        <!-- Post Available Physical Item Listing -->
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 4px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <h3 class="card-title">Donate an Item</h3>
                    <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">PHYSICAL DONATION</span>
                </div>
                <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 0;">Fill in the form below to submit an item you would like to donate.</p>
            </div>
            <form id="formPostDonation">
                <input type="hidden" id="donItemId" value="">
                
                <!-- 1. Category & 2. Item Name -->
                <div class="grid-cols-2">
                    <div class="form-group" id="groupDonCategory">
                        <label class="form-label" for="donCategory">Category</label>
                        <select class="form-control form-select" id="donCategory" required>
                            <option value="Education Supplies">Education Supplies</option>
                            <option value="Medical Supplies">Medical Supplies</option>
                            <option value="Food & Nutrition">Food & Nutrition</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Electronics & IT Equipment">Electronics & IT Equipment</option>
                            <option value="Clothing & Personal Care">Clothing & Personal Care</option>
                            <option value="Household Essentials">Household Essentials</option>
                            <option value="Other Supplies">Other Supplies</option>
                        </select>
                    </div>
                    <div class="form-group" id="groupDonItemName">
                        <label class="form-label" for="donItemName">Item Name</label>
                        <input type="text" class="form-control" id="donItemName" placeholder="e.g. First Aid Kits / Rice Rations" required>
                    </div>
                </div>

                <!-- 3. Quantity, 4. Unit of Measure, 5. Condition -->
                <div class="grid-cols-3" id="rowDonQtyUnitCond">
                    <div class="form-group" id="groupDonQuantity">
                        <label class="form-label" for="donQuantity">Quantity</label>
                        <div class="quantity-stepper" style="display: flex; align-items: center; gap: 4px;">
                            <button type="button" class="btn btn-secondary btn-stepper" id="btnDonQtyDec" onclick="window.adjustDonQuantity && window.adjustDonQuantity(-1)" style="min-width: 38px; height: 42px; font-size: 1.2rem; font-weight: 800; border-radius: 6px; background: #EFECE6; border: 1px solid var(--color-border); cursor: pointer; color: var(--color-teal-primary); display: flex; align-items: center; justify-content: center;" title="Decrease quantity">−</button>
                            <input class="form-control" type="number" id="donQuantity" min="1" value="1" style="text-align: center; font-weight: 700; height: 42px;" required>
                            <button type="button" class="btn btn-secondary btn-stepper" id="btnDonQtyInc" onclick="window.adjustDonQuantity && window.adjustDonQuantity(1)" style="min-width: 38px; height: 42px; font-size: 1.2rem; font-weight: 800; border-radius: 6px; background: #EFECE6; border: 1px solid var(--color-border); cursor: pointer; color: var(--color-teal-primary); display: flex; align-items: center; justify-content: center;" title="Increase quantity">+</button>
                        </div>
                    </div>
                    <div class="form-group" id="groupDonUnit">
                        <label class="form-label" for="donUnit">Unit of Measure</label>
                        <select class="form-control form-select" id="donUnit">
                            <option value="Units">Units / Pieces</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="g">Grams (g)</option>
                            <option value="L">Liters (L)</option>
                            <option value="mL">Milliliters (mL)</option>
                            <option value="Packs">Packs</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Bags">Bags</option>
                            <option value="Bottles">Bottles</option>
                            <option value="Cans / Tins">Cans / Tins</option>
                            <option value="Cartons">Cartons</option>
                        </select>
                    </div>
                    <div class="form-group" id="groupDonCondition">
                        <label class="form-label" for="donCondition">Condition</label>
                        <select class="form-control form-select" id="donCondition">
                            <option value="Brand New">Brand New</option>
                            <option value="Used">Used</option>
                            <option value="Partially Used">Partially Used</option>
                        </select>
                    </div>
                </div>

                <!-- 6. Item Photo / Spec Image -->
                <div class="form-group">
                    <label class="form-label">Item Photo / Spec Image</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <input type="file" id="itemPhotoUploadInput" class="form-control" style="padding: 8px 12px; flex-grow: 1;" accept=".png,.jpg,.jpeg">
                        <input type="hidden" id="donPhotoUrl" value="">
                    </div>
                    <div id="itemPhotoPreview" style="margin-top: 10px; display: none;">
                        <img id="imgPreviewSource" src="" style="max-width: 100px; border-radius: var(--radius-sm); border: 1px solid var(--color-border);" alt="Preview">
                    </div>
                </div>

                <!-- 7. Description -->
                <div class="form-group">
                    <label class="form-label" for="donDescription">Description</label>
                    <textarea class="form-control" id="donDescription" rows="2" placeholder="Item description and pickup availability..."></textarea>
                </div>

                <button class="btn btn-primary" type="submit" id="formSubmitBtn" style="width: 100%; font-size: 0.95rem; padding: 12px; font-weight: 800;">
                    Submit
                </button>
            </form>
        </div>

        <!-- Announcements Panel -->
        <div class="glass-panel" style="padding: 30px; background: #FFFFFF;">
            <div class="card-header">
                <h3 class="card-title">Announcements</h3>
            </div>
            <div id="announcementsContainer" style="max-height: 420px; overflow-y: auto;">
                <!-- Filled dynamically by app.js -->
            </div>
        </div>
    </div>
</div> <!-- 2. MY LISTINGS SECTION --> <div id="listings-panel" class="dashboard-view-panel" style="display: none;"> <div class="glass-panel" style="padding: 30px; margin-bottom: 24px; background: #FFFFFF;"> <div class="card-header"> <h3 class="card-title">Manage Offered Material Listings</h3> </div> <div style="overflow-x: auto;"> <table class="data-table"> <thead> <tr> <th>Photo</th> <th>Material Item</th> <th>Category</th> <th>Quantity</th> <th>Date</th> <th>Status</th> <th>Actions</th> </tr> </thead> <tbody id="donorListingsBody"> <!-- Filled dynamically by app.js --> </tbody> </table> </div> </div> </div> <!-- 3. REQUESTS CATALOGUE SECTION (BROWSE RECEIVER REQUESTS) --> <div id="needs-catalogue-panel" class="dashboard-view-panel" style="display: none;"> <div class="glass-panel" style="padding: 30px; margin-bottom: 24px; background: #FFFFFF;"> <div class="card-header"> <h3 class="card-title">Browse Verified Receiver Requests</h3> <span style="font-size: 0.8rem; color: var(--color-primary); font-weight: 700;">APPROVED REQUESTS</span> </div> <!-- Multi-Filter Control Toolbar --> <div class="glass-panel" style="padding: 16px; margin-bottom: 24px; background: #FBF5DD;"> <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;"> <input type="text" id="searchDonorNeeds" class="form-control" placeholder="Search requests..." style="max-width: 220px;"> <!-- Cascading Hierarchical Filter Menu --> <div class="cascading-filter-container" id="cascadingFilterContainer"> <button type="button" class="form-control form-select cascading-filter-btn" id="cascadingFilterBtn" onclick="window.toggleCascadingFilter && window.toggleCascadingFilter(event)"> <span id="cascadingFilterLabel">All Receiver Types</span> </button> <input type="hidden" id="filterReceiverCategory" value="all"> <input type="hidden" id="filterReqType" value="all"> <input type="hidden" id="filterReqCategory" value="all"> <div class="cascading-menu-popup" id="cascadingMenuPopup"> <ul class="cascading-menu-list"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('all', 'all', 'all', 'All Receiver Types')"> <span>All Receiver Types</span> </a> </li> <li class="cascading-divider"></li> <!-- Schools --> <li class="cascading-item has-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Schools</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level2"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'all', 'all', 'Schools › All Support')"> <span>All Support Types</span> </a> </li> <li class="cascading-item has-cat-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Physical Items</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level3"> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'all', 'Schools › Physical Items')">All Categories</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Education Supplies', 'Schools › Education')">Education Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Medical Supplies', 'Schools › Medical')">Medical Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Food & Nutrition', 'Schools › Food & Nutrition')">Food & Nutrition</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Furniture', 'Schools › Furniture')">Furniture</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Electronics & IT Equipment', 'Schools › Electronics & IT')">Electronics & IT Equipment</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Clothing & Personal Care', 'Schools › Clothing')">Clothing & Personal Care</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Household Essentials', 'Schools › Household')">Household Essentials</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'physical', 'Other Supplies', 'Schools › Other Supplies')">Other Supplies</a></li> </ul> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'monetary', 'all', 'Schools › Monetary Fund')"> <span>Monetary Fund</span> </a> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Schools', 'volunteer', 'all', 'Schools › Volunteer Support')"> <span>Volunteer Support</span> </a> </li> </ul> </li> <!-- Hospitals --> <li class="cascading-item has-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Hospitals</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level2"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'all', 'all', 'Hospitals › All Support')"> <span>All Support Types</span> </a> </li> <li class="cascading-item has-cat-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Physical Items</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level3"> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'all', 'Hospitals › Physical Items')">All Categories</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Education Supplies', 'Hospitals › Education')">Education Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Medical Supplies', 'Hospitals › Medical')">Medical Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Food & Nutrition', 'Hospitals › Food & Nutrition')">Food & Nutrition</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Furniture', 'Hospitals › Furniture')">Furniture</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Electronics & IT Equipment', 'Hospitals › Electronics & IT')">Electronics & IT Equipment</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Clothing & Personal Care', 'Hospitals › Clothing')">Clothing & Personal Care</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Household Essentials', 'Hospitals › Household')">Household Essentials</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'physical', 'Other Supplies', 'Hospitals › Other Supplies')">Other Supplies</a></li> </ul> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'monetary', 'all', 'Hospitals › Monetary Fund')"> <span>Monetary Fund</span> </a> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Hospitals', 'volunteer', 'all', 'Hospitals › Volunteer Support')"> <span>Volunteer Support</span> </a> </li> </ul> </li> <!-- Orphanages --> <li class="cascading-item has-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Orphanages</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level2"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'all', 'all', 'Orphanages › All Support')"> <span>All Support Types</span> </a> </li> <li class="cascading-item has-cat-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Physical Items</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level3"> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'all', 'Orphanages › Physical Items')">All Categories</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Education Supplies', 'Orphanages › Education')">Education Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Medical Supplies', 'Orphanages › Medical')">Medical Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Food & Nutrition', 'Orphanages › Food & Nutrition')">Food & Nutrition</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Furniture', 'Orphanages › Furniture')">Furniture</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Electronics & IT Equipment', 'Orphanages › Electronics & IT')">Electronics & IT Equipment</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Clothing & Personal Care', 'Orphanages › Clothing')">Clothing & Personal Care</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Household Essentials', 'Orphanages › Household')">Household Essentials</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'physical', 'Other Supplies', 'Orphanages › Other Supplies')">Other Supplies</a></li> </ul> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'monetary', 'all', 'Orphanages › Monetary Fund')"> <span>Monetary Fund</span> </a> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Orphanages', 'volunteer', 'all', 'Orphanages › Volunteer Support')"> <span>Volunteer Support</span> </a> </li> </ul> </li> <!-- Elder Care Homes --> <li class="cascading-item has-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Elder Care Homes</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level2"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'all', 'all', 'Elder Care Homes › All Support')"> <span>All Support Types</span> </a> </li> <li class="cascading-item has-cat-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Physical Items</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level3"> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'all', 'Elder Care Homes › Physical Items')">All Categories</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Education Supplies', 'Elder Care Homes › Education')">Education Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Medical Supplies', 'Elder Care Homes › Medical')">Medical Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Food & Nutrition', 'Elder Care Homes › Food & Nutrition')">Food & Nutrition</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Furniture', 'Elder Care Homes › Furniture')">Furniture</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Electronics & IT Equipment', 'Elder Care Homes › Electronics & IT')">Electronics & IT Equipment</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Clothing & Personal Care', 'Elder Care Homes › Clothing')">Clothing & Personal Care</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Household Essentials', 'Elder Care Homes › Household')">Household Essentials</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'physical', 'Other Supplies', 'Elder Care Homes › Other Supplies')">Other Supplies</a></li> </ul> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'monetary', 'all', 'Elder Care Homes › Monetary Fund')"> <span>Monetary Fund</span> </a> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Elder Care Homes', 'volunteer', 'all', 'Elder Care Homes › Volunteer Support')"> <span>Volunteer Support</span> </a> </li> </ul> </li> <!-- Disaster Relief Organizations --> <li class="cascading-item has-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Disaster Relief Organizations</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level2"> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'all', 'all', 'Disaster Relief › All Support')"> <span>All Support Types</span> </a> </li> <li class="cascading-item has-cat-submenu"> <a href="javascript:void(0)" class="cascading-link"> <span>Physical Items</span> <span class="cascading-arrow">▶</span> </a> <ul class="cascading-submenu-level3"> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'all', 'Disaster Relief › Physical Items')">All Categories</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Education Supplies', 'Disaster Relief › Education')">Education Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Medical Supplies', 'Disaster Relief › Medical')">Medical Supplies</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Food & Nutrition', 'Disaster Relief › Food & Nutrition')">Food & Nutrition</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Furniture', 'Disaster Relief › Furniture')">Furniture</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Electronics & IT Equipment', 'Disaster Relief › Electronics & IT')">Electronics & IT Equipment</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Clothing & Personal Care', 'Disaster Relief › Clothing')">Clothing & Personal Care</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Household Essentials', 'Disaster Relief › Household')">Household Essentials</a></li> <li><a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'physical', 'Other Supplies', 'Disaster Relief › Other Supplies')">Other Supplies</a></li> </ul> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'monetary', 'all', 'Disaster Relief › Monetary Fund')"> <span>Monetary Fund</span> </a> </li> <li class="cascading-item"> <a href="javascript:void(0)" class="cascading-link" onclick="window.selectCascadingOption('Disaster Relief Organization', 'volunteer', 'all', 'Disaster Relief › Volunteer Support')"> <span>Volunteer Support</span> </a> </li> </ul> </li> </ul> </div> </div> <select id="filterReqUrgency" class="form-control form-select" style="max-width: 150px;"> <option value="all">All Priorities</option> <option value="High">Emergency / High</option> <option value="Medium">Medium Priority</option> <option value="Low">Low Priority</option> </select> </div> </div> <!-- Requests Grid --> <div class="grid-cols-3" id="donorNeedsGrid" style="gap: 20px;"> <!-- Filled dynamically by app.js --> </div> </div> </div> <!-- 4. MATCHES & CONNECTIONS SECTION --> <div id="matching-panel" class="dashboard-view-panel" style="display: none;"> <div class="dashboard-grid"> <div class="glass-panel" style="padding: 30px; background: #FFFFFF;"> <div class="card-header"> <h3 class="card-title">Matches & Connections Recommendations</h3> <span class="badge badge-success">Algorithm Active</span> </div> <div id="donorMatchesContainer" style="max-height: 500px; overflow-y: auto;"> <!-- Filled dynamically by app.js --> </div> </div> <div class="glass-panel" style="padding: 30px; background: #FFFFFF;"> <div class="card-header"> <h3 class="card-title">Real-Time Distance Map</h3> </div> <div class="map-container" id="liveSimulatedMap"></div> <small style="color: var(--color-text-muted); display: block; margin-top: 12px; text-align: center;"> Calculates geometric distance (in km) between your location and active matched needs. </small> </div> </div> </div> <!-- 5. CHAT/MESSAGES SECTION (Two-Panel ChatGPT Style) -->
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
                <p class="chat-empty-text">Choose an organisation from the list on the left to view messages and coordinate donation details.</p>
            </div>
        </section>
    </div>
</div> <!-- 6. NOTIFICATIONS SECTION --> <div id="notifications-panel" class="dashboard-view-panel" style="display: none;"> <div class="glass-panel" style="padding: 30px; background: #FFFFFF;"> <div class="card-header"> <h3 class="card-title">My Alerts Log</h3> </div> <div id="notificationsListContainer" style="max-height: 500px; overflow-y: auto;"> <!-- Filled dynamically by app.js --> </div> </div> </div> <!-- MODAL DIALOG: MONETARY DONATION OFFER --> <div class="custom-modal-backdrop" id="modalMonetaryDonation"> <div class="custom-modal-card"> <h3 style="color: var(--color-primary); margin-bottom: 12px;" id="mdlMonTitle">Monetary Transfer Details</h3> <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;"> Transfer directly to the receiver's official verified bank account, then upload your transaction receipt. </p> <div class="glass-panel" style="padding: 16px; background: #FBF5DD; margin-bottom: 20px; font-size: 0.85rem; border: 1px solid var(--color-border-dark);"> <div style="font-weight: 700; color: var(--color-primary); margin-bottom: 6px;">Verified Receiver Bank Details:</div> <div id="mdlBankDetailsContent">Loading bank info...</div> </div> <form id="formSubmitMonetaryDonation"> <input type="hidden" id="mdlMonRequestId" value=""> <div class="grid-cols-2"> <div class="form-group"> <label class="form-label">Transfer Amount (LKR)</label> <input type="number" class="form-control" id="mdlMonAmount" required min="100"> </div> <div class="form-group"> <label class="form-label">Transfer Date</label> <input type="date" class="form-control" id="mdlMonDate" required> </div> </div> <div class="form-group"> <label class="form-label">Transaction Reference Number</label> <input type="text" class="form-control" id="mdlMonRef" placeholder="e.g. TXN-98765432" required> </div> <div class="form-group"> <label class="form-label">Transaction Receipt (PNG/JPG/PDF)</label> <input type="file" id="monReceiptUploadInput" class="form-control" accept=".pdf,.png,.jpg,.jpeg" required> <input type="hidden" id="mdlMonReceiptUrl" value=""> </div> <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;"> <button type="button" class="btn btn-secondary" onclick="closeCustomModal('modalMonetaryDonation')">Cancel</button> <button type="submit" class="btn btn-primary">Confirm Monetary Offer</button> </div> </form> </div> </div> <!-- MODAL DIALOG: VOLUNTEER OFFER --> <div class="custom-modal-backdrop" id="modalVolunteerOffer"> <div class="custom-modal-card"> <h3 style="color: var(--color-primary); margin-bottom: 12px;" id="mdlVolTitle">Volunteer Support Offer</h3> <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;"> Specify your availability, skills, and any equipment you can bring to assist the receiver organisation. </p> <form id="formSubmitVolunteerOffer"> <input type="hidden" id="mdlVolRequestId" value=""> <div class="grid-cols-2"> <div class="form-group"> <label class="form-label">Number of Volunteers Attending</label> <input type="number" class="form-control" id="mdlVolCount" min="1" value="1" required> </div> <div class="form-group"> <label class="form-label">Your Availability / Shift</label> <input type="text" class="form-control" id="mdlVolAvailability" placeholder="e.g. Full Day / Morning Shift" required> </div> </div> <div class="form-group"> <label class="form-label">Relevant Skills / Experience</label> <input type="text" class="form-control" id="mdlVolSkills" placeholder="e.g. First Aid, Carpentry, Painting"> </div> <div class="glass-panel" style="padding: 16px; background: #FBF5DD; border: 1px solid var(--color-border-dark); margin-bottom: 20px;"> <h4 style="font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px;">Equipment Support (Optional)</h4> <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 10px;" id="mdlVolEquipmentRequiredNotice"> Specify any required equipment you can bring and available quantities. </div> <div class="form-group" style="margin-bottom: 0;"> <label class="form-label" style="font-size: 0.75rem;">Equipment Provided & Quantities</label> <input type="text" class="form-control" id="mdlVolEquipmentProvided" placeholder="e.g. 2 Ekel Brooms, 1 Garden Cutter"> </div> </div> <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;"> <button type="button" class="btn btn-secondary" onclick="closeCustomModal('modalVolunteerOffer')">Cancel</button> <button type="submit" class="btn btn-primary">Submit Volunteer Offer</button> </div> </form> </div> </div> <script> function closeCustomModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove("active");
    }

    document.addEventListener("DOMContentLoaded", () => {
        const itemPhotoInput = document.getElementById("itemPhotoUploadInput");
        const itemPhotoUrl = document.getElementById("donPhotoUrl");
        const previewDiv = document.getElementById("itemPhotoPreview");
        const previewImg = document.getElementById("imgPreviewSource");
        
        if (itemPhotoInput) {
            itemPhotoInput.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append("file", file);
                if (window.showToast) window.showToast("Uploading item photo...", "info");
                
                try {
                    const response = await fetch("api/upload_handler.php", {
                        method: "POST",
                        body: formData
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        itemPhotoUrl.value = result.filePath;
                        previewImg.src = result.filePath;
                        previewDiv.style.display = "block";
                        if (window.showToast) window.showToast("Photo uploaded successfully", "success");
                    } else {
                        if (window.showToast) window.showToast(result.error || "Upload failed.", "danger");
                        itemPhotoInput.value = "";
                        previewDiv.style.display = "none";
                    }
                } catch (error) {
                    if (window.showToast) window.showToast("Upload server error.", "danger");
                    console.error(error);
                }
            });
        }

        const monReceiptInput = document.getElementById("monReceiptUploadInput");
        const monReceiptUrl = document.getElementById("mdlMonReceiptUrl");
        if (monReceiptInput) {
            monReceiptInput.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                if (window.showToast) window.showToast("Uploading transaction receipt...", "info");
                try {
                    const response = await fetch("api/upload_handler.php", {
                        method: "POST",
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) {
                        monReceiptUrl.value = result.filePath;
                        if (window.showToast) window.showToast("Receipt uploaded successfully", "success");
                    } else {
                        if (window.showToast) window.showToast(result.error || "Upload failed.", "danger");
                        monReceiptInput.value = "";
                    }
                } catch (err) {
                    if (window.showToast) window.showToast("Upload error.", "danger");
                    console.error(err);
                }
            });
        }
    }); </script> 