'use server'

import { getCompanyData, getCompanyContracts, getExperienceByUNSPSC } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";
import { getOpportunities } from "../predictions/actions";
import { searchProcessesByEntity, getCompetitorsByUNSPSC, getRecentProcessesByUNSPSC, SecopProcess } from "@/lib/socrata";


export async function getRecentActivity() {
    const company = await getCompanyData();

    if (!company) return [];

    const companyUNSPSC = company.unspsc_codes || [];

    // Fetch recent tenders matching company's UNSPSC codes
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!tenders) return [];

    // Filter and format
    const activity = tenders
        .filter(tender => {
            if (!tender.required_unspsc) return false;
            return tender.required_unspsc.some((code: string) =>
                companyUNSPSC.some(companyCode => companyCode.startsWith(code.slice(0, 4)))
            );
        })
        .map(tender => ({
            id: tender.id,
            title: tender.title,
            entity: tender.entity_name,
            amount: tender.amount,
            type: 'NEW_TENDER',
            date: tender.created_at
        }))
        .slice(0, 10);

    return activity;
}

export async function getMonitorStats() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            activeTenders: 0,
            matchingOpportunities: 0,
            trackedSectors: 0
        };
    }

    const companyExp = getExperienceByUNSPSC(contracts);

    // Get total active tenders
    const supabase = await createClient();
    const { count: activeTenders } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN');

    // Get matching opportunities
    const opportunities = await getOpportunities();

    return {
        activeTenders: activeTenders || 0,
        matchingOpportunities: opportunities.length,
        trackedSectors: Object.keys(companyExp).length
    };
}

// Function to get monitored entities with their statistics from SECOP II
export async function getMonitoredEntities() {
    const company = await getCompanyData();

    if (!company) return [];

    // Get company contracts to extract entities
    const contracts = await getCompanyContracts();

    // Get unique entity names from historical contracts
    const entityNames = [...new Set(contracts.map(c => c.client_name).filter(Boolean))];

    // Fetch active processes for each entity from SECOP II
    const entityData = await Promise.all(
        entityNames.slice(0, 10).map(async (entityName) => {
            const processes = await searchProcessesByEntity(entityName as string, 30);

            // Calculate statistics from SECOP II data
            const processCount = processes.length;
            const executedBudget = processes.reduce((sum: number, p: SecopProcess) => {
                const amount = parseFloat(p.precio_base || '0');
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);

            // Get most recent activity date
            const lastActivity = processes.length > 0
                ? new Date(processes[0].fecha_de_publicacion_del).toLocaleDateString('es-CO')
                : new Date().toLocaleDateString('es-CO');

            return {
                name: entityName,
                processCount,
                executedBudget,
                lastActivity
            };
        })
    );

    // Filter out entities with no active processes and sort by process count
    return entityData
        .filter(e => e.processCount > 0)
        .sort((a, b) => b.processCount - a.processCount)
        .slice(0, 6);
}

// Function to get competitor data from SECOP II
export async function getCompetitors() {
    const company = await getCompanyData();

    if (!company) return [];

    const companyUNSPSC = company.unspsc_codes || [];
    if (companyUNSPSC.length === 0) return [];

    // Fetch processes with similar UNSPSC codes from SECOP II
    const processes = await getCompetitorsByUNSPSC(companyUNSPSC, 200);

    // Extract and analyze competitors
    const competitorMap = new Map<string, { count: number; awarded: number; totalValue: number }>();

    processes.forEach((process: SecopProcess) => {
        const entity = process.entidad || 'Desconocido';

        // Skip if it's the user's company
        if (entity.toLowerCase().includes(company.company_name?.toLowerCase() || 'xxx')) {
            return;
        }

        if (!competitorMap.has(entity)) {
            competitorMap.set(entity, { count: 0, awarded: 0, totalValue: 0 });
        }

        const comp = competitorMap.get(entity)!;
        comp.count += 1;

        if (process.fase === 'Adjudicado' || process.fase === 'Celebrado') {
            comp.awarded += 1;
        }

        const amount = parseFloat(process.precio_base || '0');
        if (!isNaN(amount)) {
            comp.totalValue += amount;
        }
    });

    // Convert to array and calculate metrics
    const competitors = Array.from(competitorMap.entries())
        .map(([name, stats]) => {
            const winRate = stats.count > 0 ? stats.awarded / stats.count : 0;
            // Risk score based on frequency and win rate (higher = more competitive)
            const riskScore = Math.min(100, Math.round((stats.count * 2) + (winRate * 50)));

            return {
                id: name.substring(0, 20), // Use portion of name as ID
                name: name,
                nit: 'N/A', // NIT not available in SECOP II dataset
                riskScore,
                winRate
            };
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5);

    return competitors;
}

// Function to get market alerts from recent SECOP II processes
export async function getMarketAlerts() {
    const company = await getCompanyData();

    if (!company) return [];

    const companyUNSPSC = company.unspsc_codes || [];
    if (companyUNSPSC.length === 0) return [];

    // Fetch recent processes from last 7 days
    const recentProcesses = await getRecentProcessesByUNSPSC(companyUNSPSC, 7, 15);

    // Transform to alert format
    return recentProcesses.map((process: SecopProcess) => {
        const amount = parseFloat(process.precio_base || '0');
        const formattedAmount = isNaN(amount) ? 'No especificado' : new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);

        return {
            id: process.id_del_proceso || Math.random().toString(),
            title: process.descripci_n_del_procedimiento || 'Proceso sin descripción',
            entity: process.entidad || 'Entidad desconocida',
            amount: amount,
            type: 'NEW_TENDER',
            date: process.fecha_de_publicacion_del || new Date().toISOString(),
            message: `Nueva licitación de ${process.entidad || 'entidad'} por ${formattedAmount}. Modalidad: ${process.modalidad_de_contratacion || 'No especificada'}`
        };
    }).slice(0, 10);
}

// Alias for backward compatibility
export const getMonitoredTenders = getMonitoredEntities;
