'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LayoutGrid, LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Campaigns', href: '/dashboard', icon: LayoutGrid },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-white overflow-hidden selection:bg-[#253551]/20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#253551]/10 bg-white/50 backdrop-blur-xl flex flex-col z-20">
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
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? 'bg-[#253551]/10 text-[#253551] shadow-sm'
                                        : 'text-black/60 hover:text-[#253551] hover:bg-black/5'
                                    }`}
                            >
                                <item.icon className={`h-4 w-4 ${isActive ? 'text-[#253551]' : 'text-black/40'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#253551]/10">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-black/60 hover:text-[#253551] hover:bg-black/5 transition-all cursor-pointer">
                        <LogOut className="h-4 w-4 text-black/40" />
                        Sign Out
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto w-full bg-slate-50/50">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#253551]/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 p-8 md:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
