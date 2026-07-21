// "use client";

// import Link from "next/link";
// import {
//   Package,
//   ShoppingCart,
//   Receipt,
//   MessageSquare,
//   Plus,
//   ArrowRight,
// } from "lucide-react";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { useI18n } from "@/lib/i18n";

// export function QuickActions() {
//   const { language } = useI18n();

//   const actions = [
//     {
//       title: "New Product",
//       description: "Add inventory item",
//       href: `/${language}/dashboard/products/create`,
//       icon: Package,
//     },
//     {
//       title: "Create Order",
//       description: "Generate a customer order",
//       href: `/${language}/dashboard/orders/create`,
//       icon: ShoppingCart,
//     },
//     {
//       title: "Create Invoice",
//       description: "Issue a payment request",
//       href: `/${language}/dashboard/invoices/create`,
//       icon: Receipt,
//     },
//     {
//       title: "Send Message",
//       description: "Start a conversation",
//       href: `/${language}/dashboard/contacts`,
//       icon: MessageSquare,
//     },
//   ];

//   return (
//     <Card>

//       <CardContent>
//         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//           {actions.map((action) => (
//             <Link
//               key={action.href}
//               href={action.href}
//               className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
//             >
//               <div className="flex items-center justify-between">
//                 <action.icon className="h-5 w-5 text-muted-foreground" />

//                 <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
//               </div>

//               <h3 className="mt-4 font-medium">{action.title}</h3>

//               <p className="mt-1 text-sm text-muted-foreground">
//                 {action.description}
//               </p>
//             </Link>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import {
  MessageSquareIcon,
  PackageIcon,
  Plus,
  Send,
  ShoppingCartIcon,
  Zap,
} from "lucide-react";
import Link from "next/link";

const translations = {
  en: {
    quickActions: "Quick Actions",
    newProduct: "New Product",
    createOrder: "Create Order",
    sendMessage: "Send Message",
  },

  sw: {
    quickActions: "Vitendo vya Haraka",
    newProduct: "Bidhaa Mpya",
    createOrder: "Tengeneza Agizo",
    sendMessage: "Tuma Ujumbe",
  },
} as const;

export default function QuickActions() {
  const { language } = useI18n();
  const t = translations[language];

  const quickActions = [
    {
      label: t.newProduct,
      description: "Add inventory item",
      href: `/${language}/dashboard/products/create`,
      icon: PackageIcon,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: t.createOrder,
      description: "Generate a customer order",
      href: `/${language}/dashboard/orders/create`,
      icon: ShoppingCartIcon,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: t.sendMessage,
      description: "Start a conversation",
      href: `/${language}/dashboard/contacts`,
      icon: MessageSquareIcon,
      color: "bg-blue-600 hover:bg-blue-700",
    },
  ];

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>{t.quickActions}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              href={action.href}
              key={idx}
              className={`${action.color} text-white p-4 rounded-lg flex items-center justify-center gap-3 transition-colors`}
            >
              <action.icon className="w-5 h-5" />
              <span className="font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
