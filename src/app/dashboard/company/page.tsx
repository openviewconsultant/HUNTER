"use client";

import { motion } from "framer-motion";
import { Upload, FileText, DollarSign, ShieldCheck, Plus } from "lucide-react";
import { useState } from "react";

const documentCategories = [
    {
        id: "legal",
        title: "Documentos Legales",
        icon: ShieldCheck,
        description: "RUT, Cámara de Comercio, Representación Legal",
        documents: [
            { name: "RUT Actualizado", required: true },
            { name: "Cámara de Comercio (< 30 días)", required: true },
            { name: "Cédula Representante Legal", required: true },
        ],
    },
    {
        id: "financial",
        title: "Información Financiera",
        icon: DollarSign,
        description: "Estados Financieros, Declaraciones de Renta",
        documents: [
            { name: "Estados Financieros 2023", required: true },
            { name: "Declaración de Renta 2023", required: true },
            { name: "Certificado Bancario", required: false },
        ],
    },
    {
        id: "technical",
        title: "Experiencia Técnica",
        icon: FileText,
        description: "Certificados de contratos ejecutados",
        documents: [
            { name: "RUP (Registro Único de Proponentes)", required: true },
            { name: "Certificados de Experiencia", required: false },
        ],
    },
];

export default function CompanyProfilePage() {
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
            // Handle file upload
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Document Categories */}
                <div className="space-y-6">
                    {documentCategories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-primary/20 transition-colors"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <category.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                                    <p className="text-sm text-zinc-400">{category.description}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {category.documents.map((doc, i) => (
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
                    ))}
                </div>

                {/* Upload Area */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
              relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[400px]
              ${dragActive
                                ? "border-primary bg-primary/5"
                                : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-700"
                            }
            `}
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
