import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'

let adminApp: App | undefined

function getAdminApp (): App {
  if (adminApp) {
    return adminApp
  }

  const existingApps = getApps()

  if (existingApps.length > 0 && existingApps[0]) {
    adminApp = existingApps[0]
    return adminApp
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount)
  })

  return adminApp
}

export async function verifyFirebaseToken (token: string) {
  try {
    const auth = getAuth(getAdminApp())
    const decodedToken = await auth.verifyIdToken(token)
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return {
      success: false,
      error: 'Invalid token'
    }
  }
}
