"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  Package,
  Layers,
  FileText,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import InputPrice from "@/components/ui/input-currency";
import { ImageInput } from "@/components/ui/input-image";

import { Currency } from "@/lib/prisma/generated";
import { createProductAction } from "@/actions/product.actions";
import { useI18n } from "@/lib/i18n";
import { useEdgeStore } from "@/lib/storage/edgestore-client";

interface Props {
  defaultValues?: {
    name?: string;
    description?: string;
    price?: number;
    stockQty?: number;
    imageUrl?: string;
  };
}

type Step = 1 | 2;

export function ProductForm({ defaultValues }: Props) {
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const { language } = useI18n();

  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [price, setPrice] = useState(defaultValues?.price?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>("KES");
  const [image, setImage] = useState<File | null>(null);

  const [uiState, setUiState] = useState<string | null>(null);

  /**
   * Validate Step 1
   */
  function validateDetails() {
    if (!formRef.current) return false;

    const formData = new FormData(formRef.current);

    const name = String(formData.get("product-name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const stock = Number(formData.get("stockQty") ?? 0);

    if (!name) {
      toast.error("Product name is required.");
      return false;
    }

    if (!description) {
      toast.error("Description is required.");
      return;
    }

    if (!price || Number(price) <= 0) {
      toast.error("Enter a valid price.");
      return false;
    }

    if (stock < 0) {
      toast.error("Stock cannot be negative.");
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!validateDetails()) return;

    setStep(2);
  }

  function previousStep() {
    setStep(1);
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        // const name = String(formData.get("product-name") ?? "").trim();
        const name = String(formData.get("product-name") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const stockQty = Number(formData.get("stockQty") ?? 0);
        const image = formData.get("image") as File | null;

        if (!name) {
          toast.error("Product name is required.");
          return;
        }

        if (!description) {
          toast.error("Description is required.");
          return;
        }

        if (!price || Number(price) <= 0) {
          toast.error("Price is required.");
          return;
        }

        // upload image
        let imageUrl: string | null = null;
        if (image) {
          const { url: imgUrl } = await edgestore.publicFiles.upload({
            file: image,
            onProgressChange: (progress) => {
              // you can use this to show a progress bar
              setUiState(`uploading image: ${progress}%`);
            },
          });
          setUiState(null);
          imageUrl = imgUrl;
        }

        const productRes = await createProductAction({
          name,
          description,
          price: Number(price),
          currency,
          stockQty,
          imageUrl: imageUrl || undefined,
        });

        if (!productRes.ok) {
          toast.error(productRes.error);
          return;
        }

        toast.success("Product created.");

        router.push(`/${language}/dashboard/products/${productRes.data.id}`);
      } catch (error) {
        console.error(error);

        toast.error("Something went wrong.");
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Product</CardTitle>

        <CardDescription>
          Complete the product details before uploading an image.
        </CardDescription>

        <div className="space-y-2 pt-2">
          <Progress value={step === 1 ? 50 : 100} />

          <div className="flex justify-between text-xs text-muted-foreground">
            <div className={step === 1 ? "font-medium text-primary" : ""}>
              1. Details
            </div>

            <div className={step === 2 ? "font-medium text-primary" : ""}>
              2. Image
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-6">
          {/* ------------------------------------------------ */}
          {/* STEP 1 */}
          {/* ------------------------------------------------ */}

          <div className={step === 1 ? "space-y-4" : "hidden"}>
            {/* Product Name */}

            <div className="space-y-2">
              <Label htmlFor="product-name" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product / Service Name
                <span className="text-destructive">*</span>
              </Label>

              <Input
                id="product-name"
                name="product-name"
                defaultValue={defaultValues?.name}
                placeholder="Wireless Earbuds"
                required
                disabled={isPending}
              />
            </div>

            {/* Description */}

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description <span className="text-destructive">*</span>
              </Label>

              <Textarea
                id="description"
                name="description"
                defaultValue={defaultValues?.description}
                className="min-h-28"
                placeholder="Describe your product..."
                required
              />
            </div>

            {/* Price + Stock */}

            <div className="grid gap-4 md:grid-cols-2">
              <InputPrice
                id="price"
                label="Price"
                price={price}
                currency={currency}
                onPriceChange={setPrice}
                onCurrencyChange={setCurrency}
                required
              />

              <div className="space-y-2">
                <Label htmlFor="stockQty" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Stock Quantity
                </Label>

                <Input
                  id="stockQty"
                  name="stockQty"
                  type="number"
                  min={0}
                  defaultValue={defaultValues?.stockQty}
                />
              </div>
            </div>

            {/* Hidden values for FormData */}

            <input type="hidden" name="price" value={price} />

            <input type="hidden" name="currency" value={currency} />

            {/* Footer */}

            <div className="flex justify-end">
              <Button type="button" onClick={nextStep}>
                Continue
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* STEP 2 */}
          {/* ------------------------------------------------ */}

          <div className={step === 2 ? "space-y-4" : "hidden"}>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Product Image</h3>

                <p className="text-sm text-muted-foreground">
                  Upload a product image. Supported formats include JPG, PNG and
                  WebP.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Image
                </Label>

                <ImageInput name="image" maxSizeMB={1} />

                <p className="text-xs text-muted-foreground">
                  Recommended size: 800 × 800 pixels.
                </p>
              </div>

              {image && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />

                    <div>
                      <p className="font-medium">{image.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {(image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={previousStep}>
                Back
              </Button>

              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uiState ? uiState : "Saving Product..."}
                  </>
                ) : (
                  "Save Product"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
