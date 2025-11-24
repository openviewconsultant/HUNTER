"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Search,
    Settings,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const sidebarLinks = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Perfil de Empresa",
        href: "/dashboard/company",
        icon: Building2,
    },
    {
        name: "Búsqueda",
        href: "/dashboard/search",
        icon: Search,
    },
    {
        name: "Configuración",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 border border-white/10 text-white"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar Container */}
            <AnimatePresence mode="wait">
                {(isMobileOpen || isDesktop) && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className={cn(
                            "fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
                            isMobileOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Search className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-xl font-bold text-white">HUNTER</span>
                            </Link>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="lg:hidden text-zinc-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {sidebarLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20"
                                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <link.icon className="w-5 h-5" />
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-xs">
                                    {userEmail?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {userEmail?.split("@")[0]}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
                />
            )}
        </>
    );
}
