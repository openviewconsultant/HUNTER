'use server'

import { getCompanyData, getCompanyContracts, getExperienceByUNSPSC, getContractStats } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";
import { searchSecopProcesses, getMarketMetrics, searchOpportunitiesByUNSPSC } from "@/lib/socrata";

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
export async function searchMarketOpportunities(query: string) {
    // Integrate with SECOP API
    return await searchSecopProcesses(query, 50);
}

export async function getMarketInsights(query: string) {
    // Fetch real metrics from SECOP
    return await getMarketMetrics(query);
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

    return await searchOpportunitiesByUNSPSC(company.unspsc_codes, 50);
}
