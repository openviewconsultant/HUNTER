import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Plus, User } from "lucide-react";
import Link from "next/link";
import { CreateProfileForm } from "./create-profile-form";

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
            title={profiles?.length ? "Selecciona un Perfil" : "Crea tu Perfil"}
            subtitle={profiles?.length ? "Elige con qué perfil deseas ingresar a HUNTER." : "Configura tu cuenta para comenzar."}
        >
            <div className="space-y-4">
                {profiles && profiles.length > 0 ? (
                    <>
                        {profiles.map((profile) => (
                            <form key={profile.id} action={async () => {
                                "use server";
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

                        <div className="pt-4 border-t border-zinc-800/50">
                            <CreateProfileForm />
                        </div>
                    </>
                ) : (
                    <CreateProfileForm isFirstProfile={true} />
                )}
            </div>
        </AuthLayout>
    );
}
