# Inventory Management System - Frontend

Modul Frontend untuk sistem inventaris berbasis microservices.
Frontend ini dibuat dengan HTML, CSS, dan JavaScript (Vanilla) tanpa framework.

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Backend API running at `http://localhost:8000`

### Running the Frontend

1. **Menggunakan Live Server (VSCode Extension)**
   - Install extension "Live Server"
   - Klik kanan pada `index.html` → "Open with Live Server"

2. **Menggunakan Python HTTP Server**
   ```bash
   cd frontend
   python -m http.server 5500
   ```
   Buka `http://localhost:5500`

3. **Menggunakan Node.js HTTP Server**
   ```bash
   npx serve .
   ```

## 📁 Project Structure

```
frontend/
├── index.html          # Main HTML file
├── css/
│   ├── style.css       # Main styles
│   └── components.css  # Component styles (modal, toast, forms)
├── js/
│   ├── api.js          # API client module
│   └── app.js          # Main application logic
└── README.md
```

## ✨ Features

### Dashboard
- Overview statistics (products, categories, suppliers, low stock)
- Recent products list
- Low stock alerts
- Quick action buttons

### Products Management
- List all products with pagination
- Search and filter products
- Create, edit, and delete products
- Advanced filtering (by category, stock status, price range)

### Categories Management
- List all categories
- Create, edit, and delete categories
- View product count per category

### Suppliers Management
- List all suppliers
- Create, edit, and delete suppliers
- View product count per supplier

### Inventory Management
- View all inventory items
- Inventory summary statistics
- Low stock alerts with severity levels
- Stock adjustment (add, remove, set quantity)

## 🎨 Design Features

- **Dark Theme**: Modern dark mode design
- **Responsive**: Works on desktop, tablet, and mobile
- **Glassmorphism**: Modern glass effect elements
- **Animations**: Smooth transitions and micro-animations
- **Toast Notifications**: Feedback for user actions

## 🔧 Configuration

API endpoint dapat dikonfigurasi di `js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000/api/v1';
```

## 📝 Unit Kompetensi yang Diimplementasikan

| Kode Unit | Judul | Implementasi |
|-----------|-------|--------------|
| J.620100.005.02 | Mengimplementasikan User Interface | Complete dashboard UI |
| J.620100.006.01 | Merancang user experience | UX dengan feedback visual |
| J.620100.016.01 | Menulis kode sesuai guidelines | Clean code JavaScript |
| J.620100.019.02 | Menggunakan library pre-existing | Fetch API, modern CSS |

## 🔐 API Integration

Frontend berkomunikasi dengan backend melalui REST API:

- **GET** - Fetch data
- **POST** - Create new records
- **PUT** - Update existing records
- **DELETE** - Remove records

Semua request dan response menggunakan format JSON.

## 📄 License

This project is for BNSP certification purposes.
