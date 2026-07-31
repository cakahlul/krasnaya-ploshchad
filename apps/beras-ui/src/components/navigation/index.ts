import type { ComponentType } from 'react';
import type * as T from '../../public/types';

// BU-P1-08: replace this contract stub before the final gate.
function stub<Props>(name: string): ComponentType<Props> {
  const Component: ComponentType<Props> = () => { throw new Error(`${name} requires BU-P1-08`); };
  Component.displayName = `${name}ContractStub`;
  return Component;
}

export const Tabs = stub<T.TabsProps>('Tabs');
export const Pagination = stub<T.PaginationProps>('Pagination');
export const Breadcrumbs = stub<T.BreadcrumbsProps>('Breadcrumbs');
export const NavList = stub<T.NavListProps>('NavList');
export const AppHeader = stub<T.AppHeaderProps>('AppHeader');
export const AppSidebar = stub<T.AppSidebarProps>('AppSidebar');
export const PageHeader = stub<T.PageHeaderProps>('PageHeader');
