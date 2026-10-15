import { getUserProducts } from "@/actions/product.actions";
import { StockScanner } from "@/components/dashboard/inventory/stock-scanner";
import PageTitle from "@/components/ui/page-title";
import { isValidLanguage } from "@/lib/i18n";
import { ScanLine } from "lucide-react";

export default async function InventoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) return null;
  const result = await getUserProducts();
  if (!result.ok) return <div className="p-6 text-destructive">{result.error}</div>;
  const scannerProducts = result.data.map(({ id, name, stockQty }) => ({ id, name, stockQty }));
  return <div className="space-y-6 p-6"><PageTitle icon={ScanLine} title="Inventory scanning" description="Scan a product QR code to add or remove stock." /><StockScanner initialProducts={scannerProducts} /></div>;
}
