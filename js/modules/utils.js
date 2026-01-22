/**
 * Utils Module
 * 
 * Unit Kompetensi:
 * - J.620100.014.01: Menerapkan metode dan praktik penggunaan kembali (Reusable) subrutin
 * - J.620100.015.01: Menyusun fungsi dalam organisasi yang rapi
 * 
 * Module ini berisi utility functions yang digunakan di seluruh aplikasi.
 */

// ===== Toast Notifications =====
/**
 * Show toast notification
 * @param {string} type - success, error, warning, info
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showToast(type, title, message) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ===== Pagination =====
/**
 * Render pagination controls
 * @param {string} type - Entity type (products, categories, etc)
 * @param {object} data - Pagination data { total, page, page_size, total_pages }
 */
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

/**
 * Change page size for a specific entity type
 * @param {string} type - Entity type
 * @param {number} size - New page size
 */
function changePageSize(type, size) {
    state[type].pageSize = parseInt(size);
    state[type].page = 1; // Reset to first page
    goToPage(type, 1);
}

/**
 * Navigate to specific page
 * @param {string} type - Entity type
 * @param {number} page - Page number
 */
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

// ===== Debounce Utility =====
/**
 * Debounce function to limit execution rate
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {function} Debounced function
 */
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

// ===== Stock Status Helpers =====
/**
 * Get CSS class for stock status badge
 * @param {string} status - Stock status
 * @returns {string} CSS class
 */
function getStockStatusClass(status) {
    switch (status) {
        case 'in_stock': return 'badge-success';
        case 'low_stock': return 'badge-warning';
        case 'out_of_stock': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

/**
 * Get display text for stock status
 * @param {string} status - Stock status
 * @returns {string} Display text
 */
function getStockStatusText(status) {
    switch (status) {
        case 'in_stock': return 'In Stock';
        case 'low_stock': return 'Low Stock';
        case 'out_of_stock': return 'Out of Stock';
        default: return status;
    }
}

// Export functions for global access (non-module approach)
window.showToast = showToast;
window.renderPagination = renderPagination;
window.changePageSize = changePageSize;
window.goToPage = goToPage;
window.debounce = debounce;
window.getStockStatusClass = getStockStatusClass;
window.getStockStatusText = getStockStatusText;
