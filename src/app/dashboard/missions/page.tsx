'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Plus, Calendar, Target, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { getProjects, deleteProject } from "./actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MissionsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
        setLoading(false);
    }

    async function handleDelete(projectId: string) {
        setDeleting(true);
        try {
            await deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Error al eliminar la misión");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Cargando misiones...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Misiones</h1>
                    <p className="text-muted-foreground">
                        Gestión estratégica de tus procesos de licitación y proyectos.
                    </p>
                </div>
                <Link href="/dashboard/missions/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nueva Misión
                    </Button>
                </Link>
            </div>

            {projects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-primary/10 p-4">
                            <Rocket className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">No tienes misiones activas</h3>
                        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                            Comienza una nueva misión para gestionar una licitación con metodología PMP o Agile.
                        </p>
                        <Link href="/dashboard/missions/new">
                            <Button>Crear mi primera misión</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="h-full transition-all hover:border-primary/50 hover:shadow-md group relative"
                        >
                            {/* Action Buttons - Show on Hover */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.push(`/dashboard/missions/${project.id}`);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDeleteId(project.id);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <Link href={`/dashboard/missions/${project.id}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <Badge variant="outline" className="bg-primary/5">
                                            {project.methodology}
                                        </Badge>
                                        <Badge className={project.status === 'ACTIVE' ? 'bg-green-500' : 'bg-zinc-500'}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="line-clamp-1 mt-2">{project.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {project.tenderTitle || "Sin licitación vinculada"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Progreso</span>
                                            <span className="font-medium">{project.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {project.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {project.amount && (
                                                <div className="flex items-center gap-1">
                                                    <Target className="h-3 w-3" />
                                                    <span>
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(project.amount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la misión y todos sus datos asociados (tareas, etapas, etc.).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && handleDelete(deleteId)}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
