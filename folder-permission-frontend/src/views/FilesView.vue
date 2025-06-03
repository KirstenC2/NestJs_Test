<template>
  <div class="files-page">
    <!-- User context section -->
    <div class="user-context-section">
      <div class="current-user-info">
        <h2>當前使用者身份</h2>
        <p>當前使用者: <strong>{{ userStore.currentUser?.name || '未選擇' }}</strong></p>
        <p class="user-info-hint">切換使用者身份後，您將以該使用者的權限查看和管理檔案。</p>
      </div>
      
      <!-- User selector component with user-changed event handler -->
      <UserSelector 
        label="切換使用者身份" 
        @user-changed="handleUserChanged" 
      />
    </div>
    
    <div class="actions">
      <router-link to="/accessible-files" class="btn">
        查看可訪問的檔案
      </router-link>
      <button @click="showCreateModal = true" class="btn primary">上傳檔案</button>
    </div>
    
    <div v-if="localLoading" class="loading">
      正在載入檔案...
    </div>
    
    <div v-else-if="localError || fileStore.error" class="error-message">
      {{ localError || fileStore.error }}
    </div>
    
    <div v-else-if="fileStore.files.length === 0" class="empty-state">
      <p>目前沒有任何檔案</p>
    </div>
    
    <div v-else class="files-list">
      <div v-for="file in fileStore.files" :key="file.id" class="file-item">
        <div class="file-details">
          <h3>{{ file.originalname }}</h3>
        </div>
        
        <div class="file-actions">
          <button class="btn small" @click="viewFilePermissions(file)">
            權限管理
          </button>
          <!-- Only show delete button if user is the owner -->
          <button 
            v-if="isOwner(file)" 
            class="btn small danger" 
            @click="confirmDelete(file)"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create File Modal -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>上傳新檔案</h2>
        <form @submit.prevent="createNewFile">
          <div class="form-group">
            <label for="fileName">檔案名稱</label>
            <input 
              id="fileName" 
              v-model="newFile.originalname" 
              type="text" 
              required
              placeholder="請輸入檔案名稱"
            >
          </div>
          
          <div class="form-group">
            <label for="fileUpload">選擇檔案</label>
            <input 
              id="fileUpload" 
              type="file" 
              @change="handleFileSelection"
              required
            >
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showCreateModal = false" class="btn">取消</button>
            <button type="submit" class="btn primary">上傳</button>
          </div>
        </form>
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
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useFileStore } from '../stores/fileStore';
import { useUserStore } from '../stores/userStore';
import type { FileRecord } from '../services/fileService';
import UserSelector from '../components/UserSelector.vue';

const router = useRouter();
const userStore = useUserStore();
const fileStore = useFileStore();

// Local reactive refs for component state
const localLoading = ref(false);
const localError = ref('');

// Handle explicit user change from UserSelector
async function handleUserChanged(newUserId: string) {
  console.log(`User explicitly changed to ${newUserId}, reloading files...`);
  
  // Show loading state
  localLoading.value = true;
  localError.value = '';
  
  try {
    // Reload files for the new user
    await fileStore.fetchFiles();
    console.log('Files reloaded successfully for new user');
  } catch (error: any) {
    console.error('Error reloading files after user change:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    localLoading.value = false;
  }
}

// Watch for user changes as a backup (should not trigger with the new confirmation flow)
watch(() => userStore.currentUserId, async (newUserId, oldUserId) => {
  console.log(`User changed from ${oldUserId} to ${newUserId}`);
  // This is a backup watcher and shouldn't normally trigger with our new confirmation UI
  // but we'll keep it for safety
  localLoading.value = true;
  try {
    await fileStore.fetchFiles();
  } catch (error: any) {
    console.error('Error reloading files from watcher:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    localLoading.value = false;
  }
});

// Local state
const showCreateModal = ref(false);
const fileToDelete = ref<FileRecord | null>(null);
const selectedFile = ref<File | null>(null);
const newFile = ref<Partial<FileRecord>>({
  originalname: '',
  userId: userStore.currentUserId // Use the current user ID from store
});

// Initialize error state from store if needed
if (fileStore.error) {
  localError.value = fileStore.error;
}

// Load files when component mounts
onMounted(async () => {
  localLoading.value = true;
  try {
    await fileStore.fetchFiles();
  } catch (error: any) {
    console.error('Error loading files on mount:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    localLoading.value = false;
  }
});

// View file permissions
function viewFilePermissions(file: FileRecord) {
  router.push(`/permissions?fileId=${file.id}`);
}

// Handle file selection
function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
    // If no custom name is provided, use the file's name
    if (!newFile.value.originalname) {
      newFile.value.originalname = selectedFile.value.name;
    }
  }
}

// Create new file
async function createNewFile() {
  localError.value = ''; // Clear previous errors
  
  if (!selectedFile.value) {
    localError.value = '請選擇一個文件上傳'; // 'Please select a file to upload' in Chinese
    return;
  }
  
  console.log('Starting file upload...', {
    metadata: newFile.value,
    file: selectedFile.value,
    fileSize: selectedFile.value.size,
    fileType: selectedFile.value.type
  });
  
  // Ensure we have a valid originalname
  if (!newFile.value.originalname) {
    newFile.value.originalname = selectedFile.value.name;
  }
  
  // Always use the current user ID from store
  newFile.value.userId = userStore.currentUserId;
  
  console.log('Final upload metadata:', newFile.value);
  
  try {
    // Use the uploadFile method from the file store
    console.log('Calling uploadFile method...');
    const result = await fileStore.uploadFile(newFile.value, selectedFile.value);
    console.log('Upload successful! Result:', result);
    
    if (result) {
      showCreateModal.value = false;
      // Reset form
      newFile.value = { 
        originalname: '',
        userId: userStore.currentUserId
      };
      selectedFile.value = null;
      
      // Refresh the file list to show the new file
      await fileStore.fetchFiles();
    }
  } catch (err: any) { // Type assertion for better error handling
    console.error('Error uploading file:', err);
    // Display detailed error message
    if (err.response) {
      console.error('Response error data:', err.response.data);
      console.error('Response status:', err.response.status);
      localError.value = `上傳失敗: ${err.response.status} - ${JSON.stringify(err.response.data)}`; // 'Upload failed' in Chinese
    } else if (err.request) {
      console.error('Request error:', err.request);
      localError.value = '上傳失敗: 伺服器無回應'; // 'Upload failed: No response from server' in Chinese
    } else {
      localError.value = `上傳失敗: ${err.message}`; // 'Upload failed: [error message]' in Chinese
    }
  }
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
      
      // Refresh files list after deletion
      localLoading.value = true;
      try {
        await fileStore.fetchFiles();
      } finally {
        localLoading.value = false;
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      if (err.response) {
        localError.value = `刪除失敗: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
      } else {
        localError.value = `刪除失敗: ${err.message}`;
      }
      fileToDelete.value = null; // Close the modal even if there's an error
    }
  }
}

// Check if current user is the owner of the file
function isOwner(file: FileRecord): boolean {
  if (!file) return false;
  
  // Compare the current user ID from the store with the file's user ID
  try {
    return file.userId === userStore.currentUserId;
  } catch (err) {
    console.error('Error checking file ownership:', err);
    return false; // Default to false on any error
  }
}
</script>

<style scoped>
.files-page {
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

.actions {
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
}

.files-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.file-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
}

.file-details h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  word-break: break-word;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.loading, .empty-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error-message {
  padding: 1rem;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  margin: 1rem 0;
  border-left: 4px solid #d32f2f;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #e0e0e0;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #d0d0d0;
}

.btn.primary {
  background-color: #1976d2;
  color: white;
}

.btn.primary:hover {
  background-color: #1565c0;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn.danger {
  background-color: #f44336;
  color: white;
}

.btn.danger:hover {
  background-color: #e53935;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 4px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.warning {
  color: #f44336;
  font-weight: 500;
}
</style>
