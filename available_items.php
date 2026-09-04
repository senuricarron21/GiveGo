<!-- Available Items Shared Catalogue -->
<div id="available-items-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px;">
        <div class="card-header">
            <h3 class="card-title">Approved Available Material Donations</h3>
            <span style="font-size: 0.85rem; color: var(--color-primary); font-weight: 700; letter-spacing: 0.05em;">SYSTEM DIRECTORY</span>
        </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
            <input type="text" id="searchAllAvailableItems" class="form-control" placeholder="Search available materials or donor..." style="max-width: 220px;" oninput="window.renderAllAvailableItems && window.renderAllAvailableItems()">
            <select class="form-control form-select" id="filterAvailableDistrict" onchange="window.renderAllAvailableItems && window.renderAllAvailableItems()" style="max-width: 180px;">
                <option value="all">All Districts (25)</option>
                <option value="Ampara">Ampara</option>
                <option value="Anuradhapura">Anuradhapura</option>
                <option value="Badulla">Badulla</option>
                <option value="Batticaloa">Batticaloa</option>
                <option value="Colombo">Colombo</option>
                <option value="Galle">Galle</option>
                <option value="Gampaha">Gampaha</option>
                <option value="Hambantota">Hambantota</option>
                <option value="Jaffna">Jaffna</option>
                <option value="Kalutara">Kalutara</option>
                <option value="Kandy">Kandy</option>
                <option value="Kegalle">Kegalle</option>
                <option value="Kilinochchi">Kilinochchi</option>
                <option value="Kurunegala">Kurunegala</option>
                <option value="Mannar">Mannar</option>
                <option value="Matale">Matale</option>
                <option value="Matara">Matara</option>
                <option value="Monaragala">Monaragala</option>
                <option value="Mullaitivu">Mullaitivu</option>
                <option value="Nuwara Eliya">Nuwara Eliya</option>
                <option value="Polonnaruwa">Polonnaruwa</option>
                <option value="Puttalam">Puttalam</option>
                <option value="Ratnapura">Ratnapura</option>
                <option value="Trincomalee">Trincomalee</option>
                <option value="Vavuniya">Vavuniya</option>
            </select>
            <select class="form-control form-select" id="filterAvailableCategory" onchange="window.renderAllAvailableItems && window.renderAllAvailableItems()" style="max-width: 220px;">
                <option value="all">All Categories</option>
                <option value="Education Supplies">Education Supplies</option>
                <option value="Medical Supplies">Medical Supplies</option>
                <option value="Food & Nutrition">Food & Nutrition</option>
                <option value="Furniture">Furniture</option>
                <option value="Electronics & IT Equipment">Electronics & IT Equipment</option>
                <option value="Clothing & Personal Care">Clothing & Personal Care</option>
                <option value="Household Essentials">Household Essentials</option>
                <option value="Other Supplies">Other Supplies</option>
            </select>
            <select class="form-control form-select" id="sortAvailableItemsOrder" onchange="window.renderAllAvailableItems && window.renderAllAvailableItems()" style="max-width: 180px; font-weight:700;">
                <option value="latest">Latest Added First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-top: 10px;" id="allAvailableItemsGrid">
            <!-- Rendered dynamically by app.js -->
        </div>
    </div>
</div>
