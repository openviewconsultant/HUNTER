"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const InputModern = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 peer",
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    placeholder={label} // Placeholder required for peer-placeholder-shown trick
                    ref={ref}
                    {...props}
                />
                {label && (
                    <label
                        className={cn(
                            "absolute left-4 top-3 z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-zinc-400 duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary pointer-events-none bg-black/0 px-1",
                            error && "text-red-500 peer-focus:text-red-500"
                        )}
                    >
                        {label}
                    </label>
                )}
                {error && (
                    <span className="text-xs text-red-500 mt-1 ml-1">{error}</span>
                )}
            </div>
        );
    }
);
InputModern.displayName = "InputModern";

export { InputModern };
