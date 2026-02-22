import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, CalendarDays, Settings } from 'lucide-react';
import * as motion from 'framer-motion/client';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white overflow-hidden relative selection:bg-black/10">
            {/* Minimal Background glowing orb */}
            <div className="absolute top-[-10%] -left-1/4 w-[800px] h-[800px] bg-[#253551]/[0.03] rounded-full blur-[120px] pointer-events-none" />

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
                    <Button variant="secondary" className="bg-[#253551] text-white hover:bg-[#253551]/90 font-medium tabular-nums rounded-full px-6 transition-all shadow-sm">
                        Log in to Dashboard
                    </Button>
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#253551]/5 border border-[#253551]/10 text-[#253551] text-sm font-medium mb-8 backdrop-blur-sm"
                >
                    <Sparkles className="h-4 w-4 text-[#253551]" />
                    <span>Top of Mind Marketing for Hospitality</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-bold tracking-tighter text-balance text-black max-w-4xl leading-[1.1] mb-8"
                >
                    Set-and-forget email marketing on autopilot
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-black/60 max-w-2xl text-pretty mb-12 font-light leading-relaxed"
                >
                    The easiest way to stay connected with your guests. We scrape your branding, analyze your menu, and generate a full year of hyper-personalized email campaigns.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link href="/settings">
                        <Button size="lg" className="bg-[#253551] text-white hover:bg-[#253551]/90 font-medium rounded-full px-8 h-14 text-base transition-all shadow-md w-full sm:w-auto">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" variant="outline" className="border-black/10 bg-white text-[#253551] hover:bg-black/5 hover:text-[#253551] rounded-full px-8 h-14 text-base backdrop-blur-sm font-medium transition-all w-full sm:w-auto">
                            View Demo Dashboard
                        </Button>
                    </Link>
                </motion.div>

                {/* Features Section */}
                <section id="features" className="w-full max-w-6xl mt-40 pt-20 border-t border-black/5 text-left flex flex-col items-center">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-6">
                        Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-6 max-w-3xl">
                        Everything you need to automate your hospitality marketing.
                    </h2>
                    <p className="text-xl text-black/60 text-center max-w-2xl mb-24 leading-relaxed">
                        We handle the heavy lifting so you can focus on your guests. From content creation to audience management, it's all built-in.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 w-full">
                        {/* Feature 1 */}
                        <div className="flex flex-col justify-center order-2 md:order-1">
                            <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 text-[#111827]">AI-Powered Content Generation</h3>
                            <p className="text-lg text-[#4b5563] leading-relaxed mb-6">
                                Never stare at a blank page again. Our AI analyzes your menu, learns your brand voice, and generates 12 months of highly engaging, personalized email content tailored specifically for your restaurant.
                            </p>
                            <ul className="space-y-4">
                                {['Tonal brand matching', 'Menu-aware suggestions', 'Seasonal event integration'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[#374151]">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="order-1 md:order-2 bg-gradient-to-br from-blue-50 to-slate-100 rounded-[2rem] p-8 md:p-12 shadow-inner border border-black/5 flex items-center justify-center min-h-[400px]">
                            {/* Abstract visual representation */}
                            <div className="relative w-full aspect-square max-w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5">
                                <div className="absolute top-0 left-0 w-full h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="p-8 pt-20 flex flex-col gap-4">
                                    <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                                    <div className="h-4 w-1/2 bg-slate-100 rounded-full animate-pulse delay-75" />
                                    <div className="h-32 w-full mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-center">
                                        <Sparkles className="w-8 h-8 text-blue-400 opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-8 md:p-12 shadow-inner border border-black/5 flex items-center justify-center min-h-[400px]">
                            {/* Abstract visual representation */}
                            <div className="relative w-full aspect-square max-w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5 flex flex-col">
                                <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><CalendarDays className="w-6 h-6 text-emerald-600" /></div>
                                    <div>
                                        <div className="h-3 w-24 bg-slate-200 rounded-full mb-2" />
                                        <div className="h-2 w-16 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex-1 p-6 grid grid-cols-3 gap-3">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className={`rounded-xl ${i === 4 ? 'bg-emerald-500 shadow-md transform scale-105' : 'bg-slate-50'} flex flex-col items-center justify-center gap-2 transition-all`}>
                                            <div className={`w-6 h-1 rounded-full ${i === 4 ? 'bg-white/50' : 'bg-slate-200'}`} />
                                            <div className={`w-8 h-1 rounded-full ${i === 4 ? 'bg-white/80' : 'bg-slate-300'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                                <CalendarDays className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4 text-[#111827]">Visual Campaign Dashboard</h3>
                            <p className="text-lg text-[#4b5563] leading-relaxed mb-6">
                                Get a bird's-eye view of your entire marketing year. Easily preview, edit, and approve campaigns in a beautiful calendar interface. You are always in control before anything sends.
                            </p>
                            <ul className="space-y-4">
                                {['12-month bird\'s-eye view', 'One-click editing', 'Automated scheduling'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[#374151]">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="w-full max-w-5xl mt-40 pt-20 border-t border-black/5 text-center flex flex-col items-center mb-20">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-sm font-semibold mb-6">
                        How it works
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-[#111827]">
                        Three steps to marketing autopilot.
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-0.5 bg-slate-100 -z-10" />

                        {[
                            {
                                step: 1, color: 'bg-indigo-600', title: 'Connect & Scrape',
                                desc: "Simply enter your website URL. Our system instantly scrapes your branding, colors, and business context."
                            },
                            {
                                step: 2, color: 'bg-purple-600', title: 'AI Generates',
                                desc: "We automatically create 12 months of tailored emails, complete with professional formatting and placeholders."
                            },
                            {
                                step: 3, color: 'bg-pink-600', title: 'Review & Send',
                                desc: "Approve the calendar in minutes. We handle the sending, audience management, and analytics."
                            }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-6 relative">
                                <div className={`w-24 h-24 ${s.color} rounded-3xl shadow-lg flex items-center justify-center text-white text-3xl font-bold mb-8 transform -rotate-3 hover:rotate-0 transition-transform`}>
                                    {s.step}
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-[#111827]">{s.title}</h3>
                                <p className="text-[#4b5563] leading-relaxed text-pretty">
                                    {s.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-24 mb-10">
                        <Link href="/dashboard">
                            <Button size="lg" className="bg-[#111827] text-white hover:bg-black font-semibold rounded-full px-12 h-16 text-lg transition-all shadow-xl hover:-translate-y-1">
                                See it in action &rarr;
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
