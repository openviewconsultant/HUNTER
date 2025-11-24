import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Plus, User } from "lucide-react";
import Link from "next/link";

export default async function SelectProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id);

    return (
        <AuthLayout
            title="Selecciona un Perfil"
            subtitle="Elige con qué perfil deseas ingresar a HUNTER."
        >
            <div className="space-y-4">
                {profiles?.map((profile) => (
                    <form key={profile.id} action={async () => {
                        "use server";
                        // Here we would set a cookie or session variable for the selected profile
                        // For now, just redirect to dashboard
                        redirect("/dashboard");
                    }}>
                        <button
                            type="submit"
                            className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 hover:bg-zinc-900 transition-all group flex items-center gap-4 text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-white group-hover:text-primary transition-colors">
                                    {profile.full_name || profile.email}
                                </h3>
                                <p className="text-xs text-zinc-500">{profile.email}</p>
                            </div>
                        </button>
                    </form>
                ))}

                <button
                    type="button"
                    className="w-full p-4 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/30 transition-all flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300"
                >
                    <Plus className="w-4 h-4" />
                    <span>Crear Nuevo Perfil</span>
                </button>
            </div>
        </AuthLayout>
    );
}
