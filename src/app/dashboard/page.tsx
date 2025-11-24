import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
                <p className="text-zinc-400">Bienvenido de nuevo, {user?.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
                    <h3 className="text-lg font-medium text-zinc-400 mb-2">Licitaciones Activas</h3>
                    <p className="text-4xl font-bold text-white">0</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
                    <h3 className="text-lg font-medium text-zinc-400 mb-2">Alertas Nuevas</h3>
                    <p className="text-4xl font-bold text-primary">0</p>
                </div>
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
                    <h3 className="text-lg font-medium text-zinc-400 mb-2">Documentos</h3>
                    <p className="text-4xl font-bold text-white">0</p>
                </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <h2 className="text-xl font-bold text-white mb-4">Completa tu Perfil de Empresa</h2>
                <p className="text-zinc-400 mb-6 max-w-2xl">
                    Para que HUNTER pueda encontrar las mejores licitaciones para ti, necesitamos conocer más sobre tu empresa. Sube tus documentos legales y financieros.
                </p>
                <a
                    href="/dashboard/company"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-colors"
                >
                    Ir al Perfil de Empresa
                </a>
            </div>
        </div>
    );
}
