<template>
  <div class="permissions-page">
    <h1>Permission Management</h1>
    
    <div v-if="!selectedFileId" class="file-selection">
      <h2>Select a File</h2>
      
      <div v-if="loading" class="loading">
        Loading files...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="files.length === 0" class="empty-state">
        <p>No files found. <router-link to="/files">Upload a file</router-link> first.</p>
      </div>
      
      <div v-else class="files-list">
        <div v-for="file in files" :key="file.id" class="file-item">
          <div class="file-details">
            <h3>{{ file.name }}</h3>
          </div>
          
          <div class="file-actions">
            <button class="btn primary" @click="selectFile(file.id)">
              Manage Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="permissions-management">
      <div class="header-with-actions">
        <h2>
          Permissions for: 
          <span v-if="currentFile">{{ currentFile.name }}</span>
          <span v-else class="loading-inline">Loading...</span>
        </h2>
        <button class="btn" @click="deselectFile">Back to Files</button>
      </div>
      
      <div v-if="loading" class="loading">
        Loading permissions...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else>
        <div class="permissions-list">
          <div v-if="!currentFile?.permissions?.length" class="empty-state">
            <p>No permissions set for this file. Add a permission below.</p>
          </div>
          
          <div v-else class="permission-items">
            <div v-for="(perm, index) in currentFile?.permissions" :key="index" class="permission-item">
              <div>
                <span class="user-type-badge" :class="perm.userType">
                  {{ perm.userType === 'user' ? 'User' : 'Group' }}
                </span>
                <strong>{{ perm.userId }}</strong>
              </div>
              
              <div class="access-level">
                <span class="access-badge" :class="perm.accessLevel">
                  {{ perm.accessLevel.charAt(0).toUpperCase() + perm.accessLevel.slice(1) }}
                </span>
              </div>
              
              <button class="btn small danger" @click="removePermission(index)">
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <div class="add-permission">
          <h3>Add Permission</h3>
          <form @submit.prevent="addPermission">
            <div class="form-row">
              <div class="form-group">
                <label for="userType">User Type</label>
                <select id="userType" v-model="newPermission.userType" required>
                  <option value="user">User</option>
                  <option value="group">Group</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="userId">User/Group ID</label>
                <input 
                  id="userId" 
                  v-model="newPermission.userId" 
                  type="text" 
                  required
                  placeholder="Enter user or group ID"
                >
              </div>
              
              <div class="form-group">
                <label for="accessLevel">Access Level</label>
                <select id="accessLevel" v-model="newPermission.accessLevel" required>
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn primary">Add Permission</button>
            </div>
          </form>
        </div>
        
        <div class="save-actions">
          <button @click="savePermissions" class="btn primary large" :disabled="!hasChanges">
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFileStore } from '../stores/fileStore';
import type { Permission } from '../services/fileService';

const route = useRoute();
const router = useRouter();
const fileStore = useFileStore();

const {
  files,
  currentFile,
  loading,
  error,
  fetchFiles,
  fetchFileById,
  updatePermissions
} = fileStore;

// Local state
const selectedFileId = ref<string | null>(null);
const originalPermissions = ref<Permission[]>([]);
const newPermission = ref<Permission>({
  userId: '',
  userType: 'user',
  accessLevel: 'read'
});

// Check if there are unsaved changes
const hasChanges = computed(() => {
  if (!currentFile.value?.permissions || !originalPermissions.value) return false;
  
  if (currentFile.value.permissions.length !== originalPermissions.value.length) return true;
  
  // Deep comparison of permissions arrays
  for (let i = 0; i < currentFile.value.permissions.length; i++) {
    const curr = currentFile.value.permissions[i];
    const orig = originalPermissions.value[i];
    
    if (curr.userId !== orig.userId || 
        curr.userType !== orig.userType || 
        curr.accessLevel !== orig.accessLevel) {
      return true;
    }
  }
  
  return false;
});

// Load files on component mount
onMounted(async () => {
  await fetchFiles();
  
  // Check for fileId in the URL query parameters
  const fileId = route.query.fileId as string;
  if (fileId) {
    selectFile(fileId);
  }
});

// Select a file to manage permissions
async function selectFile(fileId: string) {
  selectedFileId.value = fileId;
  await fetchFileById(fileId);
  
  // Store original permissions for comparison
  if (currentFile.value?.permissions) {
    originalPermissions.value = JSON.parse(JSON.stringify(currentFile.value.permissions));
  } else {
    originalPermissions.value = [];
    
    // Initialize empty permissions array if not present
    if (currentFile.value && !currentFile.value.permissions) {
      currentFile.value.permissions = [];
    }
  }
}

// Go back to file selection
function deselectFile() {
  if (hasChanges.value) {
    if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
      selectedFileId.value = null;
    }
  } else {
    selectedFileId.value = null;
  }
}

// Add a new permission
function addPermission() {
  if (!currentFile.value) return;
  
  if (!currentFile.value.permissions) {
    currentFile.value.permissions = [];
  }
  
  // Clone the permission object to avoid reference issues
  currentFile.value.permissions.push({ ...newPermission.value });
  
  // Reset the form
  newPermission.value = {
    userId: '',
    userType: 'user',
    accessLevel: 'read'
  };
}

// Remove a permission
function removePermission(index: number) {
  if (!currentFile.value?.permissions) return;
  
  currentFile.value.permissions.splice(index, 1);
}

// Save all permission changes
async function savePermissions() {
  if (!selectedFileId.value || !currentFile.value?.permissions) return;
  
  const result = await updatePermissions(
    selectedFileId.value,
    currentFile.value.permissions
  );
  
  if (result) {
    alert('Permissions updated successfully!');
    // Update original permissions reference
    originalPermissions.value = JSON.parse(JSON.stringify(currentFile.value.permissions));
  }
}

// Update URL when file is selected
watch(selectedFileId, (newId) => {
  if (newId) {
    router.replace({ query: { fileId: newId } });
  } else {
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.permissions-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.file-selection, .permissions-management {
  margin-top: 2rem;
}

.header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.loading-inline {
  font-style: italic;
  color: #6c757d;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.permissions-list {
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
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-type-badge, .access-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.user-type-badge.user {
  background-color: #e3f2fd;
  color: #0d47a1;
}

.user-type-badge.group {
  background-color: #e8f5e9;
  color: #1b5e20;
}

.access-badge.read {
  background-color: #e8f5e9;
  color: #1b5e20;
}

.access-badge.write {
  background-color: #fff3e0;
  color: #e65100;
}

.access-badge.delete {
  background-color: #ffebee;
  color: #b71c1c;
}

.add-permission {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  flex: 1;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.save-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.error-message {
  color: #dc3545;
  padding: 1rem;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 1rem;
}

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #e9ecef;
  color: #212529;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  background-color: #dee2e6;
}

.btn.primary {
  background-color: #3498db;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn.danger {
  background-color: #dc3545;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn.large {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
