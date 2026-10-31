import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="figure mt-12 text-sm text-faint">404</p>
      <h1 className="heading mt-2 text-4xl">Not on this rail</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">That page doesn&rsquo;t exist, or the item belongs to someone else.</p>
      <Link href="/closet" className="btn-primary mt-8">
        Back to your closet
      </Link>
    </div>
  )
}
