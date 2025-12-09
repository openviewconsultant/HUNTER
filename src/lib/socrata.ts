export interface SecopProcess {
    id_del_proceso: string;
    referencia_del_proceso: string;
    entidad: string;
    descripci_n_del_procedimiento: string;
    fase: string;
    precio_base: string;
    fecha_de_publicacion_del: string;
    urlproceso: { url: string } | string;
    tipo_de_contrato: string;
    modalidad_de_contratacion: string;
    codigo_principal_de_categoria?: string; // UNSPSC code (e.g. V1.80111600)
    departamento_entidad?: string;
    ciudad_entidad?: string;
    nombre_del_proveedor?: string;
    valor_total_adjudicacion?: string;
}

// Using "SECOP II - Procesos de Contratación" dataset
const SOCRATA_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN; // Optional but recommended

export interface MarketFilters {
    minAmount?: number;
    maxAmount?: number;
    status?: 'active' | 'awarded' | 'all';
}

export async function searchSecopProcesses(query: string, limit: number = 20, filters?: MarketFilters): Promise<SecopProcess[]> {
    try {
        // Calculate date threshold (1 month ago for active, 6 months for awarded/history)
        const dateThreshold = new Date();
        const isHistorySearch = filters?.status === 'awarded' || filters?.status === 'all';
        dateThreshold.setMonth(dateThreshold.getMonth() - (isHistorySearch ? 6 : 1));

        const dateStr = dateThreshold.toISOString().split('T')[0];

        // Construct where clause
        let whereClause = `fecha_de_publicacion_del >= '${dateStr}'`;

        // Filter by Status/Phase
        if (filters?.status === 'active' || !filters?.status) {
            whereClause += ` AND fase = 'Presentación de oferta'`;
        } else if (filters?.status === 'awarded') {
            whereClause += ` AND (fase = 'Adjudicado' OR fase = 'Celebrado')`;
        }
        // If 'all', we don't restrict phase

        // Filters for Amount (Cuantía)
        // We handle this partially in API if possible, but safer in post-processing for mixed string/number types
        // However, SoQL supports numbers in text columns usually. Let's try to add if provided.
        if (filters?.minAmount) {
            whereClause += ` AND precio_base >= ${filters.minAmount}`;
        }
        if (filters?.maxAmount) {
            whereClause += ` AND precio_base <= ${filters.maxAmount}`;
        }

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", limit.toString());
        url.searchParams.append("$q", query);
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        console.log(`Querying SECOP: ${query} [${filters?.status || 'active'}]`);

        const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });

        if (!response.ok) {
            console.warn(`Socrata API warning: ${response.statusText}`);
            // Fallback for simple query if complex filter failed
            if (filters) {
                console.log("Retrying with simple query...");
                return searchSecopProcesses(query, limit); // Retry without filters
            }
            return [];
        }

        const data = await response.json();

        // Client-side filtering/validation
        const filteredData = data.filter((proc: SecopProcess) => {
            const price = parseFloat(proc.precio_base || '0');
            const hasValidPrice = price > 0;

            // Re-check amount filters just in case API returned string matches
            const minOk = !filters?.minAmount || price >= filters.minAmount;
            const maxOk = !filters?.maxAmount || price <= filters.maxAmount;

            return hasValidPrice && minOk && maxOk;
        });

        console.log(`SECOP returned ${data.length} items, ${filteredData.length} after filter`);

        return filteredData as SecopProcess[];

    } catch (error) {
        console.error("Error fetching SECOP data:", error);
        return [];
    }
}

export async function getMarketMetrics(query: string, filters?: MarketFilters) {
    // Aggregate metrics with filters
    try {
        // Calculate date threshold (same as search)
        const dateThreshold = new Date();
        const isHistorySearch = filters?.status === 'awarded' || filters?.status === 'all';
        dateThreshold.setMonth(dateThreshold.getMonth() - (isHistorySearch ? 6 : 1));
        const dateStr = dateThreshold.toISOString().split('T')[0];

        let whereClause = `fecha_de_publicacion_del >= '${dateStr}'`;

        // Apply filters
        if (filters?.status === 'active' || !filters?.status) {
            whereClause += ` AND fase = 'Presentación de oferta'`;
        } else if (filters?.status === 'awarded') {
            whereClause += ` AND (fase = 'Adjudicado' OR fase = 'Celebrado')`;
        }

        if (filters?.minAmount) {
            whereClause += ` AND precio_base >= ${filters.minAmount}`;
        }
        if (filters?.maxAmount) {
            whereClause += ` AND precio_base <= ${filters.maxAmount}`;
        }

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$select", "count(*) as count, avg(precio_base) as avg_amount");
        url.searchParams.append("$q", query);
        url.searchParams.append("$where", whereClause);

        const response = await fetch(url.toString(), { next: { revalidate: 3600 } });

        if (!response.ok) return { count: 0, avg_amount: 0 };

        const data = await response.json();

        return data[0] || { count: 0, avg_amount: 0 };

    } catch (error) {
        console.error("Error fetching metrics:", error);
        return { count: 0, avg_amount: 0 };
    }
}

// Search processes by entity name
export async function searchProcessesByEntity(entityName: string, limit: number = 50): Promise<SecopProcess[]> {
    try {
        // Search for active processes from specific entity
        const whereClause = `fase = 'Presentación de oferta' AND entidad LIKE '%${entityName}%'`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", limit.toString());
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });

        if (!response.ok) {
            console.error(`Socrata API error for entity ${entityName}: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data as SecopProcess[];

    } catch (error) {
        console.error(`Error fetching processes for entity ${entityName}:`, error);
        return [];
    }
}

// Get competitors by UNSPSC codes (finds companies participating in similar processes)
export async function getCompetitorsByUNSPSC(unspscCodes: string[], limit: number = 100): Promise<SecopProcess[]> {
    try {
        if (unspscCodes.length === 0) return [];

        // Search for processes with similar UNSPSC codes (using first 4 digits for category matching)
        const unspscPrefixes = [...new Set(unspscCodes.map(code => code.slice(0, 4)))];
        const searchQuery = unspscPrefixes.join(' OR ');

        const whereClause = `fase IN ('Adjudicado', 'Celebrado')`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", limit.toString());
        url.searchParams.append("$q", searchQuery);
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        const response = await fetch(url.toString(), { headers, next: { revalidate: 7200 } });

        if (!response.ok) {
            console.error(`Socrata API error for competitors: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data as SecopProcess[];

    } catch (error) {
        console.error("Error fetching competitors:", error);
        return [];
    }
}

// Get recent processes by UNSPSC codes (for alerts)
export async function getRecentProcessesByUNSPSC(unspscCodes: string[], daysBack: number = 7, limit: number = 20): Promise<SecopProcess[]> {
    try {
        if (unspscCodes.length === 0) return [];

        // Calculate date threshold
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysBack);
        const dateStr = dateThreshold.toISOString().split('T')[0];

        // Search for recent processes in company's sectors
        const unspscPrefixes = [...new Set(unspscCodes.map(code => code.slice(0, 4)))];
        const searchQuery = unspscPrefixes.join(' OR ');

        const whereClause = `fase = 'Presentación de oferta' AND fecha_de_publicacion_del >= '${dateStr}'`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", limit.toString());
        url.searchParams.append("$q", searchQuery);
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        const response = await fetch(url.toString(), { headers, next: { revalidate: 1800 } });

        if (!response.ok) {
            console.error(`Socrata API error for recent processes: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data as SecopProcess[];

    } catch (error) {
        console.error("Error fetching recent processes:", error);
        return [];
    }
}

// Search active opportunities by UNSPSC codes
export async function searchOpportunitiesByUNSPSC(unspscCodes: string[], limit: number = 50): Promise<SecopProcess[]> {
    try {
        if (unspscCodes.length === 0) return [];

        // Calculate date threshold (1 month ago - more strict to show only recent/active)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const dateThreshold = oneMonthAgo.toISOString().split('T')[0];

        // Search for active processes in company's sectors
        // Use LIKE to match codes regardless of version prefix (e.g. V1.80111600)
        // Construct OR clause for all codes
        const codeConditions = unspscCodes.map(code => `codigo_principal_de_categoria LIKE '%${code}%'`);
        const codesWhere = `(${codeConditions.join(' OR ')})`;

        // Apply same filters as searchSecopProcesses
        const whereClause = `fase = 'Presentación de oferta' AND ${codesWhere} AND fecha_de_publicacion_del >= '${dateThreshold}' AND precio_base > 0`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$limit", limit.toString());
        url.searchParams.append("$where", whereClause);
        url.searchParams.append("$order", "fecha_de_publicacion_del DESC");

        const headers: HeadersInit = {
            "Accept": "application/json",
        };

        if (APP_TOKEN) {
            headers["X-App-Token"] = APP_TOKEN;
        }

        const response = await fetch(url.toString(), { headers, next: { revalidate: 1800 } });

        if (!response.ok) {
            console.error(`Socrata API error for UNSPSC search: ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return data as SecopProcess[];

    } catch (error) {
        console.error("Error fetching opportunities by UNSPSC:", error);
        return [];
    }
}
