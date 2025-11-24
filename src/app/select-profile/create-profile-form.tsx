'use client';

import { useState } from 'react';
import { createProfile } from './actions';
import { User, Building2, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreateProfileForm({ isFirstProfile = false }: { isFirstProfile?: boolean }) {
    const [selectedType, setSelectedType] = useState<'individual' | 'company'>('individual');
    const [isLoading, setIsLoading] = useState(false);

    return (
        <form
            action={async (formData) => {
                setIsLoading(true);
                // Append the selected type manually since it's not a native input anymore
                formData.append('profileType', selectedType);
                await createProfile(formData);
                setIsLoading(false);
            }}
            className={cn(
                "w-full max-w-md mx-auto space-y-6",
                !isFirstProfile && "p-6 rounded-xl bg-zinc-900/50 border border-zinc-800"
            )}
        >
            <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-white">
                    {isFirstProfile ? "¡Bienvenido a HUNTER!" : "Nuevo Perfil"}
                </h3>
                <p className="text-sm text-zinc-400">
                    {isFirstProfile
                        ? "Para comenzar, cuéntanos cómo usarás la plataforma."
                        : "Selecciona el tipo de perfil que deseas crear."}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setSelectedType('individual')}
                    className={cn(
                        "p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 text-center group",
                        selectedType === 'individual'
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        selectedType === 'individual' ? "bg-primary/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                    )}>
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="block font-medium text-sm">Personal</span>
                        <span className="block text-xs opacity-70 mt-1">Para uso individual</span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedType('company')}
                    className={cn(
                        "p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 text-center group",
                        selectedType === 'company'
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        selectedType === 'company' ? "bg-primary/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                    )}>
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="block font-medium text-sm">Empresa</span>
                        <span className="block text-xs opacity-70 mt-1">Para organizaciones</span>
                    </div>
                </button>
            </div>

            <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-zinc-300 ml-1">
                    {selectedType === 'individual' ? 'Nombre Completo' : 'Nombre de la Empresa'}
                </label>
                <input
                    name="fullName"
                    type="text"
                    required
                    placeholder={selectedType === 'individual' ? "Ej. Juan Pérez" : "Ej. Tech Solutions SAS"}
                    className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full p-4 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <span>Continuar</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
    );
}
