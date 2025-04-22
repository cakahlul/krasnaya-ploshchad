import { useQuery } from "@tanstack/react-query"
import { getProductivityData } from "@/repositories/ProductivityRepository"

export const useProductivityViewModel = () => {
  return useQuery({
    queryKey: ["productivity"],
    queryFn: getProductivityData,
  })
}