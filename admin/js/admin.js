// Admin Panel JavaScript

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    initializeSearch();
    initializeFilters();
    initializePagination();
});

// Sidebar Toggle for Mobile
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    // Create mobile menu button if it doesn't exist
    if (window.innerWidth <= 1024) {
        createMobileMenuButton();
    }

    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024 && !document.querySelector('.mobile-menu-btn')) {
            createMobileMenuButton();
        } else if (window.innerWidth > 1024) {
            const mobileBtn = document.querySelector('.mobile-menu-btn');
            if (mobileBtn) {
                mobileBtn.remove();
            }
            sidebar.classList.remove('active');
        }
    });
}

function createMobileMenuButton() {
    const topBar = document.querySelector('.top-bar');
    const sidebar = document.getElementById('sidebar');
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    
    topBar.insertBefore(menuBtn, topBar.firstChild);
    
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Search Functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterTable(searchTerm);
    });
}

function filterTable(searchTerm) {
    const table = document.getElementById('submissionsTable');
    const rows = table.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    updateTableInfo();
}

// Filter Functionality
function initializeFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const statusFilter = document.querySelector('.filter-select').value;
    const typeFilter = document.querySelectorAll('.filter-select')[1].value;
    
    const table = document.getElementById('submissionsTable');
    const rows = table.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const statusCell = row.cells[3];
        const typeCell = row.cells[2];
        
        if (!statusCell || !typeCell) return;
        
        const status = statusCell.textContent.trim();
        const type = typeCell.textContent.trim();
        
        let showRow = true;
        
        if (statusFilter !== 'All Status' && !status.includes(statusFilter)) {
            showRow = false;
        }
        
        if (typeFilter !== 'All Types' && type !== typeFilter) {
            showRow = false;
        }
        
        row.style.display = showRow ? '' : 'none';
    });
    
    updateTableInfo();
}

function updateTableInfo() {
    const table = document.getElementById('submissionsTable');
    const rows = table.getElementsByTagName('tr');
    const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
    
    const tableInfo = document.querySelector('.table-info');
    const total = rows.length;
    const showing = visibleRows.length;
    
    tableInfo.textContent = `Showing 1 to ${showing} of ${total} entries`;
}

// Pagination
function initializePagination() {
    const paginationBtns = document.querySelectorAll('.pagination-btn:not([disabled])');
    
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!btn.classList.contains('active') && !btn.textContent.includes('...')) {
                // Remove active class from all buttons
                document.querySelectorAll('.pagination-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Add active class to clicked button (if it's a number)
                if (!isNaN(btn.textContent)) {
                    btn.classList.add('active');
                }
                
                // In a real application, this would load new data
                console.log('Loading page:', btn.textContent);
            }
        });
    });
}

// Notification Button
const notificationBtn = document.querySelector('.notification-btn');
if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
        // In a real application, this would open a notification panel
        console.log('Opening notifications...');
        alert('You have 3 new notifications');
    });
}

// Add New Submission Button
const addNewBtn = document.querySelector('.top-bar-actions .btn-primary');
if (addNewBtn) {
    addNewBtn.addEventListener('click', () => {
        // In a real application, this would open a form modal
        console.log('Opening new submission form...');
        alert('New submission form will open here');
    });
}

// View Links in Table
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('action-link')) {
        e.preventDefault();
        const row = e.target.closest('tr');
        const id = row.cells[0].textContent;
        console.log('Viewing submission:', id);
        alert(`Viewing details for ${id}`);
    }
    
    if (e.target.classList.contains('id-link')) {
        e.preventDefault();
        console.log('Opening submission:', e.target.textContent);
        alert(`Opening submission ${e.target.textContent}`);
    }
});

// Smooth scrolling for navigation
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        link.classList.add('active');
        
        // In a real SPA, this would handle routing
        console.log('Navigating to:', link.textContent.trim());
    });
});

// Log when admin panel loads
console.log('Admin Panel loaded successfully');
console.log('Current user: Admin Desa (Administrator)');
