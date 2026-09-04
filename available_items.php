<!-- Available Items Shared Catalogue -->
<div id="available-items-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px;">
        <div class="card-header">
            <h3 class="card-title">Approved Available Material Donations</h3>
            <span style="font-size: 0.85rem; color: var(--color-primary); font-weight: 700; letter-spacing: 0.05em;">SYSTEM DIRECTORY</span>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
            <input type="text" id="searchAllAvailableItems" class="form-control" placeholder="Search available materials or donor..." style="max-width: 220px;">
            <!-- Cascading District -> Category Filter Menu -->
            <div class="cascading-filter-container" id="availableCascadingFilterContainer">
                <button type="button" class="form-control form-select cascading-filter-btn" id="availableCascadingFilterBtn" onclick="window.toggleAvailableCascadingFilter && window.toggleAvailableCascadingFilter(event)">
                    <span id="availableCascadingFilterLabel">All Districts (25)</span>
                </button>
                <input type="hidden" id="filterAvailableDistrict" value="all">
                <input type="hidden" id="filterAvailableCategory" value="all">
                <div class="cascading-menu-popup" id="availableCascadingMenuPopup">
                    <ul class="cascading-menu-list">
                        <li class="cascading-item">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('all', 'all', 'All Districts (25)')">
                                <span>All Districts (25)</span>
                            </a>
                        </li>
                        <li class="cascading-divider"></li>
                        <!-- Ampara -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'all', 'Ampara › All Categories')">
                                <span>Ampara</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'all', 'Ampara › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Education Supplies', 'Ampara › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Medical Supplies', 'Ampara › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Food & Nutrition', 'Ampara › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Furniture', 'Ampara › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Electronics & IT Equipment', 'Ampara › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Clothing & Personal Care', 'Ampara › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Household Essentials', 'Ampara › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ampara', 'Other Supplies', 'Ampara › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Anuradhapura -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'all', 'Anuradhapura › All Categories')">
                                <span>Anuradhapura</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'all', 'Anuradhapura › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Education Supplies', 'Anuradhapura › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Medical Supplies', 'Anuradhapura › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Food & Nutrition', 'Anuradhapura › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Furniture', 'Anuradhapura › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Electronics & IT Equipment', 'Anuradhapura › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Clothing & Personal Care', 'Anuradhapura › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Household Essentials', 'Anuradhapura › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Anuradhapura', 'Other Supplies', 'Anuradhapura › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Badulla -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'all', 'Badulla › All Categories')">
                                <span>Badulla</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'all', 'Badulla › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Education Supplies', 'Badulla › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Medical Supplies', 'Badulla › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Food & Nutrition', 'Badulla › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Furniture', 'Badulla › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Electronics & IT Equipment', 'Badulla › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Clothing & Personal Care', 'Badulla › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Household Essentials', 'Badulla › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Badulla', 'Other Supplies', 'Badulla › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Batticaloa -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'all', 'Batticaloa › All Categories')">
                                <span>Batticaloa</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'all', 'Batticaloa › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Education Supplies', 'Batticaloa › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Medical Supplies', 'Batticaloa › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Food & Nutrition', 'Batticaloa › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Furniture', 'Batticaloa › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Electronics & IT Equipment', 'Batticaloa › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Clothing & Personal Care', 'Batticaloa › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Household Essentials', 'Batticaloa › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Batticaloa', 'Other Supplies', 'Batticaloa › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Colombo -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'all', 'Colombo › All Categories')">
                                <span>Colombo</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'all', 'Colombo › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Education Supplies', 'Colombo › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Medical Supplies', 'Colombo › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Food & Nutrition', 'Colombo › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Furniture', 'Colombo › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Electronics & IT Equipment', 'Colombo › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Clothing & Personal Care', 'Colombo › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Household Essentials', 'Colombo › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Colombo', 'Other Supplies', 'Colombo › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Galle -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'all', 'Galle › All Categories')">
                                <span>Galle</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'all', 'Galle › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Education Supplies', 'Galle › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Medical Supplies', 'Galle › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Food & Nutrition', 'Galle › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Furniture', 'Galle › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Electronics & IT Equipment', 'Galle › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Clothing & Personal Care', 'Galle › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Household Essentials', 'Galle › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Galle', 'Other Supplies', 'Galle › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Gampaha -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'all', 'Gampaha › All Categories')">
                                <span>Gampaha</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'all', 'Gampaha › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Education Supplies', 'Gampaha › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Medical Supplies', 'Gampaha › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Food & Nutrition', 'Gampaha › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Furniture', 'Gampaha › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Electronics & IT Equipment', 'Gampaha › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Clothing & Personal Care', 'Gampaha › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Household Essentials', 'Gampaha › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Gampaha', 'Other Supplies', 'Gampaha › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Hambantota -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'all', 'Hambantota › All Categories')">
                                <span>Hambantota</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'all', 'Hambantota › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Education Supplies', 'Hambantota › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Medical Supplies', 'Hambantota › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Food & Nutrition', 'Hambantota › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Furniture', 'Hambantota › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Electronics & IT Equipment', 'Hambantota › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Clothing & Personal Care', 'Hambantota › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Household Essentials', 'Hambantota › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Hambantota', 'Other Supplies', 'Hambantota › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Jaffna -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'all', 'Jaffna › All Categories')">
                                <span>Jaffna</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'all', 'Jaffna › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Education Supplies', 'Jaffna › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Medical Supplies', 'Jaffna › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Food & Nutrition', 'Jaffna › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Furniture', 'Jaffna › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Electronics & IT Equipment', 'Jaffna › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Clothing & Personal Care', 'Jaffna › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Household Essentials', 'Jaffna › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Jaffna', 'Other Supplies', 'Jaffna › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Kalutara -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'all', 'Kalutara › All Categories')">
                                <span>Kalutara</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'all', 'Kalutara › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Education Supplies', 'Kalutara › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Medical Supplies', 'Kalutara › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Food & Nutrition', 'Kalutara › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Furniture', 'Kalutara › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Electronics & IT Equipment', 'Kalutara › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Clothing & Personal Care', 'Kalutara › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Household Essentials', 'Kalutara › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kalutara', 'Other Supplies', 'Kalutara › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Kandy -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'all', 'Kandy › All Categories')">
                                <span>Kandy</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'all', 'Kandy › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Education Supplies', 'Kandy › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Medical Supplies', 'Kandy › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Food & Nutrition', 'Kandy › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Furniture', 'Kandy › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Electronics & IT Equipment', 'Kandy › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Clothing & Personal Care', 'Kandy › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Household Essentials', 'Kandy › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kandy', 'Other Supplies', 'Kandy › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Kegalle -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'all', 'Kegalle › All Categories')">
                                <span>Kegalle</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'all', 'Kegalle › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Education Supplies', 'Kegalle › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Medical Supplies', 'Kegalle › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Food & Nutrition', 'Kegalle › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Furniture', 'Kegalle › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Electronics & IT Equipment', 'Kegalle › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Clothing & Personal Care', 'Kegalle › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Household Essentials', 'Kegalle › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kegalle', 'Other Supplies', 'Kegalle › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Kilinochchi -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'all', 'Kilinochchi › All Categories')">
                                <span>Kilinochchi</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'all', 'Kilinochchi › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Education Supplies', 'Kilinochchi › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Medical Supplies', 'Kilinochchi › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Food & Nutrition', 'Kilinochchi › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Furniture', 'Kilinochchi › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Electronics & IT Equipment', 'Kilinochchi › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Clothing & Personal Care', 'Kilinochchi › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Household Essentials', 'Kilinochchi › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kilinochchi', 'Other Supplies', 'Kilinochchi › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Kurunegala -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'all', 'Kurunegala › All Categories')">
                                <span>Kurunegala</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'all', 'Kurunegala › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Education Supplies', 'Kurunegala › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Medical Supplies', 'Kurunegala › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Food & Nutrition', 'Kurunegala › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Furniture', 'Kurunegala › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Electronics & IT Equipment', 'Kurunegala › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Clothing & Personal Care', 'Kurunegala › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Household Essentials', 'Kurunegala › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Kurunegala', 'Other Supplies', 'Kurunegala › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Mannar -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'all', 'Mannar › All Categories')">
                                <span>Mannar</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'all', 'Mannar › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Education Supplies', 'Mannar › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Medical Supplies', 'Mannar › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Food & Nutrition', 'Mannar › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Furniture', 'Mannar › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Electronics & IT Equipment', 'Mannar › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Clothing & Personal Care', 'Mannar › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Household Essentials', 'Mannar › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mannar', 'Other Supplies', 'Mannar › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Matale -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'all', 'Matale › All Categories')">
                                <span>Matale</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'all', 'Matale › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Education Supplies', 'Matale › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Medical Supplies', 'Matale › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Food & Nutrition', 'Matale › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Furniture', 'Matale › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Electronics & IT Equipment', 'Matale › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Clothing & Personal Care', 'Matale › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Household Essentials', 'Matale › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matale', 'Other Supplies', 'Matale › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Matara -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'all', 'Matara › All Categories')">
                                <span>Matara</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'all', 'Matara › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Education Supplies', 'Matara › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Medical Supplies', 'Matara › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Food & Nutrition', 'Matara › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Furniture', 'Matara › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Electronics & IT Equipment', 'Matara › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Clothing & Personal Care', 'Matara › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Household Essentials', 'Matara › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Matara', 'Other Supplies', 'Matara › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Moneragala -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'all', 'Moneragala › All Categories')">
                                <span>Moneragala</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'all', 'Moneragala › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Education Supplies', 'Moneragala › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Medical Supplies', 'Moneragala › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Food & Nutrition', 'Moneragala › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Furniture', 'Moneragala › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Electronics & IT Equipment', 'Moneragala › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Clothing & Personal Care', 'Moneragala › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Household Essentials', 'Moneragala › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Moneragala', 'Other Supplies', 'Moneragala › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Mullaitivu -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'all', 'Mullaitivu › All Categories')">
                                <span>Mullaitivu</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'all', 'Mullaitivu › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Education Supplies', 'Mullaitivu › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Medical Supplies', 'Mullaitivu › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Food & Nutrition', 'Mullaitivu › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Furniture', 'Mullaitivu › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Electronics & IT Equipment', 'Mullaitivu › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Clothing & Personal Care', 'Mullaitivu › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Household Essentials', 'Mullaitivu › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Mullaitivu', 'Other Supplies', 'Mullaitivu › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Nuwara Eliya -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'all', 'Nuwara Eliya › All Categories')">
                                <span>Nuwara Eliya</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'all', 'Nuwara Eliya › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Education Supplies', 'Nuwara Eliya › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Medical Supplies', 'Nuwara Eliya › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Food & Nutrition', 'Nuwara Eliya › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Furniture', 'Nuwara Eliya › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Electronics & IT Equipment', 'Nuwara Eliya › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Clothing & Personal Care', 'Nuwara Eliya › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Household Essentials', 'Nuwara Eliya › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Nuwara Eliya', 'Other Supplies', 'Nuwara Eliya › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Polonnaruwa -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'all', 'Polonnaruwa › All Categories')">
                                <span>Polonnaruwa</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'all', 'Polonnaruwa › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Education Supplies', 'Polonnaruwa › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Medical Supplies', 'Polonnaruwa › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Food & Nutrition', 'Polonnaruwa › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Furniture', 'Polonnaruwa › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Electronics & IT Equipment', 'Polonnaruwa › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Clothing & Personal Care', 'Polonnaruwa › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Household Essentials', 'Polonnaruwa › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Polonnaruwa', 'Other Supplies', 'Polonnaruwa › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Puttalam -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'all', 'Puttalam › All Categories')">
                                <span>Puttalam</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'all', 'Puttalam › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Education Supplies', 'Puttalam › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Medical Supplies', 'Puttalam › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Food & Nutrition', 'Puttalam › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Furniture', 'Puttalam › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Electronics & IT Equipment', 'Puttalam › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Clothing & Personal Care', 'Puttalam › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Household Essentials', 'Puttalam › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Puttalam', 'Other Supplies', 'Puttalam › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Ratnapura -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'all', 'Ratnapura › All Categories')">
                                <span>Ratnapura</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'all', 'Ratnapura › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Education Supplies', 'Ratnapura › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Medical Supplies', 'Ratnapura › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Food & Nutrition', 'Ratnapura › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Furniture', 'Ratnapura › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Electronics & IT Equipment', 'Ratnapura › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Clothing & Personal Care', 'Ratnapura › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Household Essentials', 'Ratnapura › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Ratnapura', 'Other Supplies', 'Ratnapura › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Trincomalee -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'all', 'Trincomalee › All Categories')">
                                <span>Trincomalee</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'all', 'Trincomalee › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Education Supplies', 'Trincomalee › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Medical Supplies', 'Trincomalee › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Food & Nutrition', 'Trincomalee › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Furniture', 'Trincomalee › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Electronics & IT Equipment', 'Trincomalee › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Clothing & Personal Care', 'Trincomalee › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Household Essentials', 'Trincomalee › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Trincomalee', 'Other Supplies', 'Trincomalee › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Vavuniya -->
                        <li class="cascading-item has-submenu">
                            <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'all', 'Vavuniya › All Categories')">
                                <span>Vavuniya</span>
                                <span class="cascading-arrow">▶</span>
                            </a>
                            <ul class="cascading-submenu-level2">
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'all', 'Vavuniya › All Categories')">
                                        <span>All Categories</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Education Supplies', 'Vavuniya › Education')">
                                        <span>Education Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Medical Supplies', 'Vavuniya › Medical')">
                                        <span>Medical Supplies</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Food & Nutrition', 'Vavuniya › Food & Nutrition')">
                                        <span>Food & Nutrition</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Furniture', 'Vavuniya › Furniture')">
                                        <span>Furniture</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Electronics & IT Equipment', 'Vavuniya › Electronics & IT')">
                                        <span>Electronics & IT Equipment</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Clothing & Personal Care', 'Vavuniya › Clothing')">
                                        <span>Clothing & Personal Care</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Household Essentials', 'Vavuniya › Household')">
                                        <span>Household Essentials</span>
                                    </a>
                                </li>
                                <li class="cascading-item">
                                    <a href="javascript:void(0)" class="cascading-link" onclick="window.selectAvailableCascadingOption('Vavuniya', 'Other Supplies', 'Vavuniya › Other Supplies')">
                                        <span>Other Supplies</span>
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
            <select class="form-control form-select" id="sortAvailableItemsOrder" style="max-width: 180px; font-weight:700;">
                <option value="latest">Latest Added First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 10px;" id="allAvailableItemsGrid">
            <!-- Rendered dynamically by app.js -->
        </div>
    </div>
</div>
