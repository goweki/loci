"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Pencil, Eye, EyeOff, Trash2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ProductWithRelations } from "@/services/commerce/product.service";
// import {
//   deleteProductAction,
//   toggleProductStatusAction,
// } from "@/actions/product.actions";

interface ProductActionsProps {
  product: ProductWithRelations;
}

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    router.push(`/dashboard/products/${product.id}/edit`);
  }

  function handleToggleStatus() {
    startTransition(async () => {
      try {
        /**
         * TODO:
         *
         * const result = await toggleProductStatusAction(product.id);
         *
         * if (!result.ok) {
         *   toast.error(result.error);
         *   return;
         * }
         */

        toast.success(
          product.isActive ? "Product deactivated." : "Product activated.",
        );

        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Unable to update product.");
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${product.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        /**
         * TODO:
         *
         * const result = await deleteProductAction(product.id);
         *
         * if (!result.ok) {
         *   toast.error(result.error);
         *   return;
         * }
         */

        toast.success("Product deleted.");

        router.push("/dashboard/products");
      } catch (error) {
        console.error(error);
        toast.error("Unable to delete product.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleEdit}>
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
