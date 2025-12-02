import { SecopProcess } from "@/lib/socrata";

/**
 * Extracts UNSPSC codes from process data
 */
export function extractUNSPSCFromProcess(process: SecopProcess): string[] {
    const codes: string[] = [];

    // Try to extract from codigo_principal_de_categoria
    if (process.codigo_principal_de_categoria) {
        let code = process.codigo_principal_de_categoria.toString();

        // Remove "V1." prefix if present (e.g. V1.80111600 -> 80111600)
        if (code.startsWith('V1.')) {
            code = code.substring(3);
        }

        if (code && code.length >= 4) {
            codes.push(code);
        }
    }

    return codes;
}

/**
 * Extracts potential deliverables or key activities from the process description
 * This ensures we use REAL data from Socrata instead of hardcoded suggestions.
 */
export function getSuggestedDeliverables(process: SecopProcess): string[] {
    const description = process.descripci_n_del_procedimiento || '';
    if (!description) return [];

    // 1. Clean and normalize text
    let text = description
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Split by common delimiters to find distinct activities
    // We look for separators like ";", ".", " y ", " e ", ","
    const parts = text.split(/;|\.| y | e |,| incluyendo | para | con /i);

    // 3. Filter and clean parts to find "deliverable-like" phrases
    const candidates = parts
        .map(part => part.trim())
        .filter(part => {
            // Filter out short or irrelevant parts
            if (part.length < 4) return false;
            if (part.length > 100) return false; // Too long to be a single item

            const lower = part.toLowerCase();
            // Filter out common connector words or non-deliverables if they appear alone
            const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'en', 'a', 'que', 'objeto', 'contratar'];
            if (stopWords.includes(lower)) return false;

            return true;
        })
        .map(part => {
            // Capitalize first letter
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });

    // 4. Remove duplicates
    const uniqueDeliverables = [...new Set(candidates)];

    // 5. If we have too few, we might want to return the whole description as one item (if short)
    // or fall back to a generic "Ver pliegos" if it's too complex to parse.
    // But the user specifically asked for "real data", so we stick to what we extracted.

    // Limit to top 6 most relevant-looking ones
    return uniqueDeliverables.slice(0, 6);
}
