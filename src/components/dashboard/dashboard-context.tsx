"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DashboardContextType {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed !== null) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setIsCollapsed(savedCollapsed === "true");
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    return (
        <DashboardContext.Provider value={{ isCollapsed, toggleCollapse }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
