import type { ReactNode, RefObject } from 'react';

import type { BerasSize, BerasTone, BerasVariant } from '../foundations/index';

/** Shared outer-element props. `className` applies to the outermost element only. */
export interface BerasCommonProps {
  id?: string;
  className?: string;
}

export type InteractionSource = 'keyboard' | 'pointer' | 'programmatic';

export interface ChangeMeta {
  source: InteractionSource;
}

export type AsyncViewState<T> =
  | { status: 'loading'; label?: string }
  | { status: 'empty'; title: string; description?: string }
  | { status: 'error'; title: string; description?: string }
  | { status: 'ready'; data: T };

export interface BerasOption<Value extends string = string> {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SprintOption extends BerasOption<string> {
  group: string;
  startDate?: string;
  endDate?: string;
}

export interface ActionSpec {
  id: string;
  label: string;
  disabled?: boolean;
  pending?: boolean;
}

export type ValueChangeHandler<Value> = (nextValue: Value, meta: ChangeMeta) => void;
export type ActionHandler = (actionId: string, meta: ChangeMeta) => void;
export type RetryHandler = () => void;

export type OpenChangeReason = 'action' | 'backdrop' | 'escape' | 'outside' | 'programmatic';

export interface OpenChangeMeta extends ChangeMeta {
  reason: OpenChangeReason;
}

export type OpenChangeHandler = (open: boolean, meta: OpenChangeMeta) => void;

export type SortDirection = 'ascending' | 'descending';

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface DataColumn<Row> {
  id: string;
  header: string;
  render: (row: Row) => ReactNode;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface ChartPoint {
  id: string;
  label: string;
  value: number | null;
  description?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  points: readonly ChartPoint[];
  colorToken?: `--beras-data-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
}

export interface CalendarDay {
  isoDate: string;
  label: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  isWeekend?: boolean;
  disabled?: boolean;
  badges?: readonly string[];
}

export interface IssueTreeNode {
  id: string;
  label: string;
  description?: string;
  level: number;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  hasMore?: boolean;
  children?: readonly IssueTreeNode[];
}

export interface AdfLinkMark {
  type: 'link';
  attrs: { href: string; title?: string };
}

export type AdfTextMark =
  | { type: 'strong' | 'em' | 'underline' | 'strike' | 'code' }
  | AdfLinkMark;

export interface AdfTextNode {
  type: 'text';
  text: string;
  marks?: readonly AdfTextMark[];
}

export interface AdfParagraphNode {
  type: 'paragraph';
  content?: readonly AdfInlineNode[];
}

export interface AdfHeadingNode {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 };
  content?: readonly AdfInlineNode[];
}

export interface AdfBulletListNode {
  type: 'bulletList';
  content?: readonly AdfListItemNode[];
}

export interface AdfOrderedListNode {
  type: 'orderedList';
  attrs?: { order?: number };
  content?: readonly AdfListItemNode[];
}

export interface AdfListItemNode {
  type: 'listItem';
  content?: readonly AdfBlockNode[];
}

export interface AdfBlockquoteNode {
  type: 'blockquote';
  content?: readonly AdfBlockNode[];
}

export interface AdfCodeBlockNode {
  type: 'codeBlock';
  attrs?: { language?: string };
  content?: readonly AdfTextNode[];
}

export interface AdfRuleNode {
  type: 'rule';
}

export interface AdfTableCellNode {
  type: 'tableCell' | 'tableHeader';
  content?: readonly AdfBlockNode[];
}

export interface AdfTableRowNode {
  type: 'tableRow';
  content?: readonly AdfTableCellNode[];
}

export interface AdfTableNode {
  type: 'table';
  content?: readonly AdfTableRowNode[];
}

export interface AdfPanelNode {
  type: 'panel';
  attrs?: { panelType?: 'info' | 'note' | 'success' | 'warning' | 'error' };
  content?: readonly AdfBlockNode[];
}

export interface AdfUnknownNode {
  type: 'unknown';
  originalType?: string;
  content?: readonly AdfNode[];
}

export type AdfInlineNode = AdfTextNode;
export type AdfBlockNode =
  | AdfParagraphNode
  | AdfHeadingNode
  | AdfBulletListNode
  | AdfOrderedListNode
  | AdfListItemNode
  | AdfBlockquoteNode
  | AdfCodeBlockNode
  | AdfRuleNode
  | AdfTableNode
  | AdfTableRowNode
  | AdfTableCellNode
  | AdfPanelNode
  | AdfUnknownNode;

export interface AdfDocumentNode {
  type: 'doc';
  version: 1;
  content?: readonly AdfBlockNode[];
}

export type AdfNode = AdfDocumentNode | AdfBlockNode | AdfInlineNode;

export interface BerasIconProps extends BerasCommonProps {
  size?: number;
  label?: string;
}

export interface BrandMarkProps extends BerasCommonProps {
  compact?: boolean;
  label?: string;
}

export interface ButtonProps extends BerasCommonProps {
  children: ReactNode;
  actionId: string;
  variant?: BerasVariant;
  tone?: BerasTone;
  size?: BerasSize;
  disabled?: boolean;
  pending?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onAction?: ActionHandler;
}

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: ReactNode;
  label: string;
}

export interface BadgeProps extends BerasCommonProps {
  children: ReactNode;
  tone?: BerasTone;
}

export type StatusBadgeProps = BadgeProps;

export interface TagProps extends BadgeProps {
  removable?: boolean;
  onAction?: ActionHandler;
}

export interface AvatarProps extends BerasCommonProps {
  name: string;
  initials?: string;
  imageUrl?: string;
  size?: BerasSize;
}

export interface CardProps extends BerasCommonProps {
  children: ReactNode;
  title?: string;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone?: BerasTone;
}

export interface MetricCardProps extends BerasCommonProps {
  label: string;
  value: string;
  description?: string;
  tone?: BerasTone;
}

export interface StatGridProps extends BerasCommonProps {
  items: readonly MetricItem[];
}

export interface ProgressMeterProps extends BerasCommonProps {
  label: string;
  value: number;
  max?: number;
  description?: string;
  tone?: BerasTone;
}

export interface DividerProps extends BerasCommonProps {
  label?: string;
}

export interface CodeBlockProps extends BerasCommonProps {
  code: string;
  language?: string;
}

export interface SecretFieldProps extends BerasCommonProps {
  label: string;
  value: string;
  revealed?: boolean;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface FieldProps extends BerasCommonProps {
  name: string;
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export interface TextFieldProps extends FieldProps {
  value: string;
  type?: 'text' | 'email' | 'password' | 'search' | 'url';
  placeholder?: string;
  onValueChange: ValueChangeHandler<string>;
}

export interface TextAreaFieldProps extends FieldProps {
  value: string;
  rows?: number;
  placeholder?: string;
  onValueChange: ValueChangeHandler<string>;
}

export interface SwitchFieldProps extends FieldProps {
  value: boolean;
  onValueChange: ValueChangeHandler<boolean>;
}

export type CheckboxFieldProps = SwitchFieldProps;

export interface SelectFieldProps<Value extends string = string> extends FieldProps {
  value: Value | '';
  options: readonly BerasOption<Value>[];
  placeholder?: string;
  onValueChange: ValueChangeHandler<Value | ''>;
}

export interface ComboboxProps<Value extends string = string> extends FieldProps {
  value: Value | '';
  options: AsyncViewState<readonly BerasOption<Value>[]>;
  open: boolean;
  query?: string;
  placeholder?: string;
  onValueChange: ValueChangeHandler<Value | ''>;
  onOpenChange: OpenChangeHandler;
}

export type SearchComboboxProps<Value extends string = string> = ComboboxProps<Value>;

export interface MultiSelectProps<Value extends string = string> extends FieldProps {
  value: readonly Value[];
  options: AsyncViewState<readonly BerasOption<Value>[]>;
  open: boolean;
  query?: string;
  staged?: boolean;
  actions?: readonly ActionSpec[];
  onValueChange: ValueChangeHandler<readonly Value[]>;
  onOpenChange: OpenChangeHandler;
  onAction?: ActionHandler;
}

export interface DateFieldProps extends FieldProps {
  value: string;
  min?: string;
  max?: string;
  onValueChange: ValueChangeHandler<string>;
}

export type MonthFieldProps = DateFieldProps;

export interface DateRangeValue {
  start: string;
  end: string;
}

export interface DateRangeFieldProps extends FieldProps {
  value: DateRangeValue;
  presets?: readonly BerasOption[];
  onValueChange: ValueChangeHandler<DateRangeValue>;
  onAction?: ActionHandler;
}

export interface FieldGroupProps extends BerasCommonProps {
  legend: string;
  children: ReactNode;
}

export interface FilterBarProps extends BerasCommonProps {
  label: string;
  children: ReactNode;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface SegmentedControlProps<Value extends string = string> extends BerasCommonProps {
  label: string;
  value: Value;
  options: readonly BerasOption<Value>[];
  disabled?: boolean;
  onValueChange: ValueChangeHandler<Value>;
}

export interface SpinnerProps extends BerasCommonProps {
  label?: string;
  size?: BerasSize;
}

export interface SkeletonProps extends BerasCommonProps {
  label?: string;
}

export interface PageSkeletonProps extends BerasCommonProps {
  label?: string;
  dense?: boolean;
}

export type LoadingStage = 'waiting' | 'data' | 'progress';

export interface LoadingIllustrationProps extends BerasCommonProps {
  label: string;
  stage: LoadingStage;
  progress?: number;
  seed?: string;
}

export interface LoadingOverlayProps extends LoadingIllustrationProps {
  open: boolean;
}

export interface StateViewProps extends BerasCommonProps {
  state: Exclude<AsyncViewState<never>, { status: 'ready' }>;
  action?: ActionSpec;
  onAction?: ActionHandler;
  onRetry?: RetryHandler;
}

export interface CalloutProps extends BerasCommonProps {
  title: string;
  children?: ReactNode;
  tone?: BerasTone;
  action?: ActionSpec;
  onAction?: ActionHandler;
}

export interface ToastSpec {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
  urgent?: boolean;
  action?: ActionSpec;
}

export interface ToastProps extends BerasCommonProps {
  toast: ToastSpec;
  onAction?: ActionHandler;
}

export interface ToastViewportProps extends BerasCommonProps {
  toasts: readonly ToastSpec[];
  label?: string;
  onAction?: ActionHandler;
}

export interface MaintenanceStateProps extends BerasCommonProps {
  title: string;
  description?: string;
  pending?: boolean;
  onRetry?: RetryHandler;
}

export interface AccessStateProps extends BerasCommonProps {
  status: 'loading' | 'denied' | 'not-registered';
  title: string;
  description?: string;
  action?: ActionSpec;
  onAction?: ActionHandler;
}

export interface DialogProps extends BerasCommonProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onOpenChange: OpenChangeHandler;
}

export interface ConfirmDialogProps extends Omit<DialogProps, 'children'> {
  message: string;
  confirmAction: ActionSpec;
  cancelAction: ActionSpec;
  onAction: ActionHandler;
}

export interface LegalContentDialogProps extends Omit<DialogProps, 'children'> {
  document: 'terms' | 'privacy';
  content: ReactNode;
}

export interface DrawerProps extends DialogProps {
  placement?: 'start' | 'end';
}

export interface PopoverProps extends BerasCommonProps {
  open: boolean;
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  onOpenChange: OpenChangeHandler;
}

export interface DisplayItem {
  id: string;
  label: string;
  value?: string;
  description?: string;
  tone?: BerasTone;
  disabled?: boolean;
}

export interface SpecializedDialogProps extends Omit<DialogProps, 'children'> {
  state: AsyncViewState<readonly DisplayItem[]>;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export type MemberTasksDialogProps = SpecializedDialogProps;

export type FormFieldValue = string | boolean | readonly string[] | DateRangeValue;
export type FormValue = Readonly<Record<string, FormFieldValue>>;

export interface FormDialogProps extends Omit<DialogProps, 'children'> {
  value: FormValue;
  actions: readonly ActionSpec[];
  onValueChange: ValueChangeHandler<FormValue>;
  onAction: ActionHandler;
}

export type MemberFormDialogProps = FormDialogProps;
export type LeaveFormDialogProps = FormDialogProps;
export type HolidayFormDialogProps = FormDialogProps;
export type ConfigFormDialogProps = FormDialogProps;

export interface TicketDetailDialogProps extends Omit<DialogProps, 'children'> {
  item: DisplayItem;
  content?: AdfDocumentNode | string;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface ApiKeyRow extends DisplayItem {
  createdAt?: string;
  lastUsedAt?: string;
}

export interface ApiKeyTableProps extends BerasCommonProps {
  state: AsyncViewState<readonly ApiKeyRow[]>;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface JsonImportPanelProps extends BerasCommonProps {
  value: string;
  label: string;
  helperText?: string;
  error?: string;
  actions: readonly ActionSpec[];
  onValueChange: ValueChangeHandler<string>;
  onAction: ActionHandler;
}

export interface TabSpec extends BerasOption {
  badge?: string;
}

export interface TabsProps extends BerasCommonProps {
  label: string;
  value: string;
  tabs: readonly TabSpec[];
  onValueChange: ValueChangeHandler<string>;
}

export interface PaginationProps extends BerasCommonProps {
  page: number;
  pageCount: number;
  label?: string;
  onValueChange: ValueChangeHandler<number>;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps extends BerasCommonProps {
  items: readonly BreadcrumbItem[];
  label?: string;
}

export interface NavItem extends DisplayItem {
  href?: string;
  active?: boolean;
  children?: readonly NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: readonly NavItem[];
}

export interface NavListProps extends BerasCommonProps {
  label: string;
  groups: readonly NavGroup[];
  activeId?: string;
  onAction?: ActionHandler;
}

export interface AppHeaderProps extends BerasCommonProps {
  title: string;
  description?: string;
  accountLabel?: string;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface AppSidebarProps extends NavListProps {
  open: boolean;
  onOpenChange: OpenChangeHandler;
}

export interface PageHeaderProps extends BerasCommonProps {
  title: string;
  description?: string;
  breadcrumbs?: readonly BreadcrumbItem[];
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export interface DataTableProps<Row> extends BerasCommonProps {
  label: string;
  columns: readonly DataColumn<Row>[];
  state: AsyncViewState<readonly Row[]>;
  rowId: (row: Row) => string;
  sort?: SortState;
  selectedIds?: readonly string[];
  page?: number;
  pageCount?: number;
  onValueChange?: ValueChangeHandler<SortState | readonly string[] | number>;
  onAction?: ActionHandler;
}

export interface AuditLogEntry extends DisplayItem {
  changedAt: string;
  changedBy: string;
  action: string;
}

export interface CollectionProps<Item extends DisplayItem = DisplayItem> extends BerasCommonProps {
  label: string;
  state: AsyncViewState<readonly Item[]>;
  actions?: readonly ActionSpec[];
  onAction?: ActionHandler;
}

export type AuditLogPanelProps = CollectionProps<AuditLogEntry>;
export type ActivityListProps = CollectionProps;
export type TaskListProps = CollectionProps;
export type IssueListProps = CollectionProps;
export type HolidayListProps = CollectionProps;
export type LeaveListProps = CollectionProps;
export type TeamMetricsTableProps = CollectionProps;

export interface LeaveScheduleRow extends DisplayItem {
  cells: readonly DisplayItem[];
}

export type LeaveScheduleGridProps = CollectionProps<LeaveScheduleRow>;

export interface DefinitionItem {
  id: string;
  term: string;
  detail: ReactNode;
}

export interface DefinitionListProps extends BerasCommonProps {
  items: readonly DefinitionItem[];
}

export interface InstructionStep extends DisplayItem {
  code?: string;
}

export interface InstructionStepsProps extends BerasCommonProps {
  steps: readonly InstructionStep[];
}

export interface LegendProps extends BerasCommonProps {
  series: readonly Pick<ChartSeries, 'id' | 'label' | 'colorToken'>[];
}

export interface ChartProps extends BerasCommonProps {
  title: string;
  summary: string;
  series: readonly ChartSeries[];
  interactive?: boolean;
  onAction?: ActionHandler;
}

export type DonutChartProps = ChartProps;
export type BarChartProps = ChartProps;
export type AreaChartProps = ChartProps;
export type LineChartProps = ChartProps;

export interface TrendPanelProps extends BerasCommonProps {
  state: AsyncViewState<readonly ChartSeries[]>;
  title: string;
  summary: string;
  metricOptions?: readonly BerasOption[];
  metric?: string;
  onValueChange?: ValueChangeHandler<string>;
}

export type BugTrendPanelProps = TrendPanelProps;
export type SprintTrendPanelProps = TrendPanelProps;

export interface MonthCalendarProps extends BerasCommonProps {
  label: string;
  month: string;
  days: readonly CalendarDay[];
  value?: string;
  onValueChange: ValueChangeHandler<string>;
  onAction?: ActionHandler;
}

export interface HolidayCalendarProps extends MonthCalendarProps {
  range?: DateRangeValue;
}

export interface IssueTreeProps extends BerasCommonProps {
  label: string;
  state: AsyncViewState<readonly IssueTreeNode[]>;
  selectedId?: string;
  onValueChange?: ValueChangeHandler<string>;
  onAction?: ActionHandler;
}

export interface TreeControlsValue {
  query: string;
  filter: string;
  sort: string;
}

export interface TreeControlsProps extends BerasCommonProps {
  value: TreeControlsValue;
  disabled?: boolean;
  onValueChange: ValueChangeHandler<TreeControlsValue>;
}

export interface AdfContentProps extends BerasCommonProps {
  document?: AdfDocumentNode | string | null;
  emptyLabel?: string;
}

export interface Stat3DItem extends MetricItem {
  depth: number;
  sparklePositions?: readonly [number, number][];
}

export interface Stat3DSceneProps extends BerasCommonProps {
  label: string;
  items: readonly Stat3DItem[];
  activeId?: string;
  onValueChange?: ValueChangeHandler<string>;
}

export interface AppShellProps extends BerasCommonProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileNavigationOpen: boolean;
  onOpenChange: OpenChangeHandler;
}

export interface AuthLayoutProps extends BerasCommonProps {
  title: string;
  description?: string;
  hero?: ReactNode;
  children: ReactNode;
}

export interface AuthViewModel {
  title: string;
  description?: string;
  fields: readonly DisplayItem[];
  status?: 'idle' | 'validation' | 'pending' | 'error' | 'success';
  message?: string;
  actions: readonly ActionSpec[];
  legalOpen?: boolean;
}

export interface AuthFormValue {
  email?: string;
  password?: string;
  name?: string;
  teamIds?: readonly string[];
}

export interface AuthViewProps extends BerasCommonProps {
  model: AuthViewModel;
  value: AuthFormValue;
  onValueChange: ValueChangeHandler<AuthFormValue>;
  onAction?: ActionHandler;
  onOpenChange?: OpenChangeHandler;
}

export type SignInViewProps = AuthViewProps;
export type SignUpViewProps = AuthViewProps;

export interface CompositionViewModel {
  title: string;
  description?: string;
  state: AsyncViewState<readonly DisplayItem[]>;
  actions?: readonly ActionSpec[];
}

export interface CompositionViewProps<Model extends CompositionViewModel, Value>
  extends BerasCommonProps {
  model: Model;
  value: Value;
  onValueChange: ValueChangeHandler<Value>;
  onAction?: ActionHandler;
  onOpenChange?: OpenChangeHandler;
  onRetry?: RetryHandler;
}

export interface DashboardOverviewViewModel extends CompositionViewModel {
  metrics: readonly MetricItem[];
}

export interface DashboardOverviewValue {
  search: string;
}

export interface BugMonitoringViewModel extends CompositionViewModel {
  metrics: readonly MetricItem[];
  trend: readonly ChartSeries[];
}

export interface BugMonitoringValue {
  view: 'list' | 'table';
  activeTab: string;
}

export interface ConfigurationViewModel extends CompositionViewModel {
  tabs: readonly TabSpec[];
}

export interface ConfigurationValue {
  activeTab: string;
}

export interface McpConnectionViewModel extends CompositionViewModel {
  steps: readonly InstructionStep[];
}

export interface McpConnectionValue {
  dialog: 'closed' | 'create' | 'secret';
}

export interface ProductivitySummaryViewModel extends CompositionViewModel {
  metrics: readonly MetricItem[];
}

export interface ProductivitySummaryValue {
  month: string;
  query: string;
}

export interface ReportsViewModel extends CompositionViewModel {
  trend: readonly ChartSeries[];
}

export interface ReportsValue {
  dateRange: DateRangeValue;
  teamIds: readonly string[];
  sprintIds: readonly string[];
  epicIds: readonly string[];
}

export interface EpicExplorerViewModel extends CompositionViewModel {
  tree: readonly IssueTreeNode[];
}

export interface EpicExplorerValue {
  projectId: string;
  epicId: string;
  query: string;
}

export interface HolidayManagementViewModel extends CompositionViewModel {
  days: readonly CalendarDay[];
}

export interface HolidayManagementValue {
  view: 'list' | 'calendar';
  selectedDate: string;
  dialogOpen: boolean;
}

export interface TalentLeaveViewModel extends CompositionViewModel {
  schedule: readonly LeaveScheduleRow[];
}

export interface TalentLeaveValue {
  view: 'list' | 'calendar';
  month: string;
  dialogOpen: boolean;
}

export interface TeamMembersViewModel extends CompositionViewModel {
  teams: readonly DisplayItem[];
}

export interface TeamMembersValue {
  query: string;
  dialog: 'closed' | 'create' | 'edit' | 'confirm';
}

export type DashboardOverviewProps = CompositionViewProps<
  DashboardOverviewViewModel,
  DashboardOverviewValue
>;
export type BugMonitoringViewProps = CompositionViewProps<
  BugMonitoringViewModel,
  BugMonitoringValue
>;
export type ConfigurationViewProps = CompositionViewProps<
  ConfigurationViewModel,
  ConfigurationValue
>;
export type McpConnectionViewProps = CompositionViewProps<
  McpConnectionViewModel,
  McpConnectionValue
>;
export type ProductivitySummaryViewProps = CompositionViewProps<
  ProductivitySummaryViewModel,
  ProductivitySummaryValue
>;
export type ReportsViewProps = CompositionViewProps<ReportsViewModel, ReportsValue>;
export type EpicExplorerViewProps = CompositionViewProps<
  EpicExplorerViewModel,
  EpicExplorerValue
>;
export type HolidayManagementViewProps = CompositionViewProps<
  HolidayManagementViewModel,
  HolidayManagementValue
>;
export type TalentLeaveViewProps = CompositionViewProps<TalentLeaveViewModel, TalentLeaveValue>;
export type TeamMembersViewProps = CompositionViewProps<TeamMembersViewModel, TeamMembersValue>;
