import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-black text-white flex relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />

                {/* Large radial gradients for glow effect - more visible */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse"
                    style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[120px] animate-pulse"
                    style={{ animationDuration: '12s', animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />

                {/* Grid pattern - more visible */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px'
                    }}
                />

                {/* Noise texture for depth */}
                <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />
            </div>

            <Sidebar userEmail={user.email} />
            <main className="flex-1 lg:pl-64 min-h-screen transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 pt-20 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
