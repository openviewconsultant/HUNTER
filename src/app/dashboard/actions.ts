'use server';

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            activeMissions: 0,
            newAlerts: 0,
            documents: 0,
            upcomingDeadlines: 0,
            successRate: 0,
            totalInProcess: 0,
            recentMissions: [],
            recentNotifications: [],
            notifSummary: { mission: 0, alert: 0, document: 0, new_tender: 0 }
        };
    }

    try {
        // 1. Get user's profile and company
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) throw new Error("Profile not found");

        const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

        if (!company) {
            // If no company, return zeros but don't fail
            return {
                activeMissions: 0,
                newAlerts: 0,
                documents: 0,
                upcomingDeadlines: 0,
                successRate: 0,
                totalInProcess: 0,
                recentMissions: [],
                notifSummary: { mission: 0, alert: 0, document: 0, new_tender: 0 }
            };
        }

        // 2. Get active missions for the company
        const { data: recentMissions, count: activeMissions } = await supabase
            .from('projects')
            .select('name, deadline', { count: 'exact' })
            .eq('company_id', company.id)
            .eq('status', 'ACTIVE')
            .limit(2);

        // 3. Get unread notifications for the user
        const { data: notifications, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        const recentNotifications = notifications?.slice(0, 3) || [];
        const unreadNotifications = notifications?.filter(n => !n.read) || [];

        const notifSummary = {
            mission: unreadNotifications.filter(n => n.type === 'MISSION' || n.type === 'new_tender').length || 0,
            alert: unreadNotifications.filter(n => n.type === 'ALERT' || n.type === 'alert').length || 0,
            document: unreadNotifications.filter(n => n.type === 'DOCUMENT').length || 0,
            new_tender: unreadNotifications.filter(n => n.type === 'new_tender').length || 0,
        };
        const newAlerts = unreadNotifications.length || 0;

        // 4. Get documents count
        const { count: documentsCount } = await supabase
            .from('company_documents')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

        // 5. Get upcoming deadlines
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { count: upcomingDeadlines } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('status', 'ACTIVE')
            .lte('deadline', sevenDaysFromNow.toISOString());

        // 6. Calculate success rate
        const { data: completedProjects } = await supabase
            .from('projects')
            .select('status')
            .eq('company_id', company.id)
            .in('status', ['WON', 'LOST']);

        const totalCompleted = completedProjects?.length || 0;
        const won = completedProjects?.filter(p => p.status === 'WON').length || 0;
        const successRate = totalCompleted > 0 ? Math.round((won / totalCompleted) * 100) : 0;

        // 7. Total value in active projects
        const { data: activeProjects } = await supabase
            .from('projects')
            .select('id, budget, tender:tender_id(amount)')
            .eq('company_id', company.id)
            .eq('status', 'ACTIVE');

        const totalInProcess = activeProjects?.reduce((sum, project) => {
            const tenderAmount = (project.tender as any)?.amount || 0;
            return sum + (Number(project.budget) || Number(tenderAmount) || 0);
        }, 0) || 0;

        return {
            activeMissions: activeMissions || 0,
            newAlerts: (newAlerts || 0),
            documents: documentsCount || 0,
            upcomingDeadlines: upcomingDeadlines || 0,
            successRate,
            totalInProcess,
            recentMissions: recentMissions || [],
            recentNotifications,
            notifSummary
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            activeMissions: 0,
            newAlerts: 0,
            documents: 0,
            upcomingDeadlines: 0,
            successRate: 0,
            totalInProcess: 0,
            recentMissions: [],
            recentNotifications: [],
            notifSummary: { mission: 0, alert: 0, document: 0, new_tender: 0 }
        };
    }
}
