import { getProjectsWithBudgets } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, FileSpreadsheet, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ApuListingPage() {
    const projects = await getProjectsWithBudgets();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presupuestos (APU)</h1>
                    <p className="text-muted-foreground">
                        Gestiona los análisis de precios unitarios desglosados por misión.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        <Calculator className="mx-auto h-12 w-12 opacity-20 mb-4" />
                        <p>No tienes misiones activas para crear presupuestos.</p>
                        <Button className="mt-4" asChild>
                            <Link href="/dashboard/missions">Ir a Misiones</Link>
                        </Button>
                    </div>
                ) : (
                    projects.map((project) => {
                        const budgets = project.apu_budgets || [];
                        const hasBudget = budgets.length > 0;

                        return (
                            <Card key={project.id} className="relative overflow-hidden group">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary mb-2">
                                            <Calculator className="w-5 h-5" />
                                        </div>
                                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {project.description || "Sin descripción"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {hasBudget ? (
                                            <div className="space-y-2">
                                                {budgets.map((budget: any) => (
                                                    <Link
                                                        key={budget.id}
                                                        href={`/dashboard/apu/${budget.id}`}
                                                        className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors group/item"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">{budget.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold">{formatCurrency(budget.total_cost)}</span>
                                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg border-muted">
                                                <p className="text-xs text-muted-foreground mb-3">No hay presupuestos creados</p>
                                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                                    <Link href={`/dashboard/apu/new?project=${project.id}`}>
                                                        <Plus className="w-4 h-4" />
                                                        Crear APU
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
