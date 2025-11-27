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
    const companyData: any = {
        profile_id: profile.id,
        updated_at: new Date().toISOString(),
    };

    // Only add fields if they are present in formData to allow partial updates
    const fields = [
        "company_name", "nit", "legal_representative", "economic_sector",
        "phone", "address", "city", "department", "country"
    ];

    fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null) {
            companyData[field] = value;
        }
    });

    // Handle JSON fields
    if (formData.get("unspsc_codes")) {
        companyData.unspsc_codes = JSON.parse(formData.get("unspsc_codes") as string);
    }
    if (formData.get("financial_indicators")) {
        companyData.financial_indicators = JSON.parse(formData.get("financial_indicators") as string);
    }
    if (formData.get("experience_summary")) {
        companyData.experience_summary = JSON.parse(formData.get("experience_summary") as string);
    }

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

export async function saveFinancials(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No authenticated user");

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const financialData: any = {
        updated_at: new Date().toISOString(),
    };

    if (formData.get("financial_indicators")) {
        financialData.financial_indicators = JSON.parse(formData.get("financial_indicators") as string);
    }

    // Also allow saving UNSPSC codes here if needed
    if (formData.get("unspsc_codes")) {
        financialData.unspsc_codes = JSON.parse(formData.get("unspsc_codes") as string);
    }

    // NOTE: experience_summary is now auto-calculated by database triggers
    // based on company_contracts table, so we no longer accept manual input


    const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    if (existingCompany) {
        const { error } = await supabase
            .from("companies")
            .update(financialData)
            .eq("id", existingCompany.id);

        if (error) throw new Error(error.message);
    } else {
        // Company profile must exist with basic info before saving financial data
        throw new Error("Debes completar primero la información básica de tu empresa (Nombre, NIT, Representante Legal) antes de guardar los indicadores financieros.");
    }

    revalidatePath("/dashboard/company");
}

// ==================== CONTRACT MANAGEMENT ====================

export async function saveContract(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("No authenticated user");

    // Get user's profile and company
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) throw new Error("Profile not found");

    const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

    if (!company) {
        throw new Error("Empresa no encontrada. Por favor completa primero la información de tu empresa.");
    }

    const contractId = formData.get("contract_id") as string | null;
    const contractData: any = {
        company_id: company.id,
        contract_number: formData.get("contract_number"),
        client_name: formData.get("client_name"),
        contract_value: parseFloat(formData.get("contract_value") as string),
        contract_value_smmlv: parseFloat(formData.get("contract_value_smmlv") as string) || null,
        execution_date: formData.get("execution_date") || null,
        description: formData.get("description") || null,
        updated_at: new Date().toISOString(),
    };

    // Parse UNSPSC codes if provided
    const unspscCodesStr = formData.get("unspsc_codes") as string;
    if (unspscCodesStr) {
        contractData.unspsc_codes = unspscCodesStr
            .split(',')
            .map(code => code.trim())
            .filter(code => code);
    }

    // Handle document upload if file is present
    const file = formData.get("document") as File | null;
    if (file && file.size > 0) {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/contracts/${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase
            .storage
            .from('company-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Error al subir documento: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('company-documents')
            .getPublicUrl(filePath);

        contractData.document_url = publicUrl;
        contractData.document_name = file.name;
    }

    // Update or insert contract
    if (contractId) {
        // Update existing contract
        const { error } = await supabase
            .from("company_contracts")
            .update(contractData)
            .eq("id", contractId);

        if (error) throw new Error(error.message);
    } else {
        // Insert new contract
        const { error } = await supabase
            .from("company_contracts")
            .insert(contractData);

        if (error) throw new Error(error.message);
    }

    revalidatePath("/dashboard/company");
    return { success: true };
}

export async function listCompanyContracts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return [];

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) return [];

    // Fetch all contracts for this company
    const { data: contracts, error } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('company_id', company.id)
        .order('execution_date', { ascending: false });

    if (error) {
        console.error("Error fetching contracts:", error);
        return [];
    }

    return contracts || [];
}

export async function deleteContract(contractId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    // Get contract info to find document URL
    const { data: contract, error: fetchError } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

    if (fetchError || !contract) {
        throw new Error("Contrato no encontrado");
    }

    // Delete document from storage if it exists
    if (contract.document_url) {
        const urlParts = contract.document_url.split('/company-documents/');
        if (urlParts.length === 2) {
            const storagePath = urlParts[1];
            await supabase
                .storage
                .from('company-documents')
                .remove([storagePath]);
        }
    }

    // Delete contract from database
    const { error: deleteError } = await supabase
        .from('company_contracts')
        .delete()
        .eq('id', contractId);

    if (deleteError) {
        throw new Error(`Error al eliminar contrato: ${deleteError.message}`);
    }

    revalidatePath("/dashboard/company");
    return { success: true };
}

// ==================== END CONTRACT MANAGEMENT ====================


import { GoogleGenerativeAI } from "@google/generative-ai";

// Polyfill DOMMatrix for pdf-parse dependency
if (typeof DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}
const pdf = require('pdf-parse');

export async function generateDocumentSummary(fileBase64: string | null, mimeType: string, category: string, storagePath?: string, dbId?: string) {
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
                return { summary: "Error al recuperar el documento del almacenamiento.", summaryType: 'excerpt' };
            }

            // Convert Blob/File to Buffer then Base64
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            processingBase64 = buffer.toString('base64');
        }

        if (!processingBase64) {
            return { summary: "No se pudo procesar el contenido del documento.", summaryType: 'excerpt' };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        console.log("DEBUG: API Key present?", !!apiKey);

        // 1. Try Gemini 2.5 Flash Lite (Native PDF/Image Support) - Best option
        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

                let prompt = "";
                switch (category) {
                    case 'legal':
                        prompt = `Analiza este documento legal (posiblemente RUP o Cámara de Comercio). 
                        1. Genera un breve resumen de texto de máximo 40 palabras.
                        2. Extrae los CÓDIGOS UNSPSC (Clasificador de Bienes y Servicios) si están presentes.
                        3. Extrae información de experiencia si está presente (número de contratos, valor total).
                        
                        Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
                        {
                          "summary": "Texto del resumen...",
                          "unspsc_codes": ["Código1", "Código2"],
                          "experience_summary": { "total_contracts": 0, "total_value_smmlv": 0 }
                        }
                        Si no encuentras datos específicos, deja los arrays/objetos vacíos.`;
                        break;
                    case 'financial':
                        prompt = `Analiza este documento financiero (Estados Financieros, Declaración de Renta).
                        1. Genera un breve resumen de texto de máximo 40 palabras.
                        2. Extrae indicadores financieros clave: Liquidez, Endeudamiento, Capital de Trabajo, Patrimonio.
                        
                        Responde EXCLUSIVAMENTE en formato JSON con esta estructura:
                        {
                          "summary": "Texto del resumen...",
                          "financial_indicators": {
                            "liquidity_index": 0,
                            "indebtedness_index": 0,
                            "working_capital": 0,
                            "equity": 0
                          }
                        }
                        Si no encuentras datos específicos, pon null o 0.`;
                        break;
                    case 'technical':
                        prompt = "Analiza este documento técnico y genera un resumen ejecutivo en español de máximo 40 palabras. Destaca la experiencia o capacidad técnica descrita. Devuelve solo el texto del resumen.";
                        break;
                    default:
                        prompt = "Resume este documento en español en máximo 40 palabras, destacando la información más relevante. Devuelve solo el texto del resumen.";
                }

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

                    // Save summary to database metadata if dbId is provided
                    if (dbId) {
                        const supabase = await createClient();

                        // Save summary to document metadata
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: summary.trim() } })
                            .eq('id', dbId);

                        // NEW: Try to parse JSON and update company profile if applicable
                        try {
                            // Clean markdown code blocks if present
                            const jsonStr = summary.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
                            if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
                                const extractedData = JSON.parse(jsonStr);
                                console.log("📊 Structured data extracted:", extractedData);

                                // Get company_id from document
                                const { data: docData } = await supabase
                                    .from('company_documents')
                                    .select('company_id')
                                    .eq('id', dbId)
                                    .single();

                                if (docData?.company_id) {
                                    const updateData: any = {};

                                    if (category === 'legal' && extractedData.unspsc_codes) {
                                        updateData.unspsc_codes = extractedData.unspsc_codes;
                                    }
                                    if (category === 'financial' && extractedData.financial_indicators) {
                                        updateData.financial_indicators = extractedData.financial_indicators;
                                    }
                                    if (extractedData.experience_summary) {
                                        updateData.experience_summary = extractedData.experience_summary;
                                    }

                                    if (Object.keys(updateData).length > 0) {
                                        await supabase
                                            .from('companies')
                                            .update(updateData)
                                            .eq('id', docData.company_id);
                                        console.log("✅ Company profile updated with extracted data");
                                    }
                                }
                            }
                        } catch (e) {
                            console.log("ℹ️ Response was not JSON or could not be parsed (expected for general summaries)");
                        }
                    }

                    return { summary: summary.trim(), summaryType: 'ai' };
                }
            } catch (aiError) {
                console.error("⚠️ AI Generation failed:", aiError);
            }
        } else {
            console.warn("⚠️ GEMINI_API_KEY not configured");
        }

        // 2. Fallback: Local Text Extraction (if AI fails or no key)
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

                    // Save fallback summary to database metadata
                    if (dbId) {
                        const supabase = await createClient();
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: preview } })
                            .eq('id', dbId);
                    }

                    return {
                        summary: preview,
                        summaryType: 'excerpt'
                    };
                }
            } catch (pdfError) {
                console.error("Error extracting PDF text locally:", pdfError);
            }
        }

        // 3. Final Fallback
        const fallbackSummary = "Documento recibido. El contenido será analizado por nuestro equipo.";

        if (dbId) {
            const supabase = await createClient();
            await supabase
                .from('company_documents')
                .update({ metadata: { summary: fallbackSummary } })
                .eq('id', dbId);
        }

        return {
            summary: fallbackSummary,
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

    // 2. Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        throw new Error("Perfil no encontrado");
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) {
        throw new Error("Empresa no encontrada. Por favor completa primero la información de tu empresa.");
    }

    // 3. Define path: user_id/category/filename
    // Sanitize filename to avoid issues
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${category}/${Date.now()}_${sanitizedName}`;

    // 4. Upload to Supabase Storage
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

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase
        .storage
        .from('company-documents')
        .getPublicUrl(filePath);

    // 6. Save metadata to database using correct schema
    const { data: dbRecord, error: dbError } = await supabase
        .from('company_documents')
        .insert({
            company_id: company.id,
            document_type: category, // 'legal', 'financial', 'technical'
            document_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: profile.id,
            metadata: {} // Will be updated with summary after AI generation
        })
        .select()
        .single();

    if (dbError) {
        console.error("Error saving to database:", dbError);
        throw new Error(`Error al guardar en base de datos: ${dbError.message}`);
    }

    return {
        success: true,
        url: publicUrl,
        path: filePath,
        name: file.name,
        size: file.size,
        dbId: dbRecord?.id // Return DB ID for later summary update
    };
}

export async function listCompanyDocuments() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { legal: [], financial: [], technical: [] };

    // Get user's profile and company
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        console.warn("No profile found for user");
        return { legal: [], financial: [], technical: [] };
    }

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

    if (!company) {
        console.warn("No company found for profile");
        return { legal: [], financial: [], technical: [] };
    }

    // Query database for company's documents using correct schema
    const { data: documents, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', company.id)
        .order('uploaded_at', { ascending: false });

    if (error) {
        console.error("Error fetching documents:", error);
        return { legal: [], financial: [], technical: [] };
    }

    // Group by category
    const results: Record<string, any[]> = { legal: [], financial: [], technical: [] };

    if (documents) {
        documents.forEach(doc => {
            // Use file_url directly from the database (it's already the public URL)
            results[doc.document_type]?.push({
                id: doc.id,
                name: doc.document_name,
                size: doc.file_size,
                uploadDate: new Date(doc.uploaded_at),
                status: 'completed',
                progress: 100,
                url: doc.file_url,
                summary: doc.metadata?.summary || "Procesando..."
            });
        });
    }

    return results;
}

export async function deleteCompanyDocument(documentId: string) {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Usuario no autenticado");
    }

    // 2. Get document info to find storage path
    const { data: document, error: fetchError } = await supabase
        .from('company_documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (fetchError || !document) {
        throw new Error("Documento no encontrado");
    }

    // 3. Delete from Storage
    // Extract path from URL or use stored path if we had it. 
    // Since we store publicUrl, we need to extract the path relative to bucket
    // URL format: .../storage/v1/object/public/company-documents/user_id/category/filename
    const urlParts = document.file_url.split('/company-documents/');
    if (urlParts.length === 2) {
        const storagePath = urlParts[1];
        const { error: storageError } = await supabase
            .storage
            .from('company-documents')
            .remove([storagePath]);

        if (storageError) {
            console.error("Error deleting from storage:", storageError);
            // Continue to delete from DB even if storage delete fails
        }
    }

    // 4. Delete from Database
    const { error: deleteError } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', documentId);

    if (deleteError) {
        throw new Error(`Error al eliminar de base de datos: ${deleteError.message}`);
    }

    return { success: true };
}
