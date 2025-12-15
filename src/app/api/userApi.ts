import { api } from "@/lib/apiClient"
import { UserProfile } from "@/models/user"

const createUserProfile = async () => {
    try {
      const response = await api.post('/api/users/me')
      if (!response || !response.data) {
        console.error('No data returned from user profile creation')
        return
      }
      console.log(response.data)
    } catch (err) {
      console.error('Failed to create user profile', err)
    }
  }

const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/me')
    if (!response || !response.data) {
      console.error('No data returned from user profile')
      return
    }
    console.log(response.data)
  } catch (err) {
    console.error('Failed to get user profile', err)
  }
}

const updateUserProfile = async (userProfile: UserProfile) => {
  try {
    const response = await api.put('/api/users/me', userProfile)
    if (!response || !response.data) {
      console.error('No data returned from user profile update')
      return
    }
    console.log(response.data)
  } catch (err) {
    console.error('Failed to update user profile', err)
  }
}


export { createUserProfile, getUserProfile, updateUserProfile }