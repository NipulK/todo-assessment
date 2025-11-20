<template>
  <div class="todo-app" :class="{ 'dark-mode': darkMode }">
    <div class="container">
      <!-- Header with Theme Toggle -->
      <header class="app-header">
        <div class="header-content">
          <h1>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            My Tasks
          </h1>
          <p class="subtitle">Stay organized and get things done</p>
        </div>
        <button @click="toggleDarkMode" class="theme-toggle" title="Toggle theme">
          <svg v-if="!darkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
      </header>

      <!-- Statistics Dashboard -->
      <div class="stats-dashboard" v-if="stats">
        <div class="stat-card" :class="{ 'active': !showCompleted }" @click="showPendingTasks" role="button" tabindex="0" title="Click to view pending tasks">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card" :class="{ 'active': showCompleted }" @click="showCompletedTasks" role="button" tabindex="0" title="Click to view completed tasks">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card" :class="{ 'stat-warning': stats.overdue > 0 }" @click="showOverdueTasks" role="button" tabindex="0" title="Click to view overdue tasks">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">Overdue</div>
        </div>
        <div class="stat-card" @click="showAllTasks" role="button" tabindex="0" title="Click to view all tasks">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <!-- Task Form -->
      <form @submit.prevent="createTask" class="task-form">
        <div class="form-grid">
          <input 
            v-model="newTask.title" 
            type="text"
            placeholder="Task title *" 
            required 
            class="input-field input-title"
            :disabled="loading"
          />
          <input 
            v-model="newTask.description" 
            type="text"
            placeholder="Description (optional)" 
            class="input-field"
            :disabled="loading"
          />
          
          <div class="form-row">
            <select v-model="newTask.priority" class="select-field" :disabled="loading">
              <option value="LOW">🟢 Low Priority</option>
              <option value="MEDIUM">🟡 Medium Priority</option>
              <option value="HIGH">🔴 High Priority</option>
            </select>
            
            <input 
              v-model="newTask.dueDate" 
              type="date"
              class="input-field"
              :disabled="loading"
              :min="today"
            />
          </div>

          <div class="form-row">
            <select v-model="newTask.category" class="select-field" :disabled="loading">
              <option value="">No Category</option>
              <option value="Work">💼 Work</option>
              <option value="Personal">👤 Personal</option>
              <option value="Shopping">🛒 Shopping</option>
              <option value="Health">❤️ Health</option>
              <option value="Learning">📚 Learning</option>
              <option value="Other">📌 Other</option>
            </select>

            <input 
              v-model="tagInput" 
              type="text"
              placeholder="Add tags (comma separated)" 
              class="input-field"
              :disabled="loading"
              @keydown.enter.prevent="addTagFromInput"
            />
          </div>

          <div class="tags-container" v-if="newTask.tags.length > 0">
            <span v-for="(tag, idx) in newTask.tags" :key="idx" class="tag">
              {{ tag }}
              <button type="button" @click="removeTag(idx)" class="tag-remove">×</button>
            </span>
          </div>
        </div>
        
        <button type="submit" class="btn-add" :disabled="loading || !newTask.title.trim()">
          <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {{ editingTask ? 'Update Task' : 'Add Task' }}
        </button>
        <button v-if="editingTask" type="button" @click="cancelEdit" class="btn-cancel">
          Cancel
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input 
            v-model="searchQuery" 
            type="text"
            placeholder="Search tasks..." 
            class="search-input"
            @input="debouncedSearch"
          />
        </div>

        <div class="filter-buttons">
          <select v-model="filterPriority" @change="load" class="filter-select">
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select v-model="filterCategory" @change="load" class="filter-select">
            <option value="">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Learning">Learning</option>
            <option value="Other">Other</option>
          </select>

          <button 
            @click="toggleShowCompleted" 
            class="btn-filter"
            :class="{ 'active': showCompleted }"
          >
            {{ showCompleted ? 'Hide' : 'Show' }} Completed
          </button>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="tasks-section">
        <div v-if="loading && tasks.length === 0" class="empty-state">
          <div class="spinner"></div>
          <p>Loading tasks...</p>
        </div>

        <div v-else-if="tasks.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>No tasks found</h3>
          <p>{{ searchQuery ? 'Try a different search term' : 'Add your first task to get started!' }}</p>
        </div>

        <transition-group v-else name="task-list" tag="ul" class="task-list">
          <li 
            v-for="task in tasks" 
            :key="task.id" 
            class="task-item"
            :class="{ 
              'completing': completingIds.has(task.id),
              'completed': task.completed,
              'overdue': isOverdue(task)
            }"
          >
            <div class="task-priority-indicator" :class="`priority-${task.priority.toLowerCase()}`"></div>
            
            <div class="task-content">
              <div class="task-header">
                <div class="task-title-row">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <span class="priority-badge" :class="`priority-${task.priority.toLowerCase()}`">
                    {{ task.priority }}
                  </span>
                </div>
                <div class="task-meta">
                  <span class="task-date">{{ formatDate(task.createdAt) }}</span>
                  <span v-if="task.category" class="category-badge">{{ task.category }}</span>
                </div>
              </div>
              
              <p v-if="task.description" class="task-description">{{ task.description }}</p>
              
              <div class="task-footer">
                <div class="task-tags" v-if="parseTags(task.tags).length > 0">
                  <span v-for="(tag, idx) in parseTags(task.tags)" :key="idx" class="tag-small">
                    #{{ tag }}
                  </span>
                </div>
                
                <div v-if="task.dueDate" class="due-date" :class="{ 'overdue-text': isOverdue(task) }">
                  <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Due: {{ formatDueDate(task.dueDate) }}
                </div>
              </div>
            </div>

            <div class="task-actions">
              <button 
                v-if="!task.completed"
                @click="startEdit(task)" 
                class="btn-action btn-edit"
                title="Edit task"
              >
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <button 
                @click="task.completed ? uncompleteTask(task.id) : markDone(task.id)" 
                class="btn-action"
                :class="task.completed ? 'btn-uncomplete' : 'btn-complete'"
                :disabled="completingIds.has(task.id)"
                :title="task.completed ? 'Mark as incomplete' : 'Mark as complete'"
              >
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>

              <button 
                @click="confirmDelete(task)" 
                class="btn-action btn-delete"
                title="Delete task"
              >
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </li>
        </transition-group>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="taskToDelete" class="modal-overlay" @click="taskToDelete = null">
      <div class="modal-content" @click.stop>
        <h3>Delete Task?</h3>
        <p>Are you sure you want to delete "{{ taskToDelete.title }}"? This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="taskToDelete = null" class="btn-modal-cancel">Cancel</button>
          <button @click="deleteTask" class="btn-modal-confirm">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({ 
  apiUrl: { type: String, default: 'http://localhost:4000' } 
});

// State
const newTask = ref({
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
  category: '',
  tags: []
});

const tagInput = ref('');
const tasks = ref([]);
const loading = ref(false);
const error = ref('');
const completingIds = ref(new Set());
const editingTask = ref(null);
const taskToDelete = ref(null);
const darkMode = ref(false);
const stats = ref(null);

// Filters
const searchQuery = ref('');
const filterPriority = ref('');
const filterCategory = ref('');
const showCompleted = ref(false);

// Computed
const today = computed(() => {
  const date = new Date();
  return date.toISOString().split('T')[0];
});

// Dark mode
function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('darkMode', darkMode.value);
}

// Load dark mode preference
onMounted(() => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode !== null) {
    darkMode.value = savedMode === 'true';
  }
  load();
  loadStats();
});

// Stats
async function loadStats() {
  try {
    const res = await fetch(`${props.apiUrl}/tasks/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    stats.value = await res.json();
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// Load tasks
async function load() {
  try {
    loading.value = true;
    error.value = '';
    
    const params = new URLSearchParams();
    if (searchQuery.value) params.append('search', searchQuery.value);
    if (filterPriority.value) params.append('priority', filterPriority.value);
    if (filterCategory.value) params.append('category', filterCategory.value);
    params.append('showCompleted', showCompleted.value);
    params.append('limit', '50');
    
    const res = await fetch(`${props.apiUrl}/tasks?${params}`);
    if (!res.ok) throw new Error('Failed to load tasks');
    tasks.value = await res.json();
  } catch (err) {
    error.value = 'Failed to load tasks. Please try again.';
    console.error('Load error:', err);
  } finally {
    loading.value = false;
  }
}

// Debounced search
let searchTimeout;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    load();
  }, 300);
}

// Toggle show completed
function toggleShowCompleted() {
  showCompleted.value = !showCompleted.value;
  load();
}

// Stat card click handlers
function showPendingTasks() {
  showCompleted.value = false;
  filterPriority.value = '';
  filterCategory.value = '';
  searchQuery.value = '';
  load();
}

function showCompletedTasks() {
  showCompleted.value = true;
  filterPriority.value = '';
  filterCategory.value = '';
  searchQuery.value = '';
  load();
}

function showOverdueTasks() {
  showCompleted.value = false;
  filterPriority.value = '';
  filterCategory.value = '';
  searchQuery.value = '';
  load();
}

function showAllTasks() {
  showCompleted.value = false;
  filterPriority.value = '';
  filterCategory.value = '';
  searchQuery.value = '';
  load();
}

// Tags
function addTagFromInput() {
  if (tagInput.value.trim()) {
    const tags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
    newTask.value.tags.push(...tags);
    tagInput.value = '';
  }
}

function removeTag(index) {
  newTask.value.tags.splice(index, 1);
}

function parseTags(tagsString) {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString);
  } catch {
    return [];
  }
}

// Create or update task
async function createTask() {
  if (!newTask.value.title.trim()) return;
  
  try {
    loading.value = true;
    error.value = '';
    
    const taskData = {
      title: newTask.value.title.trim(),
      description: newTask.value.description.trim() || undefined,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || undefined,
      category: newTask.value.category || undefined,
      tags: newTask.value.tags.length > 0 ? newTask.value.tags : undefined
    };
    
    if (editingTask.value) {
      // Update existing task
      const res = await fetch(`${props.apiUrl}/tasks/${editingTask.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (!res.ok) throw new Error('Failed to update task');
      editingTask.value = null;
    } else {
      // Create new task
      const res = await fetch(`${props.apiUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (!res.ok) throw new Error('Failed to create task');
    }
    
    // Reset form
    newTask.value = {
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      category: '',
      tags: []
    };
    tagInput.value = '';
    
    await load();
    await loadStats();
  } catch (err) {
    error.value = `Failed to ${editingTask.value ? 'update' : 'create'} task. Please try again.`;
    console.error('Create/Update error:', err);
  } finally {
    loading.value = false;
  }
}

// Edit task
function startEdit(task) {
  editingTask.value = task;
  newTask.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    category: task.category || '',
    tags: parseTags(task.tags)
  };
  
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingTask.value = null;
  newTask.value = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    category: '',
    tags: []
  };
  tagInput.value = '';
}

// Mark done
async function markDone(id) {
  try {
    completingIds.value.add(id);
    error.value = '';
    const res = await fetch(`${props.apiUrl}/tasks/${id}/done`, { 
      method: 'POST' 
    });
    
    if (!res.ok) throw new Error('Failed to complete task');
    
    setTimeout(async () => {
      await load();
      await loadStats();
      completingIds.value.delete(id);
    }, 300);
  } catch (err) {
    error.value = 'Failed to complete task. Please try again.';
    console.error('Complete error:', err);
    completingIds.value.delete(id);
  }
}

// Uncomplete task
async function uncompleteTask(id) {
  try {
    completingIds.value.add(id);
    error.value = '';
    const res = await fetch(`${props.apiUrl}/tasks/${id}/uncomplete`, { 
      method: 'POST' 
    });
    
    if (!res.ok) throw new Error('Failed to uncomplete task');
    
    setTimeout(async () => {
      await load();
      await loadStats();
      completingIds.value.delete(id);
    }, 300);
  } catch (err) {
    error.value = 'Failed to uncomplete task. Please try again.';
    console.error('Uncomplete error:', err);
    completingIds.value.delete(id);
  }
}

// Delete task
function confirmDelete(task) {
  taskToDelete.value = task;
}

async function deleteTask() {
  if (!taskToDelete.value) return;
  
  try {
    error.value = '';
    const res = await fetch(`${props.apiUrl}/tasks/${taskToDelete.value.id}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error('Failed to delete task');
    
    taskToDelete.value = null;
    await load();
    await loadStats();
  } catch (err) {
    error.value = 'Failed to delete task. Please try again.';
    console.error('Delete error:', err);
  }
}

// Date formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDueDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.todo-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  transition: background 0.3s ease;
}

.todo-app.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.app-header {
  text-align: center;
  color: white;
  margin-bottom: 24px;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  flex: 1;
  text-align: center;
}

.app-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon {
  width: 40px;
  height: 40px;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 400;
}

.theme-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.theme-toggle svg {
  width: 24px;
  height: 24px;
}

/* Stats Dashboard */
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
  border: 2px solid transparent;
}

.dark-mode .stat-card {
  background: rgba(30, 30, 46, 0.95);
  color: white;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.stat-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.dark-mode .stat-card.active {
  border-color: #818cf8;
  background: rgba(129, 140, 248, 0.15);
}

.stat-card.stat-warning {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
}

.stat-card.stat-warning:hover {
  background: rgba(239, 68, 68, 0.15);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.dark-mode .stat-value {
  color: #818cf8;
}

.stat-card.stat-warning .stat-value {
  color: #ef4444;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark-mode .stat-label {
  color: #9ca3af;
}

/* Task Form */
.task-form {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
}

.dark-mode .task-form {
  background: rgba(30, 30, 46, 0.95);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-field, .select-field {
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  font-family: inherit;
  background: white;
}

.dark-mode .input-field,
.dark-mode .select-field {
  background: #1a1a2e;
  border-color: #374151;
  color: white;
}

.input-field:focus, .select-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field:disabled, .select-field:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.dark-mode .input-field:disabled,
.dark-mode .select-field:disabled {
  background: #0f0f1e;
}

.select-field {
  cursor: pointer;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tag-remove {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.5);
}

.btn-add {
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-add:active:not(:disabled) {
  transform: translateY(0);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  margin-top: 8px;
  padding: 12px 24px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #4b5563;
}

.icon-small {
  width: 20px;
  height: 20px;
}

.icon-tiny {
  width: 14px;
  height: 14px;
}

/* Filters */
.filters-section {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.dark-mode .filters-section {
  background: rgba(30, 30, 46, 0.95);
}

.search-box {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  font-family: inherit;
}

.dark-mode .search-input {
  background: #1a1a2e;
  border-color: #374151;
  color: white;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark-mode .filter-select {
  background: #1a1a2e;
  border-color: #374151;
  color: white;
}

.btn-filter {
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.dark-mode .btn-filter {
  background: #1a1a2e;
  color: #818cf8;
  border-color: #818cf8;
}

.btn-filter:hover {
  background: #667eea;
  color: white;
}

.btn-filter.active {
  background: #667eea;
  color: white;
}

.dark-mode .btn-filter.active {
  background: #818cf8;
}

/* Tasks Section */
.tasks-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  min-height: 200px;
}

.dark-mode .tasks-section {
  background: rgba(30, 30, 46, 0.95);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.dark-mode .empty-state {
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  opacity: 0.3;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: #374151;
}

.dark-mode .empty-state h3 {
  color: #d1d5db;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Task List */
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.3s;
  position: relative;
}

.dark-mode .task-item {
  border-bottom-color: #374151;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: #f9fafb;
}

.dark-mode .task-item:hover {
  background: rgba(45, 45, 60, 0.5);
}

.task-item.completing {
  opacity: 0.5;
  transform: scale(0.98);
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #9ca3af;
}

.task-item.overdue {
  border-left: 4px solid #ef4444;
}

.task-priority-indicator {
  width: 4px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 0 4px 4px 0;
}

.task-priority-indicator.priority-high {
  background: #ef4444;
}

.task-priority-indicator.priority-medium {
  background: #f59e0b;
}

.task-priority-indicator.priority-low {
  background: #10b981;
}

.task-content {
  flex: 1;
  min-width: 0;
  padding-left: 12px;
}

.task-header {
  margin-bottom: 8px;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.task-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-mode .task-title {
  color: #f3f4f6;
}

.priority-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.priority-badge.priority-high {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.priority-medium {
  background: #fef3c7;
  color: #d97706;
}

.priority-badge.priority-low {
  background: #d1fae5;
  color: #059669;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-date {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
}

.category-badge {
  padding: 4px 10px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.task-description {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
}

.dark-mode .task-description {
  color: #9ca3af;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-small {
  padding: 4px 10px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.dark-mode .due-date {
  color: #9ca3af;
}

.due-date.overdue-text {
  color: #ef4444;
  font-weight: 600;
}

/* Task Actions */
.task-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-complete {
  background: #10b981;
  color: white;
}

.btn-complete:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-uncomplete {
  background: #f59e0b;
  color: white;
}

.btn-uncomplete:hover {
  background: #d97706;
}

.btn-edit {
  background: #3b82f6;
  color: white;
}

.btn-edit:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Error Message */
.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.dark-mode .error-message {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dark-mode .modal-content {
  background: #1e1e2e;
  color: white;
}

.modal-content h3 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  color: #1f2937;
}

.dark-mode .modal-content h3 {
  color: #f3f4f6;
}

.modal-content p {
  margin: 0 0 24px;
  color: #6b7280;
  line-height: 1.6;
}

.dark-mode .modal-content p {
  color: #9ca3af;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-modal-cancel,
.btn-modal-confirm {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-modal-cancel {
  background: #e5e7eb;
  color: #374151;
}

.btn-modal-cancel:hover {
  background: #d1d5db;
}

.btn-modal-confirm {
  background: #ef4444;
  color: white;
}

.btn-modal-confirm:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Animations */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.4s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.task-list-move {
  transition: transform 0.4s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .filter-buttons {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }

  .task-item {
    flex-direction: column;
    gap: 12px;
  }

  .task-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-action {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .app-header h1 {
    font-size: 2rem;
  }

  .task-form {
    padding: 20px;
  }

  .stats-dashboard {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
