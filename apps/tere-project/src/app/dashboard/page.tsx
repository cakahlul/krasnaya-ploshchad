import { ProductivityTable } from "@/views/ProductivityTable";


export default function Dashboard() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Productivity Table</h1>
      <ProductivityTable />
    </main>
  )
}