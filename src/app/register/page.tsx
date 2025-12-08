import { RegisterForm } from '@/components/auth/RegisterForm'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import Link from 'next/link'

export const metadata = {
  title: 'Create Account'
}

export default function RegisterPage () {
  return (
    <div className="min-h-screen flex flex-col pattern-dots">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">K</span>
          </div>
          <span className="font-semibold text-lg group-hover:text-primary transition-colors">
            Konnektaro
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <RegisterForm />
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Konnektaro Finance. All rights reserved.</p>
      </footer>
    </div>
  )
}
