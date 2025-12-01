import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Wallet, FileText, Target, BarChart3 } from "lucide-react";
import { getAnalyticsData } from "./actions";

export default async function AnalyticsPage() {
    const data = await getAnalyticsData();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Panel de Análisis Empresarial</h1>
                <p className="text-muted-foreground">
                    Métricas financieras, capacidad de contratación y análisis de experiencia.
                </p>
            </div>

            {/* Financial Health Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capacidad K</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(data.capacityK)}
                        </div>
                        <p className="text-xs text-muted-foreground">Capacidad de contratación</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Salud Financiera</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.financialHealth}%</div>
                        <p className="text-xs text-muted-foreground">
                            Liquidez: {(data.liquidityIndex * 100).toFixed(1)}% | Endeudamiento: {((data.indebtednessIndex ?? 0) * 100).toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contratos Ejecutados</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalContracts}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(data.totalContractValue)} total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(data.avgContractValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Por contrato</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Financial Indicators */}
                <Card>
                    <CardHeader>
                        <CardTitle>Indicadores Financieros</CardTitle>
                        <CardDescription>
                            Métricas clave de tu capacidad financiera
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium">Capital de Trabajo</span>
                            <span className="text-sm">{formatCurrency(data.workingCapital ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium">Patrimonio</span>
                            <span className="text-sm">{formatCurrency(data.equity ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium">Índice de Liquidez</span>
                            <span className="text-sm">{data.liquidityIndex.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Nivel de Endeudamiento</span>
                            <span className="text-sm">{((data.indebtednessIndex ?? 0) * 100).toFixed(1)}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Projection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Proyección de Ingresos</CardTitle>
                        <CardDescription>
                            Estimado basado en tu experiencia histórica
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center py-8">
                            <Target className="mx-auto h-12 w-12 text-primary mb-4" />
                            <div className="text-3xl font-bold text-primary">
                                {formatCurrency(data.projectedRevenue)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{data.period}</p>
                            <p className="text-xs text-muted-foreground mt-4">
                                Basado en promedio de contratos anteriores
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* UNSPSC Experience Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Experiencia por Sector UNSPSC</CardTitle>
                    <CardDescription>
                        Distribución de tu experiencia por códigos UNSPSC
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.unspscBreakdown.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="mx-auto h-12 w-12 opacity-20 mb-4" />
                            <p>No hay contratos registrados con códigos UNSPSC</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.unspscBreakdown.slice(0, 10).map((item) => (
                                <div key={item.code} className="flex items-center justify-between border-b pb-3">
                                    <div>
                                        <span className="font-mono text-sm font-semibold text-primary">{item.code}</span>
                                        <p className="text-xs text-muted-foreground">{item.count} contrato(s)</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{formatCurrency(item.totalValue)}</p>
                                        <p className="text-xs text-muted-foreground">{item.totalValueSMMLV.toFixed(0)} SMMLV</p>
                                    </div>
                                </div>
                            ))}
                            {data.unspscBreakdown.length > 10 && (
                                <p className="text-sm text-muted-foreground text-center pt-2">
                                    Y{data.unspscBreakdown.length - 10} sectores más...
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
