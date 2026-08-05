<!-- Available Items Shared Catalogue -->
<div id="available-items-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px;">
        <div class="card-header">
            <h3 class="card-title">Browse Available Material Donations Catalogue</h3>
            <span style="font-size: 0.85rem; color: var(--color-primary); font-weight: 700; letter-spacing: 0.05em;">SYSTEM DIRECTORY</span>
        </div>
        
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
            <input type="text" id="searchAllAvailableItems" class="form-control" placeholder="Search available materials or donor..." style="max-width: 220px;">
            <select class="form-control form-select" id="filterAvailableCategory" style="max-width: 160px;">
                <option value="all">All Categories</option>
                <option value="Food">Food Rations</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Medical">Medical</option>
                <option value="Furniture">Furniture</option>
            </select>
            <select class="form-control form-select" id="filterAvailableDistrict" style="max-width: 160px;">
                <option value="all">All Districts</option>
                <option value="Colombo">Colombo</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Kalutara">Kalutara</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
                <option value="Jaffna">Jaffna</option>
            </select>
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
