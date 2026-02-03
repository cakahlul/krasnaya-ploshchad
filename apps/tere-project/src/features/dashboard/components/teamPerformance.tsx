"use client";

import {
  PieChartOutlined,
  RiseOutlined,
  CalendarOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useTeamReportTransform } from "../hooks/useTeamReportTransform";

export default function TeamPerformance() {
  const { data } = useTeamReportTransform();

  const statsData = [
    {
      label: "Avg WP per Hour",
      value: data?.averageWpPerHour?.toFixed(2) ?? '-',
      icon: <RocketOutlined className="text-white text-2xl" />,
      bg: "bg-teal-700",
    },
    {
      label: "Avg Productivity",
      value: data?.averageProductivity,
      icon: <RiseOutlined className="text-white text-2xl" />,
      bg: "bg-blue-700",
    },
    {
      label: "Product Percentage",
      value: data?.productPercentage,
      icon: <PieChartOutlined className="text-white text-2xl" />,
      bg: "bg-green-700",
    },
    {
      label: "Tech Debt Percentage",
      value: data?.techDebtPercentage,
      icon: <PieChartOutlined className="text-white text-2xl" />,
      bg: "bg-orange-700",
    },
    {
      label: "Sprint Working Days",
      value: data?.totalWorkingDays,
      icon: <CalendarOutlined className="text-white text-2xl" />,
      bg: "bg-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 py-4">
      {statsData.map((item, idx) => (
        <div
          key={idx}
          className={`${item.bg} text-white rounded-xl p-4 shadow-lg flex flex-col gap-2`}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <div className="text-2xl font-bold">{item.value ?? "-"}</div>
        </div>
      ))}
    </div>
  );
}
