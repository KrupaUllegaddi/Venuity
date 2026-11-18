import { Landmark } from 'lucide-react'

export default function SignupLoading() {
  return (
    <div className="bg-[#FFF7ED] text-on-surface antialiased min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-md md:max-w-4xl bg-surface flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-2xl md:rounded-3xl border border-outline-variant/40 animate-pulse">
        {/* Hero Section Placeholder */}
        <div className="h-36 sm:h-44 md:h-auto md:w-5/12 bg-stone-800 p-6 md:p-8 flex flex-col justify-between">
          <div className="w-11 h-11 rounded-2xl bg-primary-container text-white flex items-center justify-center shadow-lg mb-3">
            <Landmark className="size-6 text-white" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-stone-700 rounded-md"></div>
            <div className="h-3 w-48 bg-stone-700 rounded-md"></div>
          </div>
        </div>

        {/* Form Canvas Placeholder */}
        <div className="flex-1 bg-surface-container-lowest p-6 sm:p-8 md:p-10 space-y-5">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-surface-container rounded-md"></div>
            <div className="h-4 w-60 bg-surface-container-low rounded-md"></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-surface-container rounded"></div>
              <div className="h-11 w-full bg-surface-container-low rounded-xl"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-surface-container rounded"></div>
              <div className="h-11 w-full bg-surface-container-low rounded-xl"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-surface-container rounded"></div>
              <div className="h-11 w-full bg-surface-container-low rounded-xl flex items-center px-4">
                <span className="text-xs text-outline">Loading active campus departments...</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-surface-container rounded"></div>
              <div className="h-11 w-full bg-surface-container-low rounded-xl"></div>
            </div>
            <div className="h-12 w-full bg-primary-container/40 rounded-xl mt-4"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
