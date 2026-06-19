import React, { forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
  /** Make input read-only with a "locked" look */
  locked?: boolean;
  /** Compact size variant */
  size?: 'md' | 'lg';
}

/**
 * Premium InputField — used across forms (payments, registration, settings).
 *
 *  ▸ Lucide icon prefix
 *  ▸ Floating label with subtle uppercase tracking
 *  ▸ Smooth focus ring (orange) with backdrop highlight
 *  ▸ Optional trailing slot (badge, button, info icon)
 *  ▸ Error & hint states
 *  ▸ Locked state (read-only with subtle stripe pattern)
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon: Icon, error, hint, trailing, locked, size = 'md', className = '', ...inputProps }, ref) => {
    const sizeClass = size === 'lg' ? 'py-3.5 text-base' : 'py-3 text-sm';

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputProps.id || inputProps.name}
          className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55 font-display"
        >
          <span className="flex items-center gap-1.5">
            {label}
            {inputProps.required && <span className="text-orange-burnt/85">*</span>}
          </span>
          {locked && (
            <span className="text-[9px] font-extrabold tracking-[0.18em] text-gold-accent/85">
              · LOCKED
            </span>
          )}
        </label>

        <div
          className={`relative group rounded-xl border transition-all duration-300 ${
            error
              ? 'border-red-500/45 bg-red-500/[0.04]'
              : locked
              ? 'border-gold-accent/20 bg-[#0A1428]/45'
              : 'border-white/[0.08] bg-[#050B18]/55 hover:border-white/15'
          } backdrop-blur-md focus-within:border-[#C84B0E]/80 focus-within:bg-[#050B18]/85 focus-within:ring-2 focus-within:ring-[#C84B0E]/40 focus-within:shadow-[0_0_20px_rgba(200,75,14,0.15)]`}
        >
          {Icon && (
            <Icon
              className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                error ? 'text-red-400' : 'text-white/35 group-focus-within:text-[#C84B0E]'
              }`}
              strokeWidth={2}
            />
          )}

          <input
            ref={ref}
            id={inputProps.id || inputProps.name}
            disabled={locked || inputProps.disabled}
            {...inputProps}
            className={`w-full bg-transparent text-white font-sans placeholder:text-white/25 focus:outline-none ${sizeClass} ${
              Icon ? 'pl-10' : 'pl-4'
            } ${trailing ? 'pr-16' : 'pr-4'} ${locked ? 'cursor-not-allowed text-white/55' : ''} ${className}`}
          />

          {trailing && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {trailing}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[10px] font-sans text-red-400 leading-snug">{error}</p>
        ) : (
          hint && <p className="text-[10px] font-sans text-white/35 leading-snug">{hint}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;
