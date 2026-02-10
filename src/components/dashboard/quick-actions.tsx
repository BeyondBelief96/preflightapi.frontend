import { Link } from '@tanstack/react-router'
import { BookOpen, CreditCard, Key } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-semibold">Quick Actions</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Link to="/dashboard/keys">
          <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
            <CardContent className="flex items-center gap-4 p-6">
              <Key className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">Manage API Keys</p>
                <p className="text-sm text-muted-foreground">
                  View and regenerate your API keys
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/docs">
          <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
            <CardContent className="flex items-center gap-4 p-6">
              <BookOpen className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">API Documentation</p>
                <p className="text-sm text-muted-foreground">
                  Explore endpoints and examples
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/billing">
          <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
            <CardContent className="flex items-center gap-4 p-6">
              <CreditCard className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium">Billing & Plans</p>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
