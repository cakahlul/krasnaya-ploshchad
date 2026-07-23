import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-05: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-05`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const Spinner = stub<T.SpinnerProps>('Spinner');
export const Skeleton = stub<T.SkeletonProps>('Skeleton');
export const PageSkeleton = stub<T.PageSkeletonProps>('PageSkeleton');
export const LoadingOverlay = stub<T.LoadingOverlayProps>('LoadingOverlay');
export const LoadingIllustration = stub<T.LoadingIllustrationProps>('LoadingIllustration');
export const StateView = stub<T.StateViewProps>('StateView');
export const Callout = stub<T.CalloutProps>('Callout');
export const Toast = stub<T.ToastProps>('Toast');
export const ToastViewport = stub<T.ToastViewportProps>('ToastViewport');
export const MaintenanceState = stub<T.MaintenanceStateProps>('MaintenanceState');
export const AccessState = stub<T.AccessStateProps>('AccessState');
