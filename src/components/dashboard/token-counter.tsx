"use client";

import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface TokenUsage {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    model: string;
    updated_at: string;
}

export default function TokenCounter() {
    const [usage, setUsage] = useState<TokenUsage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTokenUsage = async () => {
            try {
                const response = await fetch('/api/ai/usage');

                if (!response.ok) {
                    throw new Error('Failed to fetch token usage');
                }

                const data = await response.json();
                setUsage({
                    total_tokens: data.total_tokens,
                    prompt_tokens: data.prompt_tokens,
                    completion_tokens: data.completion_tokens,
                    model: data.model,
                    updated_at: data.last_usage
                });
            } catch (error) {
                console.error("Error fetching token usage:", error);
                // Set default values on error
                setUsage({
                    total_tokens: 0,
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    model: "No Data",
                    updated_at: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTokenUsage();
    }, []);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl card-gradient shadow-glow">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-20 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('es-ES').format(num);
    };

    const getModelDisplayName = (model: string) => {
        const modelNames: Record<string, string> = {
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'claude-3-opus': 'Claude 3 Opus',
            'claude-3-sonnet': 'Claude 3 Sonnet',
            'gemini-pro': 'Gemini Pro',
            'gemini-1.5-pro': 'Gemini 1.5 Pro',
            'gemini-1.5-flash': 'Gemini 1.5 Flash',
            'gemini-2.0-flash': 'Gemini 2.0 Flash',
            'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
            'text-embedding-004': 'Gemini Embeddings'
        };
        return modelNames[model] || model;
    };

    return (
        <div className="p-6 rounded-2xl card-gradient shadow-glow space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Uso de IA</h3>
                        <p className="text-xs text-muted-foreground">Tokens consumidos</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                        {usage && usage.model !== 'No Data' ? getModelDisplayName(usage.model) : 'Sin uso reciente'}
                    </span>
                </div>
            </div>

            {/* Token Statistics */}
            <div className="grid grid-cols-1 gap-4">
                {/* Total Tokens */}
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total de Tokens</span>
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {usage ? formatNumber(usage.total_tokens) : '0'}
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-500"
                            style={{
                                width: usage ? `${Math.min((usage.total_tokens / 1000000) * 100, 100)}%` : '0%'
                            }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        Ref: 1M Tokens
                    </p>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background/30 border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">Entrada</div>
                        <div className="text-lg font-semibold text-foreground">
                            {usage ? formatNumber(usage.prompt_tokens) : '0'}
                        </div>
                        <div className="text-xs text-primary mt-1">
                            {usage && usage.total_tokens > 0
                                ? Math.round((usage.prompt_tokens / usage.total_tokens) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/30 border border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">Salida</div>
                        <div className="text-lg font-semibold text-foreground">
                            {usage ? formatNumber(usage.completion_tokens) : '0'}
                        </div>
                        <div className="text-xs text-primary mt-1">
                            {usage && usage.total_tokens > 0
                                ? Math.round((usage.completion_tokens / usage.total_tokens) * 100)
                                : 0}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            {usage && (
                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        Actualizado: {new Date(usage.updated_at).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            )}
        </div>
    );
}
