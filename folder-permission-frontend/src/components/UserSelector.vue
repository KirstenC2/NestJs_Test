<template>
  <div class="user-selector">
    <div class="selector-label">{{ label || '切換當前使用者' }}</div>
    
    <!-- Loading state -->
    <div v-if="userStore.loading" class="user-loading">
      <div class="loading-spinner"></div>
      <span>正在載入使用者列表...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="userStore.error" class="user-error">
      <div class="error-icon">⚠️</div>
      <span>{{ userStore.error }}</span>
      <button @click="refreshUsers" class="refresh-button">重試</button>
    </div>
    
    <!-- User list -->
    <div v-else>
      <div class="user-list">
        <div 
          v-for="user in userStore.availableUsers" 
          :key="user.id" 
          class="user-item"
          :class="{ 
            active: user.id === userStore.currentUserId,
            selected: user.id === selectedUserId && user.id !== userStore.currentUserId 
          }"
          @click="selectUser(user.id)"
        >
          <div class="user-name">{{ user.name }}</div>
          <div v-if="user.id === userStore.currentUserId" class="active-indicator">✓</div>
          <div v-else-if="user.id === selectedUserId" class="selected-indicator">★</div>
        </div>
      </div>
      
      <!-- Confirmation button - only show if a different user is selected -->
      <div v-if="selectedUserId && selectedUserId !== userStore.currentUserId" class="confirm-selection">
        <button @click="confirmUserChange" class="confirm-button">確認切換使用者</button>
        <button @click="cancelSelection" class="cancel-button">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/userStore';
import { ref } from 'vue';

// Emit events
const emit = defineEmits(['user-changed']);

// Props
const props = defineProps({
  label: String
});

// Store
const userStore = useUserStore();

// Temporary selected user ID
const selectedUserId = ref<string | null>(null);

// Select a user (temporary selection)
function selectUser(userId: string) {
  // If clicking the current user, do nothing
  if (userId === userStore.currentUserId) {
    selectedUserId.value = null;
    return;
  }
  
  // Otherwise, set as selected (but not confirmed yet)
  selectedUserId.value = userId;
}

// Confirm user change
async function confirmUserChange() {
  if (selectedUserId.value) {
    // Actually change the user in the store
    userStore.setCurrentUser(selectedUserId.value);
    
    // Clear selection after confirmation
    selectedUserId.value = null;
    
    // Emit event to notify parent components (e.g., to refresh file list)
    emit('user-changed', userStore.currentUserId);
  }
}

// Cancel selection
function cancelSelection() {
  selectedUserId.value = null;
}

// Refresh users list
async function refreshUsers() {
  await userStore.fetchUsers();
}
</script>

<style scoped>
.user-selector {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.selector-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #555;
}

.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.user-item:hover {
  background-color: #e8f5e9;
  border-color: #a5d6a7;
}

.user-item.active {
  background-color: #e8f5e9;
  border-color: #4caf50;
  font-weight: 500;
}

.active-indicator {
  color: #4caf50;
  font-weight: bold;
}

.selected-indicator {
  color: #ff9800;
  font-weight: bold;
}

.user-item.selected {
  background-color: #fff8e1;
  border-color: #ffca28;
  font-weight: 500;
}

.confirm-selection {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.confirm-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.confirm-button:hover {
  background-color: #388e3c;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

/* Loading state */
.user-loading {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 2px solid #ccc;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

/* Error state */
.user-error {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.error-icon {
  margin-right: 8px;
}

.refresh-button {
  margin-left: auto;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8rem;
}

.refresh-button:hover {
  background-color: #d32f2f;
}
</style>
