import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "./actions";
import { TrendingUp, AlertCircle, FileText, Calendar, Target, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const stats = await getDashboardStats();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-7.5rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
                    <p className="text-zinc-400 text-sm">Bienvenido de nuevo, {user?.email}</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Active Missions */}
                <Link href="/dashboard/missions" className="group block h-full">
                    <div className="p-4 h-full rounded-2xl card-gradient card-shimmer shadow-glow border border-white/5 relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Misiones Activas</h3>
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Target className="w-4 h-4 text-primary" />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                            <p className="text-3xl font-bold text-foreground">{stats.activeMissions}</p>
                        </div>

                        {/* Summary Data */}
                        <div className="mt-auto space-y-1.5 pt-2 border-t border-white/5">
                            {stats.recentMissions.length > 0 ? (
                                stats.recentMissions.map((m: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="text-zinc-400 truncate max-w-[120px]">{m.name}</span>
                                        <span className="text-primary font-medium">{new Date(m.deadline).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] text-zinc-500">Sin misiones activas en este momento</p>
                            )}
                        </div>
                    </div>
                </Link>

                {/* New Alerts */}
                <Link href="/dashboard/notifications" className="group block h-full">
                    <div className="p-4 h-full rounded-2xl card-gradient card-shimmer shadow-glow border border-white/5 relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Alertas</h3>
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                            <p className="text-3xl font-bold text-foreground">{stats.newAlerts}</p>
                        </div>

                        {/* Summary Data */}
                        <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            <div className="text-[10px] flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                                <span className="text-zinc-400">{stats.notifSummary.alert} Alertas</span>
                            </div>
                            <div className="text-[10px] flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                <span className="text-zinc-400">{stats.notifSummary.mission} Misiones</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Documents */}
                <Link href="/dashboard/company" className="group block h-full">
                    <div className="p-4 h-full rounded-2xl card-gradient card-shimmer shadow-glow border border-white/5 relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documentos</h3>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-2">
                            <p className="text-3xl font-bold text-foreground">{stats.documents}</p>
                        </div>

                        {/* Summary Data */}
                        <div className="mt-auto space-y-1 pt-2 border-t border-white/5">
                            <p className="text-[10px] text-zinc-400">RUP, Financieros y Técnicos.</p>
                            <div className="flex items-center text-[10px] text-primary">
                                Gestionar perfil <ArrowRight className="w-2.5 h-2.5 ml-1" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Success Rate */}
                <div className="p-4 rounded-2xl card-gradient card-shimmer shadow-glow border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tasa de Éxito</h3>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <p className="text-4xl font-bold text-foreground">{stats.successRate}%</p>
                        <span className="text-[10px] font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+2.5% vs mes ant.</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">de licitaciones adjudicadas globalmente</p>
                </div>

                {/* Total in Process */}
                <div className="p-4 rounded-2xl card-gradient card-shimmer shadow-glow border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Valor en Proceso</h3>
                    </div>

                    <div className="flex flex-col">
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalInProcess)}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium text-[10px]">TOTAL ACTIVO</span>
                            <p className="text-[10px] text-muted-foreground">En {stats.activeMissions} misiones</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding / Profile Status */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4 h-fit">
                        <div className="max-w-xl">
                            <h2 className="text-lg font-bold text-foreground">Perfil de Empresa</h2>
                            <p className="text-zinc-400 text-xs mt-1">
                                {stats.documents > 0
                                    ? "Tu perfil está siendo procesado por nuestra IA para encontrar mejores oportunidades."
                                    : "Sube tus documentos legales y financieros para que HUNTER pueda encontrarte las mejores oportunidades."}
                            </p>
                        </div>
                        <Link
                            href="/dashboard/company"
                            className="inline-flex items-center justify-center h-9 px-5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-colors shrink-0"
                        >
                            Ir al Perfil
                        </Link>
                    </div>

                    {/* Quick Tips / Market Status could go here */}
                </div>

                {/* Recent Notifications / Alerts */}
                <div className="lg:col-span-1">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Actividad Reciente</h3>
                            <Link href="/dashboard/notifications" className="text-[10px] text-primary hover:underline">Ver todas</Link>
                        </div>

                        <div className="space-y-4">
                            {stats?.recentNotifications && stats.recentNotifications.length > 0 ? (
                                stats.recentNotifications.map((notif: any) => (
                                    <div key={notif.id} className="flex gap-3 items-start border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full shrink-0",
                                            notif.read ? "bg-zinc-600" : "bg-primary animate-pulse"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                                            <p className="text-[10px] text-zinc-400 line-clamp-1">{notif.message}</p>
                                            <p className="text-[9px] text-zinc-600 mt-1">
                                                {new Date(notif.created_at).toLocaleDateString('es-CO', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                        <BellOff className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <p className="text-xs text-zinc-500">No hay notificaciones recientes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icons/utils needed for the dashboard
import { BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
