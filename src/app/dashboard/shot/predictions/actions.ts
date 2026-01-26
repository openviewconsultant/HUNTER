'use server'

import { getCompanyData, getCompanyContracts, calculateCapacity, getExperienceByUNSPSC } from "@/lib/company-data";
import { searchOpportunitiesByUNSPSC } from "@/lib/socrata";
import { analyzeTenderMatch } from "../market-analysis/match-analyzer";

/**
 * Get prediction statistics based on real SECOP data
 */
export async function getPredictionStats() {
    const company = await getCompanyData();

    if (!company || !company.unspsc_codes || company.unspsc_codes.length === 0) {
        return {
            opportunities: 0,
            avgSuccessScore: 0,
            risks: 0
        };
    }

    // Fetch real opportunities from SECOP using company's UNSPSC codes - Increased limit to 100
    const processes = await searchOpportunitiesByUNSPSC(company.unspsc_codes, 100);

    if (processes.length === 0) {
        return {
            opportunities: 0,
            avgSuccessScore: 0,
            risks: 0
        };
    }

    // Analyze each process
    const analyzed = await Promise.all(
        processes.map(async (proc) => {
            const analysis = await analyzeTenderMatch(proc, company);
            return {
                ...proc,
                matchScore: analysis.matchScore,
                isMatch: analysis.isMatch
            };
        })
    );

    const opportunities = analyzed.filter(p => p.matchScore >= 70).length;
    const avgScore = analyzed.length > 0
        ? Math.round(analyzed.reduce((sum, p) => sum + p.matchScore, 0) / analyzed.length)
        : 0;

    // Risks: tenders with medium scores (30-69) - need attention
    const risks = analyzed.filter(p => p.matchScore >= 30 && p.matchScore < 70).length;

    return {
        opportunities,
        avgSuccessScore: avgScore,
        risks
    };
}

/**
 * Get high-probability opportunities
 */
import { analyzeTenderDescription, TenderAnalysis } from "./ai-actions";

export async function getOpportunities() {
    const company = await getCompanyData();

    if (!company || !company.unspsc_codes || company.unspsc_codes.length === 0) {
        return [];
    }

    // Fetch real opportunities from SECOP - Increased limit to 100
    const processes = await searchOpportunitiesByUNSPSC(company.unspsc_codes, 100);

    if (processes.length === 0) return [];

    // Analyze and score each process
    const scoredProcesses = await Promise.all(
        processes.map(async (proc) => {
            const analysis = await analyzeTenderMatch(proc, company);

            let reason = "";
            const score = analysis.matchScore;

            if (score >= 90) {
                reason = "Excelente cumplimiento de capacidad K y experiencia en sector";
            } else if (score >= 80) {
                reason = "Fuerte compatibilidad financiera y técnica";
            } else if (score >= 60) {
                reason = "Perfil apto según tus indicadores registrados";
            }

            return {
                id: proc.id_del_proceso,
                title: proc.descripci_n_del_procedimiento,
                entity: proc.entidad,
                amount: parseFloat(proc.precio_base || '0'),
                closingDate: proc.fecha_de_publicacion_del,
                matchScore: score,
                reason: reason || analysis.reasons[0] || analysis.warnings[0] || "Compatible con tu perfil",
                advice: analysis.advice,
                isCorporate: analysis.isCorporate,
                isActionable: analysis.isActionable,
                description: proc.descripci_n_del_procedimiento, // Keep description for AI analysis
                aiAnalysis: null as TenderAnalysis | null
            };
        })
    );

    // Filter and sort top opportunities
    const topOpportunities = scoredProcesses
        .sort((a, b) => {
            const actionableA = a.isActionable ? 1 : 0;
            const actionableB = b.isActionable ? 1 : 0;
            if (actionableA !== actionableB) return actionableB - actionableA;

            const corporateA = a.isCorporate ? 1 : 0;
            const corporateB = b.isCorporate ? 1 : 0;
            if (corporateA !== corporateB) return corporateB - corporateA;

            return b.matchScore - a.matchScore;
        })
        .slice(0, 10);

    // Perform AI analysis on the top 3 opportunities to save tokens/time
    const enrichedOpportunities = await Promise.all(
        topOpportunities.map(async (opp, index) => {
            if (index < 3) {
                const analysis = await analyzeTenderDescription(opp.description, opp.title);
                return { ...opp, aiAnalysis: analysis };
            }
            return opp;
        })
    );

    return enrichedOpportunities;
}

/**
 * Get identified risks
 */
export async function getRisks() {
    const company = await getCompanyData();

    if (!company || !company.unspsc_codes || company.unspsc_codes.length === 0) {
        return [];
    }

    const capacity = calculateCapacity(company);

    // Fetch real opportunities from SECOP
    const processes = await searchOpportunitiesByUNSPSC(company.unspsc_codes, 50);

    if (processes.length === 0) return [];

    // Analyze and identify risks
    const risks = await Promise.all(
        processes.map(async (proc) => {
            const analysis = await analyzeTenderMatch(proc, company);
            const amount = parseFloat(proc.precio_base || '0');
            const score = analysis.matchScore;

            // Risk: interesting tender but challenging (30-69 score)
            if (score >= 30 && score < 70) {
                let title = "";
                let description = "";
                let severity: 'high' | 'medium' = 'medium';

                // Determine specific risk
                if (amount > capacity * 1.5) {
                    title = "Capacidad Financiera Insuficiente";
                    description = `El monto requerido (${formatCurrency(amount)}) excede significativamente tu capacidad K`;
                    severity = 'high';
                } else if (analysis.warnings.length > 0) {
                    title = analysis.warnings[0];
                    description = `Proceso: ${proc.descripci_n_del_procedimiento.substring(0, 100)}...`;
                    severity = 'medium';
                } else {
                    title = "Experiencia Limitada en Sector";
                    description = `Poca experiencia en los códigos UNSPSC requeridos para este proceso`;
                    severity = 'medium';
                }

                return {
                    id: proc.id_del_proceso,
                    tenderId: proc.referencia_del_proceso,
                    title,
                    description,
                    severity
                };
            }
            return null;
        })
    );

    return risks
        .filter((risk): risk is NonNullable<typeof risk> => risk !== null)
        .slice(0, 5);
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}
