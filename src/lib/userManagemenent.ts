import { getUserProfile, createUserProfile as createUserProfileApi } from '@/app/api/userApi'
import type { UserProfile } from '@/models/user'
import { useUserStore } from '@/stores/userStore'
import { AxiosError } from 'axios'

const addUserToStore = (userProfile: UserProfile) => {
  const { setUser } = useUserStore.getState()
  setUser(userProfile)
}

const syncUserProfile = async (): Promise<UserProfile | null> => {
  const { setLoading } = useUserStore.getState()
  setLoading(true)

  try {
    const userProfile = await fetchOrCreateUserProfile()
    if (userProfile) {
      addUserToStore(userProfile)
    }
    return userProfile
  } catch (error) {
    console.error('Error syncing user profile:', error)
    return null
  } finally {
    setLoading(false)
  }
}

const fetchOrCreateUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const existingProfile = await getUserProfile()

    if (existingProfile) {
      console.log('User profile found:', existingProfile)
      return existingProfile
    }
    return await createUserProfile()
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      console.log('User not found (404), creating new profile...')
      return await createUserProfile()
    }

    console.error('Error fetching user profile:', error)
    return null
  }
}

const createUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const newProfile = await createUserProfileApi()

    if (newProfile) {
      console.log('User profile created:', newProfile)
      return newProfile
    }
    return null
  } catch (error) {
    console.error('Failed to create user profile:', error)
    return null
  }
}

export { syncUserProfile }
