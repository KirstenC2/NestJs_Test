import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import userService, { type User } from '../services/userService'

export const useUserStore = defineStore('user', () => {
  // Available users - initialized as empty array and populated from API
  const availableUsers = ref<User[]>([])
  const loading = ref(false)
  const error = ref('')
  
  // Fetch users from the API
  const fetchUsers = async () => {
    loading.value = true
    error.value = ''
    try {
      const users = await userService.getUsers()
      // Add isActive property to each user
      availableUsers.value = users.map(user => ({
        ...user,
        isActive: user.id === currentUserId.value
      }))
      
      // If the current user doesn't exist in the fetched users, set the first user as current
      if (availableUsers.value.length > 0 && !availableUsers.value.find(u => u.id === currentUserId.value)) {
        setCurrentUser(availableUsers.value[0].id)
      }
      
      loading.value = false
    } catch (err: any) {
      console.error('Error fetching users:', err)
      error.value = `Failed to load users: ${err.message || 'Unknown error'}`
      loading.value = false
      
      // Set a default user if the API call fails
      availableUsers.value = [{ id: '11111111-1111-1111-1111-111111111111', name: '默認使用者', isActive: true }]
    }
  }

  // Current active user
  const currentUserId = ref<string>('11111111-1111-1111-1111-111111111111')

  // Set the current user
  const setCurrentUser = (userId: string) => {
    currentUserId.value = userId
    
    // Update isActive flag for all users
    availableUsers.value = availableUsers.value.map(user => ({
      ...user,
      isActive: user.id === userId
    }))
  }

  // Computed property to get the current user object
  const currentUser = computed(() => {
    return availableUsers.value.find(user => user.id === currentUserId.value) || availableUsers.value[0]
  })

  // Get a user by ID
  const getUserById = (userId: string) => {
    return availableUsers.value.find(user => user.id === userId)
  }

  // Add a new user
  const addUser = (user: User) => {
    availableUsers.value.push({
      ...user,
      isActive: false
    })
  }

  // Initial fetch of users when the store is created
  fetchUsers()
  
  return {
    availableUsers,
    currentUserId,
    currentUser,
    loading,
    error,
    fetchUsers,
    setCurrentUser,
    getUserById,
    addUser
  }
})
