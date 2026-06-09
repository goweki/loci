"use client";

import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Receipt,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export function QuickActions() {
  const { language } = useI18n();

  const actions = [
    {
      title: "New Product",
      description: "Add inventory item",
      href: `/${language}/dashboard/products/create`,
      icon: Package,
    },
    {
      title: "Create Order",
      description: "Generate a customer order",
      href: `/${language}/dashboard/orders/create`,
      icon: ShoppingCart,
    },
    {
      title: "Create Invoice",
      description: "Issue a payment request",
      href: `/${language}/dashboard/invoices/create`,
      icon: Receipt,
    },
    {
      title: "Send Message",
      description: "Start a conversation",
      href: `/${language}/dashboard/contacts`,
      icon: MessageSquare,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for your business</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <action.icon className="h-5 w-5 text-muted-foreground" />

                <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <h3 className="mt-4 font-medium">{action.title}</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
