/**
 * Authentication Module
 * 
 * Unit Kompetensi:
 * - J.62090.011.01: Menerapkan Standar Keamanan Informasi
 * - J.620100.005.02: Mengimplementasikan User Interface
 * 
 * Modul ini menangani autentikasi di frontend.
 */

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/**
 * Authentication API
 */
const authApi = {
    /**
     * Login user
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<object>} Token response
     */
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        return response.json();
    },

    /**
     * Register new user
     * @param {object} userData 
     * @returns {Promise<object>} User response
     */
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        return response.json();
    },

    /**
     * Get current user profile
     * @returns {Promise<object>} User profile
     */
    getProfile: async () => {
        const token = AuthManager.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                AuthManager.logout();
                throw new Error('Session expired');
            }
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get profile');
        }

        return response.json();
    },

    /**
     * Change password
     * @param {string} currentPassword 
     * @param {string} newPassword 
     * @returns {Promise<object>}
     */
    changePassword: async (currentPassword, newPassword) => {
        const token = AuthManager.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change password');
        }

        return response.json();
    },
};

/**
 * Authentication Manager
 * 
 * Mengelola state autentikasi di frontend.
 */
const AuthManager = {
    /**
     * Store token after login
     * @param {string} token 
     * @param {object} user 
     */
    setAuth: (token, user) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        if (user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        }
    },

    /**
     * Get stored token
     * @returns {string|null}
     */
    getToken: () => {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get stored user
     * @returns {object|null}
     */
    getUser: () => {
        const userStr = localStorage.getItem(AUTH_USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isAuthenticated: () => {
        return !!AuthManager.getToken();
    },

    /**
     * Logout user
     * Calls server-side logout then clears local storage
     */
    logout: async () => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);

        // Call server-side logout if token exists
        if (token) {
            try {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.warn('Server logout failed:', error);
                // Continue with local logout even if server call fails
            }
        }

        // Clear local storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
    },

    /**
     * Login and store credentials
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<object>}
     */
    login: async (username, password) => {
        const tokenResponse = await authApi.login(username, password);
        AuthManager.setAuth(tokenResponse.access_token, null);

        // Fetch user profile
        try {
            const user = await authApi.getProfile();
            AuthManager.setAuth(tokenResponse.access_token, user);
            return user;
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            return tokenResponse;
        }
    },
};

/**
 * Add authorization header to API requests
 * @param {object} options 
 * @returns {object}
 */
function addAuthHeader(options = {}) {
    const token = AuthManager.getToken();
    if (token) {
        return {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        };
    }
    return options;
}

/**
 * Login Form Handler
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('loginError');

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-small"></span> Logging in...';
        errorDiv.style.display = 'none';

        try {
            const user = await AuthManager.login(username, password);
            showToast('Login berhasil!', 'success');

            // Hide login modal and show dashboard
            hideLoginModal();
            showDashboard();
            updateAuthUI();

            // Reload dashboard data
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
        }
    });
}

/**
 * Register Form Handler
 */
function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const fullName = document.getElementById('registerFullName').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('registerError');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-small"></span> Registering...';
        errorDiv.style.display = 'none';

        try {
            await authApi.register({
                email,
                username,
                password,
                full_name: fullName,
            });

            showToast('Registrasi berhasil! Silakan login.', 'success');

            // Switch to login form
            showLoginForm();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Register';
        }
    });
}

/**
 * Show login modal
 */
function showLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        showLoginForm();
    }
}

/**
 * Hide login modal
 */
function hideLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Show login form
 */
function showLoginForm() {
    document.getElementById('loginFormContainer').style.display = 'block';
    document.getElementById('registerFormContainer').style.display = 'none';
}

/**
 * Show register form
 */
function showRegisterForm() {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
}

/**
 * Show dashboard (after login)
 */
function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('sidebar').classList.remove('hidden');
}

/**
 * Show login page (hide dashboard)
 */
function showAuthPage() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('sidebar').classList.add('hidden');
}

/**
 * Update UI based on auth state
 */
function updateAuthUI() {
    const user = AuthManager.getUser();
    const userNameEl = document.getElementById('currentUserName');
    const userEmailEl = document.getElementById('currentUserEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        if (userNameEl) userNameEl.textContent = user.full_name || user.username;
        if (userEmailEl) userEmailEl.textContent = user.email;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await AuthManager.logout();
            showAuthPage();
            showToast('Logged out successfully', 'info');
        });
    }
}

/**
 * Check authentication on page load
 */
function checkAuth() {
    if (AuthManager.isAuthenticated()) {
        showDashboard();
        updateAuthUI();

        // Verify token is still valid
        authApi.getProfile()
            .then(user => {
                AuthManager.setAuth(AuthManager.getToken(), user);
                updateAuthUI();
                // Load dashboard data after successful auth verification
                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
            })
            .catch(() => {
                AuthManager.logout();
                showAuthPage();
            });
    } else {
        showAuthPage();
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initRegisterForm();
    checkAuth();
});
