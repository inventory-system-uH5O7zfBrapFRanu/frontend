# Inventory Management System - Frontend

Frontend aplikasi Inventory Management System dengan tema Modern SaaS.
Dibuat dengan HTML, CSS, dan JavaScript (Vanilla) tanpa framework.

## 🌐 Live Demo

- **Application**: http://129.212.228.132/
- **Backend API**: http://129.212.228.132/docs

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Backend API running (lihat Backend README)

### Running Locally

**1. Menggunakan Live Server (VSCode Extension)**
- Install extension "Live Server"
- Klik kanan pada `index.html` → "Open with Live Server"

**2. Menggunakan Python HTTP Server**
```bash
cd frontend
python -m http.server 5500
```
Buka `http://localhost:5500`

**3. Menggunakan Node.js HTTP Server**
```bash
npx serve .
```

### Configuration

API endpoint dikonfigurasi di `js/api.js`:

```javascript
// Development (local)
const API_BASE_URL = 'http://localhost:8000/api/v1';
const HEALTH_URL = 'http://localhost:8000/health';

// Production (di droplet)
const API_BASE_URL = '/api/v1';
const HEALTH_URL = '/health';
```

## 📁 Project Structure

```
frontend/
├── index.html          # Main HTML file (SPA)
├── css/
│   ├── style.css       # Main styles & layout
│   └── components.css  # Component styles (modals, toasts, forms)
├── js/
│   ├── api.js          # API client module
│   ├── app.js          # Main application logic
│   └── auth.js         # Authentication module
└── README.md
```

## ✨ Features

### 🔐 Authentication
- User registration
- User login with JWT tokens
- Automatic token refresh
- Secure logout with token blacklist

### 📊 Dashboard
- Overview statistics cards
  - Total Products
  - Total Categories
  - Total Suppliers
  - Low Stock Alerts
- Recent products list
- Low stock alerts with severity levels
- Quick action buttons
- API health status indicator

### 📦 Products Management
- List products with pagination
- Search products by name/SKU
- Filter by category
- Filter by stock status (all, low stock, out of stock)
- Create new products
- Edit existing products
- Delete products
- Stock adjustment modal

### 🏷️ Categories Management
- List categories with pagination
- Search categories
- Create new categories
- Edit categories
- Delete categories
- View product count per category

### 🏢 Suppliers Management
- List suppliers with pagination
- Search suppliers
- Create new suppliers
- Edit suppliers (name, contact, email, phone, address)
- Delete suppliers
- View product count per supplier

### 📋 Inventory Management
- List all inventory items with pagination
- Filter by stock status
- Inventory summary statistics
  - Total Items
  - Total Quantity
  - Low Stock Count
  - Out of Stock Count
- Edit location
- Edit minimum quantity (min_quantity)
- Stock adjustment (add, remove, set quantity)

### 📝 Activity Logs
- View all system activities
- Filter by action type (CREATE, UPDATE, DELETE)
- Filter by entity type (product, category, supplier)
- Filter by time range (24h, 7 days, 30 days)
- Pagination support

### 🖥️ System Monitor
- System health status banner
- Active alerts with severity levels (critical, warning)
- Resource usage monitoring
  - CPU usage with progress bar
  - Memory usage with progress bar
  - Disk usage with progress bar
- Application metrics
  - Uptime
  - Total Requests
  - Error Rate
  - Average Response Time
- Background alert checking (every 30 minutes)
- Alert badge on navigation

## 🎨 Design Features

### Modern SaaS Light Theme
- **Primary Color**: Indigo (#4F46E5)
- **Secondary Color**: Soft Violet (#818CF8)
- **Background**: Ghost White (#F3F4F6)
- **Accent**: Sky Blue (#0EA5E9)

### UI Components
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Collapsible Sidebar**: With hamburger menu on mobile
- **Card-based Design**: Clean and modern cards
- **Data Tables**: With sorting and pagination
- **Modal Dialogs**: For create/edit operations
- **Toast Notifications**: Success, error, warning, info
- **Badge Counters**: For alerts and status
- **Progress Bars**: For resource usage display
- **Loading States**: Skeleton loading indicators

### Pagination
- Shows "Showing X-Y of Z items"
- Page size selector (5, 10, 20, 50, 100)
- Previous/Next navigation
- Page number buttons with ellipsis

## 🔧 API Integration

Frontend uses the `ApiClient` class for all API calls:

```javascript
// Products API
productsApi.getAll(params)    // GET /products
productsApi.getById(id)       // GET /products/{id}
productsApi.create(data)      // POST /products
productsApi.update(id, data)  // PUT /products/{id}
productsApi.delete(id)        // DELETE /products/{id}

// Categories API
categoriesApi.getAll(params)
categoriesApi.create(data)
categoriesApi.update(id, data)
categoriesApi.delete(id)

// Suppliers API
suppliersApi.getAll(params)
suppliersApi.create(data)
suppliersApi.update(id, data)
suppliersApi.delete(id)

// Inventory API
inventoryApi.getAll(params)
inventoryApi.getSummary()
inventoryApi.update(id, data)
inventoryApi.adjustStock(productId, data)

// System API
systemApi.getHealth()
systemApi.getResources()
systemApi.getMetrics()
```

## 📝 Pages & Navigation

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `dashboard` | Overview & statistics |
| Products | `products` | Product management |
| Categories | `categories` | Category management |
| Suppliers | `suppliers` | Supplier management |
| Inventory | `inventory` | Stock management |
| Activity Log | `logs` | System activity logs |
| System Monitor | `system` | Health & resource monitoring |

## 🛠️ Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern features (Grid, Flexbox, CSS Variables)
- **JavaScript (ES6+)**: Vanilla JS, no frameworks
- **Fetch API**: For HTTP requests

## 🚀 Deployment

### Deploy ke DigitalOcean Droplet

1. Clone repository ke droplet:
```bash
cd /var/www
git clone https://github.com/inventory-system-uH5O7zfBrapFRanu/frontend.git
cd frontend
git checkout dev
```

2. Update API URL untuk production:
```bash
nano js/api.js
```
Ubah ke:
```javascript
const API_BASE_URL = '/api/v1';
const HEALTH_URL = '/health';
```

3. Setup Nginx untuk serve static files (lihat PanduanDeployment.md)

### Update Frontend di Droplet

```bash
cd /var/www/frontend
git pull origin dev
```
