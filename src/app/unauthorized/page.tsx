import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="size-6 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Access Denied
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access this page. If you believe this is
          an error, please contact your system administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
