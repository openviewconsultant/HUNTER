import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, AlertTriangle, Target, Calendar, DollarSign } from "lucide-react";
import { getPredictionStats, getOpportunities, getRisks } from "./actions";
import { cn } from "@/lib/utils";

export default async function PredictionsPage() {
    const stats = await getPredictionStats();
    const opportunities = await getOpportunities();
    const risks = await getRisks();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Motor de Predicciones IA</h1>
                <p className="text-muted-foreground">
                    Análisis predictivo de oportunidades, probabilidad de éxito y detección de riesgos con datos en tiempo real.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oportunidades Alta Probabilidad</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.opportunities}</div>
                        <p className="text-xs text-muted-foreground">Detectadas por IA</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Score Promedio de Éxito</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgSuccessScore}%</div>
                        <p className="text-xs text-muted-foreground">En tus licitaciones activas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Riesgo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.risks}</div>
                        <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="opportunities" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="opportunities">Oportunidades Detectadas</TabsTrigger>
                    <TabsTrigger value="success">Probabilidad de Éxito</TabsTrigger>
                    <TabsTrigger value="risks">Riesgos Identificados</TabsTrigger>
                </TabsList>

                <TabsContent value="opportunities" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Oportunidades Recomendadas</CardTitle>
                            <CardDescription>
                                Licitaciones seleccionadas por la IA basándose en tu perfil y experiencia histórica.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {opportunities.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Brain className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                    <p>No hay oportunidades detectadas aún. La IA está analizando nuevos procesos.</p>
                                </div>
                            ) : (
                                opportunities.map((opp) => (
                                    <div key={opp.id} className={cn(
                                        "rounded-md border p-4 transition-all hover:bg-muted/50",
                                        opp.matchScore > 90 && opp.isActionable !== false ? "bg-green-600/5 border-green-600/20" : "",
                                        opp.isActionable === false ? "opacity-60 grayscale-[0.3]" : ""
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
                                                        opp.isActionable !== false
                                                            ? "bg-green-600/10 text-green-400 border-green-600/20"
                                                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                    )}>
                                                        {opp.isActionable !== false ? "Abierto" : "Finalizado / En curso"}
                                                    </span>
                                                    {opp.isCorporate === false && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                            Persona Natural
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold line-clamp-1">{opp.title}</h3>
                                                <p className="text-sm text-muted-foreground">{opp.entity}</p>
                                            </div>
                                            <Badge variant={opp.matchScore > 90 ? "default" : "secondary"} className={cn(
                                                opp.matchScore > 90 && opp.isActionable !== false ? "bg-green-600 hover:bg-green-700" : "",
                                                !opp.isActionable && "bg-zinc-600 hover:bg-zinc-600 opacity-50"
                                            )}>
                                                Match {opp.matchScore}%
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                <span>{formatCurrency(opp.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Cierre: {formatDate(opp.closingDate)}</span>
                                            </div>
                                            {opp.reason && (
                                                <div className="flex flex-col gap-1 w-full mt-2">
                                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                        <Brain className="h-3 w-3" />
                                                        <span className="text-xs font-medium">{opp.reason}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {opp.advice && (
                                                <div className="mt-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 italic">
                                                    {opp.advice}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="success" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Probabilidad de Éxito</CardTitle>
                            <CardDescription>
                                Evaluación detallada de tus posibilidades en procesos activos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {opportunities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Brain className="mb-4 h-12 w-12 opacity-20" />
                                    <p>No hay procesos para analizar.</p>
                                    <p className="text-sm mt-2">La IA analizará automáticamente las oportunidades basándose en tu perfil.</p>
                                </div>
                            ) : (
                                opportunities.map((opp) => (
                                    <div key={opp.id} className="rounded-md border p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1">
                                                <h3 className="font-semibold">{opp.title}</h3>
                                                <p className="text-sm text-muted-foreground">{opp.entity}</p>
                                            </div>
                                            <Badge
                                                variant={opp.matchScore >= 90 ? "default" : opp.matchScore >= 70 ? "secondary" : "outline"}
                                                className={
                                                    opp.matchScore >= 90
                                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                                        : opp.matchScore >= 70
                                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                            : ""
                                                }
                                            >
                                                {opp.matchScore}% Éxito
                                            </Badge>
                                        </div>

                                        {/* Success Probability Bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Probabilidad de Éxito</span>
                                                <span>{opp.matchScore}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${opp.matchScore >= 90
                                                        ? 'bg-green-600'
                                                        : opp.matchScore >= 70
                                                            ? 'bg-blue-600'
                                                            : 'bg-yellow-600'
                                                        }`}
                                                    style={{ width: `${opp.matchScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3 w-3" />
                                                <span>{formatCurrency(opp.amount)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>Cierre: {formatDate(opp.closingDate)}</span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        {opp.reason && (
                                            <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                                <Brain className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                <span>{opp.reason}</span>
                                            </div>
                                        )}

                                        {/* AI Analysis Section */}
                                        {opp.aiAnalysis && (
                                            <div className="mt-4 pt-4 border-t border-dashed">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/30">
                                                        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Análisis de Entregables (IA)</h4>
                                                </div>

                                                <div className="space-y-3 text-sm">
                                                    {opp.aiAnalysis.summary && (
                                                        <div className="bg-muted/50 p-3 rounded-md text-muted-foreground italic text-xs">
                                                            "{opp.aiAnalysis.summary}"
                                                        </div>
                                                    )}

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {opp.aiAnalysis.deliverables && opp.aiAnalysis.deliverables.length > 0 && (
                                                            <div>
                                                                <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2">Entregables Identificados</h5>
                                                                <ul className="space-y-1">
                                                                    {opp.aiAnalysis.deliverables.slice(0, 5).map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-xs">
                                                                            <span className="mt-1.5 h-1 w-1 rounded-full bg-purple-500 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {opp.aiAnalysis.technicalRequirements && opp.aiAnalysis.technicalRequirements.length > 0 && (
                                                            <div>
                                                                <h5 className="text-xs font-medium uppercase text-muted-foreground mb-2">Requisitos Técnicos</h5>
                                                                <ul className="space-y-1">
                                                                    {opp.aiAnalysis.technicalRequirements.slice(0, 5).map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-xs">
                                                                            <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-500 flex-shrink-0" />
                                                                            <span>{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risks">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monitor de Riesgos</CardTitle>
                            <CardDescription>
                                Detección temprana de anomalías y riesgos en pliegos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {risks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                    <p>No se han detectado riesgos críticos en los procesos monitoreados.</p>
                                </div>
                            ) : (
                                risks.map((risk) => (
                                    <div key={risk.id} className={`rounded-md border p-4 ${risk.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20'}`}>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className={`mt-0.5 h-5 w-5 ${risk.severity === 'high' ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500'}`} />
                                            <div>
                                                <h3 className={`font-semibold ${risk.severity === 'high' ? 'text-red-900 dark:text-red-500' : 'text-yellow-900 dark:text-yellow-500'}`}>
                                                    {risk.title}
                                                </h3>
                                                <p className={`text-sm ${risk.severity === 'high' ? 'text-red-800 dark:text-red-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
                                                    {risk.description}
                                                </p>
                                                {risk.tenderId && (
                                                    <p className="mt-2 text-xs opacity-70">Proceso ID: {risk.tenderId}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
