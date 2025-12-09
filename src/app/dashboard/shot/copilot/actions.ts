'use server'

import { AIEngine } from "@/lib/ai-engine";
import { searchSecopProcesses } from "@/lib/socrata";

export async function chatWithMissionCopilot(
    message: string,
    history: { role: 'user' | 'assistant', content: string }[],
    missionContext?: { name: string; description: string; tenderTitle?: string; entity?: string; processId?: string },
    companyContext?: any
) {
    try {
        const ai = AIEngine.getInstance();

        // Construct system prompt
        let systemPrompt = `Eres Hunter AI Copilot, un experto en licitaciones y contratación pública en Colombia (SECOP II).
Estás ayudando a un usuario ("Hunter") a gestionar y ganar procesos de licitación.

Reglas de Comportamiento:
1. Actúa como un consultor experto senior: profesional, estratégico y directo.
2. Basa tus recomendaciones en la Ley 80 de 1993, Ley 1150 de 2007 y decretos reglamentarios vigentes.
3. Si el usuario pide analizar pliegos o documentos y no tienes el texto, pide que te copien los fragmentos clave o indica qué secciones buscar.
4. Para "Redactar Observación", genera un texto formal dirigido a la entidad.
5. Para "Matriz de Cumplimiento", sugiere una tabla con los requisitos típicos (Jurídico, Financiero, Técnico).
6. Si te piden "formular pliegos" o "respuesta a pliegos" y tienes la información de la empresa, redacta una carta de presentación formal y estructurada.
`;

        if (missionContext) {
            systemPrompt += `
--------------------------------------------------
CONTEXTO DE LA MISIÓN ACTUAL:
Nombre del Proyecto: ${missionContext.name}
Descripción: ${missionContext.description}
${missionContext.tenderTitle ? `Licitación Asociada: ${missionContext.tenderTitle}` : ''}
${missionContext.entity ? `Entidad Contratante: ${missionContext.entity}` : ''}
`;

            // Fetch real-time details from SECOP if process ID is available
            if (missionContext.processId) {
                try {
                    // Search specifically for this process
                    const matches = await searchSecopProcesses(missionContext.processId);
                    const details = matches[0]; // Assume first match is correct as ID is specific

                    if (details) {
                        const url = typeof details.urlproceso === 'object' ? details.urlproceso.url : details.urlproceso;

                        systemPrompt += `
DETALLES DEL PROCESO (SECOP):
Descripción / Alcance: ${details.descripci_n_del_procedimiento}
Valor Estimado: ${details.precio_base}
Modalidad: ${details.modalidad_de_contratacion}
Fase Actual: ${details.fase}
Enlace: ${url}

NOTA: Utiliza la "Descripción / Alcance" anterior para responder preguntas sobre el objeto del contrato o el alcance.
`;
                    }
                } catch (err) {
                    console.warn("Failed to fetch SECOP details for context:", err);
                }
            }
        }

        if (companyContext) {
            systemPrompt += `
--------------------------------------------------
INFORMACIÓN DE LA EMPRESA (LICITANTE):
Nombre: ${companyContext.company_name}
NIT: ${companyContext.nit || 'No disponible'}
Representante Legal: ${companyContext.legal_representative || 'No disponible'}
Objeto Social/Experiencia: ${JSON.stringify(companyContext.experience_summary || 'No disponible')}
Indicadores Financieros: ${JSON.stringify(companyContext.financial_indicators || 'No disponible')}

Usa esta información para personalizar cartas y presentaciones, insertando el nombre de la empresa y NIT donde corresponda.
`;
        }

        if (missionContext) {
            systemPrompt += `--------------------------------------------------
Usa este contexto para que tus respuestas sean específicas a este proceso.
`;
        } else {
            systemPrompt += `
No hay una misión seleccionada actualmente. El usuario te está haciendo consultas generales.
`;
        }

        // Add recent conversation history for context (last 6 messages)
        const recentHistory = history.slice(-6).map(m =>
            `${m.role === 'user' ? 'Usuario' : 'Hunter AI'}: ${m.content}`
        ).join('\n');

        const finalPrompt = `${systemPrompt}

HISTORIAL DE CONVERSACIÓN:
${recentHistory}

Usuario: ${message}
Hunter AI:`;

        const result = await ai.generateText(finalPrompt);

        if (!result.success || !result.data) {
            throw new Error(result.error || "No se pudo generar una respuesta.");
        }

        return { success: true, content: result.data };

    } catch (error) {
        console.error("AI Error:", error);
        return {
            success: false,
            content: "Lo siento, estoy experimentando dificultades técnicas para conectar con mi motor de inteligencia. Por favor intenta de nuevo en un momento."
        };
    }
}
