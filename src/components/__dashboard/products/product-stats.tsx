import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductWithRelations } from "@/services/commerce/product.service";

interface Props {
  products: ProductWithRelations[];
}

export function ProductStats({ products }: Props) {
  const totalProducts = products.length;

  const inventoryValue = products.reduce(
    (acc, product) => acc + Number(product.price) * product.stockQty,
    0,
  );

  const lowStock = products.filter((p) => p.stockQty < 5).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Products</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">{totalProducts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Value</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">
            KES {inventoryValue.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold">{lowStock}</p>
        </CardContent>
      </Card>
    </div>
  );
}
