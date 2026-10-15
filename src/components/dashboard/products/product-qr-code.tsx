"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function ProductQrCode({ productId, productName }: { productId: string; productName: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(productId, { errorCorrectionLevel: "M", margin: 2, width: 320 })
      .then((url) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setDataUrl(""); });
    return () => { active = false; };
  }, [productId]);

  if (!dataUrl) return <p className="text-sm text-muted-foreground">Preparing product QR code…</p>;

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
      {/* QR image is generated locally from the opaque product ID. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`Inventory QR code for ${productName}`} width={240} height={240} />
      <p className="text-sm font-medium">{productName}</p>
      <a href={dataUrl} download={`loci-product-${productId}.png`}>
        <Button type="button" variant="outline">Download QR code</Button>
      </a>
    </div>
  );
}
