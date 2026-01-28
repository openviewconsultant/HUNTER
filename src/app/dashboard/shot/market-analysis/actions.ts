'use server'

import { getCompanyData, getCompanyContracts, getExperienceByUNSPSC, getContractStats } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";
import { searchSecopProcesses, getMarketMetrics, searchOpportunitiesByUNSPSC, SecopProcess } from "@/lib/socrata";
import { classifyProcessesAI } from "./ai-actions";
import { getHistoricalContracts, CompetitorInfo } from "./competitor-actions";

export async function getMarketTrends() {
    const company = await getCompanyData();

    if (!company) return [];

    const companyUNSPSC = company.unspsc_codes || [];

    // Fetch tenders in company sectors from last 12 months
    const supabase = await createClient();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: tenders } = await supabase
        .from('tenders')
        .select('*')
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

    if (!tenders) return [];

    // Group by month and UNSPSC
    const monthlyData: Record<string, { count: number; totalValue: number }> = {};

    tenders.forEach(tender => {
        if (!tender.required_unspsc) return;

        const hasMatch = tender.required_unspsc.some((code: string) =>
            companyUNSPSC.some(companyCode => companyCode.startsWith(code.slice(0, 4)))
        );

        if (hasMatch) {
            const month = new Date(tender.created_at).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
            if (!monthlyData[month]) {
                monthlyData[month] = { count: 0, totalValue: 0 };
            }
            monthlyData[month].count += 1;
            monthlyData[month].totalValue += tender.amount || 0;
        }
    });

    return Object.entries(monthlyData)
        .map(([month, data]) => ({
            month,
            count: data.count,
            totalValue: data.totalValue,
            avgValue: data.count > 0 ? data.totalValue / data.count : 0
        }))
        .slice(0, 12);
}

export async function getSectorAnalysis() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) return [];

    const companyExp = getExperienceByUNSPSC(contracts);

    // Get market data for each UNSPSC sector
    const supabase = await createClient();

    const sectorAnalysis = await Promise.all(
        Object.entries(companyExp).map(async ([code, data]) => {
            const { count: marketTenders } = await supabase
                .from('tenders')
                .select('*', { count: 'exact', head: true })
                .contains('required_unspsc', [code]);

            return {
                code,
                yourContracts: data.count,
                yourValue: data.totalValue,
                marketOpportunities: marketTenders || 0
            };
        })
    );

    return sectorAnalysis
        .sort((a, b) => b.marketOpportunities - a.marketOpportunities)
        .slice(0, 10);
}

export async function getMarketStats() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            sectorCount: 0,
            totalMarketValue: 0,
            yourMarketShare: 0
        };
    }

    const stats = getContractStats(contracts);
    const companyExp = getExperienceByUNSPSC(contracts);

    // Simplified market share calculation
    const sectorCount = Object.keys(companyExp).length;

    return {
        sectorCount,
        totalMarketValue: stats.totalValue,
        yourMarketShare: 0 // Placeholder, requires total market data
    };
}

// Market search functions for the search page
export async function searchMarketOpportunities(query: string, filters?: any) {
    // Map UI filters to Socrata filters
    const socrataFilters = {
        minAmount: filters?.minAmount,
        maxAmount: filters?.maxAmount,
        status: filters?.hideNonActionable ? 'active' : 'all'
    };

    // Integrate with SECOP API - Uses default limit of 300
    const processes = await searchSecopProcesses(query, undefined, socrataFilters as any);

    // Get company data for match analysis
    const company = await getCompanyData();

    // If no company data, return processes as are
    if (!company) {
        return processes.map(p => ({ ...p, matchAnalysis: null }));
    }

    // AI Classification in batches for better precision
    const BATCH_SIZE = 20;
    const aiClassifications: any[] = [];

    // We only analyze the first 60 for cost/speed balance, the rest use rule-based fallback
    const processesToAnalyze = processes.slice(0, 60);

    for (let i = 0; i < processesToAnalyze.length; i += BATCH_SIZE) {
        const batch = processesToAnalyze.slice(i, i + BATCH_SIZE);
        const classifiedBatch = await classifyProcessesAI(batch.map(p => ({
            id: p.id_del_proceso,
            title: p.descripci_n_del_procedimiento,
            description: p.descripci_n_del_procedimiento
        })));
        aiClassifications.push(...classifiedBatch);
    }

    // Analyze each process for compatibility
    const { analyzeTenderMatch } = await import('./match-analyzer');

    // Optimization: Fetch contracts once to avoid N+1 queries
    const contracts = await getCompanyContracts();

    const processesWithAnalysis = await Promise.all(
        processes.map(async (process) => {
            try {
                const aiOverride = aiClassifications.find(c => c.id === process.id_del_proceso);
                const matchAnalysis = await analyzeTenderMatch(process, company, contracts, aiOverride);

                // Ensure the object is serializable (plain object, no functions)
                const serializedAnalysis = {
                    isMatch: matchAnalysis.isMatch,
                    matchScore: matchAnalysis.matchScore,
                    reasons: [...matchAnalysis.reasons],
                    warnings: [...matchAnalysis.warnings],
                    advice: matchAnalysis.advice,
                    isCorporate: matchAnalysis.isCorporate,
                    isActionable: matchAnalysis.isActionable,
                    isAIPowered: !!aiOverride
                };

                return {
                    ...process,
                    matchAnalysis: serializedAnalysis
                };
            } catch (error) {
                console.error('Error analyzing process:', error);
                return {
                    ...process,
                    matchAnalysis: null
                };
            }
        })
    );

    // Sort by: 1. Actionable, 2. Corporate, 3. Match Score
    return processesWithAnalysis.sort((a, b) => {
        const actionableA = a.matchAnalysis?.isActionable ? 1 : 0;
        const actionableB = b.matchAnalysis?.isActionable ? 1 : 0;
        if (actionableA !== actionableB) return actionableB - actionableA;

        const corporateA = a.matchAnalysis?.isCorporate ? 1 : 0;
        const corporateB = b.matchAnalysis?.isCorporate ? 1 : 0;
        if (corporateA !== corporateB) return corporateB - corporateA;

        const scoreA = a.matchAnalysis?.matchScore || 0;
        const scoreB = b.matchAnalysis?.matchScore || 0;
        return scoreB - scoreA;
    });
}

export async function getMarketInsights(query: string, filters?: any) {
    // Fetch real metrics from SECOP
    return await getMarketMetrics(query, filters);
}

// Get user company for filtering
export async function getUserCompanyForFilter() {
    const company = await getCompanyData();
    if (!company) return null;

    return {
        id: company.id,
        name: company.company_name,
        unspsc_codes: company.unspsc_codes || []
    };
}

// Search opportunities using company's UNSPSC codes
export async function searchOpportunitiesByCompany() {
    const company = await getCompanyData();
    if (!company || !company.unspsc_codes || company.unspsc_codes.length === 0) {
        return [];
    }

    // 2. Search processes by UNSPSC (increased limit)
    const processes = await searchOpportunitiesByUNSPSC(company.unspsc_codes, 150);

    // 3. IDENTIFY TOP COMPETITORS for these sectors
    // We take the first few codes to avoid massive overhead, or we can batch them
    const topCodes = company.unspsc_codes.slice(0, 5);
    const historicalCompetitors = await getHistoricalContracts(topCodes);

    // Group competitors to see who is the most active
    const competitorStats = historicalCompetitors.reduce((acc: Record<string, number>, curr) => {
        acc[curr.name] = (acc[curr.name] || 0) + 1;
        return acc;
    }, {});

    const topCompetitorNames = Object.entries(competitorStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);

    // 4. AI Classification and Match Analysis
    const BATCH_SIZE = 20;
    const aiClassifications: any[] = [];
    const processesToAnalyze = processes.slice(0, 60);

    for (let i = 0; i < processesToAnalyze.length; i += BATCH_SIZE) {
        const batch = processesToAnalyze.slice(i, i + BATCH_SIZE);
        const classifiedBatch = await classifyProcessesAI(batch.map(p => ({
            id: p.id_del_proceso,
            title: p.descripci_n_del_procedimiento,
            description: p.descripci_n_del_procedimiento
        })));
        aiClassifications.push(...classifiedBatch);
    }

    const { analyzeTenderMatch } = await import('./match-analyzer');
    const contracts = await getCompanyContracts();

    const processesWithAnalysis = await Promise.all(
        processes.map(async (process) => {
            try {
                const aiOverride = aiClassifications.find(c => c.id === process.id_del_proceso);
                // Also pass competitor info to analyzeTenderMatch
                const matchAnalysis = await analyzeTenderMatch(process, company, contracts, aiOverride);

                // Add competitor presence logic
                const processUNSPSC = (process as any).codigo_principal_de_categoria || '';
                const processCategory = processUNSPSC.slice(0, 4);

                // Check if any top competitor has won in this category
                const relevantCompetitors = historicalCompetitors.filter(c =>
                    (c as any).unspscCode?.startsWith(processCategory)
                );

                const uniqueCompetitors = Array.from(new Set(relevantCompetitors.map(c => c.name))).slice(0, 3);

                const serializedAnalysis: any = {
                    isMatch: matchAnalysis.isMatch,
                    matchScore: matchAnalysis.matchScore,
                    reasons: [...matchAnalysis.reasons],
                    warnings: [...matchAnalysis.warnings],
                    advice: matchAnalysis.advice,
                    isCorporate: matchAnalysis.isCorporate,
                    isActionable: matchAnalysis.isActionable,
                    isAIPowered: !!aiOverride,
                    topCompetitors: uniqueCompetitors // NEW FIELD
                };

                // Add competitor reason if applicable
                if (uniqueCompetitors.length > 0) {
                    serializedAnalysis.reasons.push(`Competencia: Sector disputado por ${uniqueCompetitors[0]}${uniqueCompetitors.length > 1 ? ` y ${uniqueCompetitors.length - 1} más` : ''}`);
                }

                return {
                    ...process,
                    matchAnalysis: serializedAnalysis
                };
            } catch (error) {
                console.error('Error analyzing process in company search:', error);
                return {
                    ...process,
                    matchAnalysis: null
                };
            }
        })
    );

    // Sort by: 1. Actionable, 2. Corporate, 3. Match Score
    return processesWithAnalysis.sort((a, b) => {
        const actionableA = a.matchAnalysis?.isActionable ? 1 : 0;
        const actionableB = b.matchAnalysis?.isActionable ? 1 : 0;
        if (actionableA !== actionableB) return actionableB - actionableA;

        const corporateA = a.matchAnalysis?.isCorporate ? 1 : 0;
        const corporateB = b.matchAnalysis?.isCorporate ? 1 : 0;
        if (corporateA !== corporateB) return corporateB - corporateA;

        const scoreA = a.matchAnalysis?.matchScore || 0;
        const scoreB = b.matchAnalysis?.matchScore || 0;
        return scoreB - scoreA;
    });
}
