export interface SecopProcess {
    id_del_proceso: string;
    referencia_del_proceso: string;
    nombre_de_la_entidad: string;
    objeto_del_proceso: string;
    estado_del_proceso: string;
    cuantia_proceso: string;
    fecha_de_publicacion_del: string;
    urlproceso: string;
    tipo_de_contrato: string;
    modalidad_de_contratacion: string;
}

const SOCRATA_API_URL = "https://www.datos.gov.co/resource/jbjy-vk9h.json";
const APP_TOKEN = process.env.SOCRATA_APP_TOKEN; // Optional but recommended

export async function searchSecopProcesses(query: string, limit: number = 20): Promise<SecopProcess[]> {
    try {
        // Construct SoQL query
        // We search in 'objeto_del_proceso' or 'nombre_de_la_entidad'
        // Filter by recent processes (e.g., last 3 months) could be added

        const whereClause = `(lower(objeto_del_proceso) like '%${query.toLowerCase()}%' OR lower(nombre_de_la_entidad) like '%${query.toLowerCase()}%') AND estado_del_proceso = 'Presentación de oferta'`;

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
        const whereClause = `(lower(objeto_del_proceso) like '%${query.toLowerCase()}%') AND estado_del_proceso = 'Presentación de oferta'`;

        const url = new URL(SOCRATA_API_URL);
        url.searchParams.append("$select", "count(*) as count, avg(cuantia_proceso) as avg_amount");
        url.searchParams.append("$where", whereClause);

        const response = await fetch(url.toString());
        const data = await response.json();

        return data[0] || { count: 0, avg_amount: 0 };

    } catch (error) {
        console.error("Error fetching metrics:", error);
        return { count: 0, avg_amount: 0 };
    }
}
