"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Search, Shield, Zap } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background/50 to-transparent z-0" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {/* Animated Grid Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="container mx-auto relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm mb-8"
                >
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Plataforma de Inteligencia SECOPII
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 max-w-4xl"
                >
                    Encuentra Licitaciones <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
                        Antes que tu Competencia
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
                >
                    HUNTER utiliza IA avanzada para escanear SECOPII en tiempo real, entregando las oportunidades más relevantes directamente a tu panel. Deja de buscar, empieza a ganar.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
                >
                    <Link
                        href="/register"
                        className="h-12 px-8 rounded-full bg-primary text-black font-semibold text-lg flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        Prueba Gratis <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="#features"
                        className="h-12 px-8 rounded-full border border-white/10 bg-white/5 text-white font-medium text-lg flex items-center gap-2 hover:bg-white/10 transition-colors"
                    >
                        Cómo Funciona
                    </Link>
                </motion.div>

                {/* Stats / Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-10"
                >
                    {[
                        { label: "Licitaciones Activas", value: "15k+" },
                        { label: "Actualizaciones", value: "Tiempo Real" },
                        { label: "Tasa de Éxito", value: "99.9%" },
                        { label: "Usuarios Confían", value: "2k+" },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                            <span className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
    );
}
