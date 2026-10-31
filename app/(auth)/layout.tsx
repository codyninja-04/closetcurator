import { SampleOutfit } from '@/components/marketing/SampleOutfit'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center px-6 py-16">{children}</div>
      <div className="relative hidden flex-col justify-center overflow-hidden border-l border-line bg-sunk/70 px-14 lg:flex">
        <div className="max-w-md">
          <p className="label">A Tuesday, a few weeks in</p>
          <p className="heading mt-3 text-4xl leading-[1.1]">
            Pulled from your own rail, <span className="italic text-muted">including the trousers you forgot about.</span>
          </p>
          <SampleOutfit className="mt-10 shadow-lift" />
        </div>
      </div>
    </div>
  )
}
