"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, TrendingUp, DollarSign, Users, ArrowLeft, Building2, FileText, Loader2, ExternalLink, Target, CheckCircle2, Bot, Calendar, Clock, Info, ShieldCheck, Timer, GanttChartSquare, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { searchMarketOpportunities, getMarketInsights, getUserCompanyForFilter, searchOpportunitiesByCompany } from "./actions";
import { SecopProcess } from "@/lib/socrata";
import { evaluateProcessRequirements, addProcessToMissions } from "./process-actions";
import { CompetitorHistoryModal } from "./competitor-history-modal";
import { extractUNSPSCFromProcess, getSuggestedDeliverables } from "./match-helpers";
import { toast } from "sonner";

function ProcessCard({ proc, index }: { proc: SecopProcess & { matchAnalysis?: any }, index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [addingToMissions, setAddingToMissions] = useState<string | null>(null);
    const router = useRouter();

    const matchAnalysis = proc.matchAnalysis;
    const isMatch = matchAnalysis?.isMatch || false;
    const matchScore = matchAnalysis?.matchScore || 0;
    const isActionable = matchAnalysis?.isActionable !== false;
    const isCorporate = matchAnalysis?.isCorporate !== false;

    const handleAddToMissions = async (p: SecopProcess) => {
        setAddingToMissions(p.id_del_proceso);
        try {
            const result = await addProcessToMissions(p);
            if (result.success) {
                toast.success('Proceso agregado a tus misiones');
            } else {
                toast.error(result.error || 'Error al agregar el proceso');
            }
        } catch (error) {
            toast.error('Error al conectar con el servidor');
        } finally {
            setAddingToMissions(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "p-4 rounded-xl border transition-all",
                isMatch && isActionable
                    ? "bg-green-500/10 border-green-500/50 hover:border-green-500/70 shadow-lg shadow-green-500/10"
                    : "bg-white/5 border-white/10 hover:border-primary/30",
                !isActionable && "opacity-60 grayscale-[0.5]"
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-medium border uppercase",
                        isActionable
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20 shadow-glow-red"
                    )}>
                        {isActionable ? proc.fase : (matchAnalysis?.advice?.includes('ADJUDICADO') || proc.fase?.includes('Adjudicado') || proc.estado_del_proceso?.includes('Adjudicado') ? 'ADJUDICADO' : 'CERRADO')}
                    </span>
                    {!isCorporate && (
                        <span className="px-2 py-1 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            PERSONA NATURAL
                        </span>
                    )}
                    {isMatch && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-500/20 text-green-300 border border-green-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Compatible {matchScore}%</span>
                        </div>
                    )}
                    {matchAnalysis?.isAIPowered && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            <span>✨ IA</span>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-semibold">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span>Publicado</span>
                    </div>
                    <span className="text-xs text-foreground font-medium">
                        {new Date(proc.fecha_de_publicacion_del).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                {proc.descripci_n_del_procedimiento}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                <Building2 className="w-3 h-3 text-primary/70" />
                <span className="truncate max-w-[200px]">{proc.entidad}</span>
            </div>

            {/* Expander Trigger */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-xs font-medium text-zinc-300"
            >
                <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span>{isExpanded ? "Ocultar detalles técnicos" : "Ver detalles técnicos y cronograma"}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {/* Informacion Detallada del Proceso */}
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-black/30 border border-white/5 shadow-inner">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <Info className="w-3 h-3" />
                                    <span>Fase</span>
                                </div>
                                <p className="text-xs text-zinc-200 font-medium">{proc.fase || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Estado</span>
                                </div>
                                <p className="text-xs text-zinc-200 font-medium truncate" title={proc.estado_resumen || proc.estado_del_procedimiento}>
                                    {proc.estado_resumen || proc.estado_del_procedimiento || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <FileText className="w-3 h-3" />
                                    <span>Tipo Contrato</span>
                                </div>
                                <p className="text-xs text-zinc-200 font-medium truncate">{proc.tipo_de_contrato || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <Timer className="w-3 h-3" />
                                    <span>Duración</span>
                                </div>
                                <p className="text-xs text-zinc-200 font-medium">
                                    {proc.duracion ? `${proc.duracion} ${proc.unidad_de_duracion || ''}` : 'N/A'}
                                </p>
                            </div>
                            <div className="col-span-2 space-y-1 pt-1 border-t border-white/5">
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <span>Justificación</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-tight italic line-clamp-2">
                                    {proc.justificaci_n_modalidad_de || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Cronograma / Hitos */}
                        <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                                <GanttChartSquare className="w-4 h-4 text-primary" />
                                <span>Cronograma del Proceso</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                {proc.fecha_de_recepcion_de_respuestas && (
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-zinc-400">Cierre de ofertas:</span>
                                        <span className="text-zinc-200 font-medium">
                                            {new Date(proc.fecha_de_recepcion_de_respuestas).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                                {proc.fecha_adjudicacion && (
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-zinc-400">Adjudicación:</span>
                                        <span className="text-zinc-200 font-medium">
                                            {new Date(proc.fecha_adjudicacion).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-zinc-400">Plazo ejecución:</span>
                                    <span className="text-zinc-200 font-medium">
                                        {proc.duracion ? `${proc.duracion} ${proc.unidad_de_duracion || ''}` : 'Ver pliegos'}
                                    </span>
                                </div>
                                {!proc.fecha_adjudicacion && (
                                    <div className="flex items-center justify-between text-[11px] opacity-70 italic">
                                        <span className="text-zinc-500">Estimado Firma:</span>
                                        <span className="text-zinc-500">
                                            {new Date(new Date(proc.fecha_de_publicacion_del).getTime() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Match Analysis Details (Always visible if match) */}
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

                    {/* Strategic Advice section */}
                    {matchAnalysis.advice && (
                        <div className="mb-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3 shadow-sm">
                            <div className="mt-0.5 p-1 rounded bg-indigo-500/20">
                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <p className="text-xs text-indigo-200 font-medium leading-relaxed italic">
                                {matchAnalysis.advice}
                            </p>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex flex-col gap-1">
                    <div className="text-xs flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Cuantía:</span>
                        <span className="text-foreground font-semibold ml-1">{formatCurrency(proc.precio_base)}</span>
                    </div>
                    {proc.fecha_de_ultima_publicaci && (
                        <div className="text-[10px] flex items-center gap-1 text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>Act: {new Date(proc.fecha_de_ultima_publicaci).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleAddToMissions(proc)}
                        disabled={addingToMissions === proc.id_del_proceso}
                        className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50"
                        title="Agregar a misiones"
                    >
                        {addingToMissions === proc.id_del_proceso ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Target className="w-4 h-4" />
                        )}
                    </button>
                    <a
                        href={typeof proc.urlproceso === 'object' ? proc.urlproceso.url : proc.urlproceso}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-colors"
                        title="Ver proceso original"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <CompetitorHistoryModal
                        unspscCodes={extractUNSPSCFromProcess(proc)}
                        processTitle={proc.descripci_n_del_procedimiento}
                    />
                </div>
            </div>
        </motion.div>
    );
}

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

    // New Filters
    const [showCorporateOnly, setShowCorporateOnly] = useState(true);
    const [hideNonActionable, setHideNonActionable] = useState(false);

    // Load filters from localStorage on mount
    useEffect(() => {
        const savedFilters = localStorage.getItem('market_analysis_filters');
        if (savedFilters) {
            try {
                const parsed = JSON.parse(savedFilters);
                if (parsed.showCorporateOnly !== undefined) setShowCorporateOnly(parsed.showCorporateOnly);
                if (parsed.hideNonActionable !== undefined) setHideNonActionable(parsed.hideNonActionable);
                if (parsed.activeFilter !== undefined) setActiveFilter(parsed.activeFilter);
                if (parsed.minAmount !== undefined) setMinAmount(parsed.minAmount);
                if (parsed.maxAmount !== undefined) setMaxAmount(parsed.maxAmount);
                if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
            } catch (e) {
                console.error("Error parsing saved filters:", e);
            }
        }
    }, []);

    // Save filters whenever they change
    useEffect(() => {
        const filtersToSave = {
            showCorporateOnly,
            hideNonActionable,
            activeFilter,
            minAmount,
            maxAmount,
            searchQuery
        };
        localStorage.setItem('market_analysis_filters', JSON.stringify(filtersToSave));
    }, [showCorporateOnly, hideNonActionable, activeFilter, minAmount, maxAmount, searchQuery]);

    useEffect(() => {
        // Load initial data
        const loadData = async () => {
            try {
                const company = await getUserCompanyForFilter();
                setUserCompany(company);

                // Default search using persisted or initial values
                const savedFilters = localStorage.getItem('market_analysis_filters');
                if (savedFilters) {
                    const parsed = JSON.parse(savedFilters);
                    if (parsed.searchQuery) {
                        handleSearch(parsed.searchQuery);
                        return;
                    }
                    if (parsed.activeFilter && parsed.activeFilter !== 'todos') {
                        if (parsed.activeFilter === 'company' && company) {
                            handleSearch(company.name, true);
                        } else {
                            handleSearch(parsed.activeFilter);
                        }
                        return;
                    }
                }

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
                hideNonActionable // Pass the current state
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
            console.error("Search error:", error);
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

    const filteredProcesses = useMemo(() => {
        return processes.filter(proc => {
            const analysis = (proc as any).matchAnalysis;
            if (!analysis) return true;

            const corporateOk = !showCorporateOnly || analysis.isCorporate;
            const actionableOk = !hideNonActionable || analysis.isActionable;

            return corporateOk && actionableOk;
        });
    }, [processes, showCorporateOnly, hideNonActionable]);

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
                    <form onSubmit={onSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por entidad, objeto o código..."
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "px-4 py-3 rounded-lg border border-white/10 transition-colors flex items-center gap-2",
                                showFilters ? "bg-primary/20 text-primary border-primary/30" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden md:inline">Filtros</span>
                        </button>
                    </form>

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
                                <label className="text-xs text-muted-foreground">Cuantía Máxima (COP)</label>
                                <input
                                    type="number"
                                    placeholder="Sin límite"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Solo Empresas</span>
                                    <span className="text-[10px] text-muted-foreground italic">Oculta personas naturales</span>
                                </div>
                                <button
                                    onClick={() => setShowCorporateOnly(!showCorporateOnly)}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        showCorporateOnly ? "bg-primary" : "bg-zinc-700"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                        showCorporateOnly ? "right-1" : "left-1"
                                    )} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Ocultar Cerrados</span>
                                    <span className="text-[10px] text-muted-foreground italic">Solo procesos en curso</span>
                                </div>
                                <button
                                    onClick={() => setHideNonActionable(!hideNonActionable)}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        hideNonActionable ? "bg-primary" : "bg-zinc-700"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                                        hideNonActionable ? "right-1" : "left-1"
                                    )} />
                                </button>
                            </div>
                            <div className="col-span-full flex justify-end mt-2">
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
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : filteredProcesses.length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Encontradas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-purple-300">Valor Promedio</span>
                        </div>
                        <p className="text-xl font-bold text-foreground truncate">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(
                                filteredProcesses.length > 0
                                    ? filteredProcesses.reduce((acc, p) => acc + parseFloat(p.precio_base || '0'), 0) / filteredProcesses.length
                                    : 0
                            )}
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
                        ) : filteredProcesses.length > 0 ? (
                            filteredProcesses.map((proc, i) => (
                                <ProcessCard key={`${proc.id_del_proceso}-${i}`} proc={proc as any} index={i} />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <p className="text-muted-foreground">No se encontraron procesos para estos criterios.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* BI Insights Placeholder */}
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
