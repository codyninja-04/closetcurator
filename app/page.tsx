import Link from 'next/link'
import { GarmentIcon } from '@/components/closet/GarmentIcon'
import { Logo } from '@/components/layout/Logo'
import { SampleOutfit } from '@/components/marketing/SampleOutfit'
import { createClient } from '@/lib/supabase/server'

const STEPS = [
  {
    n: '01',
    title: 'Photograph it once',
    body: 'Lay a piece flat or hang it on the door and take a photo. Claude reads the type, colour, pattern and style, and you fix anything it got wrong.',
  },
  {
    n: '02',
    title: 'Ask for an outfit',
    body: 'Pick the occasion, let it check the weather, or build around one piece. Every suggestion uses only what is already in your closet.',
  },
  {
    n: '03',
    title: 'Log what you wear',
    body: 'One tap when you get dressed. Over a few weeks you see what you reach for, and what has been sitting there since spring.',
  },
]

export default async function Landing() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/closet" className="btn-primary py-2">
              Open your closet
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-quiet py-2">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary py-2">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="animate-rise-in">
            <p className="label">A wardrobe you actually use</p>
            <h1 className="heading mt-5 text-[3.4rem] leading-[0.98] sm:text-7xl lg:text-[5.4rem]">
              Wear what <br className="hidden sm:block" />
              you <span className="italic">already own.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
              Most of us wear a fifth of our clothes and forget the rest. ClosetCurator catalogs your closet from photos, builds outfits from it, and shows you which pieces never leave the hanger, before you buy a fourth grey hoodie.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={user ? '/closet' : '/signup'} className="btn-primary px-6 py-3 text-base">
                {user ? 'Open your closet' : 'Start your closet'}
              </Link>
              <span className="text-sm text-faint">Free for up to 40 items</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-x-6 -top-6 bottom-10 -z-10 rounded-[2rem] bg-sunk" aria-hidden />
            <SampleOutfit className="shadow-lift" />
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <div className="rail mx-auto max-w-3xl" aria-hidden />
            <div className="mx-auto -mt-px flex max-w-3xl justify-between px-4 text-faint">
              {(['outerwear', 'top', 'dress', 'bottom', 'shoes', 'bag'] as const).map((c, i) => (
                <div key={c} className="flex flex-col items-center">
                  <span className="h-4 w-px bg-strong" />
                  <span className="animate-sway origin-top" style={{ animationDelay: `${i * 0.35}s` }}>
                    <GarmentIcon category={c} className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.1} />
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n}>
                  <p className="figure text-xs text-faint">{s.n}</p>
                  <h2 className="heading mt-2 text-3xl">{s.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-2">
          <div>
            <p className="label">The quiet part of your closet</p>
            <h2 className="heading mt-3 text-4xl leading-tight sm:text-5xl">
              Ninety days on the hanger is <span className="italic">a decision waiting to be made.</span>
            </h2>
          </div>
          <div className="space-y-5 text-muted">
            <p className="leading-relaxed">
              Anything you haven&rsquo;t worn in 90 days lands on one list. Wear it this week, or pass it on. The insights page also shows which categories you lean on and how what you own compares with what you actually put on.
            </p>
            <p className="leading-relaxed">
              Adding something new? If it looks a lot like a piece you already have, ClosetCurator says so before you save it.
            </p>
            <p className="text-sm text-faint">No shopping links, no feed, no followers. Just your clothes.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>ClosetCurator</p>
          <p>Free up to 40 items. Pro is $5 a month.</p>
        </div>
      </footer>
    </div>
  )
}
