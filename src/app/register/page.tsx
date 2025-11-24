"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Github, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { InputModern } from "@/components/ui/input-modern";
import { signup } from "../login/actions";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const res = await signup(formData);
        if (res?.error) {
            setError(res.error);
            setIsLoading(false);
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Crear Cuenta"
            subtitle="Únete a HUNTER y empieza a ganar licitaciones hoy."
        >
            <form action={handleSubmit} className="space-y-6">
                <InputModern
                    name="fullName"
                    type="text"
                    label="Nombre Completo"
                    required
                    autoComplete="name"
                />

                <InputModern
                    name="email"
                    type="email"
                    label="Correo Electrónico"
                    required
                    autoComplete="email"
                />

                <InputModern
                    name="password"
                    type="password"
                    label="Contraseña"
                    required
                    autoComplete="new-password"
                />

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Crear Cuenta"
                    )}
                </button>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-black px-2 text-zinc-500">O regístrate con</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-zinc-300 text-sm"
                    >
                        <Github className="w-4 h-4" /> Github
                    </button>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 h-10 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-zinc-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Mail className="w-4 h-4" /> Google
                    </button>
                </div>

                <p className="text-center text-sm text-zinc-500 mt-8">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Inicia Sesión
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
