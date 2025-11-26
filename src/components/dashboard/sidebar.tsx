"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Search,
    Settings,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Target,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useDashboard } from "./dashboard-context";

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
        name: "Shot",
        href: "/dashboard/shot",
        icon: Target,
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

export function Sidebar({ }: { userEmail?: string; userName?: string | null }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const { isCollapsed, toggleCollapse } = useDashboard();
    const router = useRouter();

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        return () => window.removeEventListener('resize', checkDesktop);
    }, []);



    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground shadow-lg"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Sidebar Container */}
            <AnimatePresence mode="wait">
                {(isMobileOpen || isDesktop) && (
                    <motion.aside
                        initial={false}
                        animate={{
                            width: isDesktop ? (isCollapsed ? 80 : 256) : 256,
                            x: isMobileOpen || isDesktop ? 0 : -300
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={cn(
                            "fixed inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col",
                            !isDesktop && "w-64"
                        )}
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Search className="w-4 h-4 text-primary" />
                                </div>
                                {!isCollapsed && (
                                    <span className="text-xl font-bold text-foreground">HUNTER</span>
                                )}
                            </Link>
                            {!isDesktop && (
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
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
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                        )}
                                        title={isCollapsed ? link.name : undefined}
                                    >
                                        <link.icon className="w-5 h-5 flex-shrink-0" />
                                        {!isCollapsed && <span>{link.name}</span>}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Collapse Toggle (Desktop Only) */}
                        {isDesktop && (
                            <div className="p-4">
                                <button
                                    onClick={toggleCollapse}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                    title={isCollapsed ? "Expandir" : "Contraer"}
                                >
                                    {isCollapsed ? (
                                        <ChevronRight className="w-4 h-4" />
                                    ) : (
                                        <>
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Contraer</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
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
