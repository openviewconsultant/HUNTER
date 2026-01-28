'use server'

import { CompanyData, calculateCapacity, getExperienceByUNSPSC, getCompanyContracts, Contract } from "@/lib/company-data";
import { SecopProcess } from "@/lib/socrata";
import { extractUNSPSCFromProcess } from "./match-helpers";

/**
 * Analysis result for a tender process
 */
export interface TenderMatchAnalysis {
    isMatch: boolean;
    matchScore: number; // 0-100
    reasons: string[];
    warnings: string[];
    advice?: string;
    isCorporate: boolean;
    isActionable: boolean;
}

/**
 * Analyzes if a SECOP process matches the company's profile
 * @param process The SECOP process to analyze
 * @param company The company data
 * @returns Analysis result with match score and reasons
 */
export async function analyzeTenderMatch(
    process: SecopProcess,
    company: CompanyData,
    existingContracts?: Contract[],
    aiOverride?: { isCorporate?: boolean, isActionable?: boolean, advice?: string }
): Promise<TenderMatchAnalysis> {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let matchScore = 0;

    // Pillar 1: Jurídico (UNSPSC Match) - 30%
    const unspscMatch = analyzeUNSPSCMatch(process, company);
    if (unspscMatch.hasMatch) {
        matchScore += 30;
        reasons.push(`Pilar Jurídico: Códigos UNSPSC compatibles (${unspscMatch.matchedCodes[0]})`);
    } else {
        warnings.push('Pilar Jurídico: No hay coincidencia en códigos UNSPSC registrados en tu perfil');
    }

    // Pillar 2: Financiero (Capacidad K) - 30%
    const capacityMatch = analyzeFinancialCapacity(process, company);
    if (capacityMatch.hasCapacity) {
        matchScore += 30;
        reasons.push(`Pilar Financiero: Capacidad K suficiente (${capacityMatch.percentage}%)`);
    } else {
        if (company.financial_indicators) {
            const diff = capacityMatch.requiredAmount - capacityMatch.availableAmount;
            warnings.push(`Pilar Financiero: Capacidad insuficiente. Faltan ${formatCurrency(diff)} para cubrir el presupuesto`);
        } else {
            warnings.push('Pilar Financiero: No has configurado tus indicadores financieros (Liquidez, Endeudamiento, Patrimonio)');
        }
    }

    // Pillar 3: Experiencia (Contratos Previos) - 40%
    const experienceMatch = await analyzeExperience(process, company, existingContracts);
    if (experienceMatch.hasExperience) {
        matchScore += 40;
        reasons.push(`Pilar Experiencia: Tienes ${experienceMatch.contractCount} contratos similares en este sector`);
    } else {
        warnings.push('Pilar Experiencia: No se encontraron contratos previos relacionados con los códigos UNSPSC del proceso');
    }

    // Dynamic Location Bonus (Extra 5 points cap at 100)
    const locationMatch = analyzeLocation(process, company);
    if (locationMatch.hasMatch) {
        matchScore += 5;
        reasons.push(`Ubicación: Proceso en ${locationMatch.region}, una zona favorable`);
    }

    // Pillar 4: Corporate vs Natural Person Filter
    const description = (process.descripci_n_del_procedimiento || "").toLowerCase();
    const personalServicesKeywords = ["apoyo a la gestión", "persona natural", "servicios personales", "auxiliar de", "apoyo administrativo"];
    const isNaturalPerson = personalServicesKeywords.some(key => description.includes(key));

    // Obra, Suministro and Compraventa are always corporate
    const corporateContracts = ["Obra", "Suministro", "Compraventa", "Consultoría", "Interventoría"];
    const isCorporateType = corporateContracts.some(type => process.tipo_de_contrato?.includes(type));

    // Use AI override if available, otherwise use rules
    const isCorporate = aiOverride?.isCorporate !== undefined ? aiOverride.isCorporate : (isCorporateType || !isNaturalPerson);

    if (!isCorporate) {
        matchScore = Math.max(0, matchScore - 40); // Heavy penalty for personal services
        warnings.push('Enfoque: Este contrato parece ser para una persona natural (Servicios personales)');
    }

    matchScore = Math.min(100, matchScore);

    // Strengthened Actionable detection
    const closedPhases = ['Adjudicado', 'Celebrado', 'Liquidado', 'Finalizado'];
    const closedStates = ['Adjudicado', 'Celebrado', 'Liquidado', 'No Adjudicado'];

    const isActuallyClosed =
        closedPhases.includes(process.fase || '') ||
        closedStates.includes(process.estado_del_proceso || '');

    const isActionable = aiOverride?.isActionable !== undefined
        ? aiOverride.isActionable
        : (process.fase === 'Presentación de oferta' && !isActuallyClosed);
    const isMatch = isCorporate && matchScore >= 60; // Increased threshold and must be corporate

    // Strategic AI Advice
    let advice = aiOverride?.advice || "";
    if (!advice) {
        if (!isActionable) {
            advice = `Estrategia: Este proceso ya no recibe ofertas (Fase: ${process.fase || 'Iniciada'}). Úsalo solo para análisis de mercado o histórico.`;
        } else if (matchScore < 60) {
            if (!unspscMatch.hasMatch) {
                advice = "Estrategia: Este proceso requiere códigos UNSPSC que no tienes registrados. Considera actualizar tu RUP o buscar un socio que ya cuente con estos códigos.";
            } else if (!capacityMatch.hasCapacity) {
                advice = "Estrategia: Tu capacidad financiera (K) es insuficiente para este monto. Recomendamos buscar un socio con mayor capital para presentarse en Consorcio o Unión Temporal.";
            } else if (!experienceMatch.hasExperience) {
                advice = "Estrategia: Tienes los códigos pero no la experiencia técnica demostrable. Busca una alianza estratégica con una empresa que aporte los contratos requeridos.";
            } else {
                advice = "Estrategia: El perfil de este proceso es retador. Una alianza con un socio estratégico aumentaría drásticamente tus probabilidades de éxito.";
            }
        } else if (matchScore < 90) {
            if (!capacityMatch.hasCapacity) {
                advice = "Tip: Tienes la experiencia pero la capacidad K está ajustada. Un socio financiero podría fortalecer tu oferta.";
            } else {
                advice = "Tip: Eres un buen candidato. Asegúrate de resaltar tu experiencia específica en los entregables técnicos.";
            }
        } else {
            advice = "Tip: Tienes un perfil excelente para este proceso. Enfócate en la competitividad de tu oferta económica.";
        }
    }

    return {
        isMatch,
        matchScore,
        reasons,
        warnings,
        advice,
        isCorporate,
        isActionable
    };
}

/**
 * Analyzes UNSPSC code compatibility
 */
function analyzeUNSPSCMatch(process: SecopProcess, company: CompanyData): {
    hasMatch: boolean;
    matchedCodes: string[];
} {
    const companyUNSPSC = company.unspsc_codes || [];

    if (companyUNSPSC.length === 0) {
        return { hasMatch: false, matchedCodes: [] };
    }

    // Extract UNSPSC from process description or codigo_principal_de_categoria
    const processUNSPSC = extractUNSPSCFromProcess(process);

    const matchedCodes: string[] = [];

    // Check for matches (first 4 digits = category match)
    for (const companyCode of companyUNSPSC) {
        const companyCategory = companyCode.slice(0, 4);

        for (const processCode of processUNSPSC) {
            const processCategory = processCode.slice(0, 4);

            if (companyCategory === processCategory) {
                matchedCodes.push(companyCode);
                break;
            }
        }
    }

    return {
        hasMatch: matchedCodes.length > 0,
        matchedCodes
    };
}

// extractUNSPSCFromProcess is now imported from match-helpers.ts

/**
 * Analyzes financial capacity to handle the tender
 */
function analyzeFinancialCapacity(process: SecopProcess, company: CompanyData): {
    hasCapacity: boolean;
    percentage: number;
    requiredCapacity: string;
    availableCapacity: string;
    requiredAmount: number;
    availableAmount: number;
} {
    const tenderAmount = parseFloat(process.precio_base || '0');

    if (!company.financial_indicators || tenderAmount === 0) {
        return {
            hasCapacity: false,
            percentage: 0,
            requiredCapacity: formatCurrency(tenderAmount),
            availableCapacity: '$0',
            requiredAmount: tenderAmount,
            availableAmount: 0
        };
    }

    const capacity = calculateCapacity(company);

    // Check if company has at least 100% of the tender amount in capacity
    const percentage = Math.round((capacity / tenderAmount) * 100);
    const hasCapacity = capacity >= tenderAmount;

    return {
        hasCapacity,
        percentage,
        requiredCapacity: formatCurrency(tenderAmount),
        availableCapacity: formatCurrency(capacity),
        requiredAmount: tenderAmount,
        availableAmount: capacity
    };
}

/**
 * Analyzes if the company has previous experience in similar projects
 */
async function analyzeExperience(process: SecopProcess, company: CompanyData, existingContracts?: Contract[]): Promise<{
    hasExperience: boolean;
    contractCount: number;
}> {
    const processUNSPSC = extractUNSPSCFromProcess(process);

    if (processUNSPSC.length === 0) {
        return { hasExperience: false, contractCount: 0 };
    }

    // Get company contracts (use cache if provided)
    const contracts = existingContracts || await getCompanyContracts();
    const experienceByUNSPSC = getExperienceByUNSPSC(contracts);

    // Count contracts in matching UNSPSC categories
    let contractCount = 0;

    for (const processCode of processUNSPSC) {
        const processCategory = processCode.slice(0, 4);

        for (const [companyCode, data] of Object.entries(experienceByUNSPSC)) {
            const companyCategory = companyCode.slice(0, 4);

            if (companyCategory === processCategory) {
                contractCount += data.count;
            }
        }
    }

    return {
        hasExperience: contractCount > 0,
        contractCount
    };
}

/**
 * Analyzes location/region compatibility (basic implementation)
 */
function analyzeLocation(process: SecopProcess, company: CompanyData): {
    hasMatch: boolean;
    region: string;
} {
    // This is a simplified version
    // In a real implementation, you'd compare process location with company's operational regions

    // For now, we'll just mark it as matched if process has a location
    const region = process.departamento_entidad || process.ciudad_entidad || '';

    return {
        hasMatch: Boolean(region),
        region
    };
}

/**
 * Format currency helper
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount);
}
