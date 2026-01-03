const STATUS_CODES = {
  "Belum dikerjakan": "belum",
  "Sedang dikerjakan": "sedang",
  Selesai: "selesai",
};

const STATUS_LABELS = {
  belum: "Belum Dikerjakan",
  sedang: "Sedang Dikerjakan",
  selesai: "Selesai Dikerjakan",
};

const STATUS_CLASSES = {
  belum: "status-pending",
  sedang: "status-progress",
  selesai: "status-done",
};

const PRIORITY_LABELS = {
  tinggi: "Prioritas Tinggi",
  sedang: "Prioritas Sedang",
  rendah: "Prioritas Rendah",
};

const PRIORITY_BADGES = {
  tinggi: "detail-priority priority-high",
  sedang: "detail-priority priority-medium",
  rendah: "detail-priority priority-low",
};

let laporanCache = [];
let taskCache = [];
let currentSearchTerm = "";
let searchTimer;

document.addEventListener("DOMContentLoaded", () => {
  bootstrapTaskManagement();
});

async function bootstrapTaskManagement() {
  await loadBoardData();
  initTaskSearch();
  initForms();
  refreshNotificationBadge();
}

async function loadBoardData(searchTerm = "") {
  try {
    currentSearchTerm = searchTerm;
    const params = new URLSearchParams({ limit: 200 });
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    const response = await requestJSON(`/api/laporan/all?${params.toString()}`, {
      headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
    });
    laporanCache = Array.isArray(response.data) ? response.data : [];
    taskCache = laporanCache.map(transformLaporanToTask);
    renderTaskBoard(taskCache);
    renderStatsFromTasks(taskCache);
    renderReportOptions(laporanCache);
  } catch (error) {
    showNotification(error.message || "Gagal memuat laporan", "error");
  }
}

function transformLaporanToTask(laporan) {
  const statusCode = STATUS_CODES[laporan.status_laporan] || "belum";
  return {
    _id: laporan._id,
    nomor: laporan.nomor_laporan,
    title: laporan.judul || "Tanpa Judul",
    description: laporan.deskripsi || "",
    status: statusCode,
    priority: derivePriority(laporan),
    reporter: laporan.nama_warga || "Anonim",
    kategori: laporan.kategori || laporan.kategori_ai || "Tidak diketahui",
    lokasi: laporan.lokasi || "Tidak diketahui",
    createdAt: laporan.createdAt,
    updatedAt: laporan.updatedAt,
    notes: laporan.komentar || "",
    attachments: laporan.gambar ? [laporan.gambar] : [],
    history: buildHistoryFromLaporan(laporan),
  };
}

function derivePriority(laporan) {
  const category = (laporan.kategori_ai || laporan.kategori || "").toLowerCase();
  const sentimen = (laporan.sentimen_ai || "").toLowerCase();
  if (laporan.status_laporan === "Selesai") {
    return "rendah";
  }
  if (["infrastruktur", "keamanan", "kesehatan"].includes(category)) {
    return "tinggi";
  }
  if (["lingkungan", "pelayanan", "sosial"].includes(category)) {
    return "sedang";
  }
  if (sentimen === "negatif") {
    return "tinggi";
  }
  return "sedang";
}

function buildHistoryFromLaporan(laporan) {
  const history = [];
  history.push({
    action: "Laporan Dibuat",
    description: `Dikirim oleh ${laporan.nama_warga || "Anonim"}`,
    createdAt: laporan.createdAt,
  });
  if (laporan.updatedAt && laporan.updatedAt !== laporan.createdAt) {
    history.push({
      action: "Status Terbaru",
      description: laporan.status_laporan,
      createdAt: laporan.updatedAt,
    });
  }
  return history;
}

function renderTaskBoard(tasks) {
  const columns = {
    tinggi: document.getElementById("prioritasTinggi"),
    sedang: document.getElementById("prioritasSedang"),
    rendah: document.getElementById("prioritasRendah"),
  };
  Object.values(columns).forEach((column) => {
    if (column) {
      column.innerHTML = "";
    }
  });
  const grouped = { tinggi: [], sedang: [], rendah: [] };
  tasks.forEach((task) => {
    const priority = task.priority || "sedang";
    if (!grouped[priority]) {
      grouped[priority] = [];
    }
    grouped[priority].push(task);
  });
  if (columns.tinggi) {
    grouped.tinggi
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((task) => columns.tinggi.appendChild(createTaskCard(task)));
  }
  if (columns.sedang) {
    grouped.sedang
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((task) => columns.sedang.appendChild(createTaskCard(task)));
  }
  if (columns.rendah) {
    grouped.rendah
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((task) => columns.rendah.appendChild(createTaskCard(task)));
  }
  updateTaskCounts(grouped);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createTaskCard(task) {
  const card = createElement("div", "task-card");
  card.dataset.taskId = task._id;
  card.dataset.priority = task.priority;

  const header = createElement("div", "task-header");
  header.appendChild(createElement("span", "task-id", `#${task.nomor || task._id.slice(-5)}`));
  header.appendChild(
    createElement(
      "div",
      `task-status ${STATUS_CLASSES[task.status] || "status-pending"}`,
      STATUS_LABELS[task.status] || STATUS_LABELS.belum
    )
  );

  const titleEl = createElement("h4", "task-title", task.title || "-");
  const descEl = createElement("p", "task-description", truncateText(task.description, 140));

  const meta = createElement("div", "task-meta");
  const reporter = createElement("div", "task-assignee");
  reporter.innerHTML = `<i class="fa-solid fa-user"></i><span>${task.reporter}</span>`;
  const dateWrapper = createElement("div", "task-date");
  dateWrapper.innerHTML = `<i class="fa-solid fa-calendar"></i><span>${formatReadableDate(task.createdAt)}</span>`;
  meta.append(reporter, dateWrapper);

  const actions = createElement("div", "task-actions");
  const viewBtn = createActionButton("view", "fa-solid fa-eye", () => viewTask(task._id));
  const editBtn = createActionButton("edit", "fa-solid fa-pen", () => editTask(task._id));
  actions.append(viewBtn, editBtn);

  card.append(header, titleEl, descEl, meta, actions);
  return card;
}

function createActionButton(action, iconClass, handler) {
  const button = createElement("button", "btn-icon");
  button.dataset.action = action;
  button.innerHTML = `<i class="${iconClass}"></i>`;
  button.addEventListener("click", handler);
  return button;
}

function updateTaskCounts(grouped) {
  const columnCounts = document.querySelectorAll(".task-column .task-count");
  if (columnCounts.length >= 3) {
    columnCounts[0].textContent = grouped.tinggi.length;
    columnCounts[1].textContent = grouped.sedang.length;
    columnCounts[2].textContent = grouped.rendah.length;
  }
}

function renderStatsFromTasks(tasks) {
  const totals = { belum: 0, sedang: 0, selesai: 0 };
  tasks.forEach((task) => {
    totals[task.status] = (totals[task.status] || 0) + 1;
  });
  const statValues = document.querySelectorAll(".stat-value");
  if (statValues.length >= 4) {
    statValues[0].textContent = tasks.length;
    statValues[1].textContent = totals.belum;
    statValues[2].textContent = totals.sedang;
    statValues[3].textContent = totals.selesai;
  }
}

function initTaskSearch() {
  const searchInput = document.getElementById("taskSearch");
  if (!searchInput) {
    return;
  }
  searchInput.addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    const value = event.target.value.trim();
    searchTimer = setTimeout(() => {
      loadBoardData(value);
    }, 400);
  });
}

function renderReportOptions(laporan) {
  const reportSelect = document.getElementById("reportSelect");
  if (!reportSelect) {
    return;
  }
  reportSelect.innerHTML = '<option value="">Pilih laporan...</option>';
  laporan.forEach((item) => {
    const option = document.createElement("option");
    option.value = item._id;
    option.textContent = `${item.nomor_laporan} - ${item.judul}`;
    reportSelect.appendChild(option);
  });
}

function openAssignModal() {
  showNotification("Penugasan akan tersedia setelah integrasi lanjutan", "info");
}

function closeAssignModal() {}

function closeViewModal() {
  const modal = document.getElementById("viewModal");
  if (modal) {
    modal.classList.remove("active");
    delete modal.dataset.taskId;
  }
}

function openEditModalFromView() {
  const viewModal = document.getElementById("viewModal");
  const taskId = viewModal?.dataset.taskId;
  closeViewModal();
  if (taskId) {
    editTask(taskId);
  }
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal?.classList.remove("active");
  document.getElementById("editTaskForm")?.reset();
}

window.addEventListener("click", (event) => {
  const viewModal = document.getElementById("viewModal");
  const editModal = document.getElementById("editModal");
  if (event.target === viewModal) {
    closeViewModal();
  }
  if (event.target === editModal) {
    closeEditModal();
  }
});

function initForms() {
  const editForm = document.getElementById("editTaskForm");
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
  }
  const assignSelect = document.getElementById("assigneeSelect");
  if (assignSelect) {
    assignSelect.innerHTML = '<option value="">Penugasan belum tersedia</option>';
    assignSelect.disabled = true;
  }
  const editAssigneeSelect = document.getElementById("editAssigneeSelect");
  if (editAssigneeSelect) {
    editAssigneeSelect.innerHTML = '<option value="">Penugasan belum tersedia</option>';
    editAssigneeSelect.disabled = true;
  }
}

async function viewTask(taskId) {
  try {
    const response = await requestJSON(`/api/laporan/${taskId}`);
    const detail = transformLaporanToTask(response.data);
    document.getElementById("viewModal")?.classList.add("active");
    document.getElementById("viewModal").dataset.taskId = taskId;
    populateViewModal(detail);
  } catch (error) {
    showNotification(error.message || "Gagal memuat detail laporan", "error");
  }
}

async function editTask(taskId) {
  try {
    const response = await requestJSON(`/api/laporan/${taskId}`);
    const detail = transformLaporanToTask(response.data);
    populateEditForm(detail);
    document.getElementById("editModal")?.classList.add("active");
  } catch (error) {
    showNotification(error.message || "Gagal memuat data laporan", "error");
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();
  const taskId = document.getElementById("editTaskId").value;
  if (!taskId) {
    return;
  }
  const statusCode = document.getElementById("editStatusSelect").value;
  const statusText = STATUS_LABELS[statusCode] || "Belum dikerjakan";
  const komentar = document.getElementById("editTaskNotes").value;
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const original = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  submitBtn.disabled = true;
  try {
    await requestJSON(`/api/laporan/${taskId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_laporan: statusText, komentar }),
    });
    showNotification("Status laporan berhasil diperbarui", "success");
    closeEditModal();
    await loadBoardData(currentSearchTerm);
  } catch (error) {
    showNotification(error.message || "Gagal memperbarui laporan", "error");
  } finally {
    submitBtn.innerHTML = original;
    submitBtn.disabled = false;
  }
}

function populateViewModal(task) {
  const viewModal = document.getElementById("viewModal");
  const contentContainer = document.getElementById("viewTaskContent");
  if (!viewModal || !contentContainer) {
    return;
  }
  viewModal.dataset.taskId = task._id;
  const priorityLabel = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.sedang;
  const priorityClass = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.sedang;
  const statusLabel = STATUS_LABELS[task.status] || STATUS_LABELS.belum;
  const statusClass =
    task.status === "selesai"
      ? "badge badge-resolved"
      : task.status === "sedang"
      ? "badge badge-progress"
      : "badge badge-pending";
  const attachmentsHTML = buildAttachmentHTML(task);
  const timelineHTML = buildTimelineHTML(task.history);
  const detailHTML = `
    <div class="detail-header">
      <div>
        <span class="detail-id">#${task.nomor || task._id.slice(-5)}</span>
        <span class="${priorityClass}">${priorityLabel}</span>
      </div>
      <span class="detail-status ${statusClass}">${statusLabel}</span>
    </div>
    <h3 class="detail-title">${task.title || "-"}</h3>
    <div class="detail-grid">
      <div class="detail-item">
        <label><i class="fa-solid fa-user"></i> Dilaporkan Oleh</label>
        <p>${task.reporter}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-calendar"></i> Tanggal Dibuat</label>
        <p>${formatFullDate(task.createdAt)}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-location-dot"></i> Lokasi</label>
        <p>${task.lokasi}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-list"></i> Kategori</label>
        <p>${task.kategori}</p>
      </div>
    </div>
    <div class="detail-description">
      <label><i class="fa-solid fa-align-left"></i> Deskripsi</label>
      <p>${task.description || "-"}</p>
    </div>
    <div class="detail-notes">
      <label><i class="fa-solid fa-note-sticky"></i> Catatan Tambahan</label>
      <p>${task.notes || "-"}</p>
    </div>
    <div class="detail-attachments">
      <label><i class="fa-solid fa-paperclip"></i> Lampiran</label>
      <div class="attachment-list">${attachmentsHTML}</div>
    </div>
    <div class="detail-timeline">
      <label><i class="fa-solid fa-timeline"></i> Riwayat Aktivitas</label>
      <div class="timeline-list">${timelineHTML}</div>
    </div>
  `;
  contentContainer.innerHTML = detailHTML;
}

function populateEditForm(task) {
  document.getElementById("editTaskId").value = task._id;
  const readOnlyFields = ["editTaskTitle", "editTaskDescription", "editDueDate"];
  readOnlyFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = id === "editTaskTitle" ? task.title || "" : task.description || "";
      if (id === "editDueDate") {
        el.value = formatDateInput(task.createdAt);
        el.readOnly = true;
      } else {
        el.readOnly = true;
      }
    }
  });
  const prioritySelect = document.getElementById("editPrioritySelect");
  if (prioritySelect) {
    prioritySelect.value = task.priority;
    prioritySelect.disabled = true;
  }
  const assigneeSelect = document.getElementById("editAssigneeSelect");
  if (assigneeSelect) {
    assigneeSelect.value = "";
    assigneeSelect.disabled = true;
  }
  document.getElementById("editStatusSelect").value = task.status;
  document.getElementById("editTaskNotes").value = task.notes || "";
  document.getElementById("editSendNotification").checked = false;
}

function buildAttachmentHTML(task) {
  if (!task.attachments || !task.attachments.length) {
    return '<p class="empty-state">Tidak ada lampiran</p>';
  }
  return task.attachments
    .map(
      (file, index) => `
        <a href="${file}" target="_blank" rel="noopener" class="attachment-item">
          <i class="fa-solid fa-file-image"></i>
          <span>Lampiran ${index + 1}</span>
        </a>
      `
    )
    .join("");
}

function buildTimelineHTML(history = []) {
  if (!history.length) {
    return '<p class="empty-state">Belum ada aktivitas</p>';
  }
  return history
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (item) => `
        <div class="timeline-item">
          <div class="timeline-icon">
            <i class="fa-solid fa-circle"></i>
          </div>
          <div class="timeline-content">
            <strong>${item.action || "Aktivitas"}</strong>
            <p>${item.description || "Perubahan dilakukan"}</p>
            <span class="timeline-date">${formatDateTime(item.createdAt)}</span>
          </div>
        </div>
      `
    )
    .join("");
}

async function refreshNotificationBadge() {
  try {
    const response = await requestJSON("/api/notifications/unread-count?recipientType=admin");
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = response.data?.count || 0;
    }
  } catch (error) {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = "0";
    }
  }
}

function truncateText(text = "", limit) {
  if (!text) {
    return "-";
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function formatReadableDate(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateInput(date) {
  if (!date) {
    return "";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "";
  }
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function createElement(tag, className, textContent) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (typeof textContent === "string") {
    element.textContent = textContent;
  }
  return element;
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, options);
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Permintaan gagal diproses");
  }
  return data;
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  let bgColor;
  let icon;
  if (type === "error") {
    bgColor = "#ff4757";
    icon = "exclamation-circle";
  } else if (type === "info") {
    bgColor = "#4dabf7";
    icon = "info-circle";
  } else {
    bgColor = "#51cf66";
    icon = "check-circle";
  }
  notification.style.cssText =
    "position:fixed;top:20px;right:20px;background:" +
    bgColor +
    ";color:#fff;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;display:flex;align-items:center;gap:0.75rem;animation:slideIn 0.3s ease;max-width:400px;";
  notification.innerHTML = `<i class="fa-solid fa-${icon}"></i><span>${message}</span>`;
  document.body.appendChild(notification);
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent =
      "@keyframes slideIn {from {transform:translateX(400px);opacity:0;} to {transform:translateX(0);opacity:1;}}" +
      "@keyframes slideOut {from {transform:translateX(0);opacity:1;} to {transform:translateX(400px);opacity:0;}}";
    document.head.appendChild(style);
  }
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
