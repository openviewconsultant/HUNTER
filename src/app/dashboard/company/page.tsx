"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus, Building2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "info", label: "Información de la Empresa", icon: Building2 },
    { id: "legal", label: "Documentos Legales", icon: ShieldCheck },
    { id: "financial", label: "Información Financiera", icon: DollarSign },
    { id: "technical", label: "Experiencia Técnica", icon: FileText },
];

const documentCategories = {
    legal: {
        title: "Documentos Legales",
        description: "RUT, Cámara de Comercio, Representación Legal",
        documents: [
            { name: "RUT Actualizado", required: true },
            { name: "Cámara de Comercio (< 30 días)", required: true },
            { name: "Cédula Representante Legal", required: true },
        ],
    },
    financial: {
        title: "Información Financiera",
        description: "Estados Financieros, Declaraciones de Renta",
        documents: [
            { name: "Estados Financieros 2023", required: true },
            { name: "Declaración de Renta 2023", required: true },
            { name: "Certificado Bancario", required: false },
        ],
    },
    technical: {
        title: "Experiencia Técnica",
        description: "Certificados de contratos ejecutados",
        documents: [
            { name: "RUP (Registro Único de Proponentes)", required: true },
            { name: "Certificados de Experiencia", required: false },
        ],
    },
};

export default function CompanyProfilePage() {
    const [activeTab, setActiveTab] = useState("info");
    const [dragActive, setDragActive] = useState(false);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            console.log("File dropped:", e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Perfil de Empresa</h1>
                <p className="text-zinc-400">
                    Sube la documentación de tu empresa para que HUNTER pueda analizar tu capacidad de contratación.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-white/10">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    {activeTab === "info" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10"
                        >
                            <h3 className="text-xl font-semibold text-white mb-6">Información General</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Nombre de la Empresa
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Tech Solutions SAS"
                                        className="w-full p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        NIT
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="900.123.456-7"
                                        className="w-full p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Representante Legal
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Juan Pérez"
                                        className="w-full p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Sector / Actividad Económica
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Tecnología, Construcción, etc."
                                        className="w-full p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <button className="w-full h-12 rounded-lg bg-primary text-black font-semibold hover:bg-primary/90 transition-colors mt-6">
                                    Guardar Información
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab !== "info" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {activeTab === "legal" && <ShieldCheck className="w-5 h-5 text-primary" />}
                                    {activeTab === "financial" && <DollarSign className="w-5 h-5 text-primary" />}
                                    {activeTab === "technical" && <FileText className="w-5 h-5 text-primary" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {documentCategories[activeTab as keyof typeof documentCategories]?.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400">
                                        {documentCategories[activeTab as keyof typeof documentCategories]?.description}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {documentCategories[activeTab as keyof typeof documentCategories]?.documents.map((doc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                            <span className="text-sm text-zinc-300">{doc.name}</span>
                                            {doc.required && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                                    Requerido
                                                </span>
                                            )}
                                        </div>
                                        <button className="text-xs text-primary hover:text-primary/80">
                                            Subir
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Upload Area */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={cn(
                            "relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[400px]",
                            dragActive
                                ? "border-primary bg-primary/5"
                                : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700"
                        )}
                    >
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 shadow-xl">
                            <Upload className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Arrastra tus documentos aquí
                        </h3>
                        <p className="text-zinc-400 mb-8 max-w-xs">
                            Soporta PDF, Excel y Word hasta 50MB. Tus documentos están encriptados de extremo a extremo.
                        </p>
                        <button className="h-12 px-8 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Seleccionar Archivos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
