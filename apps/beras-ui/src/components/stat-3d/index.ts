import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-13: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-13`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const Stat3DScene = stub<T.Stat3DSceneProps>('Stat3DScene');
