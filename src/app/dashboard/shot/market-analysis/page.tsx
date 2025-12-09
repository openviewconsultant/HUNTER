"use client";

import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, DollarSign, Users, ArrowLeft, Building2, FileText, Loader2, ExternalLink, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { searchMarketOpportunities, getMarketInsights, getUserCompanyForFilter, searchOpportunitiesByCompany } from "./actions";
import { SecopProcess } from "@/lib/socrata";
import { evaluateProcessRequirements, addProcessToMissions } from "./process-actions";
import { CompetitorHistoryModal } from "./competitor-history-modal";
import { extractUNSPSCFromProcess, getSuggestedDeliverables } from "./match-helpers";


export default function MarketAnalysisPage() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState("todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [processes, setProcesses] = useState<SecopProcess[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userCompany, setUserCompany] = useState<{ id: string; name: string } | null>(null);

    const [minAmount, setMinAmount] = useState<string>("");
    const [maxAmount, setMaxAmount] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        // Load initial data
        const loadData = async () => {
            try {
                const company = await getUserCompanyForFilter();
                setUserCompany(company);

                // Default search
                handleSearch("tecnologia");
            } catch (error) {
                console.error("Error loading initial data:", error);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSearch = async (query: string, isCompanyFilter: boolean = false) => {
        setLoading(true);
        try {
            let procs: SecopProcess[] = [];
            let insights: any = null;

            const currentFilters = {
                minAmount: minAmount ? parseFloat(minAmount) : undefined,
                maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            };

            if (isCompanyFilter) {
                // Search using company's UNSPSC codes
                procs = await searchOpportunitiesByCompany();

                // Calculate metrics from the results to ensure consistency
                const count = procs.length;
                const totalAmount = procs.reduce((sum, p) => sum + parseFloat(p.precio_base || '0'), 0);
                const avgAmount = count > 0 ? totalAmount / count : 0;

                insights = {
                    count,
                    avg_amount: avgAmount,
                    top_entities: [] // We could calculate this too if needed
                };
            } else {
                // Standard text search
                [procs, insights] = await Promise.all([
                    searchMarketOpportunities(query, currentFilters),
                    getMarketInsights(query, currentFilters)
                ]);
            }

            setProcesses(procs);
            setMetrics(insights);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            handleSearch(searchQuery);
        }
    };

    const onFilterChange = (filter: string) => {
        setActiveFilter(filter);
        if (filter === 'todos') {
            handleSearch('tecnologia');
        } else if (filter === 'company' && userCompany) {
            handleSearch(userCompany.name, true);
        } else {
            handleSearch(filter);
        }
    };

    const filters = [
        { id: 'todos', label: 'Todos' },
        ...(userCompany ? [{ id: 'company', label: userCompany.name }] : []),
        { id: 'tecnologia', label: 'Tecnología' },
        { id: 'infraestructura', label: 'Infraestructura' },
        { id: 'suministros', label: 'Suministros' },
        { id: 'consultoria', label: 'Consultoría' }
    ];
    const formatCurrency = (amount: string) => {
        const val = parseFloat(amount);
        if (isNaN(val)) return "$0";
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with Back Button */}
            <div className="flex-shrink-0 mb-6 px-6 pt-4">
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
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">

                {/* Search Section */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 sticky top-0 backdrop-blur-md z-10">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
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
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "px-4 py-3 rounded-lg border border-white/10 transition-colors flex items-center gap-2",
                                showFilters ? "bg-primary/20 text-primary border-primary/30" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden md:inline">Filtros</span>
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => onFilterChange(filter.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    activeFilter === filter.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                        >
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Cuantía Mínima (COP)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Cuantía Máxima (COP)</label>
                                <input
                                    type="number"
                                    placeholder="Sin límite"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="col-span-full flex justify-end">
                                <button
                                    onClick={() => handleSearch(searchQuery || activeFilter)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-medium text-blue-300">Oportunidades</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : metrics?.count}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Encontradas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-purple-300">Valor Promedio</span>
                        </div>
                        <p className="text-xl font-bold text-foreground truncate">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency((metrics?.avg_amount ?? 0).toString())}
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
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                <p>Buscando oportunidades...</p>
                            </div>
                        ) : processes.length > 0 ? (
                            processes.map((proc, i) => {
                                const matchAnalysis = (proc as any).matchAnalysis;
                                const isMatch = matchAnalysis?.isMatch || false;
                                const matchScore = matchAnalysis?.matchScore || 0;

                                return (
                                    <motion.div
                                        key={`${proc.id_del_proceso}-${i}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all",
                                            isMatch
                                                ? "bg-green-500/10 border-green-500/50 hover:border-green-500/70 shadow-lg shadow-green-500/10"
                                                : "bg-white/5 border-white/10 hover:border-primary/30"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-1 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                                                    {proc.fase}
                                                </span>
                                                {isMatch && (
                                                    <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/40">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Compatible {matchScore}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{new Date(proc.fecha_de_publicacion_del).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                                            {proc.descripci_n_del_procedimiento}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                                            <Building2 className="w-3 h-3" />
                                            <span className="truncate max-w-[200px]">{proc.entidad}</span>
                                        </div>

                                        {/* Match Analysis Details */}
                                        {matchAnalysis && (
                                            <>
                                                {/* Deliverables Section */}
                                                <div className="mb-3">
                                                    <h5 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-primary" />
                                                        Entregables / Actividades
                                                    </h5>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {getSuggestedDeliverables(proc).slice(0, 4).map((del, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                                                                {del}
                                                            </span>
                                                        ))}
                                                        {getSuggestedDeliverables(proc).length > 4 && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-muted-foreground border border-white/10">
                                                                +{getSuggestedDeliverables(proc).length - 4} más
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reasons for Match */}
                                                {matchAnalysis.reasons.length > 0 && (
                                                    <div className="mb-3 p-2 rounded bg-green-500/5 border border-green-500/20">
                                                        <p className="text-[10px] font-medium text-green-400 mb-1">Por qué es compatible:</p>
                                                        <ul className="space-y-0.5">
                                                            {matchAnalysis.reasons.slice(0, 2).map((reason: string, idx: number) => (
                                                                <li key={idx} className="text-[10px] text-green-300/80 flex items-start gap-1">
                                                                    <span className="text-green-500 mt-0.5">•</span>
                                                                    <span className="line-clamp-1">{reason}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Warnings / Reasons for Non-Match */}
                                                {matchAnalysis.warnings.length > 0 && !isMatch && (
                                                    <div className="mb-3 p-2 rounded bg-red-500/5 border border-red-500/20">
                                                        <p className="text-[10px] font-medium text-red-400 mb-1">Por qué no aplica:</p>
                                                        <ul className="space-y-0.5">
                                                            {matchAnalysis.warnings.slice(0, 2).map((warning: string, idx: number) => (
                                                                <li key={idx} className="text-[10px] text-red-300/80 flex items-start gap-1">
                                                                    <span className="text-red-500 mt-0.5">•</span>
                                                                    <span className="line-clamp-1">{warning}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="text-xs">
                                                <span className="text-muted-foreground">Cuantía:</span>
                                                <span className="text-foreground font-medium ml-1">{formatCurrency(proc.precio_base)}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const url = typeof proc.urlproceso === 'object' ? proc.urlproceso.url : proc.urlproceso;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    <span>SECOP</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const params = new URLSearchParams({
                                                            name: proc.descripci_n_del_procedimiento,
                                                            tenderId: proc.id_del_proceso || ''
                                                        });
                                                        router.push(`/dashboard/missions/new?${params.toString()}`);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
                                                >
                                                    <Target className="w-3 h-3" />
                                                    <span>Aplicar</span>
                                                </button>
                                                <CompetitorHistoryModal
                                                    unspscCodes={extractUNSPSCFromProcess(proc)}
                                                    processTitle={proc.descripci_n_del_procedimiento}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
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
