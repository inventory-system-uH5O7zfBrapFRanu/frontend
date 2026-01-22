/**
 * API Client Module
 * 
 * Unit Kompetensi:
 * - J.620100.019.02: Menggunakan library atau komponen pre-existing
 * - J.620100.016.01: Menulis kode dengan prinsip sesuai guidelines
 * 
 * Modul ini menangani semua komunikasi dengan backend API.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';
const HEALTH_URL = 'http://localhost:8000/health';

/**
 * API Client Class
 * 
 * Menyediakan interface untuk berkomunikasi dengan backend API.
 * Menggunakan Fetch API dengan error handling yang konsisten.
 */
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic request method
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise<object>} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        // Get token from localStorage
        const token = localStorage.getItem('auth_token');

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Add Authorization header if token exists
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Handle no content response
            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(
                    data.detail || 'An error occurred',
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                'Network error. Please check your connection.',
                0,
                null
            );
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

/**
 * Custom API Error Class
 */
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Create API client instance
const api = new ApiClient(API_BASE_URL);

/**
 * Categories API
 */
const categoriesApi = {
    getAll: (params = {}) => api.get('/categories', params),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

/**
 * Suppliers API
 */
const suppliersApi = {
    getAll: (params = {}) => api.get('/suppliers', params),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
};

/**
 * Products API
 */
const productsApi = {
    getAll: (params = {}) => api.get('/products', params),
    getById: (id) => api.get(`/products/${id}`),
    getBySku: (sku) => api.get(`/products/sku/${sku}`),
    getLowStock: () => api.get('/products/low-stock'),
    create: (data, stockParams = {}) => api.post('/products', data, stockParams),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

/**
 * Inventory API
 */
const inventoryApi = {
    getAll: (params = {}) => api.get('/inventory', params),
    getSummary: () => api.get('/inventory/summary'),
    getLowStock: () => api.get('/inventory/low-stock'),
    getById: (id) => api.get(`/inventory/${id}`),
    getByProduct: (productId) => api.get(`/inventory/product/${productId}`),
    update: (id, data) => api.put(`/inventory/${id}`, data),
    adjustStock: (productId, adjustment) =>
        api.post(`/inventory/product/${productId}/adjust`, adjustment),
};

/**
 * Activity Logs API
 */
const logsApi = {
    getAll: (params = {}) => api.get('/logs', params),
    getRecent: (limit = 10) => api.get('/logs/recent', { limit }),
    getMy: (params = {}) => api.get('/logs/my', params),
    getByUser: (userId, params = {}) => api.get(`/logs/user/${userId}`, params),
};

/**
 * Health Check API
 */
const healthApi = {
    check: async () => {
        try {
            const response = await fetch(HEALTH_URL);
            return await response.json();
        } catch (error) {
            return { status: 'offline' };
        }
    },
};

/**
 * System Monitor API
 * J.620100.044.01: Alert notification
 * J.620100.045.01: Resource monitoring
 */
const systemApi = {
    getHealth: () => api.get('/system/health'),
    getResources: () => api.get('/system/resources'),
    getAlerts: () => api.get('/system/alerts'),
    getMetrics: () => api.get('/system/metrics'),
};

/**
 * Format currency to IDR
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date to locale string
 * @param {string} dateString 
 * @returns {string}
 */
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format date time
 * @param {string} dateString 
 * @returns {string}
 */
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get stock status badge class
 * @param {string} status 
 * @returns {string}
 */
function getStockStatusClass(status) {
    switch (status) {
        case 'in_stock':
            return 'badge-success';
        case 'low_stock':
            return 'badge-warning';
        case 'out_of_stock':
            return 'badge-danger';
        default:
            return 'badge-secondary';
    }
}

/**
 * Get stock status text
 * @param {string} status 
 * @returns {string}
 */
function getStockStatusText(status) {
    switch (status) {
        case 'in_stock':
            return 'In Stock';
        case 'low_stock':
            return 'Low Stock';
        case 'out_of_stock':
            return 'Out of Stock';
        default:
            return 'Unknown';
    }
}
