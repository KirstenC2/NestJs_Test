<template>
  <div class="permissions-page">
    <h1>檔案權限管理</h1>
    
    <div v-if="!selectedFileId" class="file-selection">
      <h2>選擇檔案</h2>
      
      <div v-if="localLoading" class="loading">
        正在載入檔案...
      </div>
      
      <div v-else-if="localError" class="error-message">
        {{ localError }}
      </div>
      
      <div v-else-if="fileStore.files.length === 0" class="empty-state">
        <p>沒有找到檔案。 <router-link to="/files">先上傳檔案</router-link>。</p>
      </div>
      
      <div v-else class="files-list">
        <div v-for="file in fileStore.files" :key="file.id" class="file-item">
          <div class="file-details">
            <h3>{{ file.originalname }}</h3>
          </div>
          
          <div class="file-actions">
            <button class="btn primary" @click="selectFile(file.id)">
              管理權限
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="permissions-management">
      <div class="header-with-actions">
        <h2>
          檔案權限: 
          <span v-if="fileStore.selectedFile">{{ fileStore.selectedFile.originalname }}</span>
          <span v-else class="loading-inline">正在載入...</span>
        </h2>
        <button class="btn" @click="deselectFile">返回檔案列表</button>
      </div>
      
      <div v-if="localLoading || permissionLoading" class="loading">
        正在載入權限...
      </div>
      
      <div v-else-if="localError" class="error-message">
        {{ localError }}
      </div>
      
      <div v-else>
        <!-- Owner status message -->
        <div class="ownership-info">
          <p v-if="isOwner" class="owner-badge">
            <span class="owner-icon">👑</span> 您是此檔案的擁有者，可以管理權限
          </p>
          <p v-else class="not-owner-message">
            <span class="info-icon">ℹ️</span> 只有檔案擁有者可以管理權限
          </p>
        </div>
        
        <!-- Display current permissions -->
        <div class="permissions-list">
          <h3>目前權限</h3>
          
          <div v-if="!fileStore.selectedFile?.permissions?.length" class="empty-state">
            <p>此檔案尚未設置權限。</p>
          </div>
          
          <div v-else>
            <table class="permissions-table">
              <thead>
                <tr>
                  <th>用戶 ID</th>
                  <th>權限</th>
                  <th v-if="isOwner">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="perm in fileStore.selectedFile.permissions" :key="perm.userId">
                  <td>{{ perm.userId }}</td>
                  <td>{{ perm.permission }}</td>
                  <td v-if="isOwner">
                    <button class="btn danger" @click="removePermission(perm.userId)">
                      移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Only show permission form for file owners -->
        <div v-if="isOwner" class="add-permission-section">
          <h3>新增權限</h3>
          <form @submit.prevent="formSubmit" class="permission-form">
            <div class="form-group">
              <label for="userId">用戶</label>
              <select 
                id="userId" 
                v-model="newPermission.userId" 
                required
              >
                <option value="">請選擇用戶</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="permission">權限</label>
              <select 
                id="permission" 
                v-model="newPermission.permission" 
                required
                @change="logPermissionChange"
              >
                <option value="read">讀取</option>
                <option value="write">寫入</option>
                <option value="delete">刪除</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn primary">設置權限</button>
            </div>
          </form>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileStore } from '../stores/fileStore';
import { useUserStore } from '../stores/userStore';
import type { PermissionRequest } from '../services/fileService';

const route = useRoute();
const router = useRouter();
const fileStore = useFileStore();
const userStore = useUserStore();

// Local reactive refs for component state
const localLoading = ref(false);
const localError = ref('');

// Sample users for the dropdown
const availableUsers = ref([
  { id: '11111111-1111-1111-1111-111111111111', name: '目前使用者' },
  { id: '22222222-2222-2222-2222-222222222222', name: '使用者 2' },
  { id: '33333333-3333-3333-3333-333333333333', name: '使用者 3' },
  { id: '44444444-4444-4444-4444-444444444444', name: '使用者 4' }
]);

// Local state
const selectedFileId = ref<string | null>(null); // ID of currently selected file
const newPermission = ref<PermissionRequest>({ userId: '', permission: 'read' });
const successMessage = ref<string>('');
const permissionLoading = ref<boolean>(false); // Local loading state for permission operations

// Check if current user is the file owner
const isOwner = computed(() => {
  if (!fileStore.selectedFile || !userStore.currentUserId) {
    console.log('Missing data for ownership check:', { 
      selectedFile: fileStore.selectedFile,
      currentUserId: userStore.currentUserId
    });
    return false;
  }
  
  // Check if the file has ownerId or fallback to userId
  const fileOwnerId = fileStore.selectedFile.ownerId || fileStore.selectedFile.userId;
  
  // Log ownership details to help with debugging
  console.log('Ownership check:', { 
    fileOwnerId, 
    currentUserId: userStore.currentUserId,
    isOwner: fileOwnerId === userStore.currentUserId 
  });
  
  return fileOwnerId === userStore.currentUserId;
});

// Copy any global error to our local error initially
if (fileStore.error) {
  localError.value = fileStore.error;
}

// Access the updatePermission method from the file service
import fileService from '../services/fileService';


// Load files on component mount
onMounted(async () => {
  console.log('PermissionsView component mounted');
  localLoading.value = true;
  
  try {
    // First load all files
    console.log('Fetching files list...');
    await fileStore.fetchFiles();
    console.log('Files fetched successfully:', fileStore.files.length, 'files');
    
    // Check for fileId in the URL query parameters
    const fileId = route.query.fileId as string;
    if (fileId) {
      console.log('File ID found in URL:', fileId);
      await selectFile(fileId);
    } else {
      console.log('No file ID in URL');
    }
  } catch (error: any) {
    console.error('Error loading files:', error);
    localError.value = `無法載入檔案: ${error.message || '未知錯誤'}`;
  } finally {
    localLoading.value = false;
  }
});

// Select a file to manage permissions
async function selectFile(fileId: string) {
  console.log('Selecting file with ID:', fileId);
  selectedFileId.value = fileId;
  localLoading.value = true;
  localError.value = ''; // Reset error state when selecting a file
  
  try {
    console.log('Fetching file details for ID:', fileId);
    await fileStore.fetchFileById(fileId);
    
    // Verify that file data was loaded correctly
    if (fileStore.selectedFile) {
      console.log('File details loaded successfully:', fileStore.selectedFile.originalname);
      // Update route to include fileId
      router.replace({ query: { fileId } });
    } else {
      console.error('Failed to load file details - currentFile is still undefined after fetch');
      localError.value = '檔案資料載入失敗，請重試'; // 'Failed to load file data, please try again' in Chinese
    }
  } catch (error: any) {
    console.error('Error fetching file:', error);
    localError.value = `無法載入檔案詳情: ${error.message || '未知錯誤'}`;
  } finally {
    localLoading.value = false;
  }
}

// Go back to file selection
function deselectFile() {
  selectedFileId.value = null;
  router.replace({ query: {} });
  localError.value = ''; // Reset error state when deselecting a file
}

// Debug functions
function logPermissionChange() {
  console.log('Permission selection changed:', JSON.stringify(newPermission.value));
}

// Main form submission handler
async function formSubmit(event) {
  console.log('%c FORM SUBMITTED!', 'background: orange; color: white; font-size: 16px');
  console.log('Event:', event);
  await addPermission();
}

// Manual direct submission button handler
async function manualPermissionSubmit() {
  console.log('%c MANUAL BUTTON CLICKED', 'background: yellow; color: black; font-size: 16px');
  if (!newPermission.value.userId) {
    localError.value = '請選擇用戶'; // 'Please select a user' in Chinese
    return;
  }
  await addPermission();
}

function debugClick(event) {
  console.log('Button clicked!', event);
  // We're preventing default to make sure we handle the form submission ourselves
  // But we'll also manually call addPermission just in case
  event.preventDefault();
  addPermission();
}

// Direct API test for debugging
async function testDirectApi() {
  if (!selectedFileId.value) {
    console.error('No file selected');
    localError.value = '請先選擇檔案';
    return;
  }
  
  const testUserId = '22222222-2222-2222-2222-222222222222';
  const ownerUserId = '11111111-1111-1111-1111-111111111111';
  
  console.log('Testing direct API call');
  successMessage.value = '';
  localError.value = '';
  permissionLoading.value = true;
  
  try {
    // Make a direct axios call to the permissions endpoint
    const axios = (await import('axios')).default;
    
    // Construct the URL and request payload
    const url = `http://localhost:3000/files/${selectedFileId.value}/permissions`;
    const payload = {
      userId: testUserId,
      permission: 'read'
    };
    
    // Call the API with explicit headers and query params
    console.log('Making test API call to:', url);
    console.log('With payload:', payload);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${ownerUserId}`,
        'Content-Type': 'application/json'
      },
      params: {
        userId: ownerUserId
      }
    });
    
    console.log('Direct API call succeeded:', response.data);
    successMessage.value = '測試API請求成功！';
    
    // Refresh file data
    await fetchFileById(selectedFileId.value);
  } catch (err: any) {
    console.error('Direct API call failed:', err);
    
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      localError.value = `測試API失敗: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
    } else if (err.request) {
      console.error('No response received:', err.request);
      localError.value = '測試API失敗: 伺服器無回應';
    } else {
      console.error('Error message:', err.message);
      localError.value = `測試API失敗: ${err.message}`;
    }
  } finally {
    permissionLoading.value = false;
  }
}

// Separate function to handle permission removal
async function removePermission(userId: string) {
  if (!selectedFileId.value) {
    console.error('No file selected');
    localError.value = '請先選擇檔案'; // 'Please select a file first' in Chinese
    return;
  }
  
  try {
    // Indicate in the UI that we're processing
    permissionLoading.value = true;
    localError.value = '';
    successMessage.value = '';
    
    // Call the API to remove the permission
    const url = `http://localhost:3000/files/${selectedFileId.value}/permissions/${userId}`;
    console.log('DELETE URL:', url);
    
    // Direct Axios request
    const axios = (await import('axios')).default;
    
    // Construct the request config with the user ID in the params (query)
    const ownerUserId = userStore.currentUserId;
    const config = { 
      headers: { 'Authorization': `Bearer ${ownerUserId}` },
      params: { userId: ownerUserId }
    };
    
    // Make the request
    console.log('Making DELETE request with config:', config);
    await axios.delete(url, config);
    
    console.log('Permission successfully removed');
    
    // Refresh the file data to reflect the updated permissions
    await fileStore.fetchFileById(selectedFileId.value);
    
    // Show success message
    successMessage.value = '已成功移除權限'; // 'Permission successfully removed' in Chinese
  } catch (err: any) {
    console.error('Error removing permission:', err);
    
    // Display detailed error message
    if (err.response) {
      console.error('Response error data:', err.response.data);
      console.error('Response status:', err.response.status);
      localError.value = `移除權限失敗: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
    } else {
      localError.value = `移除權限失敗: ${err.message || '未知錯誤'}`; // 'Failed to remove permission' in Chinese
    }
  } finally {
    permissionLoading.value = false;
  }
}

// Add or update a permission
async function addPermission() {
  console.log('%c ADD PERMISSION FUNCTION CALLED', 'background: green; color: white; font-size: 16px');
  console.log('Browser time:', new Date().toISOString());
  
  if (!selectedFileId.value) {
    console.error('No file selected');
    localError.value = '請先選擇檔案'; // 'Please select a file first' in Chinese
    return;
  }
  
  if (!newPermission.value.userId) {
    console.error('No user ID provided');
    localError.value = '請選擇用戶'; // 'Please select a user' in Chinese
    return;
  }
  
  if (!newPermission.value.permission) {
    console.error('No permission level provided');
    localError.value = '請選擇權限等級'; // 'Please select a permission level' in Chinese
    return;
  }
  
  try {
    // Start loading
    permissionLoading.value = true;
    
    // Reset messages
    localError.value = '';
    successMessage.value = '';
    
    console.log('Adding/updating permission:', newPermission.value);
    
    // Prepare the API call data
    const url = `http://localhost:3000/files/${selectedFileId.value}/permissions`;
    const payload = newPermission.value;
    
    // Direct Axios request
    const axios = (await import('axios')).default;
    
    // Add authorization with current user ID
    const ownerUserId = userStore.currentUserId;
    const config = { 
      headers: { 'Authorization': `Bearer ${ownerUserId}` },
      params: { userId: ownerUserId }
    };
    
    console.log('Config:', JSON.stringify(config));
    
    // Make a direct HTTP request using axios
    const response = await axios.post(url, payload, config);
    
    console.log('%c API RESPONSE SUCCESS', 'background: green; color: white');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data));
    
    // Refresh file data to show updated permissions
    await fileStore.fetchFileById(selectedFileId.value);
    
    // Show success message and reset form
    successMessage.value = '已成功設置權限'; // 'Permission successfully set' in Chinese
    newPermission.value = {
      userId: '',
      permission: 'read'
    };
  } catch (err: any) {
    console.log('%c API REQUEST FAILED', 'background: red; color: white; font-size: 16px');
    console.error('Error object:', err);
    
    if (err.response) {
      // The server responded with an error status code
      console.error('Response status:', err.response.status);
      console.error('Response headers:', JSON.stringify(err.response.headers));
      console.error('Response data:', JSON.stringify(err.response.data));
      localError.value = `設置權限失敗: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
    } else if (err.request) {
      // The request was made but no response was received
      console.error('Request sent but no response received');
      console.error('Request details:', err.request);
      localError.value = '設置權限失敗: 伺服器無回應'; // 'Failed to set permission: No response from server' in Chinese
    } else {
      // Something happened in setting up the request
      console.error('Error message:', err.message);
      localError.value = `設置權限失敗: ${err.message}`; // 'Failed to set permission' in Chinese
    }
  } finally {
    permissionLoading.value = false;
  }
}

// Update URL when file is selected
watch(selectedFileId, (newId) => {
  if (newId) {
    router.replace({ query: { fileId: newId } });
  }
});
</script>

<style scoped>
.permissions-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1, h2, h3 {
  margin-bottom: 1rem;
}

.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.file-selection, .permissions-management {
  margin-top: 2rem;
}

.files-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.file-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.file-details h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  word-break: break-word;
}

.file-actions {
  margin-top: 1rem;
}

.permissions-list {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

.permission-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.access-level {
  display: flex;
  align-items: center;
}

.permission-details {
  display: flex;
  gap: 0.5rem;
  margin-right: 1rem;
}

.access-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #eaeaea;
  color: #666;
  font-size: 0.85rem;
}

.access-badge.active {
  background-color: #4caf50;
  color: white;
}

.loading {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.loading-inline {
  color: #888;
  font-style: italic;
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

.btn.danger {
  background-color: #f44336;
  color: white;
}

.btn.danger:hover {
  background-color: #e53935;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.permission-form, .add-permission {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 200px;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  border-left: 4px solid #d32f2f;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  border-left: 4px solid #2e7d32;
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #666;
}

/* Ownership information styles */
.ownership-info {
  margin: 1rem 0 2rem;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  background-color: #f8f9fa;
  border-left: 4px solid #6c757d;
}

.owner-badge {
  color: #2c6e31;
  margin: 0;
  display: flex;
  align-items: center;
}

.not-owner-message {
  color: #6c757d;
  margin: 0;
  display: flex;
  align-items: center;
}

.owner-icon, .info-icon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

/* Permissions table styles */
.permissions-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.permissions-table th,
.permissions-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.permissions-table th {
  font-weight: 600;
  background-color: #f5f5f5;
}

.add-permission-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}
</style>
