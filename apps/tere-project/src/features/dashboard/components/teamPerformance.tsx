"use client";

import {
  PieChartOutlined,
  RiseOutlined,
  ToolOutlined,
  ProductOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { useTeamReportTransform } from "../hooks/useTeamReportTransform";

export default function TeamPerformance() {
  const { data } = useTeamReportTransform();

  const defaultData = [
    {
      label: "Total Product Points",
      value: data?.productTask,
      icon: <ProductOutlined className="text-white text-2xl" />,
      bg: "bg-indigo-700",
    },
    {
      label: "Total Tech Debt Points",
      value: data?.techDebtTask,
      icon: <ToolOutlined className="text-white text-2xl" />,
      bg: "bg-rose-700",
    },
    {
      label: "Product Percentage",
      value: data?.productPercentage,
      icon: <PieChartOutlined className="text-white text-2xl" />,
      bg: "bg-emerald-700",
    },
    {
      label: "Tech Debt Percentage",
      value: data?.techDebtPercentage,
      icon: <AppstoreAddOutlined className="text-white text-2xl" />,
      bg: "bg-yellow-700",
    },
    {
      label: "Avg Productivity",
      value: data?.averageProductivity,
      icon: <RiseOutlined className="text-white text-2xl" />,
      bg: "bg-blue-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 pt-4">
      {defaultData.map((item, idx) => (
        <div
          key={idx}
          className={`${item.bg} text-white rounded-3xl p-6 shadow-lg transition-transform duration-300 hover:scale-[1.05] hover:shadow-2xl`}
        >
          <div className="flex items-center gap-4">
            {item.icon}
            <span className="text-base font-semibold">{item.label}</span>
          </div>
          <div className="text-5xl font-extrabold mt-4 relative hover:animate-bounce-up-down">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
