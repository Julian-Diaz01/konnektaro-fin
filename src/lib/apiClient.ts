import axios, { type AxiosRequestHeaders } from 'axios'
import { getAuth } from 'firebase/auth'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

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
  baseURL: BACKEND_URL,
  withCredentials: true
})

api.interceptors.request.use(
  async (config) => {
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
      // Optionally, we could trigger a logout flow here.
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
