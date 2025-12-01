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

    return {
        totalEvaluated: rankedTenders.length,
        highProbability: rankedTenders.filter(t => t.matchScore >= 70).length,
        avgScore: rankedTenders.length > 0
            ? Math.round(rankedTenders.reduce((sum, t) => sum + t.matchScore, 0) / rankedTenders.length)
            : 0,
        // Add fields expected by the UI
        globalRank: 42, // Mock rank
        percentile: "Top 15%",
        competitivenessScore: rankedTenders.length > 0
            ? Math.round((rankedTenders.reduce((sum, t) => sum + t.matchScore, 0) / rankedTenders.length) / 10)
            : 0,
        growth: 12, // Mock growth
        sector: "Tecnología" // Mock sector or derive from UNSPSC
    };
}

// Aliases for backward compatibility

export const getUserRanking = getRankingStats;

export interface SectorRankingItem {
    id: string;
    name: string;
    amount: number;
}

export async function getSectorRanking(sector: string): Promise<SectorRankingItem[]> {
    // TODO: Implement actual sector ranking based on Socrata data
    // For now return empty to fix build and show "No data" state
    return [];
}
