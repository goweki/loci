"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Props {
  data: {
    month: string;
    revenue: number;
  }[];
}

export function SalesChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line type="monotone" dataKey="revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
