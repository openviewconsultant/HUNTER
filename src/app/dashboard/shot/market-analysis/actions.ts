"use server";

import { searchSecopProcesses, getMarketMetrics } from "@/lib/socrata";

export async function searchMarketOpportunities(query: string) {
    if (!query) return [];
    return await searchSecopProcesses(query);
}

export async function getMarketInsights(query: string) {
    if (!query) return { count: 0, avg_amount: 0 };
    return await getMarketMetrics(query);
}
