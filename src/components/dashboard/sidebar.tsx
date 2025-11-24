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
    ChevronLeft,
    ChevronRight,
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

export function Sidebar({ userEmail, userName }: { userEmail?: string; userName?: string | null }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        // Load collapse state from localStorage
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed !== null) {
            setIsCollapsed(savedCollapsed === "true");
        }

        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

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
                            <div className="px-4 py-2">
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

                        {/* User Profile & Logout */}
                        <div className="p-4 border-t border-border space-y-2">
                            {!isCollapsed ? (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/50 border border-border mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                                            {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {userName || userEmail?.split("@")[0]}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-center mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-xs">
                                            {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center justify-center px-2 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Cerrar Sesión"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </>
                            )}
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
