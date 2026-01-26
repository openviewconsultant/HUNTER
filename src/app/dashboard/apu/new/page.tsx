"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createApuBudget } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewApuPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('project');
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();

    if (!projectId) {
        return (
            <div className="p-6">
                <p>Error: No se seleccionó un proyecto. Por favor vuelve atrás.</p>
                <Button onClick={() => router.back()}>Volver</Button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                const budget = await createApuBudget(projectId, name);
                toast.success("Presupuesto creado con éxito");
                router.push(`/dashboard/apu/${budget.id}`);
            } catch (error) {
                console.error("Error creating budget:", error);
                toast.error("Error al crear el presupuesto");
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <CardTitle>Nuevo Presupuesto (APU)</CardTitle>
                    </div>
                    <CardDescription>
                        Define el nombre de tu nuevo análisis de precios unitarios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Presupuesto</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Presupuesto General de Obra"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || !name.trim()}>
                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Crear y Continuar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
