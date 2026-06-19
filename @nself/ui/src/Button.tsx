/**
 * Button — base accessible button component.
 *
 * Purpose: Single Button primitive used across all nSelf web surfaces.
 *          Wraps a native <button> with variant + size styling via inline styles
 *          (no Tailwind dependency in this package — apps apply Tailwind classes
 *          via className override). Fully accessible (aria, keyboard, focus).
 *
 * Inputs:
 *   - variant: 'primary' | 'secondary' | 'ghost' | 'destructive' — visual style
 *   - size: 'sm' | 'md' | 'lg' — button dimensions
 *   - loading: boolean — shows spinner, disables interaction
 *   - disabled: boolean — disables interaction
 *   - className: string — Tailwind/CSS class override (apps add their own styling)
 *   - All native <button> props forwarded
 *
 * Outputs: Accessible <button> element.
 *
 * Constraints:
 *   - Never disables without providing aria-label or visible label.
 *   - loading=true sets aria-busy and prevents double-submit.
 *   - type defaults to 'button' (not 'submit') — prevents accidental form submission.
 *
 * Usage:
 *   import { Button } from '@nself/ui';
 *   <Button variant="primary" onClick={handleSave}>Save</Button>
 *   <Button variant="secondary" size="sm" loading={saving}>Saving...</Button>
 *
 * SOT: F-NSELF-UI-BUTTON-01
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When true: shows spinner, prevents interaction, sets aria-busy. */
  loading?: boolean;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#2563eb',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  secondary: {
    background: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
  },
  ghost: {
    background: 'transparent',
    color: '#374151',
    border: '1px solid transparent',
  },
  destructive: {
    background: '#dc2626',
    color: '#ffffff',
    border: '1px solid transparent',
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0.25rem 0.75rem', fontSize: '0.875rem', borderRadius: '0.375rem' },
  md: { padding: '0.5rem 1.25rem', fontSize: '1rem', borderRadius: '0.5rem' },
  lg: { padding: '0.75rem 1.75rem', fontSize: '1.125rem', borderRadius: '0.5rem' },
};

function Spinner(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '1em',
        height: '1em',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        marginInlineEnd: '0.4em',
        verticalAlign: 'text-bottom',
      }}
    />
  );
}

/**
 * Button — accessible button with variant, size, and loading state.
 *
 * Purpose: Shared interactive button primitive across nSelf web and admin UIs.
 * Inputs:  ButtonProps — variant, size, loading, disabled, type, style, children,
 *          plus native button attributes. Ref-forwarded to the underlying <button>.
 * Outputs: React.ReactElement — a styled <button> with optional spinner.
 * Constraints:
 *   - loading=true disables the button automatically.
 *   - Spinner animation requires the 'spin' keyframe in the host stylesheet.
 *   - Uses inline styles; no Tailwind dependency at this primitive level.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/ui
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      type = 'button',
      style,
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          transition: 'opacity 0.15s ease, background 0.15s ease',
          userSelect: 'none',
          ...VARIANT_STYLES[variant],
          ...SIZE_STYLES[size],
          ...style,
        }}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);
