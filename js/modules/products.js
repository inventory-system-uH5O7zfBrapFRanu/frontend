/**
 * Products Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.022.02: Mengimplementasikan Algoritma Pemrograman
 * 
 * Module ini menangani semua fungsi CRUD untuk Products.
 */

/**
 * Load products with pagination and filters
 */
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';

    try {
        const params = {
            page: state.products.page,
            page_size: state.products.pageSize,
        };

        const search = document.getElementById('productSearch')?.value;
        if (search) params.search = search;

        const categoryId = document.getElementById('categoryFilter')?.value;
        if (categoryId) params.category_id = categoryId;

        const stockFilter = document.getElementById('stockFilter')?.value;
        if (stockFilter) params.stock_status = stockFilter;

        const data = await productsApi.getAll(params);
        state.products = { ...state.products, items: data.items, total: data.total };

        renderProductsTable(data.items);
        renderPagination('products', data);

    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load products</td></tr>';
    }
}

/**
 * Render products table
 * @param {Array} products - Array of products
 */
function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <div class="empty-state-title">No products found</div>
                        <div class="empty-state-message">Create your first product to get started</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><code>${p.sku}</code></td>
            <td>${p.name}</td>
            <td>${p.category?.name || '-'}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>
                <span class="badge ${getStockStatusClass(p.inventory?.stock_status || 'in_stock')}">
                    ${p.stock_quantity}
                </span>
            </td>
            <td>
                <span class="badge ${p.is_active ? 'badge-success' : 'badge-secondary'}">
                    ${p.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn stock" onclick="openStockModal(${p.id})" title="Adjust Stock">📦</button>
                    <button class="action-btn" onclick="editProduct(${p.id})" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="confirmDelete('product', ${p.id})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Load category options for product form
 */
async function loadCategoryOptions() {
    try {
        const data = await categoriesApi.getAll({ page_size: 100 });

        const selects = [
            document.getElementById('categoryFilter'),
            document.getElementById('productCategory')
        ];

        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Category</option>' +
                data.items.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            select.value = currentValue;
        });

    } catch (error) {
        console.error('Error loading category options:', error);
    }
}

/**
 * Load supplier options for product form
 */
async function loadSupplierOptions() {
    try {
        const data = await suppliersApi.getAll({ page_size: 100 });
        const select = document.getElementById('productSupplier');

        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Supplier</option>' +
                data.items.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            select.value = currentValue;
        }

    } catch (error) {
        console.error('Error loading supplier options:', error);
    }
}

/**
 * Edit product - load data and open modal
 * @param {number} id - Product ID
 */
async function editProduct(id) {
    try {
        state.editingId = id;
        const product = await productsApi.getById(id);

        // Load options first
        await loadCategoryOptions();
        await loadSupplierOptions();

        document.getElementById('productSku').value = product.sku;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category_id || '';
        document.getElementById('productSupplier').value = product.supplier_id || '';
        document.getElementById('productActive').checked = product.is_active;

        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productInitialStock').parentElement.style.display = 'none';

        openModal('product');
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('error', 'Error', 'Failed to load product');
    }
}

/**
 * Save product (create or update)
 * @param {Event} event - Form submit event
 */
async function saveProduct(event) {
    event.preventDefault();

    const formData = {
        sku: document.getElementById('productSku').value,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value || null,
        price: parseFloat(document.getElementById('productPrice').value),
        category_id: parseInt(document.getElementById('productCategory').value) || null,
        supplier_id: parseInt(document.getElementById('productSupplier').value) || null,
        is_active: document.getElementById('productActive').checked,
    };

    try {
        if (state.editingId) {
            await productsApi.update(state.editingId, formData);
            showToast('success', 'Success', 'Product updated successfully');
        } else {
            const initialStock = parseInt(document.getElementById('productInitialStock').value) || 0;
            await productsApi.create(formData, initialStock);
            showToast('success', 'Success', 'Product created successfully');
        }

        closeModal();
        loadProducts();
        loadDashboard();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('error', 'Error', error.message);
    }
}

/**
 * Open stock adjustment modal
 * @param {number} productId - Product ID
 */
async function openStockModal(productId) {
    try {
        state.editingId = productId;
        const product = await productsApi.getById(productId);

        document.getElementById('stockProductName').textContent = product.name;
        document.getElementById('stockCurrentQuantity').textContent = product.stock_quantity;
        document.getElementById('stockAdjustAmount').value = '';
        document.getElementById('stockAdjustReason').value = '';
        document.getElementById('stockAdjustType').value = 'add';

        openModal('stock');
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('error', 'Error', 'Failed to load product');
    }
}

/**
 * Adjust stock for a product
 * @param {Event} event - Form submit event
 */
async function adjustStock(event) {
    event.preventDefault();

    const adjustmentType = document.getElementById('stockAdjustType').value;
    const amount = parseInt(document.getElementById('stockAdjustAmount').value);
    const reason = document.getElementById('stockAdjustReason').value;

    try {
        await inventoryApi.adjustStock(state.editingId, {
            adjustment_type: adjustmentType,
            amount: amount,
            reason: reason || 'Stock adjustment'
        });

        showToast('success', 'Success', 'Stock adjusted successfully');
        closeModal();
        loadProducts();
        loadDashboard();
        loadInventory();
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showToast('error', 'Error', error.message);
    }
}

// Export functions for global access
window.loadProducts = loadProducts;
window.renderProductsTable = renderProductsTable;
window.loadCategoryOptions = loadCategoryOptions;
window.loadSupplierOptions = loadSupplierOptions;
window.editProduct = editProduct;
window.saveProduct = saveProduct;
window.openStockModal = openStockModal;
window.adjustStock = adjustStock;
