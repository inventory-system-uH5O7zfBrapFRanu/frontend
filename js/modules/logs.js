/**
 * Activity Logs Module
 * 
 * Unit Kompetensi:
 * - J.620100.046.01: Mengimplementasikan Fitur Logging Aplikasi
 * 
 * Module ini menangani tampilan Activity Logs.
 */

/**
 * Format datetime to local string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted datetime
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Load activity logs with pagination and filters
 */
async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

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

/**
 * Render logs table
 * @param {Array} logs - Array of activity logs
 */
function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

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

/**
 * Get badge class for action type
 * @param {string} action - Action type
 * @returns {string} Badge CSS class
 */
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

// Export functions for global access
window.loadLogs = loadLogs;
window.renderLogsTable = renderLogsTable;
window.getActionBadgeClass = getActionBadgeClass;
window.formatDateTime = formatDateTime;
