/**
 * Main Application Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.006.01: Merancang user experience
 * - J.620100.016.01: Menulis kode dengan prinsip sesuai guidelines
 * 
 * Modul utama yang menangani UI interactions dan state management.
 */

// ===== State Management =====
const state = {
    currentPage: 'dashboard',
    products: { items: [], total: 0, page: 1, pageSize: 10 },
    categories: { items: [], total: 0, page: 1, pageSize: 10 },
    suppliers: { items: [], total: 0, page: 1, pageSize: 10 },
    inventory: { items: [], total: 0, page: 1, pageSize: 10 },
    logs: { items: [], total: 0, page: 1, pageSize: 20 },
    editingId: null,
};

// ===== DOM Elements =====
const elements = {
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    modalOverlay: document.getElementById('modalOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    pageTitle: document.getElementById('pageTitle'),
    apiStatus: document.getElementById('apiStatus'),
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initEventListeners();
    checkApiHealth();

    // Only load dashboard if authenticated (handled by auth.js checkAuth)
    // loadDashboard() will be called by showDashboard() after successful login

    // Periodic API health check (every 30 seconds for status indicator)
    setInterval(checkApiHealth, 30000);

    // Background system health check every 30 minutes (1800000ms)
    // Shows toast alerts on any page if there are system issues
    setTimeout(() => {
        checkSystemAlerts();
        setInterval(checkSystemAlerts, 30 * 60 * 1000); // 30 minutes
    }, 5000); // Initial check after 5 seconds
});

/**
 * Initialize navigation handling
 */
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });

    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Menu toggle for mobile
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    // Close modal on overlay click
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        refreshCurrentPage();
    });

    // Search handlers
    document.getElementById('productSearch')?.addEventListener('input',
        debounce(() => loadProducts(), 300));
    document.getElementById('categorySearch')?.addEventListener('input',
        debounce(() => loadCategories(), 300));
    document.getElementById('supplierSearch')?.addEventListener('input',
        debounce(() => loadSuppliers(), 300));
    document.getElementById('inventorySearch')?.addEventListener('input',
        debounce(() => loadInventory(), 300));

    // Filter handlers
    document.getElementById('categoryFilter')?.addEventListener('change', () => loadProducts());
    document.getElementById('stockFilter')?.addEventListener('change', () => loadProducts());
    document.getElementById('inventoryFilter')?.addEventListener('change', () => loadInventory());
}

/**
 * Navigate to a page
 * @param {string} page 
 */
function navigateTo(page) {
    state.currentPage = page;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}Page`)?.classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        categories: 'Categories',
        suppliers: 'Suppliers',
        inventory: 'Inventory',
        logs: 'Activity Log',
        system: 'System Monitor'
    };
    elements.pageTitle.textContent = titles[page] || 'Dashboard';

    // Load page data
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            loadCategoryOptions();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'inventory':
            loadInventory();
            loadInventorySummary();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'system':
            loadSystemData();
            break;
    }

    // Close mobile sidebar
    elements.sidebar.classList.remove('open');
}

/**
 * Refresh current page
 */
function refreshCurrentPage() {
    navigateTo(state.currentPage);
    showToast('success', 'Refreshed', 'Data has been refreshed');
}

// ===== API Health Check =====
async function checkApiHealth() {
    const statusEl = elements.apiStatus;
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('span:last-child');

    try {
        const health = await healthApi.check();
        if (health.status === 'healthy' || health.status === 'degraded') {
            dotEl.className = 'status-dot online';
            textEl.textContent = 'API Online';
        } else {
            dotEl.className = 'status-dot offline';
            textEl.textContent = 'API Degraded';
        }
    } catch (error) {
        dotEl.className = 'status-dot offline';
        textEl.textContent = 'API Offline';
    }
}

// ===== Dashboard =====
async function loadDashboard() {
    try {
        // Load stats in parallel
        const [products, categories, suppliers, lowStock] = await Promise.all([
            productsApi.getAll({ page_size: 5 }),
            categoriesApi.getAll({ page_size: 1 }),
            suppliersApi.getAll({ page_size: 1 }),
            inventoryApi.getLowStock()
        ]);

        // Update stats cards
        document.getElementById('totalProducts').textContent = products.total;
        document.getElementById('totalCategories').textContent = categories.total;
        document.getElementById('totalSuppliers').textContent = suppliers.total;
        document.getElementById('lowStockCount').textContent = lowStock.length;

        // Render recent products
        renderRecentProducts(products.items);

        // Render low stock alerts
        renderLowStockAlerts(lowStock);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('error', 'Error', 'Failed to load dashboard data');
    }
}

function renderRecentProducts(products) {
    const tbody = document.getElementById('recentProductsTable');

    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No products yet</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><code>${p.sku}</code></td>
            <td>${p.name}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>
                <span class="badge ${getStockStatusClass(p.inventory?.stock_status || 'in_stock')}">
                    ${p.stock_quantity}
                </span>
            </td>
        </tr>
    `).join('');
}

function renderLowStockAlerts(alerts) {
    const container = document.getElementById('lowStockAlerts');

    if (!alerts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="empty-state-message">All stock levels are healthy!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.alert_level}">
            <span class="alert-icon">${alert.alert_level === 'out' ? '🚨' : '⚠️'}</span>
            <div class="alert-content">
                <div class="alert-title">${alert.product_name}</div>
                <div class="alert-details">
                    SKU: ${alert.product_sku} | Stock: ${alert.current_quantity}/${alert.min_quantity}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Products =====
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
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

function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');

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

// ===== Categories =====
async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading...</td></tr>';

    try {
        const params = {
            page: state.categories.page,
            page_size: state.categories.pageSize,
        };

        const search = document.getElementById('categorySearch')?.value;
        if (search) params.search = search;

        const data = await categoriesApi.getAll(params);
        state.categories = { ...state.categories, items: data.items, total: data.total };

        renderCategoriesTable(data.items);
        renderPagination('categories', data);

    } catch (error) {
        console.error('Error loading categories:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Failed to load categories</td></tr>';
    }
}

function renderCategoriesTable(categories) {
    const tbody = document.getElementById('categoriesTableBody');

    if (!categories.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏷️</div>
                        <div class="empty-state-title">No categories found</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = categories.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.description || '-'}</td>
            <td><span class="badge badge-secondary">${c.product_count}</span></td>
            <td>${formatDate(c.created_at)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editCategory(${c.id})" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="confirmDelete('category', ${c.id})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== Suppliers =====
async function loadSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');
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

function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTableBody');

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

// ===== Inventory =====
async function loadInventory() {
    const tbody = document.getElementById('inventoryTableBody');
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

function renderInventoryTable(items) {
    const tbody = document.getElementById('inventoryTableBody');

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
            <td>${i.location || '-'}</td>
            <td>
                <span class="badge ${getStockStatusClass(i.stock_status)}">
                    ${getStockStatusText(i.stock_status)}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn stock" onclick="openStockModal(${i.product_id})" title="Adjust Stock">📦</button>
                    <button class="action-btn edit" onclick="openInventoryEditModal(${i.id}, '${i.location || ''}')" title="Edit Location">📍</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Initialize inventory filter listener
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inventoryStockFilter')?.addEventListener('change', () => loadInventory());
});

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

// ===== Activity Logs =====
async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';

    try {
        const params = {
            page: state.logs.page,
            page_size: state.logs.pageSize,
        };

        const actionFilter = document.getElementById('logActionFilter')?.value;
        if (actionFilter) params.action = actionFilter;

        const entityFilter = document.getElementById('logEntityFilter')?.value;
        if (entityFilter) params.entity_type = entityFilter;

        const daysFilter = document.getElementById('logDaysFilter')?.value;
        if (daysFilter) params.days = parseInt(daysFilter);

        const data = await logsApi.getAll(params);
        state.logs = { ...state.logs, items: data.items, total: data.total };

        renderLogsTable(data.items);
        renderPagination('logs', data);

    } catch (error) {
        console.error('Error loading logs:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Failed to load activity logs</td></tr>';
    }
}

function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');

    if (!logs.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <div class="empty-state-title">No activity logs found</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const actionBadge = getActionBadgeClass(log.action);
        const entityInfo = log.entity_name ? `${log.entity_type}: ${log.entity_name}` : log.entity_type;
        const details = log.details ? JSON.stringify(log.details).substring(0, 50) : '-';

        return `
            <tr>
                <td>${formatDateTime(log.created_at)}</td>
                <td><strong>${log.username || 'System'}</strong></td>
                <td><span class="badge ${actionBadge}">${log.action}</span></td>
                <td>${entityInfo}</td>
                <td><small>${details}</small></td>
                <td><code>${log.ip_address || '-'}</code></td>
            </tr>
        `;
    }).join('');
}

function getActionBadgeClass(action) {
    switch (action) {
        case 'LOGIN':
        case 'LOGOUT':
            return 'badge-info';
        case 'CREATE':
            return 'badge-success';
        case 'UPDATE':
            return 'badge-warning';
        case 'DELETE':
            return 'badge-danger';
        case 'ADJUST_STOCK':
            return 'badge-secondary';
        default:
            return 'badge-secondary';
    }
}

// Initialize log filters
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logActionFilter')?.addEventListener('change', () => loadLogs());
    document.getElementById('logEntityFilter')?.addEventListener('change', () => loadLogs());
    document.getElementById('logDaysFilter')?.addEventListener('change', () => loadLogs());
});

// ===== Modals =====
function openModal(type) {
    elements.modalOverlay.classList.add('active');

    // Hide all modals first
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));

    switch (type) {
        case 'addProduct':
            state.editingId = null;
            document.getElementById('productModalTitle').textContent = 'Add Product';
            document.getElementById('productForm').reset();
            document.getElementById('stockFields').style.display = 'grid';
            document.getElementById('productModal').classList.add('active');
            loadCategoryOptions();
            loadSupplierOptions();
            break;
        case 'addCategory':
            state.editingId = null;
            document.getElementById('categoryModalTitle').textContent = 'Add Category';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryModal').classList.add('active');
            break;
        case 'addSupplier':
            state.editingId = null;
            document.getElementById('supplierModalTitle').textContent = 'Add Supplier';
            document.getElementById('supplierForm').reset();
            document.getElementById('supplierModal').classList.add('active');
            break;
    }
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    state.editingId = null;
}

// ===== Edit Functions =====
async function editProduct(id) {
    try {
        const product = await productsApi.getById(id);
        state.editingId = id;

        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = id;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category?.id || '';
        document.getElementById('productSupplier').value = product.supplier?.id || '';
        document.getElementById('productActive').value = product.is_active.toString();
        document.getElementById('stockFields').style.display = 'none';

        await loadCategoryOptions();
        await loadSupplierOptions();

        document.getElementById('productCategory').value = product.category?.id || '';
        document.getElementById('productSupplier').value = product.supplier?.id || '';

        elements.modalOverlay.classList.add('active');
        document.getElementById('productModal').classList.add('active');

    } catch (error) {
        showToast('error', 'Error', 'Failed to load product');
    }
}

async function editCategory(id) {
    try {
        const category = await categoriesApi.getById(id);
        state.editingId = id;

        document.getElementById('categoryModalTitle').textContent = 'Edit Category';
        document.getElementById('categoryId').value = id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';

        elements.modalOverlay.classList.add('active');
        document.getElementById('categoryModal').classList.add('active');

    } catch (error) {
        showToast('error', 'Error', 'Failed to load category');
    }
}

async function editSupplier(id) {
    try {
        const supplier = await suppliersApi.getById(id);
        state.editingId = id;

        document.getElementById('supplierModalTitle').textContent = 'Edit Supplier';
        document.getElementById('supplierId').value = id;
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('supplierContact').value = supplier.contact_person || '';
        document.getElementById('supplierEmail').value = supplier.email || '';
        document.getElementById('supplierPhone').value = supplier.phone || '';
        document.getElementById('supplierAddress').value = supplier.address || '';

        elements.modalOverlay.classList.add('active');
        document.getElementById('supplierModal').classList.add('active');

    } catch (error) {
        showToast('error', 'Error', 'Failed to load supplier');
    }
}

// ===== Stock Modal =====
async function openStockModal(productId) {
    try {
        const product = await productsApi.getById(productId);

        document.getElementById('stockProductId').value = productId;
        document.getElementById('stockInfo').innerHTML = `
            <div class="product-name">${product.name} (${product.sku})</div>
            <div class="current-stock">Current Stock: ${product.stock_quantity}</div>
        `;
        document.getElementById('stockForm').reset();
        document.getElementById('stockProductId').value = productId;

        elements.modalOverlay.classList.add('active');
        document.getElementById('stockModal').classList.add('active');

    } catch (error) {
        showToast('error', 'Error', 'Failed to load product');
    }
}

// ===== Save Functions =====
async function saveProduct(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        sku: formData.get('sku'),
        name: formData.get('name'),
        description: formData.get('description') || null,
        price: parseFloat(formData.get('price')),
        category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
        supplier_id: formData.get('supplier_id') ? parseInt(formData.get('supplier_id')) : null,
        is_active: formData.get('is_active') === 'true',
    };

    try {
        if (state.editingId) {
            await productsApi.update(state.editingId, data);
            showToast('success', 'Success', 'Product updated successfully');
        } else {
            const stockParams = {
                initial_stock: parseInt(formData.get('initial_stock')) || 0,
                min_stock: parseInt(formData.get('min_stock')) || 10,
            };
            await productsApi.create(data, stockParams);
            showToast('success', 'Success', 'Product created successfully');
        }

        closeModal();
        loadProducts();
        loadDashboard();

    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

async function saveCategory(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        description: formData.get('description') || null,
    };

    try {
        if (state.editingId) {
            await categoriesApi.update(state.editingId, data);
            showToast('success', 'Success', 'Category updated successfully');
        } else {
            await categoriesApi.create(data);
            showToast('success', 'Success', 'Category created successfully');
        }

        closeModal();
        loadCategories();
        loadDashboard();

    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

async function saveSupplier(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const data = {
        name: formData.get('name'),
        contact_person: formData.get('contact_person') || null,
        email: formData.get('email') || null,
        phone: formData.get('phone') || null,
        address: formData.get('address') || null,
    };

    try {
        if (state.editingId) {
            await suppliersApi.update(state.editingId, data);
            showToast('success', 'Success', 'Supplier updated successfully');
        } else {
            await suppliersApi.create(data);
            showToast('success', 'Success', 'Supplier created successfully');
        }

        closeModal();
        loadSuppliers();
        loadDashboard();

    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

async function adjustStock(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const productId = formData.get('product_id');
    const adjustment = {
        adjustment_type: formData.get('adjustment_type'),
        amount: parseInt(formData.get('amount')),
        reason: formData.get('reason') || null,
    };

    try {
        await inventoryApi.adjustStock(productId, adjustment);
        showToast('success', 'Success', 'Stock adjusted successfully');
        closeModal();
        loadInventory();
        loadInventorySummary();
        loadDashboard();

    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

function openInventoryEditModal(inventoryId, location) {
    state.editingId = inventoryId;

    const modal = document.getElementById('inventoryEditModal');
    if (!modal) {
        const modalHTML = `
            <div class="modal" id="inventoryEditModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Location</h2>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <form id="inventoryEditForm" onsubmit="updateInventoryLocation(event)">
                        <input type="hidden" name="inventory_id" id="edit_inventory_id">
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="edit_location">Location</label>
                                <input type="text" id="edit_location" name="location" placeholder="e.g., Warehouse A1">
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
        // Insert into modalOverlay, not body
        elements.modalOverlay.insertAdjacentHTML('beforeend', modalHTML);
    }

    document.getElementById('edit_inventory_id').value = inventoryId;
    document.getElementById('edit_location').value = location;

    // Show modal overlay and modal
    elements.modalOverlay.classList.add('active');
    document.getElementById('inventoryEditModal').classList.add('active');
}

async function updateInventoryLocation(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const inventoryId = formData.get('inventory_id');
    const data = {
        location: formData.get('location') || null,
    };

    try {
        await inventoryApi.update(inventoryId, data);
        showToast('success', 'Success', 'Location updated successfully');
        closeModal();
        loadInventory();
        loadInventorySummary();
    } catch (error) {
        showToast('error', 'Error', error.message);
    }
}

// ===== Delete Functions =====
function confirmDelete(type, id) {
    const messages = {
        product: 'Are you sure you want to delete this product? This action cannot be undone.',
        category: 'Are you sure you want to delete this category? All products in this category will also be affected.',
        supplier: 'Are you sure you want to delete this supplier?',
    };

    document.getElementById('confirmMessage').textContent = messages[type];

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = () => executeDelete(type, id);

    elements.modalOverlay.classList.add('active');
    document.getElementById('confirmModal').classList.add('active');
}

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

// ===== Pagination =====
function renderPagination(type, data) {
    const container = document.getElementById(`${type}Pagination`);
    if (!container) return;

    const { total = 0, page = 1, page_size = 10, total_pages = 1 } = data;
    const pageSizes = [5, 10, 20, 50, 100];

    // Wrapper
    let html = '<div class="pagination-wrapper">';

    // Left side: info text and page size selector
    html += '<div class="pagination-left">';
    const startItem = total > 0 ? (page - 1) * page_size + 1 : 0;
    const endItem = Math.min(page * page_size, total);
    html += `<span class="pagination-info">Showing ${startItem}-${endItem} of ${total} items</span>`;

    // Page size selector
    html += `<select class="pagination-select" onchange="changePageSize('${type}', this.value)">`;
    pageSizes.forEach(size => {
        html += `<option value="${size}" ${size === page_size ? 'selected' : ''}>${size} / page</option>`;
    });
    html += '</select>';
    html += '</div>';

    // Right side: navigation buttons
    html += '<div class="pagination-buttons">';

    // Previous button
    const prevDisabled = page <= 1;
    html += `<button class="pagination-btn" ${prevDisabled ? 'disabled' : ''} onclick="goToPage('${type}', ${page - 1})">← Prev</button>`;

    // Page numbers (show if more than 1 page)
    if (total_pages > 1) {
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(total_pages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            html += `<button class="pagination-btn" onclick="goToPage('${type}', 1)">1</button>`;
            if (start > 2) html += '<span class="pagination-ellipsis">...</span>';
        }

        for (let i = start; i <= end; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="goToPage('${type}', ${i})">${i}</button>`;
        }

        if (end < total_pages) {
            if (end < total_pages - 1) html += '<span class="pagination-ellipsis">...</span>';
            html += `<button class="pagination-btn" onclick="goToPage('${type}', ${total_pages})">${total_pages}</button>`;
        }
    } else {
        // Single page - just show page 1
        html += '<button class="pagination-btn active" disabled>1</button>';
    }

    // Next button
    const nextDisabled = page >= total_pages;
    html += `<button class="pagination-btn" ${nextDisabled ? 'disabled' : ''} onclick="goToPage('${type}', ${page + 1})">Next →</button>`;

    html += '</div></div>';

    container.innerHTML = html;
}

function changePageSize(type, size) {
    state[type].pageSize = parseInt(size);
    state[type].page = 1; // Reset to first page when changing page size
    goToPage(type, 1);
}

function goToPage(type, page) {
    state[type].page = page;

    switch (type) {
        case 'products':
            loadProducts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// ===== Toast Notifications =====
function showToast(type, title, message) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    elements.toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ===== Utilities =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== System Monitor Functions =====
// J.620100.044.01: Alert notification
// J.620100.045.01: Resource monitoring

async function loadSystemData() {
    try {
        // Load all system data in parallel
        const [health, resources, metrics] = await Promise.all([
            systemApi.getHealth(),
            systemApi.getResources(),
            systemApi.getMetrics()
        ]);

        updateHealthBanner(health);
        updateAlerts(health.alerts || []);
        updateResources(resources);
        updateMetrics(metrics);

    } catch (error) {
        console.error('Failed to load system data:', error);
        showToast('error', 'Error', 'Failed to load system data');
    }
}

function updateHealthBanner(health) {
    const banner = document.getElementById('systemHealthBanner');
    if (!banner) return;

    // Remove all status classes
    banner.classList.remove('healthy', 'warning', 'critical');

    const icons = {
        healthy: '✅',
        warning: '⚠️',
        critical: '🚨'
    };

    const texts = {
        healthy: 'All systems operational',
        warning: 'Some systems need attention',
        critical: 'Critical issues detected'
    };

    banner.classList.add(health.status);
    banner.querySelector('.health-icon').textContent = icons[health.status] || '❓';
    banner.querySelector('.health-text').textContent = texts[health.status] || 'Unknown status';
}

function updateAlerts(alerts) {
    const section = document.getElementById('alertsSection');
    const list = document.getElementById('alertsList');

    if (!section || !list) return;

    if (alerts.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    list.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.level}">
            <span class="alert-message">${alert.message}</span>
            <span class="alert-time">${formatDateTime(alert.timestamp)}</span>
        </div>
    `).join('');

    // Show toast for critical alerts
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
        showToast('error', 'Critical Alert', criticalAlerts[0].message);
    }
}

function updateResources(resources) {
    // CPU
    const cpuPercent = resources.cpu?.percent || 0;
    document.getElementById('cpuUsage').textContent = `${cpuPercent.toFixed(1)}%`;
    const cpuProgress = document.getElementById('cpuProgress');
    cpuProgress.style.width = `${cpuPercent}%`;
    updateProgressClass(cpuProgress, cpuPercent);

    // Memory
    const memPercent = resources.memory?.percent || 0;
    document.getElementById('memoryUsage').textContent = `${memPercent.toFixed(1)}%`;
    const memProgress = document.getElementById('memoryProgress');
    memProgress.style.width = `${memPercent}%`;
    updateProgressClass(memProgress, memPercent);
    document.getElementById('memoryDetail').textContent =
        `${resources.memory?.used_gb || 0} / ${resources.memory?.total_gb || 0} GB`;

    // Disk
    const diskPercent = resources.disk?.percent || 0;
    document.getElementById('diskUsage').textContent = `${diskPercent.toFixed(1)}%`;
    const diskProgress = document.getElementById('diskProgress');
    diskProgress.style.width = `${diskPercent}%`;
    updateProgressClass(diskProgress, diskPercent);
    document.getElementById('diskDetail').textContent =
        `${resources.disk?.used_gb || 0} / ${resources.disk?.total_gb || 0} GB`;

    // Database status is from health check
    document.getElementById('dbStatus').textContent = 'Connected';
}

function updateProgressClass(element, percent) {
    element.classList.remove('warning', 'critical');
    if (percent > 90) {
        element.classList.add('critical');
    } else if (percent > 80) {
        element.classList.add('warning');
    }
}

function updateMetrics(metrics) {
    document.getElementById('appUptime').textContent = metrics.uptime?.formatted || '--';
    document.getElementById('totalRequests').textContent =
        (metrics.requests?.total || 0).toLocaleString();
    document.getElementById('errorRate').textContent =
        `${metrics.requests?.error_rate || 0}%`;
    document.getElementById('avgResponseTime').textContent =
        `${metrics.performance?.avg_response_time_ms || 0} ms`;
}

/**
 * Background System Health Check
 * Runs every 30 minutes and shows toast notifications for any alerts
 * Also updates the badge counter on System Monitor menu
 */
async function checkSystemAlerts() {
    // Only check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const health = await systemApi.getHealth();
        const alerts = health.alerts || [];

        // Update badge counter on System Monitor menu
        updateSystemAlertBadge(alerts.length);

        // Show toast notifications for alerts
        if (alerts.length > 0) {
            // Group by level
            const criticalAlerts = alerts.filter(a => a.level === 'critical');
            const warningAlerts = alerts.filter(a => a.level === 'warning');

            // Show critical alerts first
            criticalAlerts.forEach(alert => {
                showToast('error', '🚨 System Alert', alert.message);
            });

            // Show warning alerts (max 2 to avoid spam)
            warningAlerts.slice(0, 2).forEach(alert => {
                showToast('warning', '⚠️ Warning', alert.message);
            });
        }

        console.log(`[System Health] Status: ${health.status}, Alerts: ${alerts.length}`);

    } catch (error) {
        console.error('Background health check failed:', error);
        // Don't show toast for this error to avoid annoying users
    }
}

/**
 * Update the badge counter on System Monitor menu item
 */
function updateSystemAlertBadge(count) {
    const menuItem = document.querySelector('[data-page="system"]');
    if (!menuItem) return;

    // Remove existing badge
    const existingBadge = menuItem.querySelector('.alert-badge');
    if (existingBadge) {
        existingBadge.remove();
    }

    // Add new badge if there are alerts
    if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'alert-badge';
        badge.textContent = count;
        menuItem.appendChild(badge);
    }
}

