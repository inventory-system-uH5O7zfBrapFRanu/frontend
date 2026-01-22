/**
 * Categories Module
 * 
 * Unit Kompetensi:
 * - J.620100.005.02: Mengimplementasikan User Interface
 * - J.620100.022.02: Mengimplementasikan Algoritma Pemrograman
 * 
 * Module ini menangani semua fungsi CRUD untuk Categories.
 */

/**
 * Format date to local string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Load categories with pagination
 */
async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

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

/**
 * Render categories table
 * @param {Array} categories - Array of categories
 */
function renderCategoriesTable(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;

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

/**
 * Edit category - load data and open modal
 * @param {number} id - Category ID
 */
async function editCategory(id) {
    try {
        state.editingId = id;
        const category = await categoriesApi.getById(id);

        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';

        document.getElementById('categoryModalTitle').textContent = 'Edit Category';
        openModal('category');
    } catch (error) {
        console.error('Error loading category:', error);
        showToast('error', 'Error', 'Failed to load category');
    }
}

/**
 * Save category (create or update)
 * @param {Event} event - Form submit event
 */
async function saveCategory(event) {
    event.preventDefault();

    const formData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value || null,
    };

    try {
        if (state.editingId) {
            await categoriesApi.update(state.editingId, formData);
            showToast('success', 'Success', 'Category updated successfully');
        } else {
            await categoriesApi.create(formData);
            showToast('success', 'Success', 'Category created successfully');
        }

        closeModal();
        loadCategories();
        loadCategoryOptions();
        loadDashboard();
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('error', 'Error', error.message);
    }
}

// Export functions for global access
window.loadCategories = loadCategories;
window.renderCategoriesTable = renderCategoriesTable;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.formatDate = formatDate;
