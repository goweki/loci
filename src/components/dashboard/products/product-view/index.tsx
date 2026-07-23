"use client";

import { ProductWithRelations } from "@/services/commerce/product.service";

import ProductHeader from "./product-header";
import ProductImage from "./product-image";
import ProductInformation from "./product-information";
import PurchaseCard from "./purchase-card";
import InventoryStats from "./inventory-stats";
import ProductMetadata from "./product-metadata";

interface ProductViewProps {
  product: ProductWithRelations;
  merchantInfo?: boolean;
}

export default function ProductView({
  product,
  merchantInfo = false,
}: ProductViewProps) {
  const inventoryValue = Number(product.price) * product.stockQty;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ProductHeader product={product} merchantInfo={merchantInfo} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6">
          <ProductImage product={product} />
        </div>

        {/* Right */}
        <div className="space-y-6 lg:col-span-2">
          <ProductInformation product={product} />

          {merchantInfo ? (
            <>
              <InventoryStats
                product={product}
                inventoryValue={inventoryValue}
              />

              <ProductMetadata product={product} />
            </>
          ) : (
            <PurchaseCard product={product} />
          )}
        </div>
      </div>
    </div>
  );
}
