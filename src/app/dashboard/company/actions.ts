'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveCompanyInfo(formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No authenticated user");
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        throw new Error("Profile not found");
    }

    // Prepare company data
    const companyData = {
        profile_id: profile.id,
        company_name: formData.get("company_name") as string,
        nit: formData.get("nit") as string,
        legal_representative: formData.get("legal_representative") as string,
        economic_sector: formData.get("economic_sector") as string,
        phone: formData.get("phone") as string || null,
        address: formData.get("address") as string || null,
        city: formData.get("city") as string || null,
        department: formData.get("department") as string || null,
        country: formData.get("country") as string || "Colombia",
        updated_at: new Date().toISOString(),
    };

    // Check if company already exists for this profile
    const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    let error;

    if (existingCompany) {
        // Update existing company
        const result = await supabase
            .from("companies")
            .update(companyData)
            .eq("id", existingCompany.id);
        error = result.error;
    } else {
        // Create new company
        const result = await supabase
            .from("companies")
            .insert(companyData);
        error = result.error;
    }

    if (error) {
        console.error("Error saving company:", error);
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/company");
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateDocumentSummary(fileBase64: string, mimeType: string, category: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set");
            return { error: "Configuración de IA no encontrada." };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-pro-vision",
            generationConfig: {
                maxOutputTokens: 100, // Limit response length for speed
                temperature: 0.3, // Lower temperature for faster, more focused responses
            }
        });

        // Simplified prompts for faster processing
        let prompt = "";
        switch (category) {
            case 'legal':
                prompt = "Resume en 30 palabras: tipo de documento, validez y fechas clave.";
                break;
            case 'financial':
                prompt = "Resume en 30 palabras: cifras principales y situación financiera.";
                break;
            case 'technical':
                prompt = "Resume en 30 palabras: experiencia técnica y certificaciones.";
                break;
            default:
                prompt = "Resume este documento en 30 palabras.";
        }

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBase64,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        return { summary: text };
    } catch (error) {
        console.error("Error generating summary:", error);
        return { error: "No se pudo analizar el documento." };
    }
}
