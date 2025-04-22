export interface ProductivityModel {
    member: string
    productPoint: number
    techDebtPoint: number
    totalPoint: number
    productivityRate: string
    averageComplexity: string
    totalWeightPoints: number
    devDefect: number
    devDefectRate: string
  }
  
  export interface ProductivityResponse {
    issues: ProductivityModel[]
    totalIssueProduct: number
    totalIssueTechDebt: number
    productPercentage: string
    techDebtPercentage: string
    averageProductivity: string
  }
  