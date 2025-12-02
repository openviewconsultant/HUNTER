'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Rocket, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createProject } from "../actions";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function NewMissionPage() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const initialName = searchParams.get('name') || '';
    const initialTenderId = searchParams.get('tenderId') || '';

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createProject(formData);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full mx-auto space-y-6 p-6">
            <div className="flex-shrink-0 mb-6">
                <Link
                    href="/dashboard/missions"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Misiones
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Nueva Misión</h1>
                    <p className="text-zinc-400 text-sm">
                        Configura tu estrategia para esta licitación.
                    </p>
                </div>
            </div>

            <form action={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la Misión</CardTitle>
                        <CardDescription>
                            Define el nombre y la metodología de trabajo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de la Misión</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej: Licitación Alcaldía de Bogotá - Vías"
                                defaultValue={initialName}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tenderId">ID del Proceso (Opcional)</Label>
                            <Input
                                id="tenderId"
                                name="tenderId"
                                placeholder="Pega el ID de SECOP o selecciona de tus guardados"
                                defaultValue={initialTenderId}
                            />
                            <p className="text-xs text-muted-foreground">
                                Vincula esta misión a un proceso real para activar el Gap Analysis automático.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label>Metodología de Gestión</Label>
                            <RadioGroup defaultValue="AGILE" name="methodology" className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <RadioGroupItem value="AGILE" id="agile" className="peer sr-only" />
                                    <Label
                                        htmlFor="agile"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Rocket className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <span className="block font-semibold">Agile / Kanban</span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                Ideal para equipos rápidos. Flujo visual de tareas y entregables.
                                            </span>
                                        </div>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="PMBOK" id="pmbok" className="peer sr-only" />
                                    <Label
                                        htmlFor="pmbok"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <BookOpen className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <span className="block font-semibold">PMBOK / Tradicional</span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                Estructurado por fases: Inicio, Planificación, Ejecución, Cierre.
                                            </span>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creando Misión..." : "Iniciar Misión"}
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
