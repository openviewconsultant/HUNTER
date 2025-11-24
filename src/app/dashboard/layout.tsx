import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
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

    // Get user's full name from profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .limit(1)
        .single();

    return (
        <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                {/* Professional gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 dark:from-[#0a1628] dark:via-[#0d1b2a] dark:to-[#1b263b]" />

                {/* Subtle accent circles */}
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <Sidebar userEmail={user.email} userName={profile?.full_name} />

            <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300">
                <Navbar userName={profile?.full_name} userEmail={user.email} />
                <main className="flex-1 pt-16">
                    <div className="container mx-auto p-4 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
