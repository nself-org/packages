/**
 * Card — surface container primitive.
 *
 * Purpose: Base card container for nSelf UI — a rounded bordered surface
 *          with optional header, body, and footer slots.
 *
 * Inputs:
 *   - header: ReactNode | undefined — card header slot
 *   - footer: ReactNode | undefined — card footer slot
 *   - className: string — Tailwind/CSS class override
 *   - children: ReactNode — card body content
 *   - All native <div> props forwarded
 *
 * Outputs: Accessible card container element.
 *
 * Constraints:
 *   - No intrinsic padding on children — apps control body spacing.
 *   - Header and footer are optional; body (children) is always present.
 *
 * Usage:
 *   import { Card } from '@nself/ui';
 *   <Card header={<h2>Title</h2>} footer={<Button>Save</Button>}>
 *     <p>Content goes here.</p>
 *   </Card>
 *
 * SOT: F-NSELF-UI-CARD-01
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional header slot — rendered above children. */
  header?: React.ReactNode;
  /** Optional footer slot — rendered below children. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Card — surface container with optional header and footer slots.
 *
 * Purpose: Provide a consistent card surface (border, shadow, rounded corners)
 *          across nSelf web and admin UIs.
 * Inputs:  CardProps — header, footer, children, plus native div attributes.
 * Outputs: React.ReactElement — a styled div with header/content/footer regions.
 * Constraints:
 *   - Inline styles only (no Tailwind class dependency at this level).
 *   - header/footer are optional; rendered only when defined.
 * SPORT: F08-SERVICE-INVENTORY.md — @nself/ui
 */
export function Card({ header, footer, children, style, ...rest }: CardProps): React.ReactElement {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.07)',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {header !== undefined && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          {header}
        </div>
      )}

      <div style={{ padding: '1.25rem' }}>{children}</div>

      {footer !== undefined && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
