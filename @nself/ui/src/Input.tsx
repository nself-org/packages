/**
 * Input — base accessible text input component.
 *
 * Purpose: Single Input primitive for all nSelf web forms. Wraps a native
 *          <input> with error state, label, and hint support. Accessible via
 *          aria-describedby for error/hint messages.
 *
 * Inputs:
 *   - label: string — visible label text (required for accessibility)
 *   - error: string | undefined — validation error message
 *   - hint: string | undefined — helper text shown below the input
 *   - id: string — links label→input; auto-derived from name if omitted
 *   - All native <input> props forwarded
 *
 * Outputs: Labelled input with optional error and hint messages.
 *
 * Constraints:
 *   - Always provide a label — aria-label alone is insufficient for screen readers.
 *   - Error text sets aria-invalid=true and aria-describedby to the error message id.
 *   - type defaults to 'text'.
 *
 * Usage:
 *   import { Input } from '@nself/ui';
 *   <Input label="Email" type="email" error={errors.email} {...register('email')} />
 *
 * SOT: F-NSELF-UI-INPUT-01
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label text. Required. */
  label: string;
  /** Validation error message. Sets aria-invalid when present. */
  error?: string;
  /** Helper text shown below the input. */
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, name, type = 'text', style, ...rest }, ref) {
    const inputId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-');
    const errorId = error !== undefined ? `${inputId}-error` : undefined;
    const hintId = hint !== undefined ? `${inputId}-hint` : undefined;

    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label
          htmlFor={inputId}
          style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={describedBy}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '1rem',
            border: `1px solid ${error !== undefined ? '#dc2626' : '#d1d5db'}`,
            borderRadius: '0.375rem',
            outline: 'none',
            background: '#ffffff',
            color: '#111827',
            width: '100%',
            boxSizing: 'border-box',
            ...style,
          }}
          {...rest}
        />

        {error !== undefined && (
          <span id={errorId} role="alert" style={{ fontSize: '0.8125rem', color: '#dc2626' }}>
            {error}
          </span>
        )}

        {hint !== undefined && (
          <span id={hintId} style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            {hint}
          </span>
        )}
      </div>
    );
  },
);
