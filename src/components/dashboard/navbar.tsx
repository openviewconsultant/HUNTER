"use client";

import { Bell, Search, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavbarProps {
    userName?: string | null;
    userEmail?: string;
}

export function Navbar({ userName, userEmail }: NavbarProps) {
    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
            <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1 max-w-2xl">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar licitaciones..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                    </button>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* User Menu */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-xs">
                            {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-foreground leading-tight">
                                {userName || userEmail?.split("@")[0]}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight">
                                {userEmail}
                            </p>
                        </div>
                        <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </header>
    );
}
