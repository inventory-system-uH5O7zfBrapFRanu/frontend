/**
 * Main Application Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.006.01: Merancang user experience
 * - J.620100.015.01: Menyusun fungsi dalam organisasi yang rapi
 * 
 * Module ini adalah entry point aplikasi yang mengkoordinasikan
 * semua module lainnya.
 */

// ===== Global State =====
const state = {
    currentPage: 'dashboard',
    editingId: null,
    products: { items: [], total: 0, page: 1, pageSize: 10 },
    categories: { items: [], total: 0, page: 1, pageSize: 10 },
    suppliers: { items: [], total: 0, page: 1, pageSize: 10 },
    inventory: { items: [], total: 0, page: 1, pageSize: 10 },
    logs: { items: [], total: 0, page: 1, pageSize: 10 },
};

// ===== DOM Elements =====
const elements = {
    pages: document.querySelectorAll('.page'),
    navLinks: document.querySelectorAll('[data-page]'),
    modalOverlay: document.getElementById('modalOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    pageTitle: document.getElementById('pageTitle'),
    apiStatus: document.getElementById('apiStatus'),
};

// Make state and elements globally accessible
window.state = state;
window.elements = elements;

/**
 * Initialize navigation handling
 */
function initNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });

    // Handle modal overlay click
    elements.modalOverlay?.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            if (typeof closeModal === 'function') {
                closeModal();
            }
        }
    });
}

/**
 * Initialize event listeners - called after all modules loaded
 */
function initEventListeners() {
    // Product search with debounce
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        productSearch.addEventListener('input', window.debounce(() => {
            state.products.page = 1;
            if (typeof loadProducts === 'function') loadProducts();
        }, 300));
    }

    // Category filter
    document.getElementById('categoryFilter')?.addEventListener('change', () => {
        state.products.page = 1;
        if (typeof loadProducts === 'function') loadProducts();
    });

    // Stock filter
    document.getElementById('stockFilter')?.addEventListener('change', () => {
        state.products.page = 1;
        if (typeof loadProducts === 'function') loadProducts();
    });

    // Category search
    const categorySearch = document.getElementById('categorySearch');
    if (categorySearch) {
        categorySearch.addEventListener('input', window.debounce(() => {
            state.categories.page = 1;
            if (typeof loadCategories === 'function') loadCategories();
        }, 300));
    }

    // Supplier search
    const supplierSearch = document.getElementById('supplierSearch');
    if (supplierSearch) {
        supplierSearch.addEventListener('input', window.debounce(() => {
            state.suppliers.page = 1;
            if (typeof loadSuppliers === 'function') loadSuppliers();
        }, 300));
    }
}

/**
 * Navigate to a page
 * @param {string} page - Page name
 */
function navigateTo(page) {
    console.log('[App] Navigating to:', page);
    state.currentPage = page;

    // Update navigation
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });

    // Update pages - IDs in HTML are like 'dashboardPage', 'productsPage', etc.
    elements.pages.forEach(p => {
        p.classList.toggle('active', p.id === page + 'Page');
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        categories: 'Categories',
        suppliers: 'Suppliers',
        inventory: 'Inventory',
        logs: 'Activity Log',
        system: 'System Monitor',
    };
    if (elements.pageTitle) {
        elements.pageTitle.textContent = titles[page] || 'Dashboard';
    }

    // Load page data - check if functions exist
    switch (page) {
        case 'dashboard':
            if (typeof loadDashboard === 'function') loadDashboard();
            break;
        case 'products':
            if (typeof loadProducts === 'function') loadProducts();
            if (typeof loadCategoryOptions === 'function') loadCategoryOptions();
            break;
        case 'categories':
            if (typeof loadCategories === 'function') loadCategories();
            break;
        case 'suppliers':
            if (typeof loadSuppliers === 'function') loadSuppliers();
            break;
        case 'inventory':
            if (typeof loadInventory === 'function') loadInventory();
            if (typeof loadInventorySummary === 'function') loadInventorySummary();
            break;
        case 'logs':
            if (typeof loadLogs === 'function') loadLogs();
            break;
        case 'system':
            if (typeof loadSystemData === 'function') loadSystemData();
            break;
    }
}

/**
 * Refresh current page
 */
function refreshCurrentPage() {
    navigateTo(state.currentPage);
    if (typeof showToast === 'function') {
        showToast('success', 'Refreshed', 'Data has been refreshed');
    }
}

/**
 * Check API health status
 */
async function checkApiHealth() {
    const indicator = document.getElementById('apiStatus');
    if (!indicator) return;

    const statusText = indicator.querySelector('span:last-child') || indicator;

    try {
        const health = await fetch(HEALTH_URL);
        if (health.ok) {
            indicator.classList.remove('offline');
            indicator.classList.add('online');
            indicator.title = 'API Online';
            statusText.textContent = 'API Online';
        } else {
            throw new Error('API not healthy');
        }
    } catch (error) {
        indicator.classList.remove('online');
        indicator.classList.add('offline');
        indicator.title = 'API Offline';
        statusText.textContent = 'API Offline';
    }
}

/**
 * Initialize app - called by init.js after all modules loaded
 */
function initApp() {
    console.log('[App] Initializing application...');
    initNavigation();
    initEventListeners();
    checkApiHealth();

    // Background system health check
    setTimeout(() => {
        if (typeof checkSystemAlerts === 'function') {
            checkSystemAlerts();
            setInterval(checkSystemAlerts, 30 * 60 * 1000);
        }
    }, 5000);

    console.log('[App] Application initialized');
}

// Export for global access
window.navigateTo = navigateTo;
window.refreshCurrentPage = refreshCurrentPage;
window.checkApiHealth = checkApiHealth;
window.initApp = initApp;
