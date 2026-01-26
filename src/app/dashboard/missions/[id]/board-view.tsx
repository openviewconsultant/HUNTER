'use client';

import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, RefreshCcw, Calendar } from "lucide-react";
import { updateTaskStage, syncProjectWithSecop } from "../actions";
import { useSortable } from '@dnd-kit/sortable';
import { useTransition } from 'react';
import { useParams } from 'next/navigation';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

// Task Card Component
function TaskCard({ task, isOverlay = false }: { task: any, isOverlay?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-lg rotate-2' : ''}`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                <Badge
                    variant={
                        task.priority === 'CRITICAL' ? 'destructive' :
                            task.priority === 'HIGH' ? 'default' :
                                'secondary'
                    }
                    className="text-[10px] shrink-0"
                >
                    {task.priority}
                </Badge>
            </div>
            {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {task.description}
                </p>
            )}
            <div className="flex items-center justify-between gap-2">
                <Badge
                    variant="outline"
                    className="text-[10px]"
                >
                    {task.requirement_type}
                </Badge>
                {task.due_date && (
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.due_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </div>
                )}
                {task.requirement_met && (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                )}
            </div>
        </div>
    );
}

// Column Component
function BoardColumn({ stage, tasks }: { stage: any, tasks: any[] }) {
    const { setNodeRef } = useSortable({
        id: stage.id,
        data: {
            type: 'Column',
            stage,
        },
    });

    return (
        <div ref={setNodeRef} className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 h-full min-w-[280px]">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{stage.name}</h3>
                <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-md border-muted-foreground/20 py-8 min-h-[100px]">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir Tarea
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BoardView({ initialStages }: { initialStages: any[] }) {
    const [stages, setStages] = useState(initialStages);
    const [activeTask, setActiveTask] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function findTask(id: string) {
        for (const stage of stages) {
            const task = stage.tasks?.find((t: any) => t.id === id);
            if (task) return task;
        }
        return null;
    }

    function findStage(id: string) {
        return stages.find(s => s.id === id);
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const task = findTask(active.id as string);
        if (task) setActiveTask(task);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const activeStage = stages.find(s => s.tasks?.some((t: any) => t.id === activeId));
        const overStage = stages.find(s => s.id === overId || s.tasks?.some((t: any) => t.id === overId));

        if (!activeStage || !overStage || activeStage === overStage) return;

        setStages((prev) => {
            const activeStageIndex = prev.findIndex(s => s.id === activeStage.id);
            const overStageIndex = prev.findIndex(s => s.id === overStage.id);

            // Clone state
            const newStages = [...prev];
            const newActiveStage = { ...newStages[activeStageIndex], tasks: [...newStages[activeStageIndex].tasks] };
            const newOverStage = { ...newStages[overStageIndex], tasks: [...newStages[overStageIndex].tasks] };

            // Find task index
            const taskIndex = newActiveStage.tasks.findIndex((t: any) => t.id === activeId);
            const [movedTask] = newActiveStage.tasks.splice(taskIndex, 1);

            // Add to new stage
            newOverStage.tasks.push(movedTask);

            newStages[activeStageIndex] = newActiveStage;
            newStages[overStageIndex] = newOverStage;

            return newStages;
        });
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find final stage
        const finalStage = stages.find(s => s.id === overId || s.tasks?.some((t: any) => t.id === overId));

        if (finalStage) {
            // Update database
            try {
                await updateTaskStage(activeId, finalStage.id);
            } catch (error) {
                console.error("Failed to update task stage:", error);
                // Revert state if needed (omitted for brevity, but recommended for production)
            }
        }
    }

    const params = useParams();
    const [isPending, startTransition] = useTransition();

    const handleSync = () => {
        if (!params.id) return;
        startTransition(async () => {
            try {
                await syncProjectWithSecop(params.id as string);
                // The page will revalidate automatically due to revalidatePath
            } catch (error) {
                console.error("Sync failed:", error);
                alert("Error al sincronizar con SECOP: " + (error as Error).message);
            }
        });
    };

    return (
        <div className="space-y-4 h-full">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isPending}
                    className="gap-2"
                >
                    <RefreshCcw className={cn("w-4 h-4", isPending && "animate-spin")} />
                    {isPending ? "Sincronizando..." : "Sincronizar con SECOP"}
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-4 gap-4 h-[calc(100%-40px)] overflow-x-auto pb-4">
                    {stages.map((stage) => (
                        <BoardColumn
                            key={stage.id}
                            stage={stage}
                            tasks={stage.tasks || []}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
