"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-black overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-12 lg:p-20 relative z-10">
                <Link href="/" className="flex items-center gap-2 mb-12 w-fit group">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/50 transition-colors">
                        <Search className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-white">HUNTER</span>
                </Link>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
                        <p className="text-zinc-400 mb-8">{subtitle}</p>
                        {children}
                    </motion.div>
                </div>

                <div className="mt-12 text-center text-sm text-zinc-600">
                    © {new Date().getFullYear()} HUNTER. Todos los derechos reservados.
                </div>
            </div>

            {/* Right Side - Visuals */}
            <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-black to-black" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 max-w-lg text-center p-12"
                >
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 backdrop-blur-xl">
                        <Search className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Inteligencia Artificial para Licitaciones
                    </h2>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        "HUNTER ha revolucionado la forma en que encontramos oportunidades. Hemos ganado 3x más licitaciones desde que lo usamos."
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-1 w-12 rounded-full bg-primary" />
                        <div className="h-1 w-2 rounded-full bg-zinc-800" />
                        <div className="h-1 w-2 rounded-full bg-zinc-800" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
