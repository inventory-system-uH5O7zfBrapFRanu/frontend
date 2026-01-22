/**
 * Dashboard Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.006.01: Merancang user experience
 * 
 * Module ini menangani semua fungsi terkait halaman Dashboard.
 */

/**
 * Format currency to IDR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

/**
 * Load dashboard data
 * Fetches summary statistics and renders dashboard components
 */
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

/**
 * Render recent products table on dashboard
 * @param {Array} products - Array of products
 */
function renderRecentProducts(products) {
    const tbody = document.getElementById('recentProductsTable');
    if (!tbody) return;

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

/**
 * Render low stock alerts on dashboard
 * @param {Array} alerts - Array of low stock alerts
 */
function renderLowStockAlerts(alerts) {
    const container = document.getElementById('lowStockAlerts');
    if (!container) return;

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

// Export functions for global access
window.loadDashboard = loadDashboard;
window.renderRecentProducts = renderRecentProducts;
window.renderLowStockAlerts = renderLowStockAlerts;
window.formatCurrency = formatCurrency;
