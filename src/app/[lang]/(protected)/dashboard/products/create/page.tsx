import { requireUser } from "@/lib/auth";
import TitleSection from "@/components/ui/page-title";
import { BoxIcon } from "lucide-react";
import { ProductForm } from "@/components/dashboard/products/product-form";

type PageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function CreateProductPage({ params }: PageProps) {
  const session = await requireUser();
  const { lang } = await params;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <TitleSection
        title="New Product"
        subtitle=" Product details and inventory information"
        icon={BoxIcon}
        breadcrumbs={[
          { label: "Products", href: `/${lang}/dashboard/products` },
          { label: "new" },
        ]}
      />

      <ProductForm />
    </div>
  );
}
