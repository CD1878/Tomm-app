'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LayoutGrid, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Campaigns', href: '/dashboard', icon: LayoutGrid },
        { name: 'Settings', href: '/settings', icon: Settings },
    ]; return (
        <div className="flex h-dvh bg-white overflow-hidden selection:bg-[#253551]/20 flex-col md:flex-row">
            {/* Sidebar (Desktop) */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-64 border-r border-[#253551]/10 bg-white/50 backdrop-blur-xl flex-col z-20 hidden md:flex"
            >
                <div className="h-20 flex items-center px-6 border-b border-[#253551]/10">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="h-8 w-8 bg-[#253551] text-white rounded flex items-center justify-center font-bold text-lg tracking-tighter shadow-sm">
                            T
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-[#253551]">
                            TOMM
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <motion.div
                                key={item.href}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                            >
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-[#253551]/10 text-[#253551] shadow-sm'
                                        : 'text-black/60 hover:text-[#253551] hover:bg-black/5'
                                        }`}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive ? 'text-[#253551]' : 'text-black/40'}`} />
                                    {item.name}
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 border-t border-[#253551]/10 mt-auto"
                >
                    <button
                        onClick={async () => {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/60 hover:text-[#253551] hover:bg-black/5 transition-all text-left"
                    >
                        <LogOut className="h-4 w-4 text-black/40" />
                        Sign Out
                    </button>
                </motion.div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto w-full bg-slate-50/50 pb-20 md:pb-0">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#253551]/[0.03] rounded-full blur-[100px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="relative z-10 p-4 sm:p-8 md:p-12 max-w-7xl mx-auto"
                >
                    {children}
                </motion.div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#253551]/10 flex justify-around items-center p-3 z-50 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive ? 'text-[#253551]' : 'text-black/40 hover:text-[#253551]'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-[#253551]' : ''}`} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={async () => {
                        const { createClient } = await import('@/utils/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-black/40 hover:text-[#253551] transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Log Out</span>
                </button>
            </nav>
        </div>
    );
}
