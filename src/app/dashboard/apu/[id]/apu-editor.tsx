"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Hammer,
    HardHat,
    Package,
    Truck,
    Calculator,
    Save,
    MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addApuItem, addApuResource } from "../actions";
import { toast } from "sonner";

interface ApuResource {
    id: string;
    type: 'material' | 'labor' | 'equipment';
    description: string;
    unit: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
}

interface ApuItem {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    apu_resources?: ApuResource[];
}

export function ApuEditor({ initialBudget }: { initialBudget: any }) {
    const [budget, setBudget] = useState(initialBudget);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const [newItem, setNewItem] = useState({ description: "", unit: "m2", quantity: 1 });

    const toggleExpand = (itemId: string) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.description.trim()) return;

        startTransition(async () => {
            try {
                const item = await addApuItem(budget.id, newItem);
                setBudget((prev: any) => ({
                    ...prev,
                    apu_items: [...(prev.apu_items || []), { ...item, apu_resources: [] }]
                }));
                setNewItem({ description: "", unit: "m2", quantity: 1 });
                setExpandedItems(prev => [...prev, item.id]);
                toast.success("Partida agregada");
            } catch (error) {
                toast.error("Error al agregar partida");
            }
        });
    };

    const handleAddResource = async (itemId: string, type: 'material' | 'labor' | 'equipment') => {
        const description = prompt(`Nombre del ${type === 'material' ? 'material' : type === 'labor' ? 'trabajador/cuadrilla' : 'equipo'}:`);
        if (!description) return;

        const unit = prompt("Unidad (ej: hr, m3, und):", "und");
        const quantity = parseFloat(prompt("Cantidad:", "1") || "0");
        const unitCost = parseFloat(prompt("Costo Unitario:", "0") || "0");

        if (isNaN(quantity) || isNaN(unitCost)) return;

        startTransition(async () => {
            try {
                const resource = await addApuResource(itemId, { type, description, unit, quantity, unit_cost: unitCost });

                setBudget((prev: any) => {
                    const newItems = prev.apu_items.map((item: any) => {
                        if (item.id === itemId) {
                            const updatedResources = [...(item.apu_resources || []), resource];
                            const newUnitPrice = updatedResources.reduce((sum, r) => sum + r.total_cost, 0);
                            return {
                                ...item,
                                apu_resources: updatedResources,
                                unit_price: newUnitPrice,
                                total_price: newUnitPrice * item.quantity
                            };
                        }
                        return item;
                    });

                    const newTotalCost = newItems.reduce((sum: number, i: any) => sum + i.total_price, 0);
                    return { ...prev, apu_items: newItems, total_cost: newTotalCost };
                });

                toast.success("Recurso agregado");
            } catch (error) {
                toast.error("Error al agregar recurso");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Budget Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Costo Directo Total</p>
                                <p className="text-3xl font-bold text-primary">{formatCurrency(budget.total_cost)}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Calculator className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-6">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Partidas</p>
                        <p className="text-3xl font-bold">{budget.apu_items?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-6">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estado</p>
                        <Badge className="mt-1">Borrador</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Item Editor */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Partidas del Presupuesto</CardTitle>
                        <CardDescription>Agrega y desglosa cada actividad de la obra.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add Item Form */}
                    <form onSubmit={handleAddItem} className="flex flex-wrap gap-3 p-4 bg-accent/30 rounded-xl border border-border/50">
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="itemDesc" className="sr-only">Descripción</Label>
                            <Input
                                id="itemDesc"
                                placeholder="Nueva actividad (ej: Excavación...)"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="w-24">
                            <Input
                                placeholder="Unidad"
                                value={newItem.unit}
                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                required
                            />
                        </div>
                        <div className="w-24">
                            <Input
                                type="number"
                                placeholder="Cant"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isPending || !newItem.description.trim()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Partida
                        </Button>
                    </form>

                    {/* Items List */}
                    <div className="space-y-4">
                        {(budget.apu_items || []).map((item: any, idx: number) => {
                            const isExpanded = expandedItems.includes(item.id);
                            return (
                                <div key={item.id} className="border rounded-xl overflow-hidden bg-card">
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors",
                                            isExpanded && "bg-accent/20 border-b"
                                        )}
                                        onClick={() => toggleExpand(item.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{item.description}</h4>
                                                <p className="text-xs text-muted-foreground uppercase">{item.quantity} {item.unit} x {formatCurrency(item.unit_price)} / {item.unit}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-foreground">{formatCurrency(item.total_price)}</p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 bg-zinc-950/20 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Materials Column */}
                                                <ResourceColumn
                                                    title="Materiales"
                                                    icon={<Package className="w-4 h-4" />}
                                                    resources={(item.apu_resources || []).filter((r: any) => r.type === 'material')}
                                                    onAdd={() => handleAddResource(item.id, 'material')}
                                                    formatCurrency={formatCurrency}
                                                />
                                                {/* Labor Column */}
                                                <ResourceColumn
                                                    title="Mano de Obra"
                                                    icon={<HardHat className="w-4 h-4" />}
                                                    resources={(item.apu_resources || []).filter((r: any) => r.type === 'labor')}
                                                    onAdd={() => handleAddResource(item.id, 'labor')}
                                                    formatCurrency={formatCurrency}
                                                />
                                                {/* Equipment Column */}
                                                <ResourceColumn
                                                    title="Equipos / Otros"
                                                    icon={<Truck className="w-4 h-4" />}
                                                    resources={(item.apu_resources || []).filter((r: any) => r.type === 'equipment')}
                                                    onAdd={() => handleAddResource(item.id, 'equipment')}
                                                    formatCurrency={formatCurrency}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ResourceColumn({ title, icon, resources, onAdd, formatCurrency }: any) {
    const total = resources.reduce((sum: number, r: any) => sum + r.total_cost, 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    {icon}
                    <span>{title}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd}>
                    <Plus className="w-3 h-3" />
                </Button>
            </div>

            <div className="space-y-2 min-h-[50px]">
                {resources.map((res: any) => (
                    <div key={res.id} className="text-[11px] p-2 rounded bg-white/5 flex flex-col gap-1 border border-white/5">
                        <div className="flex justify-between font-medium">
                            <span className="truncate">{res.description}</span>
                            <span>{formatCurrency(res.total_cost)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>{res.quantity} {res.unit} @ {formatCurrency(res.unit_cost)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-2 border-t border-dashed border-white/10 flex justify-between text-xs">
                <span className="text-zinc-500">Subtotal {title}</span>
                <span className="font-bold text-zinc-300">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}
