'use server'

import { getCompanyData, getCompanyContracts, calculateCapacity, getExperienceByUNSPSC } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";

function calculateMatchScore(company: any, tender: any, companyExperience: Record<string, any>): number {
    let score = 0;

    const capacity = calculateCapacity(company);
    if (capacity > 0 && tender.amount > 0) {
        const ratio = tender.amount / capacity;
        if (ratio <= 1) score += 40;
        else if (ratio <= 1.5) score += 25;
        else if (ratio <= 2) score += 10;
    }

    if (tender.required_unspsc && tender.required_unspsc.length > 0) {
        const companyUNSPSC = Object.keys(companyExperience);
        const matchingCodes = tender.required_unspsc.filter((code: string) =>
            companyUNSPSC.some(companyCode => companyCode.startsWith(code.slice(0, 4)))
        );
        const matchRatio = matchingCodes.length / tender.required_unspsc.length;
        score += Math.round(matchRatio * 40);
    } else {
        score += 20;
    }

    const contracts = Object.values(companyExperience);
    if (contracts.length > 0) {
        const avgContractValue = contracts.reduce((sum: number, c: any) => sum + c.totalValue, 0) / contracts.length;
        const sizeRatio = tender.amount / avgContractValue;
        if (sizeRatio >= 0.5 && sizeRatio <= 2) score += 20;
        else if (sizeRatio >= 0.3 && sizeRatio <= 3) score += 10;
    }

    return Math.min(100, Math.round(score));
}

export async function getRankedTenders() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) return [];

    const companyExperience = getExperienceByUNSPSC(contracts);

    // Fetch all open tenders
    const supabase = await createClient();
    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(100);

    if (!tenders) return [];

    // Score all tenders
    const rankedTenders = tenders
        .map(tender => ({
            id: tender.id,
            secopId: tender.secop_id,
            title: tender.title,
            entity: tender.entity_name,
            amount: tender.amount,
            closingDate: tender.closing_at,
            matchScore: calculateMatchScore(company, tender, companyExperience),
            category: tender.category || 'General'
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

    return rankedTenders;
}

import { getCompetitorsByUNSPSC, SecopProcess } from "@/lib/socrata";

// Helper to determine sector from UNSPSC codes
function determineSector(unspscCodes: string[]): string {
    if (!unspscCodes || unspscCodes.length === 0) return "General";

    // Map common UNSPSC families to sectors
    const sectorMap: Record<string, string> = {
        '72': 'Construcción e Infraestructura',
        '30': 'Construcción e Infraestructura', // Materiales estructurales
        '95': 'Construcción e Infraestructura', // Terrenos y edificios
        '43': 'Tecnología y Telecomunicaciones',
        '81': 'Tecnología y Telecomunicaciones', // Servicios de ingeniería
        '80': 'Servicios de Gestión y Profesionales',
        '85': 'Servicios de Salud',
        '50': 'Alimentos y Bebidas',
        '53': 'Ropa, Maletas y Productos de Aseo',
        '44': 'Equipos de Oficina y Accesorios',
        '39': 'Suministros y Equipos Eléctricos',
        '41': 'Equipos de Laboratorio y Medición'
    };

    // Count occurrences of each sector
    const sectorCounts: Record<string, number> = {};

    unspscCodes.forEach(code => {
        const family = code.substring(0, 2);
        const sector = sectorMap[family];
        if (sector) {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
    });

    // Find the most frequent sector
    let maxCount = 0;
    let bestSector = "General";

    Object.entries(sectorCounts).forEach(([sector, count]) => {
        if (count > maxCount) {
            maxCount = count;
            bestSector = sector;
        }
    });

    return bestSector;
}

export async function getRankingStats() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            totalEvaluated: 0,
            highProbability: 0,
            avgScore: 0
        };
    }

    const rankedTenders = await getRankedTenders();
    const sector = determineSector(company.unspsc_codes || []);

    // Calculate real metrics based on historical data vs competitors
    // This is an estimation since we don't have full market data
    const totalContracted = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);

    // Fetch competitors to compare
    const competitors = await getSectorRanking(sector, company.unspsc_codes || []);

    // Estimate rank based on where the company falls in the competitor list
    let rank = competitors.findIndex(c => c.amount < totalContracted);
    if (rank === -1) rank = competitors.length;
    rank += 1; // 1-based index

    // Calculate percentile (inverse of rank)
    const percentile = Math.max(1, Math.round(100 - (rank / (competitors.length + 1) * 100)));

    return {
        totalEvaluated: rankedTenders.length,
        highProbability: rankedTenders.filter(t => t.matchScore >= 70).length,
        avgScore: rankedTenders.length > 0
            ? Math.round(rankedTenders.reduce((sum, t) => sum + t.matchScore, 0) / rankedTenders.length)
            : 0,
        globalRank: rank,
        percentile: `Top ${percentile}%`,
        competitivenessScore: Math.min(10, Math.round(percentile / 10)),
        growth: 12, // Still mock as we need year-over-year data
        sector: sector
    };
}

// Aliases for backward compatibility

export const getUserRanking = getRankingStats;

export interface SectorRankingItem {
    id: string;
    name: string;
    amount: number;
}

export async function getSectorRanking(sector: string, unspscCodes?: string[]): Promise<SectorRankingItem[]> {
    // If codes not provided, try to get from company data
    if (!unspscCodes) {
        const company = await getCompanyData();
        unspscCodes = company?.unspsc_codes || [];
    }

    if (unspscCodes.length === 0) return [];

    // Fetch real competitors from SECOP
    const processes = await getCompetitorsByUNSPSC(unspscCodes, 100);

    // Aggregate by supplier
    const supplierMap = new Map<string, number>();

    processes.forEach((proc: SecopProcess) => {
        if (proc.nombre_del_proveedor) {
            const amount = parseFloat(proc.valor_total_adjudicacion || proc.precio_base || '0');
            const current = supplierMap.get(proc.nombre_del_proveedor) || 0;
            supplierMap.set(proc.nombre_del_proveedor, current + amount);
        }
    });

    // Convert to array and sort
    return Array.from(supplierMap.entries())
        .map(([name, amount]) => ({
            id: name,
            name: name,
            amount: amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
}
