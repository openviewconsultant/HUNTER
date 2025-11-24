"use client";

import { motion } from "framer-motion";
import { Search, Bell, BarChart3, ShieldCheck, Zap, Globe } from "lucide-react";

const features = [
    {
        icon: Search,
        title: "Búsqueda Inteligente",
        description: "Capacidades de filtrado avanzadas para encontrar exactamente lo que necesitas en segundos, no horas.",
    },
    {
        icon: Bell,
        title: "Alertas Instantáneas",
        description: "Recibe notificaciones en el momento en que se publica una licitación relevante. Nunca pierdas una oportunidad.",
    },
    {
        icon: BarChart3,
        title: "Análisis de Mercado",
        description: "Visualiza tendencias y datos de la competencia para tomar decisiones de licitación informadas.",
    },
    {
        icon: ShieldCheck,
        title: "Datos Verificados",
        description: "Integración directa con SECOPII asegura información 100% precisa y actualizada.",
    },
    {
        icon: Zap,
        title: "Licitación Automatizada",
        description: "Optimiza tu flujo de trabajo con herramientas de preparación y envío de documentos automatizados.",
    },
    {
        icon: Globe,
        title: "Cobertura Nacional",
        description: "Accede a oportunidades de cada región y municipio en todo el país.",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Construido para <span className="text-primary">Velocidad</span> y Precisión
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Todo lo que necesitas para dominar el mercado de licitaciones públicas en una sola plataforma potente.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-primary/20 transition-colors"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
