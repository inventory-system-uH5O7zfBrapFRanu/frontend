/**
 * System Monitor Module
 * 
 * Unit Kompetensi:
 * - J.620100.044.01: Menerapkan alert notification jika aplikasi bermasalah
 * - J.620100.045.01: Melakukan pemantauan resource yang digunakan aplikasi
 * 
 * Module ini menangani System Monitor untuk health check dan resource monitoring.
 */

/**
 * Load all system monitoring data
 */
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

/**
 * Update health status banner
 * @param {object} health - Health status object
 */
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

/**
 * Update alerts list
 * @param {Array} alerts - Array of alert objects
 */
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

/**
 * Update resource usage displays
 * @param {object} resources - Resource data
 */
function updateResources(resources) {
    // CPU
    const cpuPercent = resources.cpu?.percent || 0;
    const cpuUsage = document.getElementById('cpuUsage');
    const cpuProgress = document.getElementById('cpuProgress');
    if (cpuUsage) cpuUsage.textContent = `${cpuPercent.toFixed(1)}%`;
    if (cpuProgress) {
        cpuProgress.style.width = `${cpuPercent}%`;
        updateProgressClass(cpuProgress, cpuPercent);
    }

    // Memory
    const memPercent = resources.memory?.percent || 0;
    const memoryUsage = document.getElementById('memoryUsage');
    const memoryProgress = document.getElementById('memoryProgress');
    const memoryDetail = document.getElementById('memoryDetail');
    if (memoryUsage) memoryUsage.textContent = `${memPercent.toFixed(1)}%`;
    if (memoryProgress) {
        memoryProgress.style.width = `${memPercent}%`;
        updateProgressClass(memoryProgress, memPercent);
    }
    if (memoryDetail) {
        memoryDetail.textContent = `${resources.memory?.used_gb || 0} / ${resources.memory?.total_gb || 0} GB`;
    }

    // Disk
    const diskPercent = resources.disk?.percent || 0;
    const diskUsage = document.getElementById('diskUsage');
    const diskProgress = document.getElementById('diskProgress');
    const diskDetail = document.getElementById('diskDetail');
    if (diskUsage) diskUsage.textContent = `${diskPercent.toFixed(1)}%`;
    if (diskProgress) {
        diskProgress.style.width = `${diskPercent}%`;
        updateProgressClass(diskProgress, diskPercent);
    }
    if (diskDetail) {
        diskDetail.textContent = `${resources.disk?.used_gb || 0} / ${resources.disk?.total_gb || 0} GB`;
    }

    // Database status
    const dbStatus = document.getElementById('dbStatus');
    if (dbStatus) dbStatus.textContent = 'Connected';
}

/**
 * Update progress bar class based on percent
 * @param {HTMLElement} element - Progress bar element
 * @param {number} percent - Usage percentage
 */
function updateProgressClass(element, percent) {
    element.classList.remove('warning', 'critical');
    if (percent > 90) {
        element.classList.add('critical');
    } else if (percent > 80) {
        element.classList.add('warning');
    }
}

/**
 * Update metrics display
 * @param {object} metrics - Metrics data
 */
function updateMetrics(metrics) {
    const elements = {
        uptime: document.getElementById('appUptime'),
        requests: document.getElementById('totalRequests'),
        errorRate: document.getElementById('errorRate'),
        responseTime: document.getElementById('avgResponseTime')
    };

    if (elements.uptime) elements.uptime.textContent = metrics.uptime?.formatted || '--';
    if (elements.requests) elements.requests.textContent = (metrics.requests?.total || 0).toLocaleString();
    if (elements.errorRate) elements.errorRate.textContent = `${metrics.requests?.error_rate || 0}%`;
    if (elements.responseTime) elements.responseTime.textContent = `${metrics.performance?.avg_response_time_ms || 0} ms`;
}

/**
 * Background System Health Check
 * Runs periodically and shows toast notifications for any alerts
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
            const criticalAlerts = alerts.filter(a => a.level === 'critical');
            const warningAlerts = alerts.filter(a => a.level === 'warning');

            criticalAlerts.forEach(alert => {
                showToast('error', '🚨 System Alert', alert.message);
            });

            warningAlerts.slice(0, 2).forEach(alert => {
                showToast('warning', '⚠️ Warning', alert.message);
            });
        }

        console.log(`[System Health] Status: ${health.status}, Alerts: ${alerts.length}`);

    } catch (error) {
        console.error('Background health check failed:', error);
    }
}

/**
 * Update the badge counter on System Monitor menu item
 * @param {number} count - Number of alerts
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

// Export functions for global access
window.loadSystemData = loadSystemData;
window.updateHealthBanner = updateHealthBanner;
window.updateAlerts = updateAlerts;
window.updateResources = updateResources;
window.updateProgressClass = updateProgressClass;
window.updateMetrics = updateMetrics;
window.checkSystemAlerts = checkSystemAlerts;
window.updateSystemAlertBadge = updateSystemAlertBadge;
