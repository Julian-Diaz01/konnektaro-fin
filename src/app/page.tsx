import Link from 'next/link'
import { ArrowRight, PiggyBank, TrendingUp, Shield, Wallet, BarChart3, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const features = [
  {
    icon: Wallet,
    title: 'Expense Tracking',
    description: 'Easily log and categorize every transaction to understand where your money goes.'
  },
  {
    icon: BarChart3,
    title: 'Smart Budgeting',
    description: 'Set budgets by category and get alerts when you\'re approaching your limits.'
  },
  {
    icon: TrendingUp,
    title: 'Financial Insights',
    description: 'Visualize spending patterns and trends with beautiful, intuitive charts.'
  },
  {
    icon: PiggyBank,
    title: 'Savings Goals',
    description: 'Set savings goals and track your progress towards financial milestones.'
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Define financial targets and monitor your journey to achieving them.'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Bank-level security keeps your financial data safe and encrypted.'
  }
]

export default function HomePage () {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-xl">Konnektaro</span>
          </Link>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Your personal finance companion
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Take control of your{' '}
              <span className="text-gradient">finances</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Konnektaro helps you track expenses, set budgets, and achieve your financial goals.
              Simple, beautiful, and built for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 h-12 shadow-xl shadow-primary/25 glow-primary">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">$5M+</div>
                <div className="text-sm text-muted-foreground">Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage your money
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you stay on top of your finances.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to take control of your finances?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of users already using Konnektaro to build a better financial future.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 h-12 shadow-xl shadow-primary/25">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">K</span>
              </div>
              <span className="font-semibold">Konnektaro Finance</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Konnektaro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
