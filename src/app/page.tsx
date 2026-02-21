import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, CalendarDays, Settings, Mail as MailIcon } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white overflow-hidden relative selection:bg-[#253551]/20">
            {/* Background gradients for luxury feel in light mode */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-[#253551]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-[#253551]/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="px-6 lg:px-14 h-24 flex items-center justify-between border-b border-black/5 z-10 backdrop-blur-md bg-white/80 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#253551] text-white rounded-lg flex items-center justify-center font-bold text-xl tracking-tighter shadow-sm">
                        T
                    </div>
                    <span className="font-semibold text-xl tracking-tight text-[#253551]">
                        TOMM
                    </span>
                </div>
                <nav className="hidden md:flex gap-8 text-sm font-medium text-black/60">
                    <Link href="#features" className="hover:text-black transition-colors">Features</Link>
                    <Link href="#how-it-works" className="hover:text-black transition-colors">How it works</Link>
                </nav>
                <Link href="/dashboard">
                    <Button variant="secondary" className="bg-[#253551] text-white hover:bg-[#253551]/90 font-semibold rounded-full px-6 transition-all shadow-md hover:-translate-y-0.5">
                        Log in to Dashboard
                    </Button>
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#253551]/5 border border-[#253551]/10 text-[#253551] text-sm font-medium mb-8 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-[#253551]" />
                    <span>Top of Mind Marketing for Hospitality</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-black max-w-4xl leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-black to-black/70">
                    Set-and-forget email marketing on autopilot
                </h1>

                <p className="text-lg md:text-xl text-black/60 max-w-2xl mb-12 font-light leading-relaxed">
                    The easiest way to stay connected with your guests. We scrape your branding, analyze your menu, and generate a full year of hyper-personalized email campaigns.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/settings">
                        <Button size="lg" className="bg-[#253551] text-white hover:bg-[#253551]/90 font-semibold rounded-full px-8 h-14 text-base transition-all shadow-lg hover:-translate-y-0.5 w-full sm:w-auto">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" variant="outline" className="border-black/10 bg-white text-[#253551] hover:bg-black/5 hover:text-[#253551] rounded-full px-8 h-14 text-base backdrop-blur-sm transition-all w-full sm:w-auto">
                            View Demo Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Value Props Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-5xl w-full text-left">
                    <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm transition-all hover:shadow-md hover:border-black/10">
                        <Settings className="h-8 w-8 text-[#253551] mb-6" />
                        <h3 className="text-xl font-semibold text-black mb-3">1. Connect & Scrape</h3>
                        <p className="text-black/60 leading-relaxed font-light">Input your website and Instagram. Our AI extracts your exact branding, logos, colors, and business context.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm transition-all hover:shadow-md hover:border-black/10">
                        <Sparkles className="h-8 w-8 text-[#253551] mb-6" />
                        <h3 className="text-xl font-semibold text-black mb-3">2. Auto-Generate</h3>
                        <p className="text-black/60 leading-relaxed font-light">Instantly populate 12 months of tailored email campaigns based on your menu, location, and seasonal events.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm transition-all hover:shadow-md hover:border-black/10">
                        <CalendarDays className="h-8 w-8 text-[#253551] mb-6" />
                        <h3 className="text-xl font-semibold text-black mb-3">3. Set & Forget</h3>
                        <p className="text-black/60 leading-relaxed font-light">Review your year in minutes. We'll automatically send beautifully designed emails to your guests every month.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
