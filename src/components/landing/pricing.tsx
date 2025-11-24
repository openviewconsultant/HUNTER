"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const pricingPlans = [
    {
        name: "Starter",
        price: "0",
        description: "Para individuos que exploran licitaciones.",
        features: [
            "Búsqueda básica de licitaciones",
            "3 Alertas de correo diarias",
            "Acceso a licitaciones de < 10k",
            "Soporte por correo",
        ],
        notIncluded: [
            "Análisis de competencia",
            "Predicciones de IA",
            "Exportación de datos",
            "API Access",
        ],
        popular: false,
    },
    {
        name: "Pro",
        price: "29",
        description: "Para profesionales que buscan crecer.",
        features: [
            "Búsquedas ilimitadas",
            "Alertas en tiempo real",
            "Acceso a todas las licitaciones",
            "Análisis básico de mercado",
            "Exportación a CSV (100/mes)",
        ],
        notIncluded: [
            "Predicciones de IA",
            "API Access",
            "Gestor de cuenta dedicado",
        ],
        popular: true,
    },
    {
        name: "Business",
        price: "79",
        description: "Para equipos que necesitan escalar.",
        features: [
            "Todo en Pro",
            "5 Usuarios de equipo",
            "Análisis avanzado de competencia",
            "Predicciones de éxito con IA",
            "Exportación ilimitada",
            "Soporte prioritario",
        ],
        notIncluded: [
            "API Access",
            "Integraciones personalizadas",
        ],
        popular: false,
    },
    {
        name: "Enterprise",
        price: "130",
        description: "Poder total y automatización máxima.",
        features: [
            "Todo en Business",
            "Usuarios ilimitados",
            "API Access completo",
            "Integraciones personalizadas (ERP/CRM)",
            "Gestor de cuenta dedicado",
            "SLA de 99.9%",
            "Auditoría de licitaciones",
        ],
        notIncluded: [],
        popular: false,
        highlight: true,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Planes Simples y <span className="text-primary">Transparentes</span>
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Elige el plan que mejor se adapte a tus necesidades. Cancela en cualquier momento.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "relative flex flex-col p-6 rounded-2xl border transition-all duration-300",
                                plan.highlight
                                    ? "bg-primary/5 border-primary/50 shadow-lg shadow-primary/10"
                                    : "bg-zinc-900/50 border-white/10 hover:border-primary/30"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-black text-xs font-bold rounded-full uppercase tracking-wider">
                                    Más Popular
                                </div>
                            )}

                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-primary/60 text-black text-xs font-bold rounded-full uppercase tracking-wider shadow-glow">
                                    Recomendado
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                                    <span className="text-zinc-500">/mes</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-2">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm">
                                        <div className="mt-1 min-w-4 min-h-4 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-primary" />
                                        </div>
                                        <span className="text-zinc-300">{feature}</span>
                                    </div>
                                ))}
                                {plan.notIncluded?.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 text-sm opacity-50">
                                        <div className="mt-1 min-w-4 min-h-4 w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                                            <X className="w-2.5 h-2.5 text-zinc-500" />
                                        </div>
                                        <span className="text-zinc-500">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/register"
                                className={cn(
                                    "w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all text-center",
                                    plan.highlight || plan.popular
                                        ? "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02]"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                Comenzar Ahora
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
