// Admin Panel - API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// State Management
let allReportsData = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    status: '',
    kategori: '',
    search: ''
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initSidebar();
    initSearch();
    initFilters();
    initClickHandlers();
    
    // Initialize charts (from charts.js)
    if (typeof initCharts === 'function') {
        initCharts();
    }
    
    // Initialize date filters (from charts.js)
    if (typeof initDateFilters === 'function') {
        initDateFilters();
    }
    
    // Load data from backend
    loadStatistics();
    loadReports();
    loadChartData();
});

// Sidebar & Mobile Menu
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function initSidebar() {
    if (window.innerWidth <= 1024) createMobileMenu();
    
    window.addEventListener('resize', () => {
        const btn = document.querySelector('.mobile-menu-btn');
        if (window.innerWidth <= 1024 && !btn) {
            createMobileMenu();
        } else if (window.innerWidth > 1024 && btn) {
            btn.remove();
            document.getElementById('sidebar').classList.remove('active');
        }
    });
}

function createMobileMenu() {
    const topBar = document.querySelector('.top-bar');
    const sidebar = document.getElementById('sidebar');
    
    const btn = document.createElement('button');
    btn.className = 'mobile-menu-btn';
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    
    topBar.insertBefore(btn, topBar.firstChild);
    
    btn.onclick = () => sidebar.classList.toggle('active');
    
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Search
function initSearch() {
    const input = document.querySelector('.search-box input');
    input.addEventListener('input', debounce((e) => {
        currentFilters.search = e.target.value.trim();
        currentPage = 1;
        loadReports();
    }, 500));
}

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

// Load Statistics from Backend
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/laporan/statistics`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load statistics');
        
        const result = await response.json();
        const stats = result.data;
        
        // Update stat cards
        document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-value').textContent = stats.total;
        document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-value').textContent = stats.byStatus.pending;
        document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-value').textContent = stats.byStatus.inProgress;
        document.querySelector('.stats-grid .stat-card:nth-child(4) .stat-value').textContent = stats.byStatus.completed;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load Reports from Backend
async function loadReports() {
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 9,
            sortBy: 'createdAt',
            order: 'desc'
        });
        
        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.kategori) params.append('kategori', currentFilters.kategori);
        if (currentFilters.search) params.append('search', currentFilters.search);
        
        const response = await fetch(`${API_BASE_URL}/laporan/all?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load reports');
        
        const result = await response.json();
        allReportsData = result.data;
        
        renderReportsTable(result.data);
        renderPagination(result.pagination);
        updateTableInfo(result.pagination);
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('submissionsTable').innerHTML = '<tr><td colspan="6" style="text-align: center;">Gagal memuat data laporan</td></tr>';
    }
}

// Render Reports Table
function renderReportsTable(reports) {
    const tbody = document.getElementById('submissionsTable');
    
    if (!reports || reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada laporan</td></tr>';
        return;
    }
    
    tbody.innerHTML = reports.map(report => {
        const statusClass = getStatusBadgeClass(report.status_laporan);
        const statusText = report.status_laporan;
        const formattedDate = new Date(report.createdAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        return `
            <tr>
                <td><a href="#" class="id-link" data-id="${report._id}">${report.nomor_laporan}</a></td>
                <td>${report.judul}</td>
                <td>${report.kategori}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${formattedDate}</td>
                <td><a href="#" class="action-link" onclick="viewReport('${report._id}'); return false;">View</a></td>
            </tr>
        `;
    }).join('');
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'Belum dikerjakan': 'badge-pending',
        'Sedang dikerjakan': 'badge-progress',
        'Selesai': 'badge-resolved'
    };
    return statusMap[status] || 'badge-pending';
}

// Render Pagination
function renderPagination(pagination) {
    currentPage = pagination.page;
    totalPages = pagination.totalPages;
    
    const paginationDiv = document.querySelector('.pagination');
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<button class="pagination-btn" disabled>...</button>`;
        }
    }
    
    // Next button
    paginationHTML += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next</button>`;
    
    paginationDiv.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadReports();
}

function updateTableInfo(pagination) {
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    document.querySelector('.table-info').textContent = `Showing ${start} to ${end} of ${pagination.total} entries`;
}

function filterTable(term) {
    const rows = document.querySelectorAll('#submissionsTable tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
    updateTableInfo();
}

// Filters
function initFilters() {
    const selects = document.querySelectorAll('.filter-select');
    selects[0].innerHTML = `
        <option value="">Semua Status</option>
        <option value="Belum dikerjakan">Belum dikerjakan</option>
        <option value="Sedang dikerjakan">Sedang dikerjakan</option>
        <option value="Selesai">Selesai</option>
    `;
    
    selects[1].innerHTML = `
        <option value="">Semua Kategori</option>
        <option value="Infrastruktur">Infrastruktur</option>
        <option value="Sosial">Sosial</option>
        <option value="Pelayanan">Pelayanan</option>
        <option value="Keamanan">Keamanan</option>
        <option value="Kesehatan">Kesehatan</option>
        <option value="Lingkungan">Lingkungan</option>
        <option value="Lainnya">Lainnya</option>
    `;
    
    selects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const [statusFilter, kategoriFilter] = Array.from(document.querySelectorAll('.filter-select')).map(s => s.value);
    currentFilters.status = statusFilter;
    currentFilters.kategori = kategoriFilter;
    currentPage = 1;
    loadReports();
}

// Pagination
function initPagination() {
    document.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.classList.contains('active') && !btn.textContent.includes('...')) {
                document.querySelectorAll('.pagination-btn').forEach(b => b.classList.remove('active'));
                if (!isNaN(btn.textContent)) btn.classList.add('active');
            }
        });
    });
}

// Click Handlers
function initClickHandlers() {
    // Notification
    document.querySelector('.notification-btn')?.addEventListener('click', () => {
        alert('You have 3 new notifications');
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Table Actions - ID links - use event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('id-link')) {
            e.preventDefault();
            const reportId = e.target.getAttribute('data-id');
            viewReport(reportId);
        }
    });
}

// Load Chart Data
async function loadChartData() {
    try {
        const response = await fetch(`${API_BASE_URL}/laporan/all?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load chart data');
        
        const result = await response.json();
        
        // Call updateChartsWithData from charts.js
        if (typeof updateChartsWithData === 'function') {
            updateChartsWithData(result.data);
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Logout Function
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        // Clear any stored session/token
        localStorage.removeItem('adminToken');
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
}

console.log('Admin Panel loaded');
