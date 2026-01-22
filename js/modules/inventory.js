/**
 * Inventory Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.044.01: Menerapkan alert notification
 * 
 * Module ini menangani semua fungsi terkait Inventory management.
 */

/**
 * Load inventory with pagination and filters
 */
async function loadInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';

    try {
        const params = {
            page: state.inventory.page,
            page_size: state.inventory.pageSize,
        };

        const stockStatusFilter = document.getElementById('inventoryStockFilter')?.value;
        if (stockStatusFilter) params.stock_status = stockStatusFilter;

        const data = await inventoryApi.getAll(params);
        state.inventory = { ...state.inventory, items: data.items, total: data.total };

        renderInventoryTable(data.items);
        renderPagination('inventory', data);

    } catch (error) {
        console.error('Error loading inventory:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load inventory</td></tr>';
    }
}

/**
 * Render inventory table
 * @param {Array} items - Array of inventory items
 */
function renderInventoryTable(items) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-title">No inventory items</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(i => `
        <tr>
            <td>${i.product?.name || 'N/A'}</td>
            <td><code>${i.product?.sku || 'N/A'}</code></td>
            <td><strong>${i.quantity}</strong></td>
            <td>${i.min_quantity || 10}</td>
            <td>${i.location || '-'}</td>
            <td>
                <span class="badge ${getStockStatusClass(i.stock_status)}">
                    ${getStockStatusText(i.stock_status)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn stock" onclick="openStockModal(${i.product_id})" title="Adjust Stock">📦</button>
                    <button class="action-btn edit" onclick="openInventoryEditModal(${i.id}, '${i.location || ''}', ${i.min_quantity || 10})" title="Edit Inventory">✏️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Load inventory summary statistics
 */
async function loadInventorySummary() {
    try {
        const summary = await inventoryApi.getSummary();

        document.getElementById('invTotalItems').textContent = summary.total_items;
        document.getElementById('invTotalQty').textContent = summary.total_quantity;
        document.getElementById('invLowStock').textContent = summary.low_stock_count;
        document.getElementById('invOutStock').textContent = summary.out_of_stock_count;

    } catch (error) {
        console.error('Error loading inventory summary:', error);
    }
}

/**
 * Open inventory edit modal
 * @param {number} inventoryId - Inventory ID
 * @param {string} location - Current location
 * @param {number} minQuantity - Current minimum quantity
 */
function openInventoryEditModal(inventoryId, location, minQuantity) {
    state.editingId = inventoryId;

    const modal = document.getElementById('inventoryEditModal');
    const elements = {
        modalOverlay: document.getElementById('modalOverlay')
    };

    if (!modal) {
        const modalHTML = `
            <div class="modal" id="inventoryEditModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Inventory</h2>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="inventoryEditForm" onsubmit="updateInventoryLocation(event)">
                        <input type="hidden" name="inventory_id" id="edit_inventory_id">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="edit_location">Location</label>
                                <input type="text" id="edit_location" name="location" placeholder="e.g., Warehouse A1">
                            </div>
                            <div class="form-group">
                                <label for="edit_min_quantity">Minimum Quantity</label>
                                <input type="number" id="edit_min_quantity" name="min_quantity" min="0" placeholder="e.g., 10">
                                <small class="form-hint">Alert ketika stock di bawah nilai ini</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        // Insert into modalOverlay
        elements.modalOverlay.insertAdjacentHTML('beforeend', modalHTML);
    }

    document.getElementById('edit_inventory_id').value = inventoryId;
    document.getElementById('edit_location').value = location;
    document.getElementById('edit_min_quantity').value = minQuantity || 10;

    // Show modal overlay and modal
    elements.modalOverlay.classList.add('active');
    document.getElementById('inventoryEditModal').classList.add('active');
}

/**
 * Update inventory location and min quantity
 * @param {Event} event - Form submit event
 */
async function updateInventoryLocation(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const inventoryId = formData.get('inventory_id');
    const data = {
        location: formData.get('location') || null,
        min_quantity: parseInt(formData.get('min_quantity')) || 10,
    };

    try {
        await inventoryApi.update(inventoryId, data);
        showToast('success', 'Success', 'Inventory updated successfully');
        closeModal();
        loadInventory();
        loadInventorySummary();
    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

// Initialize inventory filter listener
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inventoryStockFilter')?.addEventListener('change', () => loadInventory());
});

// Export functions for global access
window.loadInventory = loadInventory;
window.renderInventoryTable = renderInventoryTable;
window.loadInventorySummary = loadInventorySummary;
window.openInventoryEditModal = openInventoryEditModal;
window.updateInventoryLocation = updateInventoryLocation;
