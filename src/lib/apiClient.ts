import axios, { type AxiosRequestHeaders } from 'axios'
import { getAuth } from 'firebase/auth'

// Get BACKEND_URL from environment variable
// NEXT_PUBLIC_* variables are automatically loaded by Next.js from .env files
// and are inlined at build time for client-side access
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

// Enhanced debugging - runs on both client and helps diagnose Vercel issues
// Note: NEXT_PUBLIC_* variables are inlined at build time, so Object.keys(process.env)
// won't show them. We need to check them directly.
if (typeof window !== 'undefined') {
  const envValue = process.env.NEXT_PUBLIC_BACKEND_URL
  
  // Check specific known variables (since inlined vars don't show in Object.keys)
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
  
  console.group('[apiClient] Environment Variable Debug')
  console.log('NEXT_PUBLIC_BACKEND_URL:', envValue ? `✓ Set (${envValue.substring(0, 30)}...)` : '❌ NOT SET')
  console.log('BACKEND_URL constant:', BACKEND_URL ? `✓ Set (${BACKEND_URL.substring(0, 30)}...)` : '❌ EMPTY')
  console.log('')
  console.log('Other NEXT_PUBLIC_ variables (to verify env vars work):')
  console.log('  NEXT_PUBLIC_FIREBASE_API_KEY:', firebaseApiKey ? '✓ Set' : '✗ Not set')
  console.log('  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', firebaseAuthDomain ? `✓ Set (${firebaseAuthDomain})` : '✗ Not set')
  console.log('  NEXT_PUBLIC_VERCEL_URL:', vercelUrl || 'Not available')
  console.log('  NEXT_PUBLIC_VERCEL_ENV:', vercelEnv || 'Not available')
  console.log('')
  console.log('Environment:', process.env.NODE_ENV)
  
  if (!envValue) {
    console.error('')
    console.error('⚠️ NEXT_PUBLIC_BACKEND_URL is missing!')
    if (firebaseApiKey || firebaseAuthDomain) {
      console.error('✅ Good news: Other NEXT_PUBLIC_ variables ARE working (Firebase is set)')
      console.error('   This means env vars are being inlined correctly.')
      console.error('   The issue is specifically with NEXT_PUBLIC_BACKEND_URL')
      console.error('')
      console.error('📋 Check:')
      console.error('  1. Variable name in Vercel: NEXT_PUBLIC_BACKEND_URL (exact match)')
      console.error('  2. Value is set (not empty)')
      console.error('  3. Production environment is checked')
      console.error('  4. Variable was saved (refresh Vercel page to verify)')
    } else {
      console.error('❌ No NEXT_PUBLIC_ variables are working')
      console.error('   This suggests env vars aren\'t being inlined at build time')
      console.error('   Check Vercel build logs and environment variable configuration')
    }
  } else {
    console.log('✅ NEXT_PUBLIC_BACKEND_URL is set correctly!')
  }
  console.groupEnd()
}

interface CrudRequestOptions {
  auth?: boolean
  params?: Record<string, unknown>
}

interface CrudService<TData = unknown, TId = string | number> {
  getAll: (options?: CrudRequestOptions) => Promise<TData[]>
  getOne: (id: TId, options?: CrudRequestOptions) => Promise<TData>
  create: (payload: Partial<TData>, options?: CrudRequestOptions) => Promise<TData>
  update: (id: TId, payload: Partial<TData>, options?: CrudRequestOptions) => Promise<TData>
  remove: (id: TId, options?: CrudRequestOptions) => Promise<void>
}

type AuthAwareConfig = {
  skipAuth?: boolean
}

const api = axios.create({
  baseURL: BACKEND_URL || '',
  withCredentials: true
})

api.interceptors.request.use(
  async (config) => {
    // Validate BACKEND_URL when actually making a request (client-side only)
    if (typeof window !== 'undefined') {
      const url = process.env.NEXT_PUBLIC_BACKEND_URL || BACKEND_URL
      
      if (!url) {
        const errorMsg = 'NEXT_PUBLIC_BACKEND_URL is not set. Please configure it in Vercel: Settings → Environment Variables → Add NEXT_PUBLIC_BACKEND_URL'
        console.error('[apiClient]', errorMsg)
        console.error('[apiClient] Available NEXT_PUBLIC_ vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')))
        throw new Error(errorMsg)
      }
      
      // Update baseURL if it's different
      if (config.baseURL !== url) {
        config.baseURL = url
      }
    }

    const authConfig = config as typeof config & { skipAuth?: boolean }

    if (authConfig.skipAuth) {
      return config
    }

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      return config
    }

    // getIdToken(true) forces refresh if expired
    const token = await user.getIdToken()

    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders
    }

    config.headers.Authorization = `Bearer ${token}`

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // we could trigger a logout flow here.
    }

    return Promise.reject(error)
  }
)

export function createCrudService<TData = unknown, TId = string | number> (
  basePath: string
): CrudService<TData, TId> {
  function buildConfig (options?: CrudRequestOptions): AuthAwareConfig & { params?: Record<string, unknown> } {
    const auth = options?.auth ?? true

    return {
      skipAuth: !auth,
      params: options?.params
    }
  }

  async function getAll (options?: CrudRequestOptions) {
    const config = buildConfig(options)
    const response = await api.get<TData[]>(basePath, config)
    return response.data
  }

  async function getOne (id: TId, options?: CrudRequestOptions) {
    const config = buildConfig(options)
    const response = await api.get<TData>(`${basePath}/${id}`, config)
    return response.data
  }

  async function create (payload: Partial<TData>, options?: CrudRequestOptions) {
    const config = buildConfig(options)
    const response = await api.post<TData>(basePath, payload, config)
    return response.data
  }

  async function update (id: TId, payload: Partial<TData>, options?: CrudRequestOptions) {
    const config = buildConfig(options)
    const response = await api.put<TData>(`${basePath}/${id}`, payload, config)
    return response.data
  }

  async function remove (id: TId, options?: CrudRequestOptions) {
    const config = buildConfig(options)
    await api.delete(`${basePath}/${id}`, config)
  }

  return {
    getAll,
    getOne,
    create,
    update,
    remove
  }
}

export { api }
