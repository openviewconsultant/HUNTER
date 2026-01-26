'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjectsWithBudgets() {
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

    const { data: projects } = await supabase
        .from('projects')
        .select(`
            *,
            apu_budgets (*)
        `)
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

    return projects || [];
}

export async function createApuBudget(projectId: string, name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

    if (!company) throw new Error("Company not found");

    const { data, error } = await supabase
        .from('apu_budgets')
        .insert({
            project_id: projectId,
            company_id: company.id,
            name
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/dashboard/apu');
    return data;
}

export async function getApuBudgetDetails(budgetId: string) {
    const supabase = await createClient();
    const { data: budget, error } = await supabase
        .from('apu_budgets')
        .select(`
            *,
            apu_items (
                *,
                apu_resources (*)
            )
        `)
        .eq('id', budgetId)
        .single();

    if (error) throw error;
    return budget;
}

export async function addApuItem(budgetId: string, data: any) {
    const supabase = await createClient();
    const { data: item, error } = await supabase
        .from('apu_items')
        .insert({
            budget_id: budgetId,
            description: data.description,
            unit: data.unit,
            quantity: data.quantity || 1,
            unit_price: 0,
            total_price: 0
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath(`/dashboard/apu/${budgetId}`);
    return item;
}

export async function addApuResource(itemId: string, data: any) {
    const supabase = await createClient();
    const { data: resource, error } = await supabase
        .from('apu_resources')
        .insert({
            item_id: itemId,
            type: data.type,
            description: data.description,
            unit: data.unit,
            quantity: data.quantity || 1,
            unit_cost: data.unit_cost || 0,
            total_cost: (data.quantity || 1) * (data.unit_cost || 0)
        })
        .select()
        .single();

    if (error) throw error;

    // 1. Recalculate Item unit_price and total_price
    const { data: siblingResources } = await supabase
        .from('apu_resources')
        .select('total_cost')
        .eq('item_id', itemId);

    const newUnitPrice = siblingResources?.reduce((sum, r) => sum + Number(r.total_cost), 0) || 0;

    const { data: item } = await supabase
        .from('apu_items')
        .select('quantity, budget_id')
        .eq('id', itemId)
        .single();

    if (item) {
        const newTotalPrice = newUnitPrice * Number(item.quantity);
        await supabase
            .from('apu_items')
            .update({
                unit_price: newUnitPrice,
                total_price: newTotalPrice
            })
            .eq('id', itemId);

        // 2. Recalculate Budget total_cost
        const { data: siblingItems } = await supabase
            .from('apu_items')
            .select('total_price')
            .eq('budget_id', item.budget_id);

        const newBudgetTotal = siblingItems?.reduce((sum, i) => sum + Number(i.total_price), 0) || 0;

        await supabase
            .from('apu_budgets')
            .update({ total_cost: newBudgetTotal })
            .eq('id', item.budget_id);
    }

    revalidatePath(`/dashboard/apu-details`);
    return resource;
}
