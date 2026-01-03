const PRIORITY_COLUMNS = {
  prioritasTinggi: "tinggi",
  prioritasSedang: "sedang",
  prioritasRendah: "rendah",
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

let taskCache = [];
let laporanCache = [];
let petugasCache = [];
let currentSearchTerm = "";
let searchTimer;

document.addEventListener("DOMContentLoaded", () => {
  bootstrapTaskManagement();
});

async function bootstrapTaskManagement() {
  await Promise.all([loadReferenceData(), loadTasks(), refreshNotificationBadge()]);
  initTaskSearch();
  initAssignForm();
}

async function loadReferenceData() {
  try {
    const [laporanRes, petugasRes] = await Promise.all([
      requestJSON(`/api/laporan/all?limit=100&status=${encodeURIComponent("Belum dikerjakan")}`),
      requestJSON("/api/petugas?isActive=true"),
    ]);
    laporanCache = laporanRes.data || [];
    petugasCache = petugasRes.data || [];
    renderReportOptions();
    renderPetugasOptions();
  } catch (error) {
    showNotification(error.message || "Gagal memuat data referensi", "error");
  }
}

async function loadTasks(searchTerm = "") {
  try {
    currentSearchTerm = searchTerm;
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    const queryString = params.toString();
    const endpoint = queryString ? `/api/tasks?${queryString}` : "/api/tasks";
    const response = await requestJSON(endpoint);
    taskCache = response.data || [];
    renderTaskBoard(taskCache);
    renderStats(response.stats);
  } catch (error) {
    showNotification(error.message || "Gagal memuat laporan", "error");
  }
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
  tasks.forEach((task) => {
    const column = columns[task.priority] || columns.sedang;
    if (column) {
      column.appendChild(createTaskCard(task));
    }
  });
  updateTaskCounts();
  initDragAndDrop();
}

function createTaskCard(task) {
  const card = createElement("div", "task-card");
  card.draggable = true;
  card.dataset.taskId = task._id;
  card.dataset.priority = task.priority;

  const header = createElement("div", "task-header");
  const displayId = task.taskNumber || task.laporan?.nomor_laporan || task._id.slice(-5);
  header.appendChild(createElement("span", "task-id", `#${displayId}`));
  header.appendChild(
    createElement(
      "div",
      `task-status ${STATUS_CLASSES[task.status] || "status-pending"}`,
      STATUS_LABELS[task.status] || STATUS_LABELS.belum
    )
  );

  const titleEl = createElement("h4", "task-title", task.title || "-");
  const descEl = createElement(
    "p",
    "task-description",
    truncateText(task.description || "-", 140)
  );

  const meta = createElement("div", "task-meta");
  const assignee = createElement("div", "task-assignee");
  const assigneeIcon = createElement("i", "fa-solid fa-user");
  const assigneeSpan = createElement(
    "span",
    "",
    task.assignedTo?.name || task.assignedTo?.email || "Belum ditugaskan"
  );
  assignee.append(assigneeIcon, assigneeSpan);
  const dateWrapper = createElement("div", "task-date");
  const dateIcon = createElement("i", "fa-solid fa-calendar");
  const dateSpan = createElement(
    "span",
    "",
    formatReadableDate(task.dueDate || task.laporan?.createdAt)
  );
  dateWrapper.append(dateIcon, dateSpan);
  meta.append(assignee, dateWrapper);

  const actions = createElement("div", "task-actions");
  const viewBtn = createActionButton("view", "fa-solid fa-eye", () => viewTask(task._id));
  const editBtn = createActionButton("edit", "fa-solid fa-pen", () => editTask(task._id));
  const deleteBtn = createActionButton("delete", "fa-solid fa-trash", () => deleteTask(task._id));
  deleteBtn.classList.add("btn-danger");
  actions.append(viewBtn, editBtn, deleteBtn);

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

function initDragAndDrop() {
  const cards = document.querySelectorAll(".task-card");
  const taskLists = document.querySelectorAll(".task-list");

  cards.forEach((card) => {
    card.addEventListener("dragstart", () => {
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      const parentList = card.closest(".task-list");
      if (!parentList) {
        return;
      }
      const newPriority = PRIORITY_COLUMNS[parentList.id];
      if (newPriority && newPriority !== card.dataset.priority) {
        updateTaskPriorityRequest(card.dataset.taskId, newPriority);
      }
    });
  });

  taskLists.forEach((list) => {
    list.addEventListener("dragover", (event) => {
      event.preventDefault();
      list.classList.add("drag-over");
      const afterElement = getDragAfterElement(list, event.clientY);
      const dragging = document.querySelector(".dragging");
      if (!dragging) {
        return;
      }
      if (!afterElement) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterElement);
      }
    });
    list.addEventListener("dragleave", (event) => {
      if (!list.contains(event.relatedTarget)) {
        list.classList.remove("drag-over");
      }
    });
    list.addEventListener("drop", (event) => {
      event.preventDefault();
      list.classList.remove("drag-over");
    });
  });

  document.addEventListener("dragend", () => {
    taskLists.forEach((list) => list.classList.remove("drag-over"));
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".task-card:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

async function updateTaskPriorityRequest(taskId, priority) {
  try {
    await requestJSON(`/api/tasks/${taskId}/priority`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    showNotification(`Prioritas diperbarui ke ${priority}`, "success");
    await loadTasks(currentSearchTerm);
  } catch (error) {
    showNotification(error.message || "Gagal memperbarui prioritas", "error");
    await loadTasks(currentSearchTerm);
  }
}

function updateTaskCounts() {
  const tinggi = document.querySelectorAll("#prioritasTinggi .task-card").length;
  const sedang = document.querySelectorAll("#prioritasSedang .task-card").length;
  const rendah = document.querySelectorAll("#prioritasRendah .task-card").length;
  const columns = document.querySelectorAll(".task-column .task-count");
  if (columns.length >= 3) {
    columns[0].textContent = tinggi;
    columns[1].textContent = sedang;
    columns[2].textContent = rendah;
  }
}

function renderStats(stats) {
  if (!stats) {
    return;
  }
  const statValues = document.querySelectorAll(".stat-value");
  if (statValues.length >= 4) {
    statValues[0].textContent = stats.total || 0;
    statValues[1].textContent = stats.status?.belum || 0;
    statValues[2].textContent = stats.status?.sedang || 0;
    statValues[3].textContent = stats.status?.selesai || 0;
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
      loadTasks(value);
    }, 400);
  });
}

function renderReportOptions() {
  const reportSelect = document.getElementById("reportSelect");
  if (!reportSelect) {
    return;
  }
  const currentValue = reportSelect.value;
  reportSelect.innerHTML = '<option value="">Pilih laporan...</option>';
  laporanCache.forEach((laporan) => {
    const option = document.createElement("option");
    option.value = laporan._id;
    option.textContent = `${laporan.nomor_laporan} - ${laporan.judul}`;
    reportSelect.appendChild(option);
  });
  if (currentValue) {
    reportSelect.value = currentValue;
  }
}

function renderPetugasOptions() {
  const assignSelect = document.getElementById("assigneeSelect");
  const editSelect = document.getElementById("editAssigneeSelect");
  if (assignSelect) {
    const currentAssign = assignSelect.value;
    assignSelect.innerHTML = '<option value="">Pilih petugas...</option>';
    petugasCache.forEach((petugas) => {
      const option = document.createElement("option");
      option.value = petugas._id;
      option.textContent = petugas.name || petugas.email;
      assignSelect.appendChild(option);
    });
    if (currentAssign) {
      assignSelect.value = currentAssign;
    }
  }
  if (editSelect) {
    const currentEdit = editSelect.value;
    editSelect.innerHTML = '<option value="">Belum ditugaskan</option>';
    petugasCache.forEach((petugas) => {
      const option = document.createElement("option");
      option.value = petugas._id;
      option.textContent = petugas.name || petugas.email;
      editSelect.appendChild(option);
    });
    if (currentEdit) {
      editSelect.value = currentEdit;
    }
  }
}

function openAssignModal() {
  document.getElementById("assignModal")?.classList.add("active");
}

function closeAssignModal() {
  const modal = document.getElementById("assignModal");
  modal?.classList.remove("active");
  document.getElementById("assignTaskForm")?.reset();
}

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
  const assignModal = document.getElementById("assignModal");
  const viewModal = document.getElementById("viewModal");
  const editModal = document.getElementById("editModal");
  if (event.target === assignModal) {
    closeAssignModal();
  }
  if (event.target === viewModal) {
    closeViewModal();
  }
  if (event.target === editModal) {
    closeEditModal();
  }
});

function initAssignForm() {
  const assignForm = document.getElementById("assignTaskForm");
  const editForm = document.getElementById("editTaskForm");
  if (assignForm) {
    assignForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        reportId: document.getElementById("reportSelect").value,
        assigneeId: document.getElementById("assigneeSelect").value,
        priority: document.getElementById("prioritySelect").value,
        dueDate: document.getElementById("dueDate").value,
        notes: document.getElementById("taskNotes").value,
        sendNotification: document.getElementById("sendNotification").checked,
      };
      if (!payload.reportId || !payload.assigneeId || !payload.priority) {
        showNotification("Harap lengkapi semua field wajib", "error");
        return;
      }
      const submitBtn = assignForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menugaskan...';
      submitBtn.disabled = true;
      try {
        await requestJSON("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showNotification("Laporan berhasil ditugaskan", "success");
        closeAssignModal();
        await Promise.all([loadTasks(currentSearchTerm), loadReferenceData()]);
      } catch (error) {
        showNotification(error.message || "Gagal menugaskan laporan", "error");
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  if (editForm) {
    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const taskId = document.getElementById("editTaskId").value;
      if (!taskId) {
        return;
      }
      const payload = {
        title: document.getElementById("editTaskTitle").value,
        description: document.getElementById("editTaskDescription").value,
        assigneeId: document.getElementById("editAssigneeSelect").value,
        status: document.getElementById("editStatusSelect").value,
        priority: document.getElementById("editPrioritySelect").value,
        dueDate: document.getElementById("editDueDate").value,
        notes: document.getElementById("editTaskNotes").value,
        sendNotification: document.getElementById("editSendNotification").checked,
      };
      const submitBtn = editForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
      submitBtn.disabled = true;
      try {
        await requestJSON(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showNotification("Laporan berhasil diperbarui", "success");
        closeEditModal();
        await loadTasks(currentSearchTerm);
      } catch (error) {
        showNotification(error.message || "Gagal memperbarui laporan", "error");
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}

async function viewTask(taskId) {
  try {
    const response = await requestJSON(`/api/tasks/${taskId}`);
    populateViewModal(response.data);
    document.getElementById("viewModal")?.classList.add("active");
  } catch (error) {
    showNotification(error.message || "Gagal memuat detail laporan", "error");
  }
}

async function editTask(taskId) {
  try {
    const response = await requestJSON(`/api/tasks/${taskId}`);
    populateEditForm(response.data);
    document.getElementById("editModal")?.classList.add("active");
  } catch (error) {
    showNotification(error.message || "Gagal memuat data laporan", "error");
  }
}

async function deleteTask(taskId) {
  if (!confirm(`Apakah Anda yakin ingin menghapus laporan ini?`)) {
    return;
  }
  try {
    await requestJSON(`/api/tasks/${taskId}`, { method: "DELETE" });
    showNotification("Laporan berhasil dihapus", "success");
    await loadTasks(currentSearchTerm);
    await loadReferenceData();
  } catch (error) {
    showNotification(error.message || "Gagal menghapus laporan", "error");
  }
}

function populateViewModal(task) {
  const viewModal = document.getElementById("viewModal");
  if (!viewModal) {
    return;
  }
  viewModal.dataset.taskId = task._id;
  const displayId = task.taskNumber || task.laporan?.nomor_laporan || task._id.slice(-5);
  document.getElementById("viewTaskId").textContent = `#${displayId}`;
  const priorityBadge = document.getElementById("viewTaskPriority");
  priorityBadge.textContent =
    task.priority === "tinggi"
      ? "Prioritas Tinggi"
      : task.priority === "rendah"
      ? "Prioritas Rendah"
      : "Prioritas Sedang";
  priorityBadge.className =
    task.priority === "tinggi"
      ? "detail-priority priority-high"
      : task.priority === "rendah"
      ? "detail-priority priority-low"
      : "detail-priority priority-medium";
  const statusBadge = document.getElementById("viewTaskStatus");
  statusBadge.textContent = STATUS_LABELS[task.status] || STATUS_LABELS.belum;
  statusBadge.className = `detail-status badge ${
    task.status === "selesai"
      ? "badge-resolved"
      : task.status === "sedang"
      ? "badge-progress"
      : "badge-pending"
  }`;
  document.getElementById("viewTaskTitle").textContent = task.title || "-";
  document.getElementById("viewTaskDescription").textContent = task.description || "-";
  document.getElementById("viewTaskAssignee").textContent =
    task.assignedTo?.name || task.assignedTo?.email || "-";
  document.getElementById("viewTaskCreated").textContent = formatFullDate(
    task.laporan?.createdAt || task.createdAt
  );
  document.getElementById("viewTaskDue").textContent = formatFullDate(task.dueDate);
  document.getElementById("viewTaskCategory").textContent =
    task.laporan?.kategori || task.laporan?.kategori_ai || "-";
  document.getElementById("viewTaskNotes").textContent = task.notes || "-";
  renderAttachmentList(task);
  renderTimeline(task.history);
}

function populateEditForm(task) {
  document.getElementById("editTaskId").value = task._id;
  document.getElementById("editTaskTitle").value = task.title || "";
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById("editStatusSelect").value = task.status || "belum";
  document.getElementById("editPrioritySelect").value = task.priority || "sedang";
  document.getElementById("editAssigneeSelect").value = task.assignedTo?._id || "";
  document.getElementById("editDueDate").value = formatDateInput(task.dueDate);
  document.getElementById("editTaskNotes").value = task.notes || "";
  document.getElementById("editSendNotification").checked = true;
}

function renderAttachmentList(task) {
  const container = document.getElementById("viewTaskAttachments");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  const lampiran = task.laporan?.gambar;
  if (!lampiran) {
    container.innerHTML = '<p class="empty-state">Tidak ada lampiran</p>';
    return;
  }
  const link = document.createElement("a");
  link.href = lampiran;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "attachment-item";
  link.innerHTML = `<i class="fa-solid fa-file-image"></i><span>Buka Lampiran</span>`;
  container.appendChild(link);
}

function renderTimeline(history = []) {
  const container = document.getElementById("viewTaskTimeline");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!history.length) {
    container.innerHTML = '<p class="empty-state">Belum ada aktivitas</p>';
    return;
  }
  history
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((item) => {
      const timelineItem = createElement("div", "timeline-item");
      const iconWrapper = createElement("div", "timeline-icon");
      iconWrapper.innerHTML = '<i class="fa-solid fa-circle"></i>';
      const content = createElement("div", "timeline-content");
      content.appendChild(createElement("strong", "", item.action || "Aktivitas"));
      content.appendChild(
        createElement("p", "", item.description || "Perubahan dilakukan")
      );
      content.appendChild(
        createElement("span", "timeline-date", formatDateTime(item.createdAt))
      );
      timelineItem.append(iconWrapper, content);
      container.appendChild(timelineItem);
    });
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

function truncateText(text, limit) {
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
