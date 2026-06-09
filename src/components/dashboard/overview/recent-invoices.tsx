import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { InvoiceService } from "@/services/commerce/invoice.service";
import { Prisma } from "@/lib/prisma/generated";

type RecentInvoicesProps = {
  invoices: Prisma.InvoiceGetPayload<{}>[];
};

export async function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/dashboard/invoices/${invoice.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
            >
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>

                <p className="text-sm text-muted-foreground">
                  Due{" "}
                  {invoice.dueDate ? invoice.dueDate.toLocaleDateString() : "-"}
                </p>
              </div>

              <div className="text-right">
                <p className="font-medium">
                  KES {Number(invoice.total).toLocaleString()}
                </p>

                <Badge>{invoice.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
