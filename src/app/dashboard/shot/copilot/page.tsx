import { getProjects } from "@/app/dashboard/missions/actions";
import { CopilotClient } from "./copilot-client";
import { createClient } from "@/lib/supabase/server";

export default async function CopilotPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Data handling
    const missions = await getProjects();

    // Get company info
    let company = null;
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profile) {
            const { data: companyData } = await supabase
                .from('companies')
                .select('*')
                .eq('profile_id', profile.id)
                .single();
            company = companyData;
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="px-6 pt-6">
                <h1 className="text-3xl font-bold tracking-tight">Asistente de Licitación (Copilot)</h1>
                <p className="text-muted-foreground">
                    Tu experto en IA para redacción de propuestas, análisis de pliegos y generación de documentos.
                </p>
            </div>

            <CopilotClient missions={missions} company={company} />
        </div>
    );
}
