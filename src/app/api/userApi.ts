import { api } from '@/lib/apiClient'
import { UserProfile } from '@/models/user'

const createUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await api.post('/api/users/me')
    if (!response || !response.data || !response.data.user) {
      console.error('No data returned from user profile creation')
      return null
    }
    return response.data.user as UserProfile
  } catch (err) {
    console.error('Failed to create user profile', err)
    throw err
  }
}

const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await api.get('/api/users/me')
    if (!response || !response.data) {
      console.error('No data returned from user profile')
      return null
    }
    // GET returns UserProfile directly, not wrapped in { user: ... }
    return response.data as UserProfile
  } catch (err) {
    console.error('Failed to get user profile', err)
    throw err
  }
}

const updateUserProfile = async (userProfile: UserProfile): Promise<UserProfile | null> => {
  try {
    const response = await api.put('/api/users/me', userProfile)
    if (!response || !response.data || !response.data.user) {
      console.error('No data returned from user profile update')
      return null
    }
    return response.data.user as UserProfile
  } catch (err) {
    console.error('Failed to update user profile', err)
    throw err
  }
}

export { createUserProfile, getUserProfile, updateUserProfile }
