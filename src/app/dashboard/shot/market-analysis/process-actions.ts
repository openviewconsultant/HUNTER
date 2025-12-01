'use server'

import { createClient } from "@/lib/supabase/server";
import { getCompanyData } from "@/lib/company-data";
import { SecopProcess } from "@/lib/socrata";

// Evaluate if company meets process requirements
export async function evaluateProcessRequirements(process: SecopProcess): Promise<{
    meetsRequirements: boolean;
    matchScore: number;
    reasons: string[];
}> {
    const company = await getCompanyData();

    if (!company) {
        return {
            meetsRequirements: false,
            matchScore: 0,
            reasons: ['No se encontró información de la empresa']
        };
    }

    const companyUNSPSC = company.unspsc_codes || [];
    const reasons: string[] = [];
    let matchScore = 0;

    // Check UNSPSC code match (if available in process description)
    // Note: SECOP II dataset doesn't always include UNSPSC codes explicitly
    // We'll do a simple keyword match for now
    const description = process.descripci_n_del_procedimiento?.toLowerCase() || '';

    // Extract keywords from company's UNSPSC codes (simplified)
    const hasRelevantExperience = companyUNSPSC.length > 0;

    if (hasRelevantExperience) {
        matchScore += 30;
        reasons.push('✓ Tienes experiencia en códigos UNSPSC relacionados');
    }

    // Check contract type
    if (process.tipo_de_contrato) {
        matchScore += 20;
        reasons.push(`✓ Tipo de contrato: ${process.tipo_de_contrato}`);
    }

    // Check if amount is reasonable based on company experience
    const amount = parseFloat(process.precio_base || '0');
    if (!isNaN(amount) && company.experience_summary) {
        const avgContractValue = company.experience_summary.total_value_smmlv * 1000000; // Rough estimate
        if (amount > 0 && amount <= avgContractValue * 3) {
            matchScore += 25;
            reasons.push('✓ El monto está dentro de tu rango de experiencia');
        } else if (amount > avgContractValue * 3) {
            reasons.push('⚠ El monto es significativamente mayor a tu experiencia promedio');
        }
    }

    // Check financial capacity
    if (company.financial_indicators) {
        const { liquidity_index, working_capital } = company.financial_indicators;
        if (liquidity_index > 1.0) {
            matchScore += 15;
            reasons.push('✓ Índice de liquidez favorable');
        }
        if (working_capital > 0) {
            matchScore += 10;
            reasons.push('✓ Capital de trabajo positivo');
        }
    }

    const meetsRequirements = matchScore >= 50;

    return {
        meetsRequirements,
        matchScore,
        reasons
    };
}

// Add process to missions (projects table)
export async function addProcessToMissions(process: SecopProcess): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        // Get profile for the current user
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.id) {
            return { success: false, error: 'No se encontró el perfil del usuario' };
        }

        // Get company ID from companies table
        const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

        if (!company?.id) {
            return { success: false, error: 'No se encontró la empresa asociada' };
        }

        // Check if process already exists in projects
        const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('company_id', company.id)
            .eq('secop_process_id', process.id_del_proceso)
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'Este proceso ya está en tus misiones' };
        }

        // Evaluate requirements for initial data
        const evaluation = await evaluateProcessRequirements(process);

        // Parse deadline from fecha_de_publicacion_del (estimate: 30 days for submission)
        const publicationDate = new Date(process.fecha_de_publicacion_del);
        publicationDate.setDate(publicationDate.getDate() + 30);

        // Insert into projects table
        const { error: insertError } = await supabase
            .from('projects')
            .insert({
                company_id: company.id,
                secop_process_id: process.id_del_proceso,
                name: process.descripci_n_del_procedimiento?.substring(0, 255) || 'Proceso sin título',
                description: `${process.entidad}\n\nModalidad: ${process.modalidad_de_contratacion}\nReferencia: ${process.referencia_del_proceso}`,
                status: 'ACTIVE',
                methodology: 'AGILE',
                start_date: new Date().toISOString().split('T')[0],
                deadline_date: publicationDate.toISOString().split('T')[0],
                budget: parseFloat(process.precio_base || '0'),
                progress: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error inserting project:', insertError);
            return { success: false, error: insertError.message };
        }

        return { success: true };

    } catch (error) {
        console.error('Error adding to missions:', error);
        return { success: false, error: 'Error al agregar a misiones' };
    }
}
