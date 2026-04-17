import type { IComplexityWeightStrategy } from './complexity-weight.strategy';
import type { JiraIssueEntity } from '@shared/types/report.types';
import { parseAppendixWeightPoints, isMeetingAppendixValue, parseMeetingSP, type AppendixWeightPoint } from '@shared/utils/appendix-level';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';

const DEFAULT_WEIGHTS: WpWeights = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 4,
  'High': 8,
};

export class V3ComplexityWeightStrategy implements IComplexityWeightStrategy {
  constructor(private readonly weights: Record<AppendixWeightPoint, number> = DEFAULT_WEIGHTS) {}

  /**
   * Calculates the Weight Points (WP) for an issue.
   * Meeting tickets (ALL-Meeting prefix) are excluded from WP calculation — they return 0.
   */
  calculateWeight(issue: JiraIssueEntity): number {
    const selectedOptions = issue.fields.customfield_11543 || [];
    return selectedOptions.reduce((total: number, option: any) => {
      const appendixWeightText = option?.value;
      if (!appendixWeightText) return total;
      // Meeting tickets are not counted as WP — skip them entirely
      if (isMeetingAppendixValue(appendixWeightText)) return total;
      const weightPoint = parseAppendixWeightPoints(appendixWeightText);
      if (!weightPoint) return total;
      return total + this.weights[weightPoint];
    }, 0);
  }

  /**
   * Extracts the total Story Points from meeting appendix values.
   * Only applies to options with "ALL-Meeting" prefix.
   * Non-meeting options contribute 0 SP here — they are handled via WP conversion.
   */
  extractMeetingSP(issue: JiraIssueEntity): number {
    const selectedOptions = issue.fields.customfield_11543 || [];
    return selectedOptions.reduce((total: number, option: any) => {
      const appendixWeightText = option?.value;
      if (!appendixWeightText) return total;
      const sp = parseMeetingSP(appendixWeightText);
      return sp !== null ? total + sp : total;
    }, 0);
  }
}

export const v3ComplexityWeightStrategy = new V3ComplexityWeightStrategy();
