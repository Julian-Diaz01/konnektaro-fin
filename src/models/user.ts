interface UserProfile {
  uid: string
  email?: string | null
  displayName?: string | null
  createdAt: string // ISO timestamp string from backend
  updatedAt: string // ISO timestamp string from backend
}

export type { UserProfile }
