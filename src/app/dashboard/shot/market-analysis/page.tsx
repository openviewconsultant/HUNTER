"use client";

import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, DollarSign, Users, ArrowLeft, Building2, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { searchMarketOpportunities, getMarketInsights } from "./actions";
import { SecopProcess } from "@/lib/socrata";

export default function MarketAnalysisPage() {
    const [activeFilter, setActiveFilter] = useState("todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [processes, setProcesses] = useState<SecopProcess[]>([]);
    const [metrics, setMetrics] = useState({ count: 0, avg_amount: 0 });
    const [isLoading, setIsLoading] = useState(false);

    // Initial load
    useEffect(() => {
        handleSearch("tecnologia"); // Default search to show something
    }, []);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        try {
            const [procs, insights] = await Promise.all([
                searchMarketOpportunities(query),
                getMarketInsights(query)
            ]);
            setProcesses(procs);
            setMetrics(insights);
        } catch (error) {
            console.error("Error searching:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onFilterChange = (filter: string) => {
        setActiveFilter(filter.toLowerCase());
        handleSearch(filter === 'Todos' ? 'tecnologia' : filter);
    };

    const formatCurrency = (amount: string) => {
        const val = parseFloat(amount);
        if (isNaN(val)) return "$0";
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col mr-4">
            {/* Header with Back Button */}
            <div className="flex-shrink-0 mb-6">
                <Link
                    href="/dashboard/shot"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Shot
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Análisis de Mercado</h1>
                        <p className="text-zinc-400 text-sm">
                            Datos en tiempo real de SECOP II (Colombia Compra Eficiente)
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Mobile First Grid */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">

                {/* Search Section */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-0 backdrop-blur-md z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por entidad, objeto o código..."
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                        />
                    </div>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                        {['Todos', 'Tecnologia', 'Infraestructura', 'Suministros', 'Consultoria'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                                    activeFilter === filter.toLowerCase()
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-blue-300">Oportunidades</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : metrics.count}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Encontradas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-purple-300">Valor Promedio</span>
                        </div>
                        <p className="text-xl font-bold text-foreground truncate">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(metrics.avg_amount.toString())}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">COP</p>
                    </div>
                </div>

                {/* Recent Opportunities List */}
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Procesos Recientes (SECOP II)
                    </h3>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                <p>Buscando oportunidades...</p>
                            </div>
                        ) : processes.length > 0 ? (
                            processes.map((proc, i) => (
                                <motion.div
                                    key={proc.id_del_proceso}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors cursor-pointer group"
                                    onClick={() => window.open(proc.urlproceso, '_blank')}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                                            {proc.estado_del_proceso}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{new Date(proc.fecha_de_publicacion_del).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                        {proc.objeto_del_proceso}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                                        <Building2 className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{proc.nombre_de_la_entidad}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="text-xs">
                                            <span className="text-muted-foreground">Cuantía:</span>
                                            <span className="text-foreground font-medium ml-1">{formatCurrency(proc.cuantia_proceso)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-primary">
                                            <span>Ver en SECOP</span>
                                            <ArrowLeft className="w-3 h-3 rotate-180" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No se encontraron procesos recientes.
                            </div>
                        )}
                    </div>
                </div>

                {/* BI Insights Placeholder (Still mock for now as it requires complex analysis) */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Análisis de Competencia</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Basado en tu perfil, hemos identificado competidores frecuentes en licitaciones similares.
                    </p>
                    <div className="h-24 flex items-end justify-between gap-2 px-2">
                        {[40, 70, 50, 90, 60].map((h, i) => (
                            <div key={i} className="w-full bg-primary/20 rounded-t-sm relative group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="absolute bottom-0 w-full bg-primary/50 rounded-t-sm group-hover:bg-primary transition-colors"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
