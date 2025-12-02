'use client'

import { useState, useEffect } from 'react';
import { History, Building2, Calendar, DollarSign, Loader2, X } from "lucide-react";
import { getHistoricalContracts, CompetitorInfo } from './competitor-actions';
import { motion, AnimatePresence } from 'framer-motion';

interface CompetitorHistoryModalProps {
    unspscCodes: string[];
    processTitle: string;
}

export function CompetitorHistoryModal({ unspscCodes, processTitle }: CompetitorHistoryModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<CompetitorInfo[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [hasData, setHasData] = useState<boolean | null>(null); // null = not checked, true = has data, false = no data

    // Check if there's historical data available
    useEffect(() => {
        const checkData = async () => {
            if (!unspscCodes || unspscCodes.length === 0) {
                setHasData(false);
                return;
            }

            try {
                const data = await getHistoricalContracts(unspscCodes);
                setHasData(data.length > 0);
            } catch (error) {
                console.error("Error checking historical data:", error);
                setHasData(false);
            }
        };

        checkData();
    }, [unspscCodes]);

    useEffect(() => {
        if (isOpen && !hasLoaded) {
            console.log('Modal opened, loading history for UNSPSC codes:', unspscCodes);
            console.log('Exact codes:', JSON.stringify(unspscCodes));
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        console.log('Starting loadHistory with codes:', unspscCodes);
        setLoading(true);
        try {
            const data = await getHistoricalContracts(unspscCodes);
            console.log('Received historical data:', data.length, 'contracts');
            setHistory(data);
            setHasLoaded(true);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Don't render button if no UNSPSC codes or no historical data available
    if (!unspscCodes || unspscCodes.length === 0 || hasData === false) {
        return null;
    }

    // Show loading state while checking for data
    if (hasData === null) {
        return null; // Or could show a loading skeleton
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
            >
                <History className="w-3 h-3" />
                <span>Histórico</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                                <div>
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <History className="w-5 h-5 text-purple-400" />
                                        Histórico de Competencia
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-md">
                                        Para: {processTitle}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" />
                                        <p className="text-sm">Buscando contratos similares en SECOP...</p>
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="space-y-3">
                                        {history.map((item, i) => (
                                            <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                                            <Building2 className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-sm text-purple-100">{item.name}</span>
                                                    </div>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.contractDate).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-zinc-400 mb-3 line-clamp-2 pl-9">
                                                    {item.description}
                                                </p>

                                                <div className="flex items-center justify-between pt-3 border-t border-white/5 pl-9">
                                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                        <Building2 className="w-3 h-3" />
                                                        <span className="truncate max-w-[250px]">{item.entity}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                                        <DollarSign className="w-3 h-3" />
                                                        {formatCurrency(item.awardValue)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                        <div className="p-4 rounded-full bg-white/5 mb-3">
                                            <History className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p className="font-medium text-zinc-400">No se encontraron contratos históricos</p>
                                        <p className="text-xs mt-1 opacity-60 max-w-xs text-center">
                                            {unspscCodes.length === 0
                                                ? 'Esta licitación no tiene código UNSPSC definido.'
                                                : `No hay registros de contratos adjudicados con el código UNSPSC ${unspscCodes[0]} en SECOP.`
                                            }
                                        </p>
                                        {unspscCodes.length > 0 && (
                                            <p className="text-[10px] mt-2 opacity-40 text-center">
                                                Código buscado: {unspscCodes.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-white/10 bg-white/5 flex justify-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
