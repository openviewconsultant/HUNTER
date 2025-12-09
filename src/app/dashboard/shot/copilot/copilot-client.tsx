"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, FileText, CheckSquare, PenTool, Rocket, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithMissionCopilot } from "./actions";
import ReactMarkdown from 'react-markdown';


import { jsPDF } from "jspdf";

interface Project {
    id: string;
    name: string;
    description: string;
    methodology: string;
    status: string;
    progress: number;
    tenderTitle?: string;
    entity?: string;
    amount?: number;
    deadline?: string;
    processId?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function CopilotClient({ missions, company }: { missions: Project[], company?: any }) {
    const [selectedMission, setSelectedMission] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hola, soy tu asistente de licitaciones (Hunter AI). Selecciona una misión para comenzar a trabajar o hazme una pregunta general.',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeMissions = missions.filter(m => m.status === 'ACTIVE');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        const currentHistory = messages; // Snapshot history before adding new user msg for the API (or include it depending on logic)

        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            const missionCtx = selectedMission ? {
                name: selectedMission.name,
                description: selectedMission.description,
                tenderTitle: selectedMission.tenderTitle,
                entity: selectedMission.entity,
                processId: selectedMission.processId
            } : undefined;

            const response = await chatWithMissionCopilot(userMessage, currentHistory, missionCtx, company);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.content || "Lo siento, no pude generar una respuesta.",
                timestamp: new Date()
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Error de conexión con el asistente.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (action: string) => {
        if (!selectedMission) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Por favor selecciona una misión primero para ejecutar esta acción.',
                timestamp: new Date()
            }]);
            return;
        }

        const prompts: Record<string, string> = {
            'pliegos': `Genera una carta de presentación formal para la licitación "${selectedMission.tenderTitle || selectedMission.name}", utilizando la información de mi empresa para demostrar idoneidad. Incluye el objeto, el compromiso de cumplimiento y la firma del representante legal.`,
            'observacion': `Ayúdame a redactar una observación formal para la licitación "${selectedMission.tenderTitle || selectedMission.name}".`,
            'matriz': `Genera una estructura para la matriz de cumplimiento de "${selectedMission.name}".`
        };

        const prompt = prompts[action] || '';
        setInputValue(prompt);
    };

    const downloadPDF = (content: string) => {
        const doc = new jsPDF();

        // Config basic formatting
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        // Simple text wrapping (could be improved with html2canvas for rich text)
        const pageWidth = doc.internal.pageSize.getWidth();
        const splitText = doc.splitTextToSize(content.replace(/\*\*/g, ''), pageWidth - 40); // Simple markdown clean

        doc.text(splitText, 20, 20);
        doc.save("documento_generado_hunter.pdf");
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 p-6">
            {/* Sidebar with Missions */}
            <div className="w-80 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="py-4 px-4 border-b bg-muted/40">
                        <CardTitle className="text-md flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-primary" />
                            Misiones Activas
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 grid gap-2">
                            {activeMissions.length === 0 ? (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    No hay misiones activas.
                                </div>
                            ) : (
                                activeMissions.map(mission => (
                                    <button
                                        key={mission.id}
                                        onClick={() => setSelectedMission(mission)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent group relative overflow-hidden",
                                            selectedMission?.id === mission.id
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "bg-card border-border/50"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium truncate text-sm pr-2 text-foreground">
                                                {mission.name}
                                            </span>
                                            {selectedMission?.id === mission.id && (
                                                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        {mission.tenderTitle && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                {mission.tenderTitle}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-auto">
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                                                {mission.methodology}
                                            </Badge>
                                            {mission.amount && (
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.amount)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader className="py-4 px-4 border-b bg-muted/40">
                        <CardTitle className="text-md">Herramientas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 grid gap-2">
                        <Button
                            variant="outline"
                            className="justify-start gap-2 h-9 text-sm"
                            disabled={!selectedMission}
                            onClick={() => handleAction('pliegos')}
                        >
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            Respuesta a Pliegos
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start gap-2 h-9 text-sm"
                            disabled={!selectedMission}
                            onClick={() => handleAction('observacion')}
                        >
                            <PenTool className="h-3.5 w-3.5 text-orange-500" />
                            Redactar Observación
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start gap-2 h-9 text-sm"
                            disabled={!selectedMission}
                            onClick={() => handleAction('matriz')}
                        >
                            <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                            Matriz de Cumplimiento
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col shadow-lg border-primary/10">
                <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between bg-card/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Hunter AI Copilot</CardTitle>
                            <CardDescription>
                                {selectedMission
                                    ? `Trabajando en: ${selectedMission.name}`
                                    : "Selecciona una misión para comenzar"
                                }
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                                msg.role === 'assistant' ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full bg-slate-400" />}
                            </div>
                            <div className="space-y-2">
                                <div className={cn(
                                    "rounded-2xl p-4 text-sm shadow-sm",
                                    msg.role === 'assistant'
                                        ? "bg-card border text-card-foreground rounded-tl-none"
                                        : "bg-primary text-primary-foreground rounded-tr-none"
                                )}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                    <span className="block text-[10px] opacity-50 mt-2 text-right" suppressHydrationWarning>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {msg.role === 'assistant' && msg.content.length > 100 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-muted-foreground hover:text-primary gap-1"
                                        onClick={() => downloadPDF(msg.content)}
                                    >
                                        <FileText className="h-3 w-3" />
                                        Descargar como PDF
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="rounded-2xl p-4 text-sm bg-card border text-card-foreground rounded-tl-none flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="border-t p-4 bg-card">
                    <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={selectedMission ? `Escribe sobre ${selectedMission.name}...` : "Selecciona una misión o pregunta algo general..."}
                            className="flex-1 pr-10"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
