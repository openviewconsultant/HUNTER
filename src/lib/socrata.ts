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
