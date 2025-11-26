"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus, Building2, Edit2, Check, LayoutGrid, ArrowRight, Trash2, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { saveCompanyInfo, generateDocumentSummary, uploadCompanyDocument, listCompanyDocuments, deleteCompanyDocument } from "./actions";
import { testDatabaseConnection } from "./test-db";
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
    const [selectedDocument, setSelectedDocument] = useState<UploadedFile | null>(null);

    // Estado separado para documentos por categoría
    const [documentsByCategory, setDocumentsByCategory] = useState<Record<DocumentCategory, UploadedFile[]>>({
        legal: [],
        financial: [],
        technical: []
    });

    useEffect(() => {
        const loadDocuments = async () => {
            try {
                // Test database connection first
                const testResult = await testDatabaseConnection();
                console.log("🔍 Database test:", testResult);

                const docs = await listCompanyDocuments();
                console.log("📄 Documents loaded:", docs);

                setDocumentsByCategory(prev => ({
                    ...prev,
                    legal: docs.legal as UploadedFile[],
                    financial: docs.financial as UploadedFile[],
                    technical: docs.technical as UploadedFile[]
                }));
            } catch (error) {
                console.error("❌ Error loading documents:", error);
            }
        };
        loadDocuments();
    }, []);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

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

        // Process each file
        newFiles.forEach(async (uploadedFile, index) => {
            const originalFile = files[index];

            // Step 1: Simulate initial upload progress for UX
            let currentProgress = 0;
            const uploadInterval = setInterval(() => {
                currentProgress += Math.random() * 10;
                if (currentProgress >= 90) {
                    currentProgress = 90;
                    clearInterval(uploadInterval);
                }
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === uploadedFile.id ? { ...f, progress: currentProgress } : f
                    )
                }));
            }, 200);

            try {
                // Step 2: Upload to Supabase Storage
                const formData = new FormData();
                formData.append('file', originalFile);
                formData.append('category', category);

                const uploadResult = await uploadCompanyDocument(formData);

                clearInterval(uploadInterval);

                // Update progress to 95%
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === uploadedFile.id ? { ...f, progress: 95 } : f
                    )
                }));

                // Step 3: Generate AI Summary
                // Now we pass null for base64 and the storage path so the server downloads it
                // This avoids the "Unterminated string in JSON" error for large files
                const summaryResult = await generateDocumentSummary(
                    null,
                    originalFile.type,
                    category,
                    uploadResult.path,
                    uploadResult.dbId // Pass DB ID so summary can be saved
                );

                // Step 4: Complete with summary and real URL
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === uploadedFile.id ? {
                            ...f,
                            status: 'completed',
                            progress: 100,
                            summary: summaryResult.summary,
                            // Store the real URL if needed in the future, currently UploadedFile interface might need update
                            // url: uploadResult.url 
                        } : f
                    )
                }));
            } catch (error) {
                console.error("Error processing document:", error);
                clearInterval(uploadInterval);
                setDocumentsByCategory(prev => ({
                    ...prev,
                    [category]: prev[category].map(f =>
                        f.id === uploadedFile.id ? {
                            ...f,
                            status: 'error',
                            progress: 0
                        } : f
                    )
                }));
            }
        });
    };

    const handleFileUpload = (file: File, category: DocumentCategory) => {
        handleAddFiles(category, [file]);
    };

    const handleRemoveFile = async (category: DocumentCategory, fileId: string) => {
        // Optimistic update
        setDocumentsByCategory(prev => ({
            ...prev,
            [category]: prev[category].filter(f => f.id !== fileId)
        }));

        try {
            await deleteCompanyDocument(fileId);
            console.log("✅ Document deleted successfully");
        } catch (error) {
            console.error("❌ Error deleting document:", error);
            // Revert changes if needed, but for now just log error
            // In a real app we might want to show a toast and restore the file
        }
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
        <div className="h-[calc(100vh-8rem)] flex flex-col mr-4">
            {/* Fixed Header */}
            <div className="flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Perfil de Empresa</h1>
                    <p className="text-zinc-400">
                        Sube la documentación de tu empresa para que HUNTER pueda analizar tu capacidad de contratación.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 p-4 rounded-xl bg-white/5 border-2 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Completitud del Perfil</h3>
                            <p className="text-xs text-zinc-500">Completa tu información para mejorar tus oportunidades</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                                {(() => {
                                    // Calculate completion percentage
                                    let completed = 0;
                                    let total = 7; // Total sections to complete

                                    // Check company basic info (5 required fields)
                                    if (company?.company_name) completed += 0.2;
                                    if (company?.nit) completed += 0.2;
                                    if (company?.legal_representative) completed += 0.2;
                                    if (company?.economic_sector) completed += 0.2;
                                    if (company?.address && company?.city) completed += 0.2;

                                    // Check documents
                                    if (documentsByCategory.legal.length > 0) completed += 1;
                                    if (documentsByCategory.financial.length > 0) completed += 1;
                                    if (documentsByCategory.technical.length > 0) completed += 1;

                                    const percentage = Math.round((completed / 4) * 100);
                                    return percentage;
                                })()}%
                            </p>
                            <p className="text-xs text-zinc-500">completado</p>
                        </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-primary/60"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(() => {
                                    let completed = 0;
                                    if (company?.company_name) completed += 0.2;
                                    if (company?.nit) completed += 0.2;
                                    if (company?.legal_representative) completed += 0.2;
                                    if (company?.economic_sector) completed += 0.2;
                                    if (company?.address && company?.city) completed += 0.2;
                                    if (documentsByCategory.legal.length > 0) completed += 1;
                                    if (documentsByCategory.financial.length > 0) completed += 1;
                                    if (documentsByCategory.technical.length > 0) completed += 1;
                                    return Math.round((completed / 4) * 100);
                                })()}%`
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>

                    {/* Completion Checklist */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={cn(
                            "flex items-center gap-2 text-xs",
                            company?.company_name && company?.nit ? "text-primary" : "text-zinc-500"
                        )}>
                            {company?.company_name && company?.nit ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                            )}
                            <span>Info Básica</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 text-xs",
                            documentsByCategory.legal.length > 0 ? "text-primary" : "text-zinc-500"
                        )}>
                            {documentsByCategory.legal.length > 0 ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                            )}
                            <span>Docs. Legales</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 text-xs",
                            documentsByCategory.financial.length > 0 ? "text-primary" : "text-zinc-500"
                        )}>
                            {documentsByCategory.financial.length > 0 ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                            )}
                            <span>Info. Financiera</span>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 text-xs",
                            documentsByCategory.technical.length > 0 ? "text-primary" : "text-zinc-500"
                        )}>
                            {documentsByCategory.technical.length > 0 ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />
                            )}
                            <span>Exp. Técnica</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-white/10 mt-8">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap relative",
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
            <div className="flex-1 overflow-y-auto mt-6 pr-4">
                <div className="min-h-[400px] pb-8 max-w-full">
                    {activeTab === "overview" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Company Info Summary Card */}
                            <div className="p-4 rounded-2xl card-gradient card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                                                <Building2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">Información de la Empresa</h3>
                                        </div>
                                        {company && (
                                            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                <Check className="w-3 h-3 text-primary" />
                                                <span className="text-xs text-primary font-medium">Completado</span>
                                            </div>
                                        )}
                                    </div>

                                    {company ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground">Empresa</p>
                                                <p className="text-sm text-foreground font-medium">{company.company_name}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground">NIT</p>
                                                <p className="text-sm text-foreground font-medium">{company.nit}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground">Representante Legal</p>
                                                <p className="text-sm text-foreground font-medium">{company.legal_representative}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground">Sector Económico</p>
                                                <p className="text-sm text-foreground font-medium">{company.economic_sector}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <p className="text-sm text-muted-foreground mb-3">Aún no has completado la información de tu empresa.</p>
                                            <button
                                                onClick={() => setActiveTab("info")}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg transition-colors"
                                            >
                                                Completar Información
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "info" && (
                        <>
                            {!isEditing && company ? (
                                // Display Mode - Show Company Name Only
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 rounded-2xl card-gradient card-shimmer shadow-glow"
                                >
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                                                    <Building2 className="w-8 h-8 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Empresa registrada</p>
                                                    <h3 className="text-2xl font-bold text-foreground">{company.company_name}</h3>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                // Edit Mode - Show Form
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 rounded-2xl card-gradient card-shimmer shadow-glow"
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

                    {/* Legal Documents Tab */}
                    {activeTab === "legal" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-6 rounded-2xl card-gradient card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground">Documentos Legales</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Certificados de existencia, RUT, cédula del representante legal
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="legal-upload"
                                                className="hidden"
                                                multiple
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    files.forEach(file => handleFileUpload(file, 'legal'));
                                                }}
                                            />
                                            <label
                                                htmlFor="legal-upload"
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Anexar Documentos
                                            </label>
                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.legal.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {documentsByCategory.legal.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <button
                                                                onClick={() => setSelectedDocument(file)}
                                                                className="hover:bg-primary/10 p-1 rounded-lg transition-colors"
                                                            >
                                                                <FileText className="w-8 h-8 text-primary flex-shrink-0 cursor-pointer" />
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {(file.size / 1024).toFixed(2)} KB
                                                                </p>
                                                                {file.summary && (
                                                                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                            <span className="text-xs font-medium text-primary">Análisis IA</span>
                                                                        </div>
                                                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                                                            {file.summary}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFile('legal', file.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No has subido documentos legales aún</p>
                                            <p className="text-sm text-muted-foreground mt-1">Haz clic en "Anexar Documentos" para comenzar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Financial Documents Tab */}
                    {activeTab === "financial" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-6 rounded-2xl card-gradient card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground">Información Financiera</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Estados financieros, declaraciones de renta
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="financial-upload"
                                                className="hidden"
                                                multiple
                                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    files.forEach(file => handleFileUpload(file, 'financial'));
                                                }}
                                            />
                                            <label
                                                htmlFor="financial-upload"
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Anexar Documentos
                                            </label>
                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.financial.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {documentsByCategory.financial.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <button
                                                                onClick={() => setSelectedDocument(file)}
                                                                className="hover:bg-primary/10 p-1 rounded-lg transition-colors"
                                                            >
                                                                <DollarSign className="w-8 h-8 text-primary flex-shrink-0 cursor-pointer" />
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {(file.size / 1024).toFixed(2)} KB
                                                                </p>
                                                                {file.summary && (
                                                                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                            <span className="text-xs font-medium text-primary">Análisis IA</span>
                                                                        </div>
                                                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                                                            {file.summary}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFile('financial', file.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No has subido documentos financieros aún</p>
                                            <p className="text-sm text-muted-foreground mt-1">Haz clic en "Anexar Documentos" para comenzar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Technical Documents Tab */}
                    {activeTab === "technical" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-6 rounded-2xl card-gradient card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground">Experiencia Técnica</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Certificados de trabajos anteriores, experiencia relevante
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="technical-upload"
                                                className="hidden"
                                                multiple
                                                accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    files.forEach(file => handleFileUpload(file, 'technical'));
                                                }}
                                            />
                                            <label
                                                htmlFor="technical-upload"
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Anexar Documentos
                                            </label>
                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.technical.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {documentsByCategory.technical.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <button
                                                                onClick={() => setSelectedDocument(file)}
                                                                className="hover:bg-primary/10 p-1 rounded-lg transition-colors"
                                                            >
                                                                <FileText className="w-8 h-8 text-primary flex-shrink-0 cursor-pointer" />
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {(file.size / 1024).toFixed(2)} KB
                                                                </p>
                                                                {file.summary && (
                                                                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                            <span className="text-xs font-medium text-primary">Análisis IA</span>
                                                                        </div>
                                                                        <p className="text-xs text-zinc-300 leading-relaxed">
                                                                            {file.summary}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFile('technical', file.id)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground">No has subido documentos técnicos aún</p>
                                            <p className="text-sm text-muted-foreground mt-1">Haz clic en "Anexar Documentos" para comenzar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}


                </div>
            </div>

            {/* Document Summary Modal */}
            {selectedDocument && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedDocument(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-primary/20 to-cyan-500/20 border-b border-primary/30 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{selectedDocument.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {(selectedDocument.size / 1024).toFixed(2)} KB · {selectedDocument.uploadDate.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDocument(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
                                        <path d="M18 6 6 18"></path>
                                        <path d="m6 6 12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* AI Summary Section */}
                            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <h4 className="text-sm font-semibold text-primary">Análisis con IA - Gemini</h4>
                                </div>
                                {selectedDocument.summary ? (
                                    <p className="text-sm text-zinc-200 leading-relaxed">
                                        {selectedDocument.summary}
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span>Generando resumen...</span>
                                    </div>
                                )}
                            </div>

                            {/* Document Details */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detalles del Documento</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Estado</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {selectedDocument.status === 'completed' ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span className="text-green-400">Completado</span>
                                                </>
                                            ) : selectedDocument.status === 'uploading' ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                    <span className="text-blue-400">Subiendo...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                    <span className="text-red-400">Error</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Progreso</p>
                                        <p className="text-foreground font-medium mt-1">{selectedDocument.progress}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
