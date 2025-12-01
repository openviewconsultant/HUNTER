import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, AlertCircle, FileText, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

async function getProjectDetails(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            tender:tender_id (
                title,
                amount,
                entity_name,
                secop_id
            )
        `)
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return data;
}

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
    const project = await getProjectDetails(params.id);

    if (!project) {
        notFound();
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                        <Badge variant="outline">{project.methodology}</Badge>
                        <Badge className={project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-zinc-500'}>
                            {project.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        {project.tender?.title || "Misión sin licitación vinculada"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Configuración</Button>
                    <Button>Actualizar Estado</Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="board" className="flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b pb-4">
                    <TabsList>
                        <TabsTrigger value="board">Tablero {project.methodology === 'AGILE' ? 'Kanban' : 'Fases'}</TabsTrigger>
                        <TabsTrigger value="gap">Gap Analysis</TabsTrigger>
                        <TabsTrigger value="docs">Documentos</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="board" className="flex-1 mt-4">
                    <div className="grid grid-cols-4 gap-4 h-full overflow-x-auto pb-4">
                        {/* Kanban Columns - Mocked for UI structure */}
                        {['Por Hacer', 'En Progreso', 'Revisión', 'Listo'].map((col) => (
                            <div key={col} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 h-full min-w-[280px]">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm">{col}</h3>
                                    <Badge variant="secondary" className="text-xs">0</Badge>
                                </div>

                                {/* Empty State for Column */}
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-md border-muted-foreground/20">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Añadir Tarea
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="gap" className="mt-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Análisis de Requisitos</CardTitle>
                                <CardDescription>Comparativa automática: Tu Perfil vs Pliego</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 dark:text-green-400">Capacidad Financiera</h4>
                                            <p className="text-sm text-green-800 dark:text-green-300">Cumples con el K de Contratación y Liquidez requeridos.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-400">Experiencia Específica</h4>
                                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                Falta 1 contrato de obra civil &gt; 500 SMMLV.
                                                <br />
                                                <span className="font-medium mt-1 block">Recomendación IA:</span>
                                                Revisar consorcio con empresa aliada "Constructora X".
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Matriz de Riesgos</CardTitle>
                                <CardDescription>Alertas detectadas en el pliego de condiciones</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm border-b pb-2">
                                        <span>Cronograma Ajustado</span>
                                        <Badge variant="destructive">Alto</Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-b pb-2">
                                        <span>Anticipo</span>
                                        <Badge variant="secondary">Bajo</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="docs" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos de la Misión</CardTitle>
                            <CardDescription>Repositorio centralizado para esta licitación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p>Arrastra documentos aquí o haz clic para subir.</p>
                                <Button variant="outline" className="mt-4">Subir Archivos</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
