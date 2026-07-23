'use client';

import type { TicketDetailDialogProps } from '../../public/types';
import { ActionButtons } from './actions';
import { BaseModal } from './modal';

function plainAdfText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const record = node as { text?: unknown; content?: unknown };
  const ownText = typeof record.text === 'string' ? record.text : '';
  const childText = Array.isArray(record.content)
    ? record.content.map(plainAdfText).filter(Boolean).join(' ')
    : '';
  return [ownText, childText].filter(Boolean).join(' ');
}

export function TicketDetailDialog({
  actions = [],
  content,
  item,
  onAction,
  ...props
}: TicketDetailDialogProps) {
  const detail = typeof content === 'string' ? content : plainAdfText(content);
  return (
    <BaseModal
      rootClass="beras-ticket-detail-dialog beras-dialog"
      {...props}
      footer={
        <ActionButtons actions={actions} label="Ticket actions" onAction={onAction} />
      }
    >
      <article>
        <h3>{item.label}</h3>
        {item.value ? <p>{item.value}</p> : null}
        {item.description ? <p>{item.description}</p> : null}
        {detail ? <p>{detail}</p> : null}
      </article>
    </BaseModal>
  );
}
