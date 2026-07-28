<!-- Available Items Shared Catalogue -->
<div id="available-items-panel" class="dashboard-view-panel" style="display: none;">
    <div class="glass-panel" style="padding: 30px; margin-bottom: 24px;">
        <div class="card-header">
            <h3 class="card-title">Browse Available Material Donations Catalogue</h3>
            <span style="font-size: 0.85rem; color: var(--color-primary); font-weight: 700; letter-spacing: 0.05em;">SYSTEM DIRECTORY</span>
        </div>
        
        <div style="margin-bottom: 24px;">
            <input type="text" id="searchAllAvailableItems" class="form-control" placeholder="Search available materials by keyword, category, or donor..." style="max-width: 400px;">
        </div>

        <div class="grid-cols-3" id="allAvailableItemsGrid" style="gap: 20px; margin-top: 10px;">
            <!-- Rendered dynamically by app.js -->
        </div>
    </div>
</div>
