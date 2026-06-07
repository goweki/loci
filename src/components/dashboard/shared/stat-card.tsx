import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>

            <h3 className="text-2xl font-bold mt-2">{value}</h3>
          </div>

          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
