"use client"
import { ProductivityModel } from "@/models/ProductivityModel"
import { useProductivityViewModel } from "@/view-models/ProductivityViewModel"
import { Table } from "antd"
import type { ColumnsType } from "antd/es/table"

export const ProductivityTable = () => {
  const { data, isLoading } = useProductivityViewModel()

  const columns: ColumnsType<ProductivityModel> = [
    { title: "Member", dataIndex: "member", key: "member" },
    { title: "Product Point", dataIndex: "productPoint", key: "productPoint" },
    { title: "Tech Debt Point", dataIndex: "techDebtPoint", key: "techDebtPoint" },
    { title: "Total Point", dataIndex: "totalPoint", key: "totalPoint" },
    { title: "Productivity Rate", dataIndex: "productivityRate", key: "productivityRate" },
    { title: "Avg. Complexity", dataIndex: "averageComplexity", key: "averageComplexity" },
    { title: "Total Weight Pts", dataIndex: "totalWeightPoints", key: "totalWeightPoints" },
    { title: "Dev Defect", dataIndex: "devDefect", key: "devDefect" },
    { title: "Defect Rate", dataIndex: "devDefectRate", key: "devDefectRate" },
  ]

  return <Table columns={columns} dataSource={data?.issues || []} loading={isLoading} rowKey="member" scroll={{ x: 'max-content' }} />
}
