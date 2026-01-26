"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Search,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Target,
    Rocket,
    ChevronDown,
    LineChart,
    Bot,
    BarChart3,
    Activity,
    Trophy,
    PieChart,
    Calendar,
    Calculator
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "./dashboard-context";

interface SidebarItem {
    name: string;
    href: string;
    icon: any;
    subItems?: SidebarItem[];
}

const sidebarLinks: SidebarItem[] = [
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
        subItems: [
            {
                name: "Predictions",
                href: "/dashboard/shot/predictions",
                icon: LineChart,
            },

            {
                name: "Ranking",
                href: "/dashboard/shot/ranking",
                icon: Trophy,
            },
            {
                name: "Copilot",
                href: "/dashboard/shot/copilot",
                icon: Bot,
            },
            {
                name: "Analytics",
                href: "/dashboard/shot/analytics",
                icon: BarChart3,
            },
            {
                name: "Market Analysis",
                href: "/dashboard/shot/market-analysis",
                icon: PieChart,
            },
        ],
    },
    {
        name: "Misiones",
        href: "/dashboard/missions",
        icon: Rocket,
    },
    {
        name: "Presupuestos (APU)",
        href: "/dashboard/apu",
        icon: Calculator,
    },
    {
        name: "Calendario",
        href: "/dashboard/calendar",
        icon: Calendar,
    },
];

export function Sidebar({ }: { userEmail?: string; userName?: string | null }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const { isCollapsed, toggleCollapse } = useDashboard();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);

        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Auto-expand if active link is a sub-item
    useEffect(() => {
        sidebarLinks.forEach(link => {
            if (link.subItems) {
                const hasActiveSubItem = link.subItems.some(sub => pathname.startsWith(sub.href));
                if (hasActiveSubItem && !expandedItems.includes(link.name)) {
                    setExpandedItems(prev => [...prev, link.name]);
                }
            }
        });
    }, [pathname]);

    const toggleExpand = (name: string) => {
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
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
                            <Link href="/dashboard" prefetch={true} className="flex items-center gap-2">
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
                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            {sidebarLinks.map((link) => {
                                const isActive = pathname === link.href || (link.subItems && link.subItems.some(sub => pathname.startsWith(sub.href)));
                                const isExpanded = expandedItems.includes(link.name);
                                const hasSubItems = link.subItems && link.subItems.length > 0;

                                return (
                                    <div key={link.name}>
                                        {hasSubItems ? (
                                            <div
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                                                    isActive
                                                        ? "bg-primary/10 text-primary border border-primary/20"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                )}
                                                onClick={() => toggleExpand(link.name)}
                                                title={isCollapsed ? link.name : undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <link.icon className="w-5 h-5 flex-shrink-0" />
                                                    {!isCollapsed && <span>{link.name}</span>}
                                                </div>
                                                {!isCollapsed && (
                                                    <ChevronDown
                                                        className={cn(
                                                            "w-4 h-4 transition-transform",
                                                            isExpanded ? "transform rotate-180" : ""
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                prefetch={true}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-primary/10 text-primary border border-primary/20"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                                )}
                                                onClick={() => setIsMobileOpen(false)}
                                                title={isCollapsed ? link.name : undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <link.icon className="w-5 h-5 flex-shrink-0" />
                                                    {!isCollapsed && <span>{link.name}</span>}
                                                </div>
                                            </Link>
                                        )}

                                        {/* Sub-items */}
                                        <AnimatePresence>
                                            {!isCollapsed && hasSubItems && isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden ml-4 mt-1 space-y-1 border-l border-border pl-2"
                                                >
                                                    {link.subItems!.map((subItem) => {
                                                        const isSubActive = pathname === subItem.href;
                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                prefetch={true}
                                                                onClick={() => setIsMobileOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                                    isSubActive
                                                                        ? "text-primary bg-primary/5"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <subItem.icon className="w-4 h-4 flex-shrink-0" />
                                                                <span>{subItem.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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
