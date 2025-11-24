'use server'

import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function createProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user");
    }

    const fullName = formData.get("fullName") as string;
    const profileType = formData.get("profileType") as string; // e.g., 'individual', 'company'

    // 1. Create Profile in Supabase
    const { error } = await supabase
        .from("profiles")
        .insert({
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            // We could add a 'type' column to profiles if needed, or store it in metadata
            // type: profileType 
        });

    if (error) {
        console.error("Error creating profile:", error);
        return { error: error.message };
    }

    // 2. Send Welcome Email (Safe-fail)
    if (user.email && process.env.RESEND_API_KEY) {
        try {
            await sendWelcomeEmail(user.email, fullName);
        } catch (e) {
            console.warn("Failed to send welcome email, but profile was created.", e);
        }
    }

    // 3. Redirect to Dashboard
    redirect("/dashboard");
}
