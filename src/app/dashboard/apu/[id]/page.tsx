import { getApuBudgetDetails } from "../actions";
import { ApuEditor } from "./apu-editor";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ApuDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const budget = await getApuBudgetDetails(id);

    if (!budget) {
        notFound();
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link
                        href="/dashboard/apu"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Presupuestos
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>Misión asociada</span>
                    </div>
                </div>
            </div>

            <ApuEditor initialBudget={budget} />
        </div>
    );
}
