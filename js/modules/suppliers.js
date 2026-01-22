/**
 * Suppliers Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.022.02: Mengimplementasikan Algoritma Pemrograman
 * 
 * Module ini menangani semua fungsi CRUD untuk Suppliers.
 */

/**
 * Load suppliers with pagination
 */
async function loadSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';

    try {
        const params = {
            page: state.suppliers.page,
            page_size: state.suppliers.pageSize,
        };

        const search = document.getElementById('supplierSearch')?.value;
        if (search) params.search = search;

        const data = await suppliersApi.getAll(params);
        state.suppliers = { ...state.suppliers, items: data.items, total: data.total };

        renderSuppliersTable(data.items);
        renderPagination('suppliers', data);

    } catch (error) {
        console.error('Error loading suppliers:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load suppliers</td></tr>';
    }
}

/**
 * Render suppliers table
 * @param {Array} suppliers - Array of suppliers
 */
function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    if (!suppliers.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏢</div>
                        <div class="empty-state-title">No suppliers found</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.contact_person || '-'}</td>
            <td>${s.email || '-'}</td>
            <td>${s.phone || '-'}</td>
            <td><span class="badge badge-secondary">${s.product_count}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editSupplier(${s.id})" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="confirmDelete('supplier', ${s.id})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Edit supplier - load data and open modal
 * @param {number} id - Supplier ID
 */
async function editSupplier(id) {
    try {
        state.editingId = id;
        const supplier = await suppliersApi.getById(id);

        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('supplierContact').value = supplier.contact_person || '';
        document.getElementById('supplierEmail').value = supplier.email || '';
        document.getElementById('supplierPhone').value = supplier.phone || '';
        document.getElementById('supplierAddress').value = supplier.address || '';

        document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
        openModal('supplier');
    } catch (error) {
        console.error('Error loading supplier:', error);
        showToast('error', 'Error', 'Failed to load supplier');
    }
}

/**
 * Save supplier (create or update)
 * @param {Event} event - Form submit event
 */
async function saveSupplier(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('supplierName').value,
        contact_person: document.getElementById('supplierContact').value || null,
        email: document.getElementById('supplierEmail').value || null,
        phone: document.getElementById('supplierPhone').value || null,
        address: document.getElementById('supplierAddress').value || null,
    };

    try {
        if (state.editingId) {
            await suppliersApi.update(state.editingId, formData);
            showToast('success', 'Success', 'Supplier updated successfully');
        } else {
            await suppliersApi.create(formData);
            showToast('success', 'Success', 'Supplier created successfully');
        }

        closeModal();
        loadSuppliers();
        loadSupplierOptions();
        loadDashboard();
    } catch (error) {
        console.error('Error saving supplier:', error);
        showToast('error', 'Error', error.message);
    }
}

// Export functions for global access
window.loadSuppliers = loadSuppliers;
window.renderSuppliersTable = renderSuppliersTable;
window.editSupplier = editSupplier;
window.saveSupplier = saveSupplier;
