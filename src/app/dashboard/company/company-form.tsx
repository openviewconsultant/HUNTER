"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus, Building2, Edit2, Check, LayoutGrid, ArrowRight, Trash2, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { saveCompanyInfo, generateDocumentSummary, uploadCompanyDocument, listCompanyDocuments, deleteCompanyDocument, saveContract, listCompanyContracts, deleteContract } from "./actions";
import { testDatabaseConnection } from "./test-db";
import { DocumentUpload, UploadedFile } from "./document-upload";

const tabs = [
    { id: "overview", label: "Resumen General", icon: LayoutGrid },
    { id: "info", label: "Información de la Empresa", icon: Building2 },
    { id: "legal", label: "Documentos Legales", icon: ShieldCheck },
    { id: "financial", label: "Información Financiera", icon: DollarSign },
    { id: "technical", label: "Experiencia Técnica", icon: FileText },
    { id: "capacity", label: "Capacidad de Contratación", icon: Check },
];

interface CompanyFormProps {
    company?: any;
}

type DocumentCategory = 'legal' | 'financial' | 'technical';

interface Contract {
    id: string;
    contract_number: string;
    client_name: string;
    contract_value: number;
    contract_value_smmlv: number | null;
    execution_date: string | null;
    unspsc_codes: string[] | null;
    description: string | null;
    document_url: string | null;
    document_name: string | null;
    created_at: string;
}

export default function CompanyForm({ company }: CompanyFormProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [dragActive, setDragActive] = useState(false);
    const [isEditing, setIsEditing] = useState(!company);
    const [selectedDocument, setSelectedDocument] = useState<UploadedFile | null>(null);
    const [documentModalOpen, setDocumentModalOpen] = useState<{ category: string; open: boolean }>({ category: '', open: false });
    const [uploadModalOpen, setUploadModalOpen] = useState<{ category: string; open: boolean }>({ category: '', open: false });
    const [isEditingFinancial, setIsEditingFinancial] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isAddingContract, setIsAddingContract] = useState(false);

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

        const loadContracts = async () => {
            try {
                const contractsData = await listCompanyContracts();
                console.log("📝 Contracts loaded:", contractsData);
                setContracts(contractsData as Contract[]);
            } catch (error) {
                console.error("❌ Error loading contracts:", error);
            }
        };

        loadDocuments();
        loadContracts();
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
                <div className="border-b border-white/10 mt-8 w-full">
                    <div className="flex gap-4 overflow-x-auto pb-2 w-full max-w-full scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 min-w-0 flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group relative overflow-hidden",
                                        activeTab === tab.id
                                            ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                            : "bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
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
                                        <div className="flex items-center gap-2">
                                            {company && (
                                                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                                                    <Check className="w-3 h-3 text-primary" />
                                                    <span className="text-xs text-primary font-medium">Completado</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setActiveTab("info");
                                                    setIsEditing(true);
                                                }}
                                                className="p-1.5 hover:bg-white/10 text-primary rounded-lg transition-colors"
                                                title="Editar Información"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {documentsByCategory.legal.length > 0 && (
                                                <button
                                                    onClick={() => setDocumentModalOpen({ category: 'legal', open: true })}
                                                    className="p-1.5 hover:bg-white/10 text-primary rounded-lg transition-colors"
                                                    title="Ver Documentos"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>


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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">País</label>
                                                    <input
                                                        type="text"
                                                        name="country"
                                                        defaultValue={company?.country || "Colombia"}
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                    className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Departamento</label>
                                                    <input
                                                        type="text"
                                                        name="department"
                                                        defaultValue={company?.department}
                                                        placeholder="Cundinamarca"
                                                        className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
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
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-foreground">Documentos Legales</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Documentos requeridos para acreditar la capacidad jurídica de tu empresa
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {documentsByCategory.legal.length} documento(s) subido(s)
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setUploadModalOpen({ category: 'legal', open: true })}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Cargar Documentos
                                            </button>
                                            {documentsByCategory.legal.length > 0 && (
                                                <button
                                                    onClick={() => setDocumentModalOpen({ category: 'legal', open: true })}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg transition-colors border border-white/20"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Ver Documentos
                                                </button>
                                            )}

                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.legal.length > 0 ? (
                                        <div className="hidden">
                                            {documentsByCategory.legal.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors"
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
                                                                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
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
                                    ) : null}
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
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-foreground">Información Financiera</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Documentos para acreditar la capacidad financiera y fiscal de tu empresa
                                        </p>
                                    </div>



                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {documentsByCategory.financial.length} documento(s) subido(s)
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setUploadModalOpen({ category: 'financial', open: true })}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Cargar Documentos
                                            </button>
                                            {documentsByCategory.financial.length > 0 && (
                                                <button
                                                    onClick={() => setDocumentModalOpen({ category: 'financial', open: true })}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg transition-colors border border-white/20"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Ver Documentos
                                                </button>
                                            )}

                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.financial.length > 0 ? (
                                        <div className="hidden">
                                            {documentsByCategory.financial.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors"
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
                                                                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
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
                                    ) : null}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Capacity Tab */}
                    {activeTab === "capacity" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-2xl card-gradient card-shimmer shadow-glow">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-4">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-semibold text-foreground">Capacidad de Contratación</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Información extraída automáticamente de tus documentos para el análisis de licitaciones.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {documentsByCategory.financial.length} documento(s) subido(s)
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsEditingFinancial(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar Indicadores
                                            </button>
                                            {documentsByCategory.financial.length > 0 && (
                                                <button
                                                    onClick={() => setDocumentModalOpen({ category: 'financial', open: true })}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg transition-colors border border-white/20"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Ver Documentos
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Financial Indicators */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Indicadores Financieros
                                        </h4>
                                        {company?.financial_indicators ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Índice de Liquidez</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.financial_indicators.liquidity_index || "N/A"}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Nivel de Endeudamiento</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.financial_indicators.indebtedness_index ? `${(company.financial_indicators.indebtedness_index * 100).toFixed(1)}%` : "N/A"}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Capital de Trabajo</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.financial_indicators.working_capital ? `$${company.financial_indicators.working_capital.toLocaleString()}` : "N/A"}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Patrimonio</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.financial_indicators.equity ? `$${company.financial_indicators.equity.toLocaleString()}` : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* UNSPSC Codes */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4" />
                                            Códigos UNSPSC (Clasificador de Bienes y Servicios)
                                        </h4>
                                        {company?.unspsc_codes && company.unspsc_codes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {company.unspsc_codes.map((code: string, index: number) => (
                                                    <span key={index} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Experience Summary */}
                                    <div>
                                        <h4 className="text-sm font-medium text-primary mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Resumen de Experiencia
                                        </h4>
                                        {company?.experience_summary ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Total Contratos Ejecutados</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.experience_summary.total_contracts || 0}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-1">Valor Total (SMMLV)</p>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {company.experience_summary.total_value_smmlv ? company.experience_summary.total_value_smmlv.toLocaleString() : 0}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
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
                                    <div className="mb-6">
                                        <h3 className="text-xl font-semibold text-foreground">Experiencia Técnica</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Documentos para acreditar tu experiencia y capacidad técnica
                                        </p>
                                    </div>



                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {documentsByCategory.technical.length} documento(s) subido(s)
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setUploadModalOpen({ category: 'technical', open: true })}
                                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Cargar Documentos
                                            </button>
                                            {documentsByCategory.technical.length > 0 && (
                                                <button
                                                    onClick={() => setDocumentModalOpen({ category: 'technical', open: true })}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-foreground rounded-lg transition-colors border border-white/20"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Ver Documentos
                                                </button>
                                            )}

                                        </div>
                                    </div>

                                    {/* Uploaded Documents */}
                                    {documentsByCategory.technical.length > 0 ? (
                                        <div className="hidden">
                                            {documentsByCategory.technical.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors"
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
                                                                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
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
                                    ) : null}
                                </div>
                            </div>
                        </motion.div>
                    )
                    }




                </div>
            </div>

            {/* Document Summary Modal */}
            {
                selectedDocument && (
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
                )
            }


            {/* Upload Modal with Document Checklist */}
            {uploadModalOpen.open && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setUploadModalOpen({ category: '', open: false })}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-primary/20 to-cyan-500/20 border-b border-primary/30 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary">
                                            {uploadModalOpen.category === 'legal' ? 'Documentos Legales' : uploadModalOpen.category === 'financial' ? 'Documentos Financieros' : 'Documentos Técnicos'}
                                        </h3>
                                        <p className="text-xs text-primary/70 mt-1">
                                            Selecciona el documento que deseas cargar
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUploadModalOpen({ category: '', open: false })}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
                                        <path d="M18 6 6 18"></path>
                                        <path d="m6 6 12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="overflow-y-auto flex-1 p-6">
                            <div className="space-y-3">
                                {uploadModalOpen.category === 'legal' && (
                                    <>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificado de existencia y representación legal</span>
                                            </div>
                                            <input type="file" id="upload-legal-certificado" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-certificado" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>RUT (Registro Único Tributario)</span>
                                            </div>
                                            <input type="file" id="upload-legal-rut" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-rut" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Cédula del representante legal</span>
                                            </div>
                                            <input type="file" id="upload-legal-cedula" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-cedula" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificado antecedentes fiscales (Contraloría)</span>
                                            </div>
                                            <input type="file" id="upload-legal-fiscales" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-fiscales" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificado antecedentes disciplinarios (Procuraduría)</span>
                                            </div>
                                            <input type="file" id="upload-legal-disciplinarios" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-disciplinarios" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificado antecedentes judiciales</span>
                                            </div>
                                            <input type="file" id="upload-legal-judiciales" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-judiciales" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Boletín de responsables fiscales</span>
                                            </div>
                                            <input type="file" id="upload-legal-boletin" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-boletin" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificación bancaria</span>
                                            </div>
                                            <input type="file" id="upload-legal-bancaria" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'legal')); }} />
                                            <label htmlFor="upload-legal-bancaria" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                    </>
                                )}
                                {uploadModalOpen.category === 'financial' && (
                                    <>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Balance General (últimos 3 años)</span>
                                            </div>
                                            <input type="file" id="upload-financial-balance" className="hidden" accept=".pdf,.xls,.xlsx"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-balance" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Estado de Resultados (últimos 3 años)</span>
                                            </div>
                                            <input type="file" id="upload-financial-resultados" className="hidden" accept=".pdf,.xls,.xlsx"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-resultados" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Declaración de Renta (últimas 2 vigencias)</span>
                                            </div>
                                            <input type="file" id="upload-financial-renta" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-renta" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificación de pago de aportes seguridad social</span>
                                            </div>
                                            <input type="file" id="upload-financial-seguridad-social" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-seguridad-social" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Indicadores financieros certificados</span>
                                            </div>
                                            <input type="file" id="upload-financial-indicadores" className="hidden" accept=".pdf,.xls,.xlsx"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-indicadores" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificación de capacidad de contratación (K)</span>
                                            </div>
                                            <input type="file" id="upload-financial-capacidad-k" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'financial')); }} />
                                            <label htmlFor="upload-financial-capacidad-k" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                    </>
                                )}

                                {uploadModalOpen.category === 'technical' && (
                                    <>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>RUP (Registro Único de Proponentes)</span>
                                            </div>
                                            <input type="file" id="upload-technical-rup" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-rup" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificados de contratos ejecutados</span>
                                            </div>
                                            <input type="file" id="upload-technical-contratos" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-contratos" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Actas de liquidación de contratos</span>
                                            </div>
                                            <input type="file" id="upload-technical-actas" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-actas" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificaciones de experiencia</span>
                                            </div>
                                            <input type="file" id="upload-technical-experiencia" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-experiencia" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Licencias y permisos profesionales</span>
                                            </div>
                                            <input type="file" id="upload-technical-licencias" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-licencias" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Portafolio de proyectos/servicios</span>
                                            </div>
                                            <input type="file" id="upload-technical-portafolio" className="hidden" accept=".pdf,.ppt,.pptx"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-portafolio" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-100">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Certificados de personal técnico</span>
                                            </div>
                                            <input type="file" id="upload-technical-personal" className="hidden" accept=".pdf"
                                                onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => handleFileUpload(file, 'technical')); }} />
                                            <label htmlFor="upload-technical-personal" className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm rounded-lg cursor-pointer transition-colors">
                                                <Upload className="w-4 h-4" /> Subir
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Financial Edit Modal */}
            {isEditingFinancial && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setIsEditingFinancial(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-primary text-xl font-semibold flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary" />
                                Editar Indicadores Financieros
                            </h3>
                            <button
                                onClick={() => setIsEditingFinancial(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
                                    <path d="M18 6 6 18"></path>
                                    <path d="m6 6 12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <form action={async (formData) => {
                                const indicators = {
                                    liquidity_index: parseFloat(formData.get("liquidity_index") as string),
                                    indebtedness_index: parseFloat(formData.get("indebtedness_index") as string) / 100,
                                    working_capital: parseFloat(formData.get("working_capital") as string),
                                    equity: parseFloat(formData.get("equity") as string)
                                };

                                const unspscCodes = formData.get("unspsc_codes") as string;
                                const unspscArray = unspscCodes ? unspscCodes.split(',').map(code => code.trim()).filter(code => code) : [];

                                const experienceSummary = {
                                    total_contracts: parseInt(formData.get("total_contracts") as string) || 0,
                                    total_value_smmlv: parseFloat(formData.get("total_value_smmlv") as string) || 0
                                };

                                const newFormData = new FormData();
                                newFormData.append("financial_indicators", JSON.stringify(indicators));
                                newFormData.append("unspsc_codes", JSON.stringify(unspscArray));
                                newFormData.append("experience_summary", JSON.stringify(experienceSummary));

                                try {
                                    const { saveFinancials } = await import("./actions");
                                    await saveFinancials(newFormData);
                                    setIsEditingFinancial(false);
                                } catch (error: any) {
                                    alert(error.message || "Error al guardar los indicadores financieros");
                                }
                            }} className="space-y-6">
                                {/* Financial Indicators */}
                                <div>
                                    <h4 className="text-sm font-semibold text-primary mb-4">Indicadores Financieros</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Índice de Liquidez</label>
                                            <input
                                                name="liquidity_index"
                                                type="number"
                                                step="0.01"
                                                defaultValue={company?.financial_indicators?.liquidity_index}
                                                className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Nivel de Endeudamiento (%)</label>
                                            <input
                                                name="indebtedness_index"
                                                type="number"
                                                step="0.1"
                                                defaultValue={company?.financial_indicators?.indebtedness_index ? (company.financial_indicators.indebtedness_index * 100).toFixed(1) : ""}
                                                className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                placeholder="0.0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Capital de Trabajo</label>
                                            <input
                                                name="working_capital"
                                                type="number"
                                                defaultValue={company?.financial_indicators?.working_capital}
                                                className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Patrimonio</label>
                                            <input
                                                name="equity"
                                                type="number"
                                                defaultValue={company?.financial_indicators?.equity}
                                                className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* UNSPSC Codes */}
                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-primary mb-4">Códigos UNSPSC</h4>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Clasificador de Bienes y Servicios</label>
                                        <input
                                            name="unspsc_codes"
                                            type="text"
                                            defaultValue={company?.unspsc_codes?.join(', ')}
                                            className="w-full p-3 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                            placeholder="Ej: 72101500, 81111500, 93141600 (separados por comas)"
                                        />
                                        <p className="text-xs text-muted-foreground">Ingresa los códigos UNSPSC separados por comas</p>
                                    </div>
                                </div>

                                {/* Experience Summary - Auto-calculated from Contracts */}
                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-semibold text-primary mb-4">Resumen de Experiencia (Auto-calculado)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Total Contratos Ejecutados</label>
                                            <div className="w-full p-3 rounded-lg bg-input/50 border border-border text-foreground">
                                                {contracts.length}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Valor Total (SMMLV)</label>
                                            <div className="w-full p-3 rounded-lg bg-input/50 border border-border text-foreground">
                                                {contracts.reduce((sum, c) => sum + (c.contract_value_smmlv || 0), 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Estos valores se calculan automáticamente desde tus contratos registrados
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingFinancial(false)}
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                    >
                                        Guardar Indicadores
                                    </button>
                                </div>
                            </form>

                            {/* Contracts Management - Outside the main form */}
                            <div className="pt-6 border-t border-white/10 mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-primary">Contratos Ejecutados</h4>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingContract(!isAddingContract)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {isAddingContract ? 'Cancelar' : 'Agregar Contrato'}
                                    </button>
                                </div>

                                {/* Add Contract Form */}
                                {isAddingContract && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-4 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                                    >
                                        <form action={async (formData) => {
                                            try {
                                                await saveContract(formData);
                                                const updatedContracts = await listCompanyContracts();
                                                setContracts(updatedContracts as Contract[]);
                                                setIsAddingContract(false);
                                            } catch (error: any) {
                                                alert(error.message || "Error al guardar el contrato");
                                            }
                                        }} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Número de Contrato *</label>
                                                    <input
                                                        name="contract_number"
                                                        type="text"
                                                        required
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                        placeholder="CTR-2024-001"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Cliente *</label>
                                                    <input
                                                        name="client_name"
                                                        type="text"
                                                        required
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                        placeholder="Nombre del cliente"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Valor (COP) *</label>
                                                    <input
                                                        name="contract_value"
                                                        type="number"
                                                        required
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                        placeholder="150000000"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Valor (SMMLV)</label>
                                                    <input
                                                        name="contract_value_smmlv"
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                        placeholder="120.5"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Fecha de Ejecución</label>
                                                    <input
                                                        name="execution_date"
                                                        type="date"
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Códigos UNSPSC</label>
                                                    <input
                                                        name="unspsc_codes"
                                                        type="text"
                                                        className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                        placeholder="80101500, 80111500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-400">Descripción</label>
                                                <textarea
                                                    name="description"
                                                    rows={2}
                                                    className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
                                                    placeholder="Breve descripción del contrato..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-400">Documento Soporte (PDF, max 10MB)</label>
                                                <input
                                                    name="document"
                                                    type="file"
                                                    accept=".pdf"
                                                    className="w-full p-2 rounded-lg bg-sky-100 dark:bg-slate-800/50 border border-sky-300 dark:border-slate-700 text-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 text-sm"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingContract(false)}
                                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                                >
                                                    Guardar Contrato
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}

                                {/* Contracts List */}
                                {contracts.length > 0 ? (
                                    <div className="space-y-2">
                                        {contracts.map((contract) => (
                                            <div
                                                key={contract.id}
                                                className="p-3 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-primary/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h5 className="text-sm font-semibold text-foreground">{contract.contract_number}</h5>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <span className="text-xs text-muted-foreground">{contract.client_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span>💰 ${contract.contract_value.toLocaleString()}</span>
                                                            {contract.contract_value_smmlv && (
                                                                <span>📊 {contract.contract_value_smmlv} SMMLV</span>
                                                            )}
                                                            {contract.execution_date && (
                                                                <span>📅 {new Date(contract.execution_date).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                        {contract.description && (
                                                            <p className="text-xs text-zinc-400 mt-1">{contract.description}</p>
                                                        )}
                                                        {contract.document_url && (
                                                            <a
                                                                href={contract.document_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                {contract.document_name || 'Ver documento'}
                                                            </a>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (confirm('¿Estás seguro de eliminar este contrato?')) {
                                                                try {
                                                                    await deleteContract(contract.id);
                                                                    const updatedContracts = await listCompanyContracts();
                                                                    setContracts(updatedContracts as Contract[]);
                                                                } catch (error: any) {
                                                                    alert(error.message || "Error al eliminar el contrato");
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay contratos registrados. Agrega tu primer contrato para comenzar.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Document List Modal */}
            {documentModalOpen.open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setDocumentModalOpen({ category: '', open: false })}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-primary/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-primary/20 to-cyan-500/20 border-b border-primary/30 p-6 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-primary">
                                            Documentos {documentModalOpen.category === 'legal' ? 'Legales' : documentModalOpen.category === 'financial' ? 'Financieros' : 'Técnicos'}
                                        </h3>
                                        <p className="text-xs text-primary/70 mt-1">
                                            {documentsByCategory[documentModalOpen.category as DocumentCategory]?.length || 0} documento(s) cargados
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDocumentModalOpen({ category: '', open: false })}
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
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documentsByCategory[documentModalOpen.category as DocumentCategory]?.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 rounded-lg bg-sky-50 dark:bg-slate-700/80 border border-sky-200 dark:border-slate-600 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDocument(file);
                                                        setDocumentModalOpen({ category: '', open: false });
                                                    }}
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
                                                            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                                                                {file.summary}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFile(documentModalOpen.category as DocumentCategory, file.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-500" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div >
    );
}
