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
}

// Using "SECOP II - Procesos de Contratación" dataset
const SOCRATA_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN; // Optional but recommended

export async function searchSecopProcesses(query: string, limit: number = 20): Promise<SecopProcess[]> {
    try {
        // Filter by 'Presentación de oferta' to show active opportunities
        const whereClause = `fase = 'Presentación de oferta'`;

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

        const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });

        if (!response.ok) {
            throw new Error(`Socrata API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data as SecopProcess[];

    } catch (error) {
        console.error("Error fetching SECOP data:", error);
        return [];
    }
}

export async function getMarketMetrics(query: string) {
    // Example aggregation query
    // Calculate average amount and count
    try {
        const whereClause = `fase = 'Presentación de oferta'`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$select", "count(*) as count, avg(precio_base) as avg_amount");
        url.searchParams.append("$q", query);
        url.searchParams.append("$where", whereClause);

        const response = await fetch(url.toString());
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

        // Search for active processes in company's sectors
        // Use full UNSPSC codes for exact matching as prefix search (4 digits) might fail
        const searchQuery = unspscCodes.join(' OR ');

        const whereClause = `fase = 'Presentación de oferta'`;

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
