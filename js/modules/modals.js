/**
 * Modals Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * 
 * Module ini menangani semua fungsi modal (add, edit, delete).
 */

/**
 * Open add modal for specific type
 * @param {string} type - Modal type (addProduct, addCategory, addSupplier)
 */
function openModal(type) {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.add('active');

    // Hide all modals first
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));

    switch (type) {
        case 'addProduct':
            state.editingId = null;
            document.getElementById('productModalTitle').textContent = 'Add Product';
            document.getElementById('productForm').reset();
            const stockFields = document.getElementById('stockFields');
            if (stockFields) stockFields.style.display = 'grid';
            document.getElementById('productModal').classList.add('active');
            loadCategoryOptions();
            loadSupplierOptions();
            break;
        case 'product':
            document.getElementById('productModal').classList.add('active');
            break;
        case 'addCategory':
            state.editingId = null;
            document.getElementById('categoryModalTitle').textContent = 'Add Category';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryModal').classList.add('active');
            break;
        case 'category':
            document.getElementById('categoryModal').classList.add('active');
            break;
        case 'addSupplier':
            state.editingId = null;
            document.getElementById('supplierModalTitle').textContent = 'Add Supplier';
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierModal').classList.add('active');
            break;
        case 'supplier':
            document.getElementById('supplierModal').classList.add('active');
            break;
        case 'stock':
            document.getElementById('stockModal').classList.add('active');
            break;
    }
}

/**
 * Close all modals
 */
function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    state.editingId = null;
}

/**
 * Confirm delete action
 * @param {string} type - Entity type (product, category, supplier)
 * @param {number} id - Entity ID
 */
function confirmDelete(type, id) {
    const messages = {
        product: 'Are you sure you want to delete this product? This action cannot be undone.',
        category: 'Are you sure you want to delete this category? All products in this category will also be affected.',
        supplier: 'Are you sure you want to delete this supplier?',
    };

    document.getElementById('confirmMessage').textContent = messages[type];

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = () => executeDelete(type, id);

    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.add('active');
    document.getElementById('confirmModal').classList.add('active');
}

/**
 * Execute delete action
 * @param {string} type - Entity type
 * @param {number} id - Entity ID
 */
async function executeDelete(type, id) {
    try {
        switch (type) {
            case 'product':
                await productsApi.delete(id);
                loadProducts();
                break;
            case 'category':
                await categoriesApi.delete(id);
                loadCategories();
                break;
            case 'supplier':
                await suppliersApi.delete(id);
                loadSuppliers();
                break;
        }

        showToast('success', 'Deleted', `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        closeModal();
        loadDashboard();

    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

// Export functions for global access
window.openModal = openModal;
window.closeModal = closeModal;
window.confirmDelete = confirmDelete;
window.executeDelete = executeDelete;

console.log('[Modals] modals.js loaded successfully, openModal:', typeof openModal);
