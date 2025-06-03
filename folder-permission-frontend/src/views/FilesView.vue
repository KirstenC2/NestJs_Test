<template>
  <div class="files-page">
    <h1>File Management</h1>
    
    <div class="actions">
      <button @click="showCreateModal = true" class="btn primary">Upload New File</button>
    </div>
    
    <div v-if="loading" class="loading">
      Loading files...
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="files.length === 0" class="empty-state">
      <p>No files found. Start by uploading a file.</p>
    </div>
    
    <div v-else class="files-list">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-details">
          <h3>{{ file.originalname }}</h3>
        </div>
        
        <div class="file-actions">
          <button class="btn small" @click="viewFilePermissions(file)">
            Permissions
          </button>
          <button class="btn small danger" @click="confirmDelete(file)">
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create File Modal -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h2>Upload New File</h2>
        <form @submit.prevent="createNewFile">
          <div class="form-group">
            <label for="fileName">File Name</label>
            <input 
              id="fileName" 
              v-model="newFile.originalname" 
              type="text" 
              required
              placeholder="Enter file name"
            >
          </div>
          
          <div class="form-group">
            <label for="fileUpload">Select File</label>
            <input 
              id="fileUpload" 
              type="file" 
              @change="handleFileSelection"
              required
            >
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showCreateModal = false" class="btn">Cancel</button>
            <button type="submit" class="btn primary">Upload</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="fileToDelete" class="modal">
      <div class="modal-content">
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete <strong>{{ fileToDelete.originalname }}</strong>?</p>
        <p class="warning">This action cannot be undone.</p>
        
        <div class="form-actions">
          <button @click="fileToDelete = null" class="btn">Cancel</button>
          <button @click="deleteSelectedFile" class="btn danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFileStore } from '../stores/fileStore';
import type { FileRecord } from '../services/fileService';

const router = useRouter();
const fileStore = useFileStore();

const { 
  files, 
  loading, 
  error, 
  fetchFiles, 
  createFile, 
  deleteFile 
} = fileStore;

// Local state
const showCreateModal = ref(false);
const fileToDelete = ref<FileRecord | null>(null);
const selectedFile = ref<File | null>(null);
const newFile = ref<Partial<FileRecord>>({
  originalname: '',
  userId: 'user1' // Default user ID
});

// Load files when component mounts
onMounted(async () => {
  await fetchFiles();
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
  if (!selectedFile.value) {
    error.value = 'Please select a file to upload';
    return;
  }
  
  console.log('Starting file upload...', {
    metadata: newFile.value,
    file: selectedFile.value
  });
  
  try {
    // Use the uploadFile method instead of createFile for actual file uploads
    console.log('Calling uploadFile method...');
    const result = await uploadFile(newFile.value, selectedFile.value);
    console.log('Upload result:', result);
    
    if (result) {
      showCreateModal.value = false;
      // Reset form
      newFile.value = { 
        originalname: '',
        userId: 'user1'
      };
      selectedFile.value = null;
    }
  } catch (err) {
    console.error('Error uploading file:', err);
    // Display detailed error message
    if (err.response) {
      console.error('Response error data:', err.response.data);
      console.error('Response status:', err.response.status);
      error.value = `Failed to upload file: ${err.response.status} - ${JSON.stringify(err.response.data)}`;
    } else if (err.request) {
      console.error('Request error:', err.request);
      error.value = 'Failed to upload file: No response received from server';
    } else {
      error.value = `Failed to upload file: ${err.message}`;
    }
  }
}

// Delete file confirmation
function confirmDelete(file: FileRecord) {
  fileToDelete.value = file;
}

// Delete selected file
async function deleteSelectedFile() {
  if (!fileToDelete.value) return;
  
  const result = await deleteFile(fileToDelete.value.id);
  if (result) {
    fileToDelete.value = null;
  }
}
</script>

<style scoped>
.files-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.actions {
  margin-bottom: 2rem;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.file-actions {
  display: flex;
  gap: 0.5rem;
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
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.warning {
  color: #dc3545;
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

.btn:hover {
  background-color: #dee2e6;
}

.btn.primary {
  background-color: #3498db;
  color: white;
}

.btn.primary:hover {
  background-color: #2980b9;
}

.btn.danger {
  background-color: #dc3545;
  color: white;
}

.btn.danger:hover {
  background-color: #c82333;
}

.btn.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>
