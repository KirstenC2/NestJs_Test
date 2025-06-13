import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import fileService, { type FileRecord, type PermissionRequest } from '../services/fileService'

export const useFileStore = defineStore('file', () => {
  // State
  const files = ref<FileRecord[]>([])
  const selectedFile = ref<FileRecord | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Actions
  const fetchFiles = async () => {
    loading.value = true
    error.value = ''
    try {
      files.value = await fileService.getFiles()
      loading.value = false
    } catch (err) {
      console.error('Error fetching files:', err)
      error.value = 'Failed to load files'
      loading.value = false
    }
  }
  
  const fetchAccessibleFiles = async () => {
    loading.value = true
    error.value = ''
    try {
      const accessibleFiles = await fileService.getAccessibleFiles()
      loading.value = false
      return accessibleFiles
    } catch (err) {
      console.error('Error fetching accessible files:', err)
      error.value = 'Failed to load accessible files'
      loading.value = false
      return []
    }
  }

  const fetchFileById = async (id: string) => {
    loading.value = true
    error.value = ''
    try {
      selectedFile.value = await fileService.getFile(id)
      loading.value = false
      return selectedFile.value
    } catch (err) {
      console.error(`Error fetching file ${id}:`, err)
      error.value = 'Failed to load file details'
      loading.value = false
      return null
    }
  }

  const uploadFile = async (file: Partial<FileRecord>, fileObject: globalThis.File | Blob) => {
    loading.value = true
    error.value = ''
    try {
      const uploadedFile = await fileService.uploadFile(file, fileObject)
      files.value.push(uploadedFile)
      loading.value = false
      return uploadedFile
    } catch (err) {
      console.error('Error uploading file:', err)
      error.value = 'Failed to upload file'
      loading.value = false
      return null
    }
  }

  const createFile = async (file: Omit<FileRecord, 'id'>) => {
    loading.value = true
    error.value = ''
    try {
      const newFile = await fileService.createFile(file)
      files.value.push(newFile)
      loading.value = false
      return newFile
    } catch (err) {
      console.error('Error creating file:', err)
      error.value = 'Failed to create file'
      loading.value = false
      return null
    }
  }

  const downloadFile = async (id: string, filename: string) => {
    loading.value = true
    error.value = ''
    try {
      // Use the fileService's downloadFile method which now handles the full download process
      await fileService.downloadFile(id, filename)
      loading.value = false
      return true
    } catch (err) {
      console.error(`Error downloading file ${id}:`, err)
      error.value = 'Failed to download file'
      loading.value = false
      return false
    }
  }

  const deleteFile = async (id: string) => {
    loading.value = true
    error.value = ''
    try {
      await fileService.deleteFile(id)
      files.value = files.value.filter((f: FileRecord) => f.id !== id)
      if (selectedFile.value && selectedFile.value.id === id) {
        selectedFile.value = null
      }
      loading.value = false
      return true
    } catch (err) {
      console.error(`Error deleting file ${id}:`, err)
      error.value = 'Failed to delete file'
      loading.value = false
      return false
    }
  }

  const updatePermission = async (fileId: string, permission: PermissionRequest) => {
    loading.value = true
    error.value = ''
    try {
      const result = await fileService.updatePermission(fileId, permission)
      
      // Refresh the file data to get updated permissions
      await fetchFileById(fileId)
      
      loading.value = false
      return result
    } catch (err) {
      console.error(`Error updating permission for file ${fileId}:`, err)
      error.value = 'Failed to update permission'
      loading.value = false
      return null
    }
  }

  // Getters
  const getFileById = computed(() => (id: string) => {
    return files.value.find((file: FileRecord) => file.id === id) || null
  })

  return {
    // State
    files,
    selectedFile,
    loading,
    error,
    // Actions
    fetchFiles,
    fetchAccessibleFiles,
    fetchFileById,
    uploadFile,
    createFile,
    downloadFile,
    deleteFile,
    updatePermission,
    // Getters
    getFileById
  }
})
