import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-12: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-12`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const IssueTree = stub<T.IssueTreeProps>('IssueTree');
export const TreeControls = stub<T.TreeControlsProps>('TreeControls');
export const AdfContent = stub<T.AdfContentProps>('AdfContent');
