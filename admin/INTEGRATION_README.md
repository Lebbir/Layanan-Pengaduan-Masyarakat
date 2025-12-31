# Integrasi Backend-Frontend Admin Dashboard

## Ringkasan Perubahan

Dashboard admin telah diintegrasikan dengan backend API dan semua placeholder data dummy telah dihapus.

## 🔗 API Endpoints yang Digunakan

### 1. Statistics API
- **Endpoint**: `GET /api/laporan/statistics`
- **Fungsi**: Mengambil statistik laporan (total, pending, in progress, completed)
- **Digunakan di**: `admin.js` → `loadStatistics()`

### 2. All Reports API
- **Endpoint**: `GET /api/laporan/all`
- **Query Parameters**: 
  - `page`: nomor halaman
  - `limit`: jumlah data per halaman
  - `status`: filter berdasarkan status
  - `kategori`: filter berdasarkan kategori
  - `search`: pencarian
  - `sortBy`: field untuk sorting
  - `order`: urutan sorting (asc/desc)
- **Fungsi**: Mengambil daftar semua laporan dengan pagination
- **Digunakan di**: `admin.js` → `loadReports()`, `charts.js` → `loadChartData()`

### 3. Report Detail API
- **Endpoint**: `GET /api/laporan/:id`
- **Fungsi**: Mengambil detail satu laporan
- **Digunakan di**: `dashboard-reports.js` → `viewReport()`

## 📁 File yang Dimodifikasi

### 1. **admin/js/admin.js**
✅ Ditambahkan:
- Konfigurasi API base URL
- State management untuk pagination dan filtering
- Authentication check
- `loadStatistics()` - Load data statistik dari backend
- `loadReports()` - Load daftar laporan dari backend
- `renderReportsTable()` - Render tabel dengan data real
- `renderPagination()` - Dynamic pagination
- `changePage()` - Handler untuk navigasi halaman
- Debounced search function
- Dynamic filter dengan data dari backend
- `loadChartData()` - Load data untuk charts

### 2. **admin/js/dashboard-reports.js**
✅ Ditambahkan:
- Integrasi API untuk fetch detail laporan
- `viewReport()` async function dengan real data
- Display AI analysis (kategori_ai, sentimen_ai, keywords_ai)
- Dynamic attachment handling
- Proper error handling

❌ Dihapus:
- Hardcoded `reportsData` object

### 3. **admin/js/charts.js**
Ditambahkan:
- API configuration
- `updateChartsWithData()` - Update charts dengan data real dari backend
- Real-time counting untuk kategori, status, dan trend bulanan
- Date range filtering dengan fetch data dari API
- Label yang sesuai dengan kategori backend (Infrastruktur, Sosial, dll)

Dihapus:
- Hardcoded dummy data di chart initialization

### 4. **admin/index.html**
Diubah:
- Stats cards diubah dari hardcoded ke nilai 0 (akan diisi dari API)
- Filter select options dibersihkan (akan diisi dinamis)
- Table tbody dibersihkan, hanya loading message
- Pagination direset ke default
- Modal fields direset ke placeholder values

## 🔐 Authentication

Dashboard menggunakan token-based authentication:
- Token disimpan di `localStorage.adminToken`
- Setiap API call menyertakan header: `Authorization: Bearer {token}`
- Auto redirect ke login page jika token tidak ada

## Fitur yang Berfungsi

### Statistics Cards
- Total Submissions
- Pending
- In Progress  
- Resolved

### Charts
- **Category Chart** (Doughnut): Distribusi berdasarkan kategori
- **Status Chart** (Pie): Distribusi berdasarkan status
- **Trend Chart** (Line): Trend laporan bulanan

### Reports Table
- Pagination dinamis
- Search dengan debounce
- Filter berdasarkan status dan kategori
- Sorting
- Click to view detail

### Report Detail Modal
- Info lengkap laporan
- Tampilan analisis AI
- Attachment viewer
- Responsive

## Cara Penggunaan

1. **Start Backend Server**
   ```bash
   cd Backend
   node server.js
   ```

2. **Akses Admin Dashboard**
   - URL: `http://localhost:3000/admin/index.html`
   - Login dengan credentials admin
   - Dashboard akan otomatis load data dari API

## 🔧 Konfigurasi

Jika backend berjalan di port berbeda, ubah `API_BASE_URL` di:
- `admin/js/admin.js`
- `admin/js/dashboard-reports.js`
- `admin/js/charts.js`

```javascript
const API_BASE_URL = 'http://localhost:YOUR_PORT/api';
```

## 📊 Data Flow

```
Backend API
    ↓
fetch() dengan Authorization header
    ↓
Process & Format Data
    ↓
Update DOM Elements
    ↓
User Interface
```

## ⚠️ Notes

- Semua placeholder data dummy telah dihapus
- Data sekarang 100% dari backend
- Error handling sudah diterapkan
- Loading states ditampilkan saat fetch data
- CORS harus dikonfigurasi di backend

## 🐛 Troubleshooting

**Masalah**: Data tidak muncul
- ✅ Cek console browser untuk error
- ✅ Pastikan backend server running
- ✅ Cek token tersimpan di localStorage
- ✅ Verify CORS settings di backend

**Masalah**: Charts kosong
- ✅ Pastikan ada data laporan di database
- ✅ Check console untuk API errors
- ✅ Reload page setelah backend siap

