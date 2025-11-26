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

// Polyfill DOMMatrix for pdf-parse dependency
if (typeof DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}
const pdf = require('pdf-parse');

export async function generateDocumentSummary(fileBase64: string | null, mimeType: string, category: string, storagePath?: string) {
    try {
        let processingBase64 = fileBase64;

        // If we have a storage path, download the file from Supabase first
        // This avoids sending large base64 strings from client to server
        if (storagePath && !processingBase64) {
            const supabase = await createClient();
            const { data, error } = await supabase.storage
                .from('company-documents')
                .download(storagePath);

            if (error || !data) {
                console.error("Error downloading from storage:", error);
                return { summary: "Error al recuperar el documento del almacenamiento." };
            }

            // Convert Blob/File to Buffer then Base64
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            processingBase64 = buffer.toString('base64');
        }

        if (!processingBase64) {
            return { summary: "No se pudo procesar el contenido del documento." };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        console.log("DEBUG: API Key present?", !!apiKey);

        // 1. Try Gemini 1.5 Flash (Native PDF/Image Support) - Best option
        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                // Use Gemini 2.5 Flash Lite which is available for this key
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

                let prompt = "";
                switch (category) {
                    case 'legal':
                        prompt = "Analiza este documento legal y genera un resumen ejecutivo en español de máximo 40 palabras. Identifica el tipo de documento y su validez.";
                        break;
                    case 'financial':
                        prompt = "Analiza este documento financiero y genera un resumen ejecutivo en español de máximo 40 palabras. Extrae las cifras más relevantes si existen.";
                        break;
                    case 'technical':
                        prompt = "Analiza este documento técnico y genera un resumen ejecutivo en español de máximo 40 palabras. Destaca la experiencia o capacidad técnica descrita.";
                        break;
                    default:
                        prompt = "Resume este documento en español en máximo 40 palabras, destacando la información más relevante.";
                }

                // Send the file directly to Gemini
                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: processingBase64,
                            mimeType: mimeType
                        }
                    }
                ]);

                const response = await result.response;
                const summary = response.text();

                if (summary && summary.trim().length > 0) {
                    console.log("✅ AI Summary generated successfully with Gemini 2.5 Flash Lite");
                    return { summary: summary.trim(), summaryType: 'ai' };
                }
            } catch (aiError) {
                console.error("⚠️ AI Generation failed:", aiError);
            }
        } else {
            console.warn("⚠️ GEMINI_API_KEY not configured");
        }

        // 2. Fallback: Local Text Extraction (if AI fails or no key)
        // Only for PDFs as we can't easily extract text from images locally
        if (mimeType === "application/pdf" && processingBase64) {
            try {
                const buffer = Buffer.from(processingBase64, 'base64');
                const data = await pdf(buffer);
                const textContent = data.text || "";

                if (textContent.trim().length > 10) {
                    const lines = textContent.split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 10);

                    const meaningfulText = lines.slice(0, 5).join(' ');
                    const cleanText = meaningfulText.replace(/\s+/g, ' ').trim();

                    const preview = cleanText.length > 150
                        ? cleanText.slice(0, 150) + '...'
                        : cleanText;

                    return {
                        summary: preview,
                        summaryType: 'excerpt'
                    };
                }
            } catch (pdfError) {
                console.error("Error extracting PDF text locally:", pdfError);
            }
        }

        // 3. Final Fallback if everything fails
        return {
            summary: "Documento recibido. El contenido será analizado por nuestro equipo.",
            summaryType: 'excerpt'
        };

    } catch (error) {
        console.error("❌ Critical error processing document:", error);
        return {
            summary: "Documento recibido correctamente.",
            summaryType: 'excerpt'
        };
    }
}

export async function uploadCompanyDocument(formData: FormData) {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
        throw new Error("Faltan datos requeridos (archivo o categoría)");
    }

    // 2. Define path: user_id/category/filename
    // Sanitize filename to avoid issues
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${category}/${Date.now()}_${sanitizedName}`;

    // 3. Upload to Supabase Storage
    const { data, error } = await supabase
        .storage
        .from('company-documents')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Error uploading to storage:", error);
        throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('company-documents')
        .getPublicUrl(filePath);

    return {
        success: true,
        url: publicUrl,
        path: filePath,
        name: file.name,
        size: file.size
    };
}

export async function listCompanyDocuments() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { legal: [], financial: [], technical: [] };

    // List all files in the bucket for this user
    // Since our structure is userId/category/filename, we can list recursively or by folder
    // But list() is not recursive by default. We need to list for each category.

    const categories = ['legal', 'financial', 'technical'];
    const results: Record<string, any[]> = { legal: [], financial: [], technical: [] };

    for (const category of categories) {
        const { data, error } = await supabase
            .storage
            .from('company-documents')
            .list(`${user.id}/${category}`);

        if (data) {
            results[category] = data.map(file => {
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('company-documents')
                    .getPublicUrl(`${user.id}/${category}/${file.name}`);

                return {
                    id: file.id,
                    name: file.name.split('_').slice(1).join('_'), // Remove timestamp prefix
                    size: file.metadata?.size || 0,
                    uploadDate: new Date(file.created_at),
                    status: 'completed',
                    progress: 100,
                    url: publicUrl,
                    summary: "Documento cargado previamente." // Placeholder as we don't store summary in storage metadata yet
                };
            });
        }
    }

    return results;
}
