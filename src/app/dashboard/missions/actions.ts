'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProcessSchedule, getProcessDocuments } from "@/lib/socrata";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { extractTextFromPdfUrl } from "@/lib/pdf";
import { getCompanyData, getCompanyContracts } from "@/lib/company-data";

export async function getProjects() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

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

    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            tender:tender_id (
                title,
                amount,
                entity_name,
                secop_id
            )
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
        return [];
    }

    return data.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        methodology: project.methodology,
        status: project.status,
        progress: project.progress,
        tenderTitle: project.tender?.title,
        entity: project.tender?.entity_name,
        amount: project.tender?.amount,
        deadline: project.deadline_date,
        processId: project.secop_process_id || project.tender?.secop_id
    }));
}

// Helper function to create default stages based on methodology
async function createDefaultStages(projectId: string, methodology: string, supabase: any) {
    const stages = methodology === 'AGILE'
        ? [
            { name: 'Por Hacer', order: 1, color: '#64748b' },
            { name: 'En Progreso', order: 2, color: '#3b82f6' },
            { name: 'Revisión', order: 3, color: '#f59e0b' },
            { name: 'Listo', order: 4, color: '#10b981' }
        ]
        : [
            { name: 'Iniciación', order: 1, color: '#8b5cf6' },
            { name: 'Planificación', order: 2, color: '#3b82f6' },
            { name: 'Ejecución', order: 3, color: '#f59e0b' },
            { name: 'Cierre', order: 4, color: '#10b981' }
        ];

    const { data, error } = await supabase
        .from('project_stages')
        .insert(stages.map(s => ({ ...s, project_id: projectId })))
        .select()
        .order('order');

    if (error) {
        console.error("Error creating stages:", error);
        return [];
    }

    return data;
}

// Helper function to create default contract deliverables
async function createDefaultDeliverables(projectId: string, stages: any[], supabase: any) {
    const deliverables = [
        // Pre-contractual - Stage 0 (Por Hacer/Iniciación)
        { title: 'Fotocopia de Cédula del Representante Legal', stage: 0, priority: 'HIGH', type: 'legal', description: 'Documento de identidad del representante legal vigente' },
        { title: 'RUT (Registro Único Tributario)', stage: 0, priority: 'HIGH', type: 'legal', description: 'RUT actualizado de la empresa' },
        { title: 'Certificado de Existencia y Representación Legal', stage: 0, priority: 'HIGH', type: 'legal', description: 'No mayor a 30 días' },
        { title: 'Estados Financieros (último año fiscal)', stage: 0, priority: 'HIGH', type: 'financial', description: 'Balance general y estado de resultados certificados' },
        { title: 'Certificado de Antecedentes Fiscales y Disciplinarios', stage: 0, priority: 'MEDIUM', type: 'legal', description: 'Contraloría y Procuraduría' },
        { title: 'Paz y Salvo de Seguridad Social', stage: 0, priority: 'HIGH', type: 'legal', description: 'PILA de los últimos 6 meses' },
        { title: 'Garantía de Seriedad de la Oferta', stage: 0, priority: 'CRITICAL', type: 'financial', description: 'Póliza de cumplimiento por el % requerido' },
        { title: 'Propuesta Técnica', stage: 0, priority: 'CRITICAL', type: 'technical', description: 'Metodología, cronograma y plan de trabajo' },
        { title: 'Propuesta Económica', stage: 0, priority: 'CRITICAL', type: 'financial', description: 'Formulario de presupuesto y APU' },

        // Contractual - Stage 1 (En Progreso/Planificación)
        { title: 'Firma Acta de Inicio', stage: 1, priority: 'CRITICAL', type: 'legal', description: 'Acta firmada por las partes' },
        { title: 'Constitución de Garantías', stage: 1, priority: 'HIGH', type: 'financial', description: 'Pólizas de cumplimiento, calidad y anticipo' },
        { title: 'Afiliación ARL del Personal', stage: 1, priority: 'HIGH', type: 'legal', description: 'Certificados de afiliación vigentes' },
        { title: 'Plan de Trabajo', stage: 1, priority: 'HIGH', type: 'technical', description: 'Plan detallado aprobado por la interventoría' },
        { title: 'Cronograma de Ejecución', stage: 1, priority: 'HIGH', type: 'technical', description: 'Diagrama de Gantt con hitos' },

        // Execution - Stage 2 (En Progreso/Ejecución)
        { title: 'Informe de Avance 1 (25%)', stage: 2, priority: 'MEDIUM', type: 'technical', description: 'Reporte de avance del primer cuarto' },
        { title: 'Informe de Avance 2 (50%)', stage: 2, priority: 'MEDIUM', type: 'technical', description: 'Reporte de avance al 50%' },
        { title: 'Informe de Avance 3 (75%)', stage: 2, priority: 'MEDIUM', type: 'technical', description: 'Reporte de avance al 75%' },
        { title: 'Actas de Recibo Parcial', stage: 2, priority: 'MEDIUM', type: 'legal', description: 'Actas firmadas por cada entrega' },
        { title: 'Facturas y Soportes de Pago', stage: 2, priority: 'MEDIUM', type: 'financial', description: 'Documentación para desembolsos' },

        // Closure - Stage 3 (Revisión o Listo/Cierre)
        { title: 'Informe Final', stage: 3, priority: 'CRITICAL', type: 'technical', description: 'Documento completo de cierre del proyecto' },
        { title: 'Acta de Recibo Final', stage: 3, priority: 'CRITICAL', type: 'legal', description: 'Conformidad total de la entidad' },
        { title: 'Certificación de Cumplimiento', stage: 3, priority: 'HIGH', type: 'legal', description: 'Documento de cumplimiento satisfactorio' },
        { title: 'Acta de Liquidación', stage: 3, priority: 'HIGH', type: 'legal', description: 'Cierre financiero del contrato' },
        { title: 'Paz y Salvo Final', stage: 3, priority: 'MEDIUM', type: 'legal', description: 'Certificado de no deudas' },
    ];

    const tasks = deliverables.map(d => ({
        project_id: projectId,
        stage_id: stages[d.stage]?.id,
        title: d.title,
        description: d.description,
        priority: d.priority,
        status: 'TODO',
        is_requirement: true,
        requirement_type: d.type,
        requirement_met: false
    }));

    const { error } = await supabase.from('project_tasks').insert(tasks);

    if (error) {
        console.error("Error creating deliverables:", error);
    }
}

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile!.id)
        .single();

    const name = formData.get('name') as string;
    const methodology = formData.get('methodology') as string;
    const tenderId = formData.get('tenderId') as string;

    // Validate UUID format (simple check)
    const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const validTenderId = tenderId && isValidUUID(tenderId) ? tenderId : null;

    const { data, error } = await supabase
        .from('projects')
        .insert({
            company_id: company!.id,
            name,
            methodology,
            tender_id: validTenderId,
            status: 'ACTIVE',
            progress: 0
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create default stages and deliverables
    const stages = await createDefaultStages(data.id, methodology, supabase);

    // Attempt to sync with SECOP if tenderId is present
    if (validTenderId) {
        try {
            await syncProjectWithSecop(data.id);
        } catch (e) {
            console.error("Initial SECOP sync failed, falling back to defaults:", e);
            await createDefaultDeliverables(data.id, stages, supabase);
        }
    } else {
        await createDefaultDeliverables(data.id, stages, supabase);
    }

    redirect(`/dashboard/missions/${data.id}`);
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Verify the project belongs to the user's company
    const { data: project } = await supabase
        .from('projects')
        .select(`
            id,
            company:company_id (
                profile:profile_id (
                    user_id
                )
            )
        `)
        .eq('id', projectId)
        .single();

    if (!project) throw new Error("Project not found");

    const companyProfile = (project as any).company?.profile;
    if (companyProfile?.user_id !== user.id) {
        throw new Error("Unauthorized to delete this project");
    }

    // Delete the project (cascade will delete stages and tasks)
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) throw new Error(error.message);

    return { success: true };
}

export async function updateTaskStage(taskId: string, stageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('project_tasks')
        .update({ stage_id: stageId })
        .eq('id', taskId);

    if (error) throw new Error(error.message);

    return { success: true };
}

export async function syncProjectWithSecop(projectId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "No autorizado" };

        // 1. Get Project and Tender info
        const { data: project, error: pError } = await supabase
            .from('projects')
            .select(`
            *,
            tender:tender_id (secop_id, title, description)
        `)
            .eq('id', projectId)
            .single();

        if (pError || !project) return { error: "Proyecto no encontrado" };
        const secopId = project.tender?.secop_id || (project as any).secop_process_id;
        // if (!secopId) return { error: "Este proyecto no tiene vinculada una licitación de SECOP (falta ID de proceso)" };

        // 2. Fetch data from SECOP if available
        let schedule: any[] = [];
        let documents: any[] = [];
        if (secopId) {
            const [s, d] = await Promise.all([
                getProcessSchedule(secopId),
                getProcessDocuments(secopId)
            ]);
            schedule = s;
            documents = d;
        }

        // 3. Fetch Company Profile Data for Real Analysis
        const [companyData, companyContracts] = await Promise.all([
            getCompanyData(),
            getCompanyContracts()
        ]);

        if (!companyData) return { error: "Perfil de empresa no encontrado para el análisis" };

        // 4. fetch current stages
        const { data: stages } = await supabase
            .from('project_stages')
            .select('*')
            .eq('project_id', projectId)
            .order('order');

        if (!stages || stages.length === 0) return { error: "Etapas del proyecto no encontradas" };

        // 4. Identify and extract text from key documents
        const keyKeywords = ['anexo', 'pliego', 'estudio', 'técnico', 'tecnico', 'técnica', 'tecnica', 'condiciones'];
        const relevantDocs = documents.filter((doc: any) => {
            const name = (doc.nombre_del_documento || '').toLowerCase();
            return keyKeywords.some(k => name.includes(k));
        }).slice(0, 3); // Limit to top 3 relevant docs to avoid context overflow

        console.log(`Found ${relevantDocs.length} relevant documents for parsing.`);

        const docContents = await Promise.all(
            relevantDocs.map(async (doc: any) => {
                const url = typeof doc.link_del_documento === 'string'
                    ? doc.link_del_documento
                    : doc.link_del_documento?.url;

                if (!url || !url.toLowerCase().endsWith('.pdf')) return null;

                console.log(`Extracting text from: ${doc.nombre_del_documento}`);
                const text = await extractTextFromPdfUrl(url);
                return {
                    name: doc.nombre_del_documento,
                    content: text.slice(0, 10000) // Limit per document to 10k chars
                };
            })
        );

        const validContents = docContents.filter((c): c is { name: string, content: string } => c !== null && c.content.length > 0);

        // 6. Use AI to categorize tasks and generate GAP ANALYSIS
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

        const prompt = `
    Como experto en contratación pública en Colombia y analista senior de riesgos y licitaciones, realiza un análisis profundo.
    Tu tarea es generar:
    1. Una lista de TAREAS y ENTREGABLES organizada por ETAPAS.
    2. Un ANÁLISIS DE BRECHAS (GAP Analysis) comparando el perfil de la empresa con los requisitos del proceso.
    3. Una MATRIZ DE RIESGOS específica.

    PERFIL DE LA EMPRESA (Tus Datos Reales):
    - Razon Social: ${companyData.company_name}
    - Indicadores: ${JSON.stringify(companyData.financial_indicators)}
    - UNSPSC: ${JSON.stringify(companyData.unspsc_codes)}
    - Experiencia Resumen: ${JSON.stringify(companyData.experience_summary)}
    - Contratos Registrados: ${JSON.stringify(companyContracts.map(c => ({ objeto: c.description, valor: c.contract_value })))}

    INFORMACIÓN DE LA LICITACIÓN (SECOP II):
    - Título: ${project.name}
    - Cronograma: ${JSON.stringify(schedule)}
    - Documentos SECOP: ${JSON.stringify(documents.map((d: any) => d.nombre_del_documento))}
    
    CONTENIDO DE DOCUMENTOS CLAVE:
    ${validContents.map(c => `--- DOCUMENTO: ${c.name} ---\n${c.content}\n`).join('\n')}
    
    ETAPAS DEL PROYECTO:
    ${stages.map(s => `- ID: ${s.id}, Nombre: ${s.name}`).join('\n')}
    
    REGLAS DE ORO:
    1. No inventes. Si no hay contenido de documentos, basa el Gap Analysis en los indicadores financieros y códigos UNSPSC vs el valor del proceso.
    2. Gap Analysis: Debes comparar CADA indicador financiero (Liquidez, Endeudamiento, K) y experiencia ( UNSPSC) con lo que SECOP exige.
    3. Responde estrictamente en JSON con la siguiente estructura:
    {
      "tasks": [
        {
          "stage_id": "string",
          "title": "string",
          "description": "string",
          "priority": "HIGH" | "MEDIUM" | "CRITICAL",
          "due_date": "YYYY-MM-DD",
          "requirement_type": "legal" | "technical" | "financial"
        }
      ],
      "gap_analysis": [
        {
          "category": "Capacidad Financiera" | "Experiencia Específica" | "Requisitos Habilitantes",
          "status": "success" | "warning" | "error",
          "title": "string",
          "message": "Detalle real de la comparación",
          "recommendation": "Acción concreta para mitigar el gap"
        }
      ],
      "risks": [
        {
          "title": "string",
          "level": "Bajo" | "Medio" | "Alto",
          "description": "Basado en clausulas reales de riesgo detectadas"
        }
      ]
    }
    `;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        console.log("SECOP FULL ANALYSIS RAW Response Size:", aiResponse.length);

        let fullAnalysis;
        try {
            const jsonStr = aiResponse.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();
            fullAnalysis = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", aiResponse);
            return { error: "La IA generó un formato inválido. Por favor intenta de nuevo." };
        }

        const { tasks: newTasks, gap_analysis, risks } = fullAnalysis;

        // 7. Save Analysis to Project
        await supabase
            .from('projects')
            .update({ ai_analysis: { gap_analysis, risks } })
            .eq('id', projectId);

        // 8. Clean old auto-generated requirements
        await supabase
            .from('project_tasks')
            .delete()
            .eq('project_id', projectId)
            .eq('is_requirement', true);

        // 9. Insert new tasks
        const tasksToInsert = newTasks.map((t: any) => ({
            ...t,
            project_id: projectId,
            status: 'TODO',
            is_requirement: true,
            requirement_met: false
        }));

        const { error: iError } = await supabase.from('project_tasks').insert(tasksToInsert);
        if (iError) return { error: "Error al guardar tareas: " + iError.message };

        revalidatePath(`/dashboard/missions/${projectId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Critical error in syncProjectWithSecop:", error);
        return { error: error.message || "Ocurrió un error inesperado durante la sincronización" };
    }
}
