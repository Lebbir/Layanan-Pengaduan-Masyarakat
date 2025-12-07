// Task Management System

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initTaskSearch();
    initAssignForm();
});

// Drag and Drop Functionality
function initDragAndDrop() {
    const draggables = document.querySelectorAll('.task-card');
    const taskLists = document.querySelectorAll('.task-list');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            
            // Get the new status
            const column = draggable.closest('.task-column');
            const columnId = draggable.closest('.task-list').id;
            const taskId = draggable.querySelector('.task-id').textContent;
            
            let newStatus;
            if (columnId === 'belumDikerjakan') newStatus = 'Belum Dikerjakan';
            else if (columnId === 'dalamProses') newStatus = 'Dalam Proses';
            else if (columnId === 'selesai') newStatus = 'Selesai';
            
            // TODO: Call API to update task status
            // updateTaskStatus(taskId, newStatus);
            
            showNotification(`Task ${taskId} moved to ${newStatus}`, 'success');
        });
    });

    taskLists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(list, e.clientY);
            const dragging = document.querySelector('.dragging');
            
            if (afterElement == null) {
                list.appendChild(dragging);
            } else {
                list.insertBefore(dragging, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Task Search
function initTaskSearch() {
    const searchInput = document.getElementById('taskSearch');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            const title = card.querySelector('.task-title').textContent.toLowerCase();
            const description = card.querySelector('.task-description').textContent.toLowerCase();
            const id = card.querySelector('.task-id').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm) || id.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Modal Functions
function openAssignModal() {
    const modal = document.getElementById('assignModal');
    modal.classList.add('active');
}

function closeAssignModal() {
    const modal = document.getElementById('assignModal');
    modal.classList.remove('active');
    document.getElementById('assignTaskForm').reset();
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    const assignModal = document.getElementById('assignModal');
    const viewModal = document.getElementById('viewModal');
    const editModal = document.getElementById('editModal');
    
    if (e.target === assignModal) {
        closeAssignModal();
    }
    if (e.target === viewModal) {
        closeViewModal();
    }
    if (e.target === editModal) {
        closeEditModal();
    }
});

// View Modal Functions
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.remove('active');
}

function openEditModalFromView() {
    const taskId = document.getElementById('viewTaskId').textContent.replace('#', '');
    closeViewModal();
    editTask(taskId);
}

// Edit Modal Functions
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
    document.getElementById('editTaskForm').reset();
}

// Assign Form Submission
function initAssignForm() {
    const assignForm = document.getElementById('assignTaskForm');
    const editForm = document.getElementById('editTaskForm');
    
    // Assign Form
    assignForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            reportId: document.getElementById('reportSelect').value,
            assignee: document.getElementById('assigneeSelect').value,
            priority: document.getElementById('prioritySelect').value,
            dueDate: document.getElementById('dueDate').value,
            notes: document.getElementById('taskNotes').value,
            sendNotification: document.getElementById('sendNotification').checked
        };
        
        // Validate
        if (!formData.reportId || !formData.assignee || !formData.priority) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Show loading
        const submitBtn = assignForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Assigning...';
        submitBtn.disabled = true;
        
        try {
            // TODO: Call API to assign task
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Get assignee name
            const assigneeSelect = document.getElementById('assigneeSelect');
            const assigneeName = assigneeSelect.options[assigneeSelect.selectedIndex].text;
            
            // Show success notification
            if (formData.sendNotification) {
                showNotification(`Task assigned to ${assigneeName}. Notification sent!`, 'success');
            } else {
                showNotification(`Task assigned to ${assigneeName}`, 'success');
            }
            
            closeAssignModal();
            
        } catch (error) {
            console.error('Error assigning task:', error);
            showNotification('Failed to assign task. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // Edit Form
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            taskId: document.getElementById('editTaskId').value,
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            assignee: document.getElementById('editAssigneeSelect').value,
            status: document.getElementById('editStatusSelect').value,
            priority: document.getElementById('editPrioritySelect').value,
            dueDate: document.getElementById('editDueDate').value,
            notes: document.getElementById('editTaskNotes').value,
            sendNotification: document.getElementById('editSendNotification').checked
        };
        
        // Show loading
        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        try {
            // TODO: Call API to update task
            // await fetch(`/api/tasks/${formData.taskId}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showNotification('Task updated successfully!', 'success');
            closeEditModal();
            
            // TODO: Refresh task board
            
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Failed to update task. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Task Actions
function viewTask(taskId) {
    // Sample data - replace with API call
    const taskData = {
        '8214': {
            id: '8214',
            title: 'Perbaikan Jalan Rusak',
            description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara. Terdapat beberapa lubang besar yang dapat menyebabkan kecelakaan. Perlu segera dilakukan perbaikan untuk keamanan warga.',
            assignee: 'Budi Santoso',
            priority: 'high',
            status: 'Belum Dikerjakan',
            category: 'Complaint',
            created: 'December 4, 2025',
            due: 'December 10, 2025',
            notes: 'Koordinasi dengan dinas PU untuk material perbaikan. Budget sudah disetujui.'
        }
    };
    
    const task = taskData[taskId] || taskData['8214'];
    
    // Populate modal
    document.getElementById('viewTaskId').textContent = `#${task.id}`;
    document.getElementById('viewTaskTitle').textContent = task.title;
    document.getElementById('viewTaskDescription').textContent = task.description;
    document.getElementById('viewTaskAssignee').textContent = task.assignee;
    document.getElementById('viewTaskCreated').textContent = task.created;
    document.getElementById('viewTaskDue').textContent = task.due;
    document.getElementById('viewTaskCategory').textContent = task.category;
    document.getElementById('viewTaskNotes').textContent = task.notes;
    
    // Set priority badge
    const priorityBadge = document.getElementById('viewTaskPriority');
    priorityBadge.className = `detail-priority priority-${task.priority}`;
    priorityBadge.textContent = `${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority`;
    
    // Set status badge
    const statusBadge = document.getElementById('viewTaskStatus');
    let statusClass = 'badge-pending';
    if (task.status === 'Dalam Proses') statusClass = 'badge-progress';
    if (task.status === 'Selesai') statusClass = 'badge-resolved';
    statusBadge.className = `detail-status badge ${statusClass}`;
    statusBadge.textContent = task.status;
    
    // Open modal
    document.getElementById('viewModal').classList.add('active');
}

function editTask(taskId) {
    // Sample data - replace with API call
    const taskData = {
        id: taskId,
        title: 'Perbaikan Jalan Rusak',
        description: 'Jalan di RT 05 rusak parah dan membahayakan pengendara',
        assignee: 'budi',
        priority: 'high',
        status: 'belumDikerjakan',
        dueDate: '2025-12-10',
        notes: 'Koordinasi dengan dinas PU untuk material perbaikan.'
    };
    
    // Populate form
    document.getElementById('editTaskId').value = taskData.id;
    document.getElementById('editTaskTitle').value = taskData.title;
    document.getElementById('editTaskDescription').value = taskData.description;
    document.getElementById('editAssigneeSelect').value = taskData.assignee;
    document.getElementById('editStatusSelect').value = taskData.status;
    document.getElementById('editPrioritySelect').value = taskData.priority;
    document.getElementById('editDueDate').value = taskData.dueDate;
    document.getElementById('editTaskNotes').value = taskData.notes;
    
    // Open modal
    document.getElementById('editModal').classList.add('active');
}

function deleteTask(taskId) {
    if (!confirm(`Are you sure you want to delete task #${taskId}?`)) {
        return;
    }
    
    // TODO: Call API to delete task
    // fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    
    showNotification(`Task #${taskId} deleted successfully`, 'success');
    
    // Remove task card from DOM
    const taskCard = document.querySelector(`.task-id:contains("#${taskId}")`);
    if (taskCard) {
        taskCard.closest('.task-card').remove();
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = '#51cf66';
            icon = 'check-circle';
            break;
        case 'error':
            bgColor = '#ff4757';
            icon = 'exclamation-circle';
            break;
        case 'info':
            bgColor = '#4dabf7';
            icon = 'info-circle';
            break;
        default:
            bgColor = '#51cf66';
            icon = 'check-circle';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fa-solid fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Add animation styles if not present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// API Integration Examples for Backend Developer
/*
// Fetch tasks by status
async function fetchTasks(status) {
    const response = await fetch(`/api/tasks?status=${status}`);
    const tasks = await response.json();
    return tasks;
}

// Update task status
async function updateTaskStatus(taskId, newStatus) {
    const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    return response.json();
}

// Assign task
async function assignTask(data) {
    const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Send notification
async function sendNotification(userId, message) {
    const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message })
    });
    return response.json();
}
*/
