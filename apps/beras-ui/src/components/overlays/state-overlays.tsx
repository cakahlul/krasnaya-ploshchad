'use client';

import type {
  ApiKeyTableProps,
  AsyncViewState,
  DisplayItem,
  MemberTasksDialogProps,
} from '../../public/types';
import { ActionButtons } from './actions';
import { BaseModal } from './modal';

function StateContent({
  disclosures = false,
  state,
}: {
  disclosures?: boolean;
  state: AsyncViewState<readonly DisplayItem[]>;
}) {
  if (state.status === 'loading') {
    return <p role="status" aria-busy="true">{state.label ?? 'Loading…'}</p>;
  }
  if (state.status === 'empty') {
    return (
      <section aria-label="Empty state">
        <h3>{state.title}</h3>
        {state.description ? <p>{state.description}</p> : null}
      </section>
    );
  }
  if (state.status === 'error') {
    return (
      <section role="alert">
        <h3>{state.title}</h3>
        {state.description ? <p>{state.description}</p> : null}
      </section>
    );
  }
  return (
    <ul>
      {state.data.map((item) => {
        const itemContent = (
          <>
            {item.value ? <span>{item.value}</span> : null}
            {item.description ? <p>{item.description}</p> : null}
          </>
        );
        return (
          <li key={item.id} data-beras-tone={item.tone}>
            {disclosures ? (
              <details open={item.value === 'expanded' || (item.description?.length ?? 0) > 200}>
                <summary>{item.label}</summary>
                {itemContent}
              </details>
            ) : (
              <>
                <strong>{item.label}</strong>
                {itemContent}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function MemberTasksDialog({
  actions = [],
  onAction,
  state,
  ...props
}: MemberTasksDialogProps) {
  return (
    <BaseModal
      rootClass="beras-member-tasks-dialog beras-dialog"
      {...props}
      footer={
        <ActionButtons
          actions={actions}
          label="Member task actions"
          onAction={onAction}
        />
      }
    >
      <StateContent state={state} disclosures />
    </BaseModal>
  );
}

export function ApiKeyTable({
  actions = [],
  className,
  id,
  onAction,
  state,
}: ApiKeyTableProps) {
  return (
    <section
      id={id}
      className={`beras-api-key-table${className ? ` ${className}` : ''}`}
      data-beras-state={state.status}
      aria-busy={state.status === 'loading' || undefined}
    >
      {state.status === 'ready' ? (
        <div
          className="beras-api-key-table__overflow"
          role="region"
          aria-label="API keys"
          tabIndex={0}
        >
          <table className="beras-api-key-table__table">
            <caption>API keys</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Key</th>
                <th scope="col">Created</th>
                <th scope="col">Last used</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value ?? '—'}</td>
                  <td>{row.createdAt ?? '—'}</td>
                  <td>{row.lastUsedAt ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StateContent state={state} />
      )}
      {actions.length ? (
        <ActionButtons
          actions={actions}
          label="API key actions"
          onAction={onAction}
        />
      ) : null}
    </section>
  );
}
