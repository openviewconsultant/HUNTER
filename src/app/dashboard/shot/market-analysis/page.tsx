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
                "p-5 rounded-2xl border transition-all duration-300 group",
                isMatch && isActionable
                    ? "bg-gradient-to-br from-green-500/[0.05] dark:from-green-500/10 via-transparent to-transparent border-green-500/30 dark:border-green-500/30 hover:border-green-500/50 shadow-lg shadow-green-500/5"
                    : "bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/10 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-white/[0.04] shadow-sm",
                !isActionable && "opacity-60 grayscale-[0.3]"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        isActionable
                            ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                            : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 shadow-glow-red"
                    )}>
                        {isActionable ? proc.fase : (matchAnalysis?.advice?.includes('ADJUDICADO') || proc.fase?.includes('Adjudicado') || proc.estado_del_proceso?.includes('Adjudicado') ? 'ADJUDICADO' : 'CERRADO')}
                    </span>
                    {!isCorporate && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 tracking-wider">
                            PERSONA NATURAL
                        </span>
                    )}
                    {isMatch && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/20 dark:border-green-500/40 tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{matchScore}% MATCH</span>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-500 uppercase font-black tracking-tighter">
                        <Calendar className="w-3 h-3 text-primary/70" />
                        <span>Publicado</span>
                    </div>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 font-bold mt-0.5 block">
                        {new Date(proc.fecha_de_publicacion_del).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <h4 className="text-base font-bold text-zinc-900 dark:text-foreground mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {proc.descripci_n_del_procedimiento}
            </h4>

            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-500 mb-5">
                <div className="p-1 rounded bg-zinc-100 dark:bg-white/5">
                    <Building2 className="w-3 h-3 text-primary" />
                </div>
                <span className="truncate font-bold uppercase tracking-tight">{proc.entidad}</span>
            </div>

            {/* Expander Trigger */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl transition-all text-xs font-semibold border",
                    isExpanded
                        ? "bg-zinc-100 dark:bg-white/10 border-zinc-300 dark:border-white/20 text-zinc-900 dark:text-white"
                        : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/10"
                )}
            >
                <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-primary" />
                    <span>{isExpanded ? "Ocultar detalles técnicos" : "Ver detalles técnicos"}</span>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
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
                        <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 shadow-inner">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                    <Info className="w-2.5 h-2.5" />
                                    <span>Fase</span>
                                </div>
                                <p className="text-xs text-zinc-900 dark:text-zinc-200 font-bold">{proc.fase || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>Estado</span>
                                </div>
                                <p className="text-xs text-zinc-900 dark:text-zinc-200 font-bold truncate" title={proc.estado_resumen || proc.estado_del_procedimiento}>
                                    {proc.estado_resumen || proc.estado_del_procedimiento || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                    <FileText className="w-2.5 h-2.5" />
                                    <span>Tipo Contrato</span>
                                </div>
                                <p className="text-xs text-zinc-900 dark:text-zinc-200 font-bold truncate">{proc.tipo_de_contrato || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                    <Timer className="w-2.5 h-2.5" />
                                    <span>Duración</span>
                                </div>
                                <p className="text-xs text-zinc-900 dark:text-zinc-200 font-bold">
                                    {proc.duracion ? `${proc.duracion} ${proc.unidad_de_duracion || ''}` : 'N/A'}
                                </p>
                            </div>
                            {proc.justificaci_n_modalidad_de && (
                                <div className="col-span-2 space-y-1 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                                        <span>Justificación</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed italic line-clamp-3">
                                        {proc.justificaci_n_modalidad_de}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Deliverables Section */}
                        {matchAnalysis && (
                            <div className="mb-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black text-foreground uppercase tracking-widest pl-1">
                                    <GanttChartSquare className="w-4 h-4 text-primary" />
                                    <span>Entregables Sugeridos</span>
                                </div>
                                <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-inner">
                                    {getSuggestedDeliverables(proc).slice(0, 6).map((del, idx) => (
                                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-tight hover:bg-primary/20 transition-all cursor-default dark:bg-primary/10 dark:text-primary dark:border-primary/20">
                                            {del}
                                        </span>
                                    ))}
                                    {getSuggestedDeliverables(proc).length > 6 && (
                                        <span className="px-2.5 py-1.5 rounded-lg bg-white/5 text-muted-foreground border border-white/10 text-[10px] font-bold">
                                            +{getSuggestedDeliverables(proc).length - 6} MÁS
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Match Analysis Details (Always visible) */}
            {matchAnalysis && (
                <div className="space-y-3 mt-4">
                    {/* Reasons for Match */}
                    {matchAnalysis.reasons.length > 0 && (
                        <div className="p-4 rounded-xl bg-green-500/[0.05] dark:bg-green-500/[0.03] border border-green-500/20 shadow-sm">
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" />
                                Análisis de Compatibilidad
                            </p>
                            <ul className="space-y-1.5">
                                {matchAnalysis.reasons.slice(0, 3).map((reason: string, idx: number) => (
                                    <li key={idx} className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-2 leading-snug">
                                        <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                        <span>{reason}</span>
                                    </li>
                                ))}
                                {matchAnalysis.topCompetitors && matchAnalysis.topCompetitors.length > 0 && (
                                    <li className="pt-2 mt-2 border-t border-green-500/10">
                                        <p className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">Competidores Históricos en este sector</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {matchAnalysis.topCompetitors.map((comp: string, i: number) => (
                                                <span key={i} className="px-2 py-1 rounded-md bg-purple-500/5 text-purple-700 dark:text-purple-300 border border-purple-500/10 text-[9px] font-black uppercase tracking-tight">
                                                    {comp}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Strategic Advice */}
                    {matchAnalysis.advice && (
                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 flex items-start gap-3 shadow-sm group/advice">
                            <div className="shrink-0 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 group-hover/advice:bg-indigo-200 dark:group-hover/advice:bg-indigo-500/20 transition-colors">
                                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Insight de IA</p>
                                <p className="text-xs text-indigo-900 dark:text-indigo-100/80 font-bold leading-relaxed italic">
                                    "{matchAnalysis.advice}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-white/5">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-zinc-100 dark:bg-white/5">
                            <DollarSign className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Presupuesto</span>
                            <span className="text-sm text-zinc-900 dark:text-foreground font-black tracking-tight">{formatCurrency(proc.precio_base)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleAddToMissions(proc)}
                        disabled={addingToMissions === proc.id_del_proceso}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {addingToMissions === proc.id_del_proceso ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Target className="w-4 h-4" />
                                <span>Misión</span>
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-2">
                        <a
                            href={typeof proc.urlproceso === 'object' ? proc.urlproceso.url : proc.urlproceso}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
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
            </div>
        </motion.div >
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
    const [selectedPhase, setSelectedPhase] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");

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
                if (parsed.selectedPhase !== undefined) setSelectedPhase(parsed.selectedPhase);
                if (parsed.selectedStatus !== undefined) setSelectedStatus(parsed.selectedStatus);
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
            searchQuery,
            selectedPhase,
            selectedStatus
        };
        localStorage.setItem('market_analysis_filters', JSON.stringify(filtersToSave));
    }, [showCorporateOnly, hideNonActionable, activeFilter, minAmount, maxAmount, searchQuery, selectedPhase, selectedStatus]);

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
            const phaseOk = !selectedPhase || proc.fase === selectedPhase;
            const statusOk = !selectedStatus || proc.estado_del_proceso === selectedStatus;

            return corporateOk && actionableOk && phaseOk && statusOk;
        });
    }, [processes, showCorporateOnly, hideNonActionable, selectedPhase, selectedStatus]);

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
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-foreground tracking-tight">Análisis de Mercado</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                            Datos en tiempo real de SECOP II (Colombia Compra Eficiente)
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Mobile First Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">

                {/* Search & Filters Section */}
                <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 sticky top-0 backdrop-blur-xl z-20 shadow-xl dark:shadow-2xl">
                    <form onSubmit={onSearch} className="flex gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar lictaciones por entidad, objeto o código UNSPSC..."
                                className="w-full bg-zinc-100/50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-zinc-900 dark:text-foreground placeholder:text-zinc-500 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-black/60 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "px-5 py-4 rounded-xl border transition-all flex items-center gap-3 font-bold text-sm",
                                showFilters
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                    : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filtros</span>
                        </button>
                    </form>

                    <div className="flex gap-2 overflow-x-auto pb-1 mt-5 scrollbar-hide py-1">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => onFilterChange(filter.id)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                    activeFilter === filter.id
                                        ? "bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 shadow-sm"
                                        : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-500 border-transparent hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Cuantía Máxima (COP)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input
                                                type="number"
                                                placeholder="Cualquier valor"
                                                value={maxAmount}
                                                onChange={(e) => setMaxAmount(e.target.value)}
                                                className="w-full bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-900 dark:text-foreground focus:outline-none focus:border-primary transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Fase del Proceso</label>
                                        <div className="relative">
                                            <select
                                                value={selectedPhase}
                                                onChange={(e) => setSelectedPhase(e.target.value)}
                                                className="w-full bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-foreground focus:outline-none focus:border-primary transition-all font-bold appearance-none"
                                            >
                                                <option value="">Todas las fases</option>
                                                <option value="Presentación de oferta">Presentación de oferta</option>
                                                <option value="Adjudicado">Adjudicado</option>
                                                <option value="Celebrado">Celebrado</option>
                                                <option value="Evaluación">Evaluación</option>
                                                <option value="Desierto">Desierto</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Estado Detallado</label>
                                        <div className="relative">
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-foreground focus:outline-none focus:border-primary transition-all font-bold appearance-none"
                                            >
                                                <option value="">Todos los estados</option>
                                                <option value="Adjudicado">Adjudicado</option>
                                                <option value="Activo">Activo</option>
                                                <option value="Cerrado">Cerrado</option>
                                                <option value="En evaluación">En evaluación</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="col-span-full grid md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setShowCorporateOnly(!showCorporateOnly)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all group",
                                                showCorporateOnly
                                                    ? "bg-primary/5 dark:bg-primary/10 border-primary/40 text-primary shadow-inner"
                                                    : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    showCorporateOnly ? "bg-primary/10 dark:bg-primary/20 shadow-glow-primary" : "bg-zinc-100 dark:bg-white/5"
                                                )}>
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-sm font-bold block">Solo Empresas</span>
                                                    <span className="text-[10px] font-medium opacity-70">Ocupar personas naturales</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                                showCorporateOnly ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                                            )}>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                                                    showCorporateOnly ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setHideNonActionable(!hideNonActionable)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border-2 transition-all group",
                                                hideNonActionable
                                                    ? "bg-primary/5 dark:bg-primary/10 border-primary/40 text-primary shadow-inner"
                                                    : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    hideNonActionable ? "bg-primary/10 dark:bg-primary/20 shadow-glow-primary" : "bg-zinc-100 dark:bg-white/5"
                                                )}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-sm font-bold block">Ocultar Cerrados</span>
                                                    <span className="text-[10px] font-medium opacity-70">Solo procesos en curso</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                                hideNonActionable ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"
                                            )}>
                                                <div className={cn(
                                                    "w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                                                    hideNonActionable ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </div>
                                        </button>
                                    </div>

                                    <div className="col-span-full flex justify-end gap-3 mt-2">
                                        <button
                                            onClick={() => {
                                                setMinAmount("");
                                                setMaxAmount("");
                                                setSelectedPhase("");
                                                setSelectedStatus("");
                                            }}
                                            className="px-6 py-3 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleSearch(searchQuery || activeFilter);
                                                setShowFilters(false);
                                            }}
                                            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                        >
                                            Aplicar Filtros
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">Oportunidades</span>
                        </div>
                        <p className="text-2xl font-black text-zinc-900 dark:text-foreground">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : filteredProcesses.length}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-muted-foreground mt-1 font-bold uppercase tracking-tight">Encontradas</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest">Valor Promedio</span>
                        </div>
                        <p className="text-xl font-black text-zinc-900 dark:text-foreground truncate uppercase tracking-tighter">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(
                                filteredProcesses.length > 0
                                    ? filteredProcesses.reduce((acc, p) => acc + parseFloat(p.precio_base || '0'), 0) / filteredProcesses.length
                                    : 0
                            )}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-muted-foreground mt-1 font-bold uppercase tracking-tight">COP</p>
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
                            <div className="text-center py-12 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-dashed border-zinc-200 dark:border-white/10">
                                <p className="text-zinc-500 dark:text-muted-foreground font-medium">No se encontraron procesos para estos criterios.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-gradient-to-br dark:from-primary/5 dark:to-transparent border border-zinc-200 dark:border-primary/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-black text-zinc-900 dark:text-foreground uppercase tracking-widest">Análisis de Competencia</h3>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-muted-foreground leading-relaxed mb-4 font-medium uppercase tracking-tight">
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
