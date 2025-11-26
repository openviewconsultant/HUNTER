"use client";

import { motion } from "framer-motion";
import { Target, BarChart3, Search } from "lucide-react";
import Link from "next/link";

export default function ShotPage() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col mr-4">
            {/* Header */}
            <div className="flex-shrink-0 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Shot</h1>
                </div>
                <p className="text-zinc-400">
                    Selecciona el tipo de disparo que deseas realizar para encontrar oportunidades.
                </p>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {/* Option 1: Market Analysis */}
                <Link href="/dashboard/shot/market-analysis" className="group relative p-8 rounded-2xl card-gradient card-shimmer shadow-glow text-left hover:scale-[1.02] transition-all duration-300 border border-white/5 hover:border-primary/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                            Análisis del mercado
                        </h3>

                        <p className="text-muted-foreground leading-relaxed">
                            Analiza tendencias, competidores y oportunidades en el mercado actual para optimizar tu estrategia.
                        </p>

                        <div className="mt-auto pt-8 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                            Comenzar análisis <span className="ml-2">→</span>
                        </div>
                    </div>
                </Link>

                {/* Option 2: New Process Search */}
                <button className="group relative p-8 rounded-2xl card-gradient card-shimmer shadow-glow text-left hover:scale-[1.02] transition-all duration-300 border border-white/5 hover:border-primary/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                            <Search className="w-8 h-8 text-purple-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                            Búsqueda de procesos nuevos
                        </h3>

                        <p className="text-muted-foreground leading-relaxed">
                            Encuentra nuevas licitaciones y procesos de contratación que se ajusten a tu perfil empresarial.
                        </p>

                        <div className="mt-auto pt-8 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                            Iniciar búsqueda <span className="ml-2">→</span>
                        </div>
                    </div>
                </button>
            </motion.div>
        </div>
    );
}
