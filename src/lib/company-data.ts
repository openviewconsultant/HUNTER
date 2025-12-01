import { createClient } from "@/lib/supabase/server";

export interface CompanyData {
    id: string;
    company_name: string;
    nit: string;
    financial_indicators: {
        liquidity_index: number;
        indebtedness_index: number;
        working_capital: number;
        equity: number;
    } | null;
    unspsc_codes: string[] | null;
    experience_summary: {
        total_contracts: number;
        total_value_smmlv: number;
    } | null;
}

export interface Contract {
    id: string;
    contract_number: string;
    client_name: string;
    contract_value: number;
    contract_value_smmlv: number | null;
    execution_date: string | null;
    unspsc_codes: string[] | null;
    description: string | null;
}

/**
 * Get the current user's company data including financial indicators
 */
export async function getCompanyData(): Promise<CompanyData | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) return null;

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

    return company;
}

/**
 * Get all contracts for the current user's company
 */
export async function getCompanyContracts(): Promise<Contract[]> {
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

    const { data: contracts } = await supabase
        .from('company_contracts')
        .select('*')
        .eq('company_id', company.id)
        .order('execution_date', { ascending: false });

    return contracts || [];
}

/**
 * Calculate the company's current contracting capacity (K)
 * K = (Activos Totales - Pasivos Totales) * liquidity_index * (1 - indebtedness_index)
 */
export function calculateCapacity(company: CompanyData): number {
    if (!company.financial_indicators) return 0;

    const { working_capital, equity, liquidity_index, indebtedness_index } = company.financial_indicators;

    // Simplified K calculation
    const totalAssets = working_capital + equity;
    const k = totalAssets * liquidity_index * (1 - indebtedness_index);

    return Math.max(0, k);
}

/**
 * Group contracts by UNSPSC code with aggregated values
 */
export function getExperienceByUNSPSC(contracts: Contract[]): Record<string, { count: number; totalValue: number; totalValueSMMLV: number }> {
    const byUNSPSC: Record<string, { count: number; totalValue: number; totalValueSMMLV: number }> = {};

    contracts.forEach(contract => {
        if (!contract.unspsc_codes) return;

        contract.unspsc_codes.forEach(code => {
            if (!byUNSPSC[code]) {
                byUNSPSC[code] = { count: 0, totalValue: 0, totalValueSMMLV: 0 };
            }
            byUNSPSC[code].count += 1;
            byUNSPSC[code].totalValue += contract.contract_value;
            byUNSPSC[code].totalValueSMMLV += contract.contract_value_smmlv || 0;
        });
    });

    return byUNSPSC;
}

/**
 * Calculate total contract value and count
 */
export function getContractStats(contracts: Contract[]): { totalValue: number; totalValueSMMLV: number; count: number; avgValue: number } {
    const totalValue = contracts.reduce((sum, c) => sum + c.contract_value, 0);
    const totalValueSMMLV = contracts.reduce((sum, c) => sum + (c.contract_value_smmlv || 0), 0);
    const count = contracts.length;
    const avgValue = count > 0 ? totalValue / count : 0;

    return { totalValue, totalValueSMMLV, count, avgValue };
}
