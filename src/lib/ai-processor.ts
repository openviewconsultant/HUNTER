import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// Utility to ensure DOMMatrix is polyfilled before loading pdf-parse
function getPdfParser() {
    if (typeof DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix { };
    }
    return require('pdf-parse');
}

export interface AnalysisResult {
    summary: string;
    summaryType: 'ai' | 'excerpt';
    extractedData?: any;
}

export async function generateDocumentSummary(fileBase64: string | null, mimeType: string, category: string, storagePath?: string, dbId?: string): Promise<AnalysisResult> {
    try {
        let processingBase64 = fileBase64;

        // If we have a storage path, download the file from Supabase first
        if (storagePath && !processingBase64) {
            const supabase = await createClient();
            const { data, error } = await supabase.storage
                .from('company-documents')
                .download(storagePath);

            if (error || !data) {
                console.error("Error downloading from storage:", error);
                return { summary: "Error al recuperar el documento del almacenamiento.", summaryType: 'excerpt' };
            }

            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            processingBase64 = buffer.toString('base64');
        }

        if (!processingBase64) {
            return { summary: "No se pudo procesar el contenido del documento.", summaryType: 'excerpt' };
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // 1. Try Gemini 2.5 Flash Lite
        if (apiKey) {
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

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
                    // Try to parse JSON if applicable
                    let extractedData = null;
                    try {
                        const jsonStr = summary.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
                        if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
                            extractedData = JSON.parse(jsonStr);
                        }
                    } catch (e) {
                        // Ignore parse error
                    }

                    // Save summary and data to DB if dbId provided
                    if (dbId) {
                        const supabase = await createClient();
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: summary.trim() } })
                            .eq('id', dbId);

                        if (extractedData) {
                            await updateCompanyDataFromAnalysis(dbId, category, extractedData);
                        }
                    }

                    return {
                        summary: summary.trim(),
                        summaryType: 'ai',
                        extractedData
                    };
                }
            } catch (aiError) {
                console.error("AI Generation failed:", aiError);
            }
        }

        // 2. Fallback: Local Text Extraction
        if (mimeType === "application/pdf" && processingBase64) {
            try {
                const buffer = Buffer.from(processingBase64, 'base64');
                const pdf = getPdfParser();
                const data = await pdf(buffer);
                const textContent = data.text || "";

                if (textContent.trim().length > 10) {
                    const lines = textContent.split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 10);

                    const meaningfulText = lines.slice(0, 5).join(' ');
                    const cleanText = meaningfulText.replace(/\s+/g, ' ').trim();
                    const preview = cleanText.length > 150 ? cleanText.slice(0, 150) + '...' : cleanText;

                    if (dbId) {
                        const supabase = await createClient();
                        await supabase
                            .from('company_documents')
                            .update({ metadata: { summary: preview } })
                            .eq('id', dbId);
                    }

                    return { summary: preview, summaryType: 'excerpt' };
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

        return { summary: fallbackSummary, summaryType: 'excerpt' };

    } catch (error) {
        console.error("Critical error processing document:", error);
        return { summary: "Documento recibido correctamente.", summaryType: 'excerpt' };
    }
}

async function updateCompanyDataFromAnalysis(documentId: string, category: string, data: any) {
    try {
        const supabase = await createClient();

        const { data: docData } = await supabase
            .from('company_documents')
            .select('company_id')
            .eq('id', documentId)
            .single();

        if (docData?.company_id) {
            const updateData: any = {};

            if (category === 'legal' && data.unspsc_codes) {
                updateData.unspsc_codes = data.unspsc_codes;
            }
            if (category === 'financial' && data.financial_indicators) {
                updateData.financial_indicators = data.financial_indicators;
            }
            if (data.experience_summary) {
                updateData.experience_summary = data.experience_summary;
            }

            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('companies')
                    .update(updateData)
                    .eq('id', docData.company_id);
            }
        }
    } catch (error) {
        console.error("Error updating company data from analysis:", error);
    }
}

export async function extractTextFromDocument(bucket: string, storagePath: string, mimeType: string): Promise<string> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.storage
            .from(bucket)
            .download(storagePath);

        if (error || !data) {
            console.warn(`Could not download document from ${bucket}/${storagePath}:`, error);
            return "";
        }

        if (mimeType === 'application/pdf') {
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdf = getPdfParser();
            const pdfData = await pdf(buffer);
            return pdfData.text || "";
        } else {
            // Assume text-based
            return await data.text();
        }
    } catch (error) {
        console.error("Error extracting text:", error);
        return "";
    }
}

export async function generateCompanyAnalysisReport(company: any, contracts: any[], documentsText: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

    const prompt = `
    Actúa como un consultor experto en gerencia, licitaciones y análisis empresarial.
    Realiza un análisis técnico y gerencial exhaustivo de la siguiente empresa, basado en su información registrada y documentos cargados.

    INFORMACIÓN DE LA EMPRESA:
    - Nombre: ${company.company_name}
    - NIT: ${company.nit}
    - Representante Legal: ${company.legal_representative}
    - Sector: ${company.economic_sector}
    - Descripción: ${company.description || 'No disponible'}
    - Ciudad: ${company.city}

    INDICADORES FINANCIEROS:
    - Índice de Liquidez: ${company.financial_indicators?.liquidity_index || 'N/A'}
    - Nivel de Endeudamiento: ${company.financial_indicators?.indebtedness_index ? (company.financial_indicators.indebtedness_index * 100).toFixed(2) + '%' : 'N/A'}
    - Capital de Trabajo: ${company.financial_indicators?.working_capital || 'N/A'}
    - Patrimonio: ${company.financial_indicators?.equity || 'N/A'}

    EXPERIENCIA (CONTRATOS):
    ${contracts?.map((c: any) => `- Objeto: ${c.description || 'N/A'}, Cliente: ${c.client_name}, Valor: $${c.contract_value}, Fecha: ${c.execution_date}`).join('\n') || 'No hay contratos registrados.'}

    CONTENIDO DE LOS DOCUMENTOS CARGADOS:
    ${documentsText}

    Genera un INFORME TÉCNICO Y GERENCIAL con la siguiente estructura (usa formato Markdown):

    # Informe de Análisis Empresarial: ${company.company_name}

    ## 1. Resumen Ejecutivo
    Visión general del estado actual de la empresa, sus fortalezas clave y su posición en el mercado.

    ## 2. Análisis Financiero
    Evaluación de la salud financiera basada en los indicadores. Interpreta qué significan los números (liquidez, endeudamiento, etc.) para la operatividad de la empresa.

    ## 3. Capacidad Técnica y Experiencia
    Análisis de la experiencia demostrada a través de los contratos. Identifica áreas de especialización y magnitud de proyectos manejados.

    ## 4. Análisis de Documentación
    Evaluación de la calidad y completitud de la documentación legal, financiera y técnica aportada.

    ## 5. Recomendaciones Estratégicas
    Sugerencias concretas para mejorar el perfil de la empresa ante posibles licitaciones o clientes.

    ## 6. Conclusión
    Veredicto final sobre la capacidad de contratación y solidez de la empresa.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
