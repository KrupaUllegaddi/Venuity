import Link from "next/link";
import { Landmark, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dim p-4 sm:p-6 lg:p-8 select-none">
      <main className="relative w-full max-w-md md:max-w-xl min-h-[640px] md:min-h-[720px] overflow-hidden bg-on-background shadow-2xl rounded-2xl md:rounded-3xl flex flex-col justify-between border border-outline-variant/30">
        {/* Immersive Campus Background Image with Warm Palette & Lighting */}
        <img
          alt="A grand collegiate university brick building framed by majestic oak trees illuminated by intense golden-hour sunset light."
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwFQh3_4M33T7WpaMKNNkZhYRAHpPeu7s-nneRfgmX61_GzdJ3hP1LdTovoKIgMAsbklki5X1GTbuQdwgKnVKuyioNrDZYpTTw6fBhXBQTxNAn1iT_uqwInYxg422NWNa4q_2h1yBjAgweTy_fm2NnCpBtti1v49FxTbzDKE6WXL0Mj-8qqASL_kD3W7_W0a_y2H42OSeVXr3_9XTa-n_D8GtoBmCwhEhkZNVjsa9cnQIv8eXSEx3M6Q"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Multi-Layered Sunset Tint & High-Readability Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/85 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-primary/20 to-transparent pointer-events-none mix-blend-multiply"></div>

        {/* Center Hero Branding Block */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center mt-16 md:mt-20">
          {/* Architectural Neoclassical Building Icon Badge */}
          <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container shadow-[0_8px_24px_rgba(255,104,53,0.4)] border border-white/20 transform transition-transform hover:scale-105">
            <Landmark className="size-8 text-white" />
          </div>
          {/* Brand Wordmark Title */}
          <h1 className="text-3xl md:text-4xl text-white font-extrabold drop-shadow-md tracking-tight mb-2.5">
            Venuity
          </h1>
          {/* Core Brand Tagline Pill */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-sm">
            <p className="text-xs tracking-[0.2em] font-semibold text-secondary-fixed uppercase">
              PLAN • BOOK • COLLABORATE
            </p>
          </div>
          {/* Campus Management Value Proposition */}
          <p className="text-sm md:text-base text-surface-bright/90 max-w-xs md:max-w-sm leading-relaxed drop-shadow-sm font-medium">
            Smart Venue Management for a Connected Campus
          </p>
        </div>

        {/* Bottom Actions Resting Over Warm Soft Scrim */}
        <section className="relative z-20 w-full px-6 pb-9 pt-4 flex flex-col items-center">
          <Link href="/login" className="w-full">
            <button
              type="button"
              className="w-full h-13 rounded-2xl bg-primary-container hover:bg-[#C94B24] text-white text-base font-semibold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,104,53,0.35)] active:scale-[0.98] transition-all duration-150 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="size-5" />
            </button>
          </Link>
          <Link href="/login" className="mt-3">
            <button
              type="button"
              className="py-2.5 px-4 text-sm text-white/90 hover:text-white font-medium tracking-wide transition-colors duration-150 flex items-center justify-center gap-1 active:opacity-75 cursor-pointer"
            >
              <span>I already have an account</span>
            </button>
          </Link>
        </section>
      </main>
    </div>
  );
}
