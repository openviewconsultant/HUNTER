import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-3xl mb-4">
                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-foreground">
                                {profile?.full_name || "Usuario"}
                            </h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>

                        <div className="pt-6 border-t border-border space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">
                                    Miembro desde {new Date(user.created_at || "").toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground capitalize">{profile?.role || "user"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 rounded-2xl card-gradient shadow-glow">
                        <h3 className="text-lg font-bold text-foreground mb-6">Información Personal</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    defaultValue={profile?.full_name || ""}
                                    className="w-full h-10 px-4 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="Tu nombre completo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={user.email || ""}
                                    disabled
                                    className="w-full h-10 px-4 rounded-lg bg-muted border border-border text-sm text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    El correo electrónico no se puede cambiar
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 rounded-2xl card-gradient shadow-glow">
                        <h3 className="text-lg font-bold text-foreground mb-6">Acciones</h3>
                        <div className="space-y-3">
                            <button className="w-full h-10 px-6 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-colors">
                                Guardar Cambios
                            </button>
                            <button className="w-full h-10 px-6 rounded-lg border border-border text-foreground hover:bg-accent transition-colors">
                                Cambiar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
