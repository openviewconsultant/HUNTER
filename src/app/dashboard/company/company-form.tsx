"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus, Building2, Edit2, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { saveCompanyInfo } from "./actions";

const tabs = [
    { id: "info", label: "Información de la Empresa", icon: Building2 },
    { id: "legal", label: "Documentos Legales", icon: ShieldCheck },
    { id: "financial", label: "Información Financiera", icon: DollarSign },
    { id: "technical", label: "Experiencia Técnica", icon: FileText },
];

interface CompanyFormProps {
    company?: any;
}

export default function CompanyForm({ company }: CompanyFormProps) {
    const [activeTab, setActiveTab] = useState("info");
    const [dragActive, setDragActive] = useState(false);
    const [isEditing, setIsEditing] = useState(!company);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const documentCategories = {
        legal: {
            title: "Documentos Legales",
            description: "Certificados de existencia, RUT, cédula del representante legal",
        },
        financial: {
            title: "Información Financiera",
            description: "Estados financieros, declaraciones de renta",
        },
        technical: {
            title: "Experiencia Técnica",
            description: "Certificados de trabajos anteriores, experiencia relevante",
        },
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Perfil de Empresa</h1>
                    <p className="text-zinc-400">
                        Sube la documentación de tu empresa para que HUNTER pueda analizar tu capacidad de contratación.
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-white/10 mt-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "group flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap relative",
                                        isActive
                                            ? "border-primary text-foreground"
                                            : "border-transparent text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                        isActive
                                            ? "bg-primary/20 border border-primary/30"
                                            : "bg-white/5 border border-white/10 group-hover:bg-white/10"
                                    )}>
                                        <tab.icon className={cn(
                                            "w-4 h-4 transition-colors duration-300",
                                            isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-200"
                                        )} />
                                    </div>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto mt-6">
                <div className="min-h-[400px] pb-8">
                    {activeTab === "info" && (
                        <>
                            {!isEditing && company ? (
                                // Display Mode - Show Company Info
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl card-gradient-primary card-shimmer shadow-glow"
                                >
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-foreground">Información de la Empresa</h3>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Nombre de la Empresa</p>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-primary" />
                                                    {company.company_name}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">NIT</p>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-primary" />
                                                    {company.nit}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Representante Legal</p>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-primary" />
                                                    {company.legal_representative}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Sector Económico</p>
                                                <p className="text-foreground font-medium flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-primary" />
                                                    {company.economic_sector}
                                                </p>
                                            </div>
                                            {company.phone && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">Teléfono</p>
                                                    <p className="text-foreground font-medium flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary" />
                                                        {company.phone}
                                                    </p>
                                                </div>
                                            )}
                                            {company.country && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">País</p>
                                                    <p className="text-foreground font-medium flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary" />
                                                        {company.country}
                                                    </p>
                                                </div>
                                            )}
                                            {company.address && (
                                                <div className="space-y-2 md:col-span-2">
                                                    <p className="text-sm text-muted-foreground">Dirección</p>
                                                    <p className="text-foreground font-medium flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary" />
                                                        {company.address}
                                                    </p>
                                                </div>
                                            )}
                                            {company.city && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">Ciudad</p>
                                                    <p className="text-foreground font-medium flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary" />
                                                        {company.city}
                                                    </p>
                                                </div>
                                            )}
                                            {company.department && (
                                                <div className="space-y-2">
                                                    <p className="text-sm text-muted-foreground">Departamento</p>
                                                    <p className="text-foreground font-medium flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-primary" />
                                                        {company.department}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                // Edit Mode - Show Form
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow"
                                >
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold text-foreground">Información General</h3>
                                            {company && (
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </div>
                                        <form action={saveCompanyInfo} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                        Nombre de la Empresa *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="company_name"
                                                        defaultValue={company?.company_name}
                                                        placeholder="Ej. Tech Solutions SAS"
                                                        required
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                        NIT *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="nit"
                                                        defaultValue={company?.nit}
                                                        placeholder="900.123.456-7"
                                                        required
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                        Representante Legal *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="legal_representative"
                                                        defaultValue={company?.legal_representative}
                                                        placeholder="Juan Pérez"
                                                        required
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                                        Sector / Actividad Económica *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="economic_sector"
                                                        defaultValue={company?.economic_sector}
                                                        placeholder="Tecnología, Construcción, etc."
                                                        required
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Teléfono</label>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        defaultValue={company?.phone}
                                                        placeholder="+57 300 123 4567"
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">País</label>
                                                    <input
                                                        type="text"
                                                        name="country"
                                                        defaultValue={company?.country || "Colombia"}
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-2">Dirección</label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    defaultValue={company?.address}
                                                    placeholder="Calle 123 #45-67"
                                                    className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Ciudad</label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        defaultValue={company?.city}
                                                        placeholder="Bogotá"
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Departamento</label>
                                                    <input
                                                        type="text"
                                                        name="department"
                                                        defaultValue={company?.department}
                                                        placeholder="Cundinamarca"
                                                        className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors mt-6"
                                            >
                                                Guardar Información
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}

                    {activeTab !== "info" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {activeTab === "legal" && <ShieldCheck className="w-5 h-5 text-primary" />}
                                    {activeTab === "financial" && <DollarSign className="w-5 h-5 text-primary" />}
                                    {activeTab === "technical" && <FileText className="w-5 h-5 text-primary" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {documentCategories[activeTab as keyof typeof documentCategories]?.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {documentCategories[activeTab as keyof typeof documentCategories]?.description}
                                    </p>
                                </div>
                            </div>

                            {/* File upload area */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-12 text-center transition-colors",
                                    dragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-white/20 hover:border-white/40"
                                )}
                            >
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-zinc-400 mb-4" />
                                    <p className="text-zinc-400 mb-2">
                                        Arrastra tus archivos aquí o haz clic para seleccionar
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        Soporta PDF, Excel y Word hasta 50MB. Tus documentos están encriptados de extremo a extremo.
                                    </p>
                                    <button className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        Seleccionar Archivos
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
