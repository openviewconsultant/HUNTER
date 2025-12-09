'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    await createDefaultDeliverables(data.id, stages, supabase);

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
