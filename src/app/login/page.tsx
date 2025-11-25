"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Github, Mail, Briefcase, Target } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { InputModern } from "@/components/ui/input-modern";
import { login, devLogin } from "./actions";
import { isDevMode } from "@/lib/auth/dev-users";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);

        const res = await login(formData);
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
                redirectTo: `${location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent select_account',
                },
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleDevLogin = async (role: "company" | "hunter") => {
        setIsLoading(true);
        setError(null);
        const res = await devLogin(role);
        if (res?.error) {
            setError(res.error);
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Sign in"
            subtitle=""
        >
            <div className="space-y-8">
                {/* Development Quick Login - Only visible in dev mode */}
                {isDevMode() && (
                    <div className="space-y-4 pb-4 border-b border-zinc-800/50">
                        <div className="text-center">
                            <span className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                🚀 Development Mode
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleDevLogin("company")}
                                disabled={isLoading}
                                type="button"
                                className="group relative overflow-hidden px-6 py-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/60 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex flex-col items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-primary" />
                                    <span className="text-sm font-semibold text-white">Company</span>
                                    <span className="text-xs text-zinc-400">Quick Login</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleDevLogin("hunter")}
                                disabled={isLoading}
                                type="button"
                                className="group relative overflow-hidden px-6 py-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 hover:border-cyan-500/60 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex flex-col items-center gap-2">
                                    <Target className="w-6 h-6 text-cyan-400" />
                                    <span className="text-sm font-semibold text-white">Hunter</span>
                                    <span className="text-xs text-zinc-400">Quick Login</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Social Login Icons - Redis Style */}
                <div className="flex justify-center gap-8">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex flex-col items-center gap-2 cursor-pointer group bg-transparent border-none p-0 hover:bg-transparent"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-all group-hover:scale-105 shadow-lg">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.373-1.147 8.587-3.493 2.293-2.293 3.2-5.12 3.2-7.573 0-.72-.067-1.413-.187-2.013h-11.6z" />
                            </svg>
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-white font-medium">Google</span>
                    </button>

                    <button
                        type="button"
                        className="flex flex-col items-center gap-2 cursor-pointer group bg-transparent border-none p-0 hover:bg-transparent"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-all group-hover:scale-105 shadow-lg">
                            <Github className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-white font-medium">GitHub</span>
                    </button>

                    <button
                        type="button"
                        className="flex flex-col items-center gap-2 cursor-pointer group bg-transparent border-none p-0 hover:bg-transparent"
                    >
                        <div className="w-12 h-12 rounded-full bg-[#1b263b] flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-all group-hover:scale-105 shadow-lg">
                            <Loader2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs text-zinc-400 group-hover:text-white font-medium">SSO</span>
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0d1b2a] px-4 text-zinc-500 font-medium tracking-wider">Or</span>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Email:</label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="w-full h-11 px-4 rounded-lg bg-[#1b263b]/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <p className="text-[10px] text-zinc-500 ml-1">Using SSO? Just enter your email, no password required.</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Password:</label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="w-full h-11 px-4 rounded-lg bg-[#1b263b]/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Link
                            href="/forgot-password"
                            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                            Forgot Password?
                        </Link>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 h-10 rounded-lg bg-[#1b263b] border border-zinc-700 text-white font-medium hover:bg-primary hover:text-black hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Login"
                            )}
                        </button>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="pt-8 text-center">
                        <p className="text-xs text-zinc-500 mb-4">
                            Don't have an account yet?{" "}
                            <Link href="/register" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </p>

                        <p className="text-[10px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
                            By signing up, you acknowledge that you agree to our{" "}
                            <Link href="/terms" className="underline hover:text-zinc-400">Cloud Terms of Service</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</Link>.
                        </p>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
