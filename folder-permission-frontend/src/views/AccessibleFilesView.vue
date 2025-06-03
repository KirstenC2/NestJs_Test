<template>
  <div class="accessible-files-page">
    <!-- User context section -->
    <div class="user-context-section">
      <div class="current-user-info">
        <h2>當前使用者身份</h2>
        <p>當前使用者: <strong>{{ userStore.currentUser?.name || '未選擇' }}</strong></p>
        <p class="user-info-hint">您可以查看所有您有權限訪問的檔案。</p>
      </div>
      
      <!-- User selector component with user-changed event handler -->
      <UserSelector 
        label="切換使用者身份" 
        @user-changed="handleUserChanged" 
      />
    </div>
    
    <div class="page-header">
      <h1>可訪問的檔案</h1>
      <div class="nav-buttons">
        <router-link to="/" class="btn">返回我的檔案</router-link>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      正在載入檔案...
    </div>
    
    <div v-else-if="localError" class="error-message">
      {{ localError }}
    </div>
    
    <div v-else-if="accessibleFiles.length === 0" class="empty-state">
      <p>目前沒有任何您可訪問的檔案</p>
    </div>
    
    <div v-else class="files-list">
      <div v-for="file in accessibleFiles" :key="file.id" class="file-item">
        <div class="file-details">
          <h3>{{ file.originalname }}</h3>
          <div class="file-meta">
            <span class="file-owner">
              擁有者: {{ getOwnerName(file) }}
            </span>
            <span class="permission-badge" 
              :class="{
                'read': file.userPermission === 'read',
                'write': file.userPermission === 'write',
                'delete': file.userPermission === 'delete',
                'owner': isOwner(file)
              }">
              {{ getPermissionLabel(file) }}
            </span>
          </div>
        </div>
        
        <div class="file-actions">
          <button class="btn small" @click="viewFilePermissions(file)">
            權限管理
          </button>
          <!-- Only show delete button if user is the owner or has delete permission -->
          <button 
            v-if="isOwner(file) || file.userPermission === 'delete'" 
            class="btn small danger" 
            @click="confirmDelete(file)"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="fileToDelete" class="modal">
      <div class="modal-content">
        <h2>確定刪除</h2>
        <p>確定要刪除 <strong>{{ fileToDelete.originalname }}</strong>?</p>
        <p class="warning">此動作無法復原。</p>
        
        <div class="form-actions">
          <button @click="fileToDelete = null" class="btn">取消</button>
          <button @click="deleteSelectedFile" class="btn danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { useFileStore } from '../stores/fileStore';
import { type FileRecord } from '../services/fileService';
import UserSelector from '../components/UserSelector.vue';

const router = useRouter();
const userStore = useUserStore();
const fileStore = useFileStore();

// Reactive state for accessible files
const accessibleFiles = ref<FileRecord[]>([]);
const loading = ref(false);
const localError = ref('');
const fileToDelete = ref<FileRecord | null>(null);

// Handle explicit user change from UserSelector
async function handleUserChanged(newUserId: string) {
  console.log(`User explicitly changed to ${newUserId}, reloading accessible files...`);
  
  // Show loading state
  loading.value = true;
  localError.value = '';
  
  try {
    // Reload files for the new user
    await fetchAccessibleFiles();
    console.log('Accessible files reloaded successfully for new user');
  } catch (error: any) {
    console.error('Error reloading accessible files after user change:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    loading.value = false;
  }
}

// Fetch files where the current user has permissions
async function fetchAccessibleFiles() {
  loading.value = true;
  localError.value = '';
  
  try {
    const files = await fileStore.fetchAccessibleFiles();
    accessibleFiles.value = files;
  } catch (error: any) {
    console.error('Error fetching accessible files:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    loading.value = false;
  }
}

// Get the name of the file owner
function getOwnerName(file: FileRecord): string {
  // Try to find the owner user by ID
  if (file.ownerId) {
    const owner = userStore.getUserById(file.ownerId);
    if (owner) return owner.name;
  }
  
  if (file.userId) {
    const owner = userStore.getUserById(file.userId);
    if (owner) return owner.name;
  }
  
  return '未知';
}

// Check if current user is the owner of the file
function isOwner(file: FileRecord): boolean {
  if (!file) return false;
  
  try {
    // Check against ownerId if it exists, otherwise fall back to userId
    // This handles both new and old data formats
    return (file.ownerId && file.ownerId === userStore.currentUserId) || 
           (file.userId && file.userId === userStore.currentUserId);
  } catch (err) {
    console.error('Error checking file ownership:', err);
    return false; // Default to false on any error
  }
}

// Get permission label for display
function getPermissionLabel(file: FileRecord): string {
  if (isOwner(file)) return '擁有者';
  
  switch (file.userPermission) {
    case 'read': return '只讀';
    case 'write': return '讀寫';
    case 'delete': return '完整權限';
    default: return '未知';
  }
}

// View file permissions
function viewFilePermissions(file: FileRecord) {
  router.push(`/permissions?fileId=${file.id}`);
}

// Delete file confirmation
function confirmDelete(file: FileRecord) {
  fileToDelete.value = file;
}

// Delete selected file
async function deleteSelectedFile() {
  if (fileToDelete.value) {
    localError.value = ''; // Clear any previous errors
    
    try {
      await fileStore.deleteFile(fileToDelete.value.id);
      fileToDelete.value = null; // Close the modal
      
      // Refresh the accessible files list
      await fetchAccessibleFiles();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      localError.value = `刪除失敗: ${err.message || '未知錯誤'}`;
    }
  }
}

// Load accessible files when component mounts
onMounted(async () => {
  await fetchAccessibleFiles();
});
</script>

<style scoped>
.accessible-files-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* User context section styles */
.user-context-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f0f8ff;
  border-radius: 8px;
  border: 1px solid #cce5ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.current-user-info {
  margin-bottom: 1rem;
}

.current-user-info h2 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  color: #0066cc;
}

.current-user-info p {
  margin: 0.5rem 0;
  color: #444;
}

.user-info-hint {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
  padding-left: 0.5rem;
  border-left: 3px solid #cce5ff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #333;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.error-message {
  padding: 1rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #ef5350;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-top: 2rem;
}

.files-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.file-item {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.file-owner {
  font-style: italic;
}

.permission-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.permission-badge.read {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.permission-badge.write {
  background-color: #e3f2fd;
  color: #1565c0;
}

.permission-badge.delete {
  background-color: #fff3e0;
  color: #e65100;
}

.permission-badge.owner {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: auto;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  background-color: #f5f5f5;
  color: #333;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:hover {
  background-color: #e0e0e0;
}

.btn.primary {
  background-color: #2196f3;
  color: white;
}

.btn.primary:hover {
  background-color: #1976d2;
}

.btn.danger {
  background-color: #f44336;
  color: white;
}

.btn.danger:hover {
  background-color: #d32f2f;
}

.btn.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.9rem;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
}

.modal h2 {
  margin-top: 0;
  color: #333;
}

.warning {
  color: #f44336;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
