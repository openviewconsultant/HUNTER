"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus, Building2, Edit2, Check, LayoutGrid, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { saveCompanyInfo } from "./actions";
import { DocumentUpload, UploadedFile } from "./document-upload";

const tabs = [
    { id: "overview", label: "Resumen General", icon: LayoutGrid },
    { id: "info", label: "Información de la Empresa", icon: Building2 },
    { id: "legal", label: "Documentos Legales", icon: ShieldCheck },
    { id: "financial", label: "Información Financiera", icon: DollarSign },
    { id: "technical", label: "Experiencia Técnica", icon: FileText },
];

interface CompanyFormProps {
    company?: any;
}

type DocumentCategory = 'legal' | 'financial' | 'technical';

export default function CompanyForm({ company }: CompanyFormProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [dragActive, setDragActive] = useState(false);
    const [isEditing, setIsEditing] = useState(!company);

    // Estado separado para documentos por categoría
    const [documentsByCategory, setDocumentsByCategory] = useState<Record<DocumentCategory, UploadedFile[]>>({
        legal: [],
        financial: [],
        technical: []
    });

    const handleAddFiles = (category: DocumentCategory, files: File[]) => {
        const newFiles: UploadedFile[] = files.map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            status: 'uploading',
            progress: 0
        }));

        setDocumentsByCategory(prev => ({
            ...prev,
            [category]: [...prev[category], ...newFiles]
        }));

        // Simulate upload progress for each file
        newFiles.forEach(file => {
            simulateUpload(category, file.id);
        });
    };

    const simulateUpload = (category: DocumentCategory, fileId: string) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
                    )
                }));
            } else {
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === fileId ? { ...f, progress } : f
                    )
                }));
            }
        }, 200);
    };

    const handleRemoveFile = (category: DocumentCategory, fileId: string) => {
        setDocumentsByCategory(prev => ({
            ...prev,
            [category]: prev[category].filter(f => f.id !== fileId)
        }));
    };

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
                    {activeTab === "overview" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Company Info Summary Card */}
                            <div className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-foreground">Información de la Empresa</h3>
                                        </div>
                                        {company && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                <Check className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-primary font-medium">Completado</span>
                                            </div>
                                        )}
                                    </div>

                                    {company ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Empresa</p>
                                                <p className="text-foreground font-medium">{company.company_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">NIT</p>
                                                <p className="text-foreground font-medium">{company.nit}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Representante Legal</p>
                                                <p className="text-foreground font-medium">{company.legal_representative}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Sector Económico</p>
                                                <p className="text-foreground font-medium">{company.economic_sector}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4">
                                            <p className="text-muted-foreground mb-4">Aún no has completado la información de tu empresa.</p>
                                            <button
                                                onClick={() => setActiveTab("info")}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                            >
                                                Completar Información
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Legal Documents */}
                                <div className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow">
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-semibold text-foreground">Documentos Legales</h4>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Archivos</span>
                                                <span className="text-lg font-bold text-foreground">
                                                    {documentsByCategory.legal.length}
                                                </span>
                                            </div>

                                            {documentsByCategory.legal.length > 0 ? (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                    <Check className="w-3 h-3 text-primary" />
                                                    <span className="text-xs text-primary font-medium">Documentos cargados</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    <span className="text-xs text-muted-foreground">Sin documentos</span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveTab("legal")}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground rounded-lg transition-colors mt-4"
                                            >
                                                Ver Detalles
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Documents */}
                                <div className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow">
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-semibold text-foreground">Info. Financiera</h4>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Archivos</span>
                                                <span className="text-lg font-bold text-foreground">
                                                    {documentsByCategory.financial.length}
                                                </span>
                                            </div>

                                            {documentsByCategory.financial.length > 0 ? (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                    <Check className="w-3 h-3 text-primary" />
                                                    <span className="text-xs text-primary font-medium">Documentos cargados</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    <span className="text-xs text-muted-foreground">Sin documentos</span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveTab("financial")}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground rounded-lg transition-colors mt-4"
                                            >
                                                Ver Detalles
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Technical Documents */}
                                <div className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow">
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <h4 className="font-semibold text-foreground">Exp. Técnica</h4>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Archivos</span>
                                                <span className="text-lg font-bold text-foreground">
                                                    {documentsByCategory.technical.length}
                                                </span>
                                            </div>

                                            {documentsByCategory.technical.length > 0 ? (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                    <Check className="w-3 h-3 text-primary" />
                                                    <span className="text-xs text-primary font-medium">Documentos cargados</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    <span className="text-xs text-muted-foreground">Sin documentos</span>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveTab("technical")}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground rounded-lg transition-colors mt-4"
                                            >
                                                Ver Detalles
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

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
                        <DocumentUpload
                            title={documentCategories[activeTab as keyof typeof documentCategories]?.title}
                            description={documentCategories[activeTab as keyof typeof documentCategories]?.description}
                            icon={
                                activeTab === "legal" ? <ShieldCheck className="w-5 h-5 text-primary" /> :
                                    activeTab === "financial" ? <DollarSign className="w-5 h-5 text-primary" /> :
                                        <FileText className="w-5 h-5 text-primary" />
                            }
                            category={activeTab}
                            files={documentsByCategory[activeTab as DocumentCategory] || []}
                            onAddFiles={(files) => handleAddFiles(activeTab as DocumentCategory, files)}
                            onRemoveFile={(fileId) => handleRemoveFile(activeTab as DocumentCategory, fileId)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
