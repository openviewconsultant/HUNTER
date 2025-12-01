'use server'

import { getCompanyData, getCompanyContracts, calculateCapacity, getExperienceByUNSPSC, getContractStats } from "@/lib/company-data";

export async function getAnalyticsData() {
    const company = await getCompanyData();
    const contracts = await getCompanyContracts();

    if (!company) {
        return {
            projectedRevenue: 0,
            period: "Sin datos",
            capacityK: 0,
            liquidityIndex: 0,
            totalContracts: 0,
            totalContractValue: 0,
            avgContractValue: 0,
            unspscBreakdown: [],
            financialHealth: 0
        };
    }

    const capacity = calculateCapacity(company);
    const stats = getContractStats(contracts);
    const unspscData = getExperienceByUNSPSC(contracts);

    // Convert UNSPSC data to array format for easier rendering
    const unspscBreakdown = Object.entries(unspscData).map(([code, data]) => ({
        code,
        count: data.count,
        totalValue: data.totalValue,
        totalValueSMMLV: data.totalValueSMMLV
    })).sort((a, b) => b.totalValue - a.totalValue);

    // Calculate financial health score (0-100)
    const liquidityScore = Math.min(100, (company.financial_indicators?.liquidity_index || 0) * 50);
    const indebtednessScore = Math.max(0, (1 - (company.financial_indicators?.indebtedness_index || 0)) * 100);
    const financialHealth = (liquidityScore + indebtednessScore) / 2;

    return {
        // Company name
        companyName: company.company_name,

        // Financial metrics
        capacityK: capacity,
        liquidityIndex: company.financial_indicators?.liquidity_index || 0,
        indebtednessIndex: company.financial_indicators?.indebtedness_index || 0,
        workingCapital: company.financial_indicators?.working_capital || 0,
        equity: company.financial_indicators?.equity || 0,
        financialHealth: Math.round(financialHealth),

        // Contract stats
        totalContracts: stats.count,
        totalContractValue: stats.totalValue,
        totalContractValueSMMLV: stats.totalValueSMMLV,
        avgContractValue: stats.avgValue,

        // UNSPSC breakdown
        unspscBreakdown,

        // Projections (based on historical data)
        projectedRevenue: stats.avgValue * 2, // Simple projection: 2x average contract
        period: "Próximos 6 meses"
    };
}
