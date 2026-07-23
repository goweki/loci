"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { MoreVertical, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ProductWithRelations } from "@/services/commerce/product.service";

interface MerchantActionsProps {
  product: ProductWithRelations;
}

export default function MerchantActions({ product }: MerchantActionsProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  async function handleToggleStatus() {
    startTransition(async () => {
      try {
        /**
         * TODO:
         *
         * await toggleProductStatusAction(product.id)
         */

        toast.success(
          product.isActive ? "Product deactivated." : "Product activated.",
        );

        router.refresh();
      } catch {
        toast.error("Unable to update product.");
      }
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        /**
         * TODO:
         *
         * await deleteProductAction(product.id)
         */

        toast.success("Product deleted.");

        router.push("/dashboard/products");
      } catch {
        toast.error("Unable to delete product.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Product
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleToggleStatus}>
          {product.isActive ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Deactivate Product
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Activate Product
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Product
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
