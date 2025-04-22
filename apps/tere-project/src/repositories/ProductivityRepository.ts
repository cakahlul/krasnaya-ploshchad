import { ProductivityResponse } from "@/models/ProductivityModel"

export const getProductivityData = async (): Promise<ProductivityResponse> => {
  const res = await fetch("/data/productivity.json")
  if (!res.ok) throw new Error("Failed to fetch productivity data")
  return res.json()
}
