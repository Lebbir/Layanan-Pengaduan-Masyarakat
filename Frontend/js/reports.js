// Reports Page - Public Transparency
const API_URL = "http://localhost:3000/api/laporan";

let currentPage = 1;
let currentFilters = {
  search: "",
  kategori: "",
  status: "",
  sortBy: "createdAt",
  order: "desc",
};

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadComponents();
  setupEventListeners();
  loadStatistics();
  loadReports();
});

// Load header and footer components
async function loadComponents() {
  try {
    const headerResponse = await fetch("../components/header.html");
    const headerHtml = await headerResponse.text();
    document.getElementById("header-placeholder").innerHTML = headerHtml;

    const footerResponse = await fetch("../components/footer.html");
    const footerHtml = await footerResponse.text();
    document.getElementById("footer-placeholder").innerHTML = footerHtml;

    // Initialize header functionality
    setupHeaderNavigation();
  } catch (error) {
    console.error("Error loading components:", error);
  }
}

// Setup header navigation for reports page
function setupHeaderNavigation() {
  setTimeout(() => {
    // Fix navigation links to go back to index.html
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href === "#beranda" ||
        href === "#cara-kerja" ||
        href === "#fitur" ||
        href === "#kontak"
      ) {
        link.setAttribute("href", "../index.html" + href);
      }
    });

    // Fix "Daftar Pengaduan" link to stay on current page
    const reportsLink = document.querySelector(
      '.nav-links a[href*="reports.html"]'
    );
    if (reportsLink) {
      reportsLink.setAttribute("href", "reports.html");
      reportsLink.classList.add("active");
    }

    // Fix "Buat Laporan" button
    const buatLaporanBtn = document.getElementById("buatLaporanBtn");
    if (buatLaporanBtn) {
      buatLaporanBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (token) {
          window.location.href = "submit.html";
        } else {
          window.location.href = "login.html";
        }
      });
    }

    // Initialize user menu
    initializeUserMenu();

    // Mobile hamburger menu
    const hamburger = document.getElementById("hamburger");
    const navLinksContainer = document.querySelector(".nav-links");
    if (hamburger && navLinksContainer) {
      hamburger.addEventListener("click", () => {
        navLinksContainer.classList.toggle("active");
        hamburger.classList.toggle("active");
      });
    }
  }, 100);
}

// Initialize user menu (profile dropdown and logout)
function initializeUserMenu() {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("user_name");
  const userMenu = document.getElementById("userMenu");
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const profileLink = document.getElementById("profileLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (token && userName && userMenu) {
    userMenu.style.display = "flex";
    const userNameSpan = document.getElementById("userName");
    if (userNameSpan) {
      userNameSpan.textContent = userName;
    }

    // Toggle dropdown
    if (profileBtn && dropdownMenu) {
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!userMenu.contains(e.target)) {
          dropdownMenu.classList.remove("show");
        }
      });
    }

    // Profile link
    if (profileLink) {
      profileLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "profile.html";
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin keluar?")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_name");
          localStorage.removeItem("user_id");
          window.location.href = "../index.html";
        }
      });
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const filterKategori = document.getElementById("filterKategori");
  const filterStatus = document.getElementById("filterStatus");
  const filterSort = document.getElementById("filterSort");
  const btnApplyFilter = document.getElementById("btnApplyFilter");
  const btnResetFilter = document.getElementById("btnResetFilter");

  // Real-time search with debounce
  // Search input: store value but do NOT trigger search automatically.
  // User must click "Terapkan" to apply filters.
  let searchTimeout;
  let pendingSearch = "";
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      pendingSearch = e.target.value;
    }, 300);
  });

  // Apply filters button
  btnApplyFilter.addEventListener("click", () => {
    // Apply pending search and selected filters
    currentFilters.search = (pendingSearch || searchInput.value || "").trim();
    currentFilters.kategori = filterKategori.value;
    currentFilters.status = filterStatus.value;

    const [sortBy, order] = filterSort.value.split("-");
    currentFilters.sortBy = sortBy;
    currentFilters.order = order;

    currentPage = 1;
    loadReports();
  });

  // Reset filters button
  btnResetFilter.addEventListener("click", () => {
    searchInput.value = "";
    filterKategori.value = "";
    filterStatus.value = "";
    filterSort.value = "createdAt-desc";

    // clear pending search and reset filters
    pendingSearch = "";
    currentFilters = {
      search: "",
      kategori: "",
      status: "",
      sortBy: "createdAt",
      order: "desc",
    };

    currentPage = 1;
    loadReports();
  });
}

// Load statistics
async function loadStatistics() {
  try {
    const response = await fetch(`${API_URL}/statistics`);
    const result = await response.json();

    if (result.success) {
      const stats = result.data;
      document.getElementById("statTotal").textContent = stats.total;
      document.getElementById("statPending").textContent =
        stats.byStatus.pending;
      document.getElementById("statProgress").textContent =
        stats.byStatus.inProgress;
      document.getElementById("statCompleted").textContent =
        stats.byStatus.completed;
    }
  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

// Load reports
async function loadReports() {
  try {
    const reportsList = document.getElementById("reportsList");
    reportsList.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Memuat data laporan...</p>
            </div>
        `;

    // Fetch all reports from server (client-side filtering/sorting/pagination)
    const FETCH_LIMIT = 10000; // large enough to fetch all items; adjust if needed
    const params = new URLSearchParams({ page: 1, limit: FETCH_LIMIT });

    const response = await fetch(`${API_URL}/public?${params}`);
    const result = await response.json();

    if (result.success) {
      const allReports = Array.isArray(result.data) ? result.data : [];

      // Apply client-side filters, sorting and pagination
      const filtered = applyClientFilters(allReports);

      const total = filtered.length;
      const limit = 9;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      // Ensure currentPage is within range
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const start = (currentPage - 1) * limit;
      const pageReports = filtered.slice(start, start + limit);

      renderReports(pageReports);
      renderPagination({ page: currentPage, totalPages, total });
    } else {
      reportsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <p>Gagal memuat data</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading reports:", error);
    document.getElementById("reportsList").innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>Terjadi kesalahan saat memuat data</p>
            </div>
        `;
  }
}

// Apply client-side filtering and sorting
function applyClientFilters(reports) {
  if (!Array.isArray(reports)) return [];

  console.log("applyClientFilters called with", reports.length, "reports");
  console.log("currentFilters:", currentFilters);

  const statusMap = {
    pending: "Belum dikerjakan",
    "in progress": "Sedang dikerjakan",
    completed: "Selesai",
  };

  let res = reports.slice();

  // Search (title or description)
  const q = (currentFilters.search || "").trim().toLowerCase();
  if (q) {
    console.log("Filtering by search:", q);
    res = res.filter((r) => {
      const title = (r.judul || "").toLowerCase();
      const desc = (r.deskripsi || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
    console.log("After search filter:", res.length, "items");
  }

  // Category
  if (currentFilters.kategori) {
    const cat = (currentFilters.kategori || "").trim().toLowerCase();
    console.log("Filtering by kategori:", cat);
    const beforeCount = res.length;
    // Prefer AI-assigned category (`kategori_ai`) if available, otherwise use user category (`kategori`)
    res = res.filter((r) => {
      const dbKat = ((r.kategori_ai && r.kategori_ai) || r.kategori || "")
        .trim()
        .toLowerCase();
      return dbKat === cat;
    });
    console.log(
      "After kategori filter:",
      res.length,
      "items (was",
      beforeCount,
      ")"
    );
  }

  // Status
  if (currentFilters.status) {
    console.log("Filtering by status:", currentFilters.status);
    const mapped = statusMap[currentFilters.status] || currentFilters.status;
    const beforeCount = res.length;
    res = res.filter(
      (r) =>
        (r.status_laporan || "").trim().toLowerCase() ===
        mapped.trim().toLowerCase()
    );
    console.log(
      "After status filter:",
      res.length,
      "items (was",
      beforeCount,
      ")"
    );
  }

  // Sorting
  const sortBy = currentFilters.sortBy || "createdAt";
  const order = currentFilters.order || "desc";
  console.log("Sorting by:", sortBy, "order:", order);

  res.sort((a, b) => {
    if (sortBy === "judul") {
      const va = (a.judul || "").toLowerCase();
      const vb = (b.judul || "").toLowerCase();
      if (va < vb) return order === "asc" ? -1 : 1;
      if (va > vb) return order === "asc" ? 1 : -1;
      return 0;
    }

    // default: createdAt
    const da = new Date(a.createdAt).getTime() || 0;
    const db = new Date(b.createdAt).getTime() || 0;
    return order === "asc" ? da - db : db - da;
  });

  console.log("Final filtered results:", res.length, "items");
  return res;
}

function sensorNama(nama) {
  if (!nama) return "Anonymous";

  let parts = nama.split(" ");

  let sensor = parts.map((kata) => {
    if (kata.length <= 2) {
      return kata;
    }

    return kata[0] + "*".repeat(kata.length - 1);
  });

  return sensor.join(" ");
}

// Render reports cards
function renderReports(reports) {
  const reportsList = document.getElementById("reportsList");

  if (reports.length === 0) {
    reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Tidak ada laporan yang ditemukan</p>
                <small>Coba ubah filter pencarian Anda</small>
            </div>
        `;
    return;
  }

  reportsList.innerHTML = reports
    .map(
      (report) => `
        <div class="report-card" onclick="viewDetail('${report._id}')">
            <div class="report-header">
                <div class="report-meta">
                    <span class="report-number">
                        <i class="fa-solid fa-hashtag"></i> ${
                          report.nomor_laporan
                        }
                    </span>
                    <span class="report-date">
                        <i class="fa-solid fa-calendar"></i> ${formatDate(
                          report.createdAt
                        )}
                    </span>
                </div>
                <span class="status-badge status-${report.status_laporan.replace(
                  " ",
                  "-"
                )}">
                    ${getStatusIcon(report.status_laporan)} ${
        report.status_laporan
      }
                </span>
            </div>
            
            ${
              report.gambar
                ? `
                <div class="report-image">
                    <img src="${report.gambar}" alt="${report.judul}">
                </div>
            `
                : ""
            }
            
            <div class="report-body">
                <h3 class="report-title">${report.judul}</h3>
                <p class="report-description">${truncateText(
                  report.deskripsi,
                  150
                )}</p>
                
                <div class="report-tags">
                    ${
                      report.kategori
                        ? `
                        <span class="tag tag-kategori">
                            <i class="fa-solid fa-tag"></i> ${report.kategori}
                        </span>
                    `
                        : ""
                    }
                    ${
                      report.kategori_ai
                        ? `
                        <span class="tag tag-ai">
                            <i class="fa-solid fa-robot"></i> ${report.kategori_ai}
                        </span>
                    `
                        : ""
                    }
                    ${
                      report.sentimen_ai
                        ? `
                        <span class="tag tag-sentiment sentiment-${
                          report.sentimen_ai
                        }">
                            ${getSentimentIcon(report.sentimen_ai)} ${
                            report.sentimen_ai
                          }
                        </span>
                    `
                        : ""
                    }
                </div>
                
                <div class="report-footer">
                    <div class="report-author">
                        <i class="fa-solid fa-user"></i>
                        <span>${
                          sensorNama(report.warga_id?.user_warga) || "Anonymous"
                        }</span>
                    </div>
                    ${
                      report.lokasi
                        ? `
                        <div class="report-location">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>${report.lokasi}</span>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <div class="report-action">
                <button class="btn-detail">
                    <i class="fa-solid fa-eye"></i> Lihat Detail
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById("paginationContainer");
  if (!container) return;
  const { page, totalPages, total } = pagination;

  // Hide pagination if only one page
  if (totalPages <= 1) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }

  container.style.display = "block";

  let html = '<div class="pagination-info">';
  html += `<p>Menampilkan halaman ${page} dari ${totalPages} (${total} total laporan)</p>`;
  html += "</div>";

  html += '<div class="pagination-controls">';

  // Previous button
  html += `<button class="btn-page" ${
    page === 1 ? "disabled" : ""
  } onclick="changePage(${page - 1})">
                                <i class="fa-solid fa-chevron-left"></i> Sebelumnya
                </button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      html += `<button class="btn-page ${
        i === page ? "active" : ""
      }" onclick="changePage(${i})">${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += '<span class="pagination-ellipsis">...</span>';
    }
  }

  // Next button
  html += `<button class="btn-page" ${
    page === totalPages ? "disabled" : ""
  } onclick="changePage(${page + 1})">
                                Selanjutnya <i class="fa-solid fa-chevron-right"></i>
                </button>`;

  html += "</div>";
  container.innerHTML = html;
}

// Change page
function changePage(page) {
  currentPage = page;
  loadReports();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// View detail
async function viewDetail(id) {
  try {
    const response = await fetch(`${API_URL}/public/${id}`);
    const result = await response.json();

    if (result.success) {
      showDetailModal(result.data);
    } else {
      alert("Gagal memuat detail laporan");
    }
  } catch (error) {
    console.error("Error loading detail:", error);
    alert("Terjadi kesalahan saat memuat detail");
  }
}

// Show detail modal
function showDetailModal(laporan) {
  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
        <div class="detail-container">
            <div class="detail-header-section">
                <div class="detail-status-row">
                    <span class="status-badge status-${laporan.status_laporan.replace(
                      " ",
                      "-"
                    )}">
                        ${getStatusIcon(laporan.status_laporan)} ${
    laporan.status_laporan
  }
                    </span>
                    <span class="detail-number">${laporan.nomor_laporan}</span>
                </div>
                <h2>${laporan.judul}</h2>
                <div class="detail-meta">
                    <span><i class="fa-solid fa-user"></i> ${
                      laporan.warga_id?.user_warga || "Anonymous"
                    }</span>
                    <span><i class="fa-solid fa-calendar"></i> ${formatDate(
                      laporan.createdAt
                    )}</span>
                    ${
                      laporan.lokasi
                        ? `<span><i class="fa-solid fa-location-dot"></i> ${laporan.lokasi}</span>`
                        : ""
                    }
                </div>
            </div>
            
            ${
              laporan.gambar
                ? `
                <div class="detail-image-section">
                    <img src="${laporan.gambar}" alt="${laporan.judul}">
                </div>
            `
                : ""
            }
            
            <div class="detail-content-section">
                <h3><i class="fa-solid fa-file-lines"></i> Deskripsi Laporan</h3>
                <p class="detail-description">${laporan.deskripsi}</p>
            </div>
            
            ${
              laporan.kategori_ai ||
              laporan.sentimen_ai ||
              (laporan.keywords_ai && laporan.keywords_ai.length > 0)
                ? `
                <div class="detail-ai-section">
                    <h3><i class="fa-solid fa-robot"></i> Analisis AI</h3>
                    <div class="ai-tags">
                        ${
                          laporan.kategori
                            ? `
                            <div class="ai-item">
                                <label>Kategori (User):</label>
                                <span class="tag tag-kategori">
                                    <i class="fa-solid fa-tag"></i> ${laporan.kategori}
                                </span>
                            </div>
                        `
                            : ""
                        }
                        ${
                          laporan.kategori_ai
                            ? `
                            <div class="ai-item">
                                <label>Kategori (AI):</label>
                                <span class="tag tag-ai">
                                    <i class="fa-solid fa-robot"></i> ${laporan.kategori_ai}
                                </span>
                            </div>
                        `
                            : ""
                        }
                        ${
                          laporan.sentimen_ai
                            ? `
                            <div class="ai-item">
                                <label>Sentimen:</label>
                                <span class="tag tag-sentiment sentiment-${
                                  laporan.sentimen_ai
                                }">
                                    ${getSentimentIcon(laporan.sentimen_ai)} ${
                                laporan.sentimen_ai
                              }
                                </span>
                            </div>
                        `
                            : ""
                        }
                        ${
                          laporan.keywords_ai && laporan.keywords_ai.length > 0
                            ? `
                            <div class="ai-item keywords-item">
                                <label>Keywords:</label>
                                <div class="keywords-list">
                                    ${laporan.keywords_ai
                                      .map(
                                        (k) =>
                                          `<span class="keyword-tag">${k}</span>`
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            `
                : ""
            }
            
            ${
              laporan.komentar
                ? `
                <div class="detail-response-section">
                    <h3><i class="fa-solid fa-comment-dots"></i> Tanggapan Admin</h3>
                    <div class="response-box">
                        <p>${laporan.komentar}</p>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;

  modal.style.display = "flex";

  // Close modal handlers
  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("id-ID", options);
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function getStatusIcon(status) {
  switch (status) {
    case "Belum dikerjakan":
      return '<i class="fa-solid fa-clock"></i>';
    case "Sedang dikerjakan":
      return '<i class="fa-solid fa-spinner"></i>';
    case "Selesai":
      return '<i class="fa-solid fa-check-circle"></i>';
    default:
      return '<i class="fa-solid fa-circle"></i>';
  }
}

function getSentimentIcon(sentiment) {
  const icons = {
    positif: '<i class="fa-solid fa-face-smile"></i>',
    negatif: '<i class="fa-solid fa-face-frown"></i>',
    netral: '<i class="fa-solid fa-face-meh"></i>',
  };
  return icons[sentiment] || '<i class="fa-solid fa-circle"></i>';
}
