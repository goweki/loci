"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { adjustProductStockAction, getUserProducts } from "@/actions/product.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

type ScannerProduct = { id: string; name: string; stockQty: number };

export function StockScanner({ initialProducts }: { initialProducts: ScannerProduct[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [direction, setDirection] = useState<"ADD" | "REMOVE">("ADD");
  const [scanning, setScanning] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const selected = products.find((product) => product.id === productId);

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function startScan() {
    if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
      toast.error("Camera scanning is not available. Enter the product ID manually.");
      return;
    }
    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result) return;
        const scanned = result.getText().trim();
        const match = products.find((product) => product.id === scanned);
        if (!match) {
          toast.error("This QR code does not match a product in your account.");
          return;
        }
        setProductId(match.id);
        controlsRef.current?.stop();
        controlsRef.current = null;
        setScanning(false);
        toast.success(`Selected ${match.name}`);
      });
      controlsRef.current = controls;
      setScanning(true);
    } catch {
      toast.error("Unable to access the camera. Check browser permissions or enter the product ID.");
      setScanning(false);
    }
  }

  function stopScan() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  function submitAdjustment() {
    if (!selected) {
      toast.error("Select a product first.");
      return;
    }
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      toast.error("Enter a whole-number quantity greater than zero.");
      return;
    }
    const operation = direction === "ADD" ? "add to" : "remove from";
    if (!window.confirm(`${direction === "ADD" ? "Add" : "Remove"} ${amount} unit(s) ${operation} ${selected.name}? Current stock: ${selected.stockQty}.`)) return;

    startTransition(async () => {
      const result = await adjustProductStockAction(selected.id, direction, amount, requestId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.data.name}: ${result.data.stockQty} in stock`);
      setRequestId(crypto.randomUUID());
      setProducts((current) => current.map((item) => item.id === selected.id ? { ...item, stockQty: result.data.stockQty } : item));
      const refreshed = await getUserProducts();
      if (refreshed.ok) setProducts(refreshed.data);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Scan product QR</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">Scan the QR label shown on a product page, or enter a product ID. Scanning selects a product; stock changes only after confirmation.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={scanning ? stopScan : startScan}>{scanning ? "Stop camera" : "Start QR scanner"}</Button>
          <Input aria-label="Product ID" placeholder="Product ID" value={productId} onChange={(event) => setProductId(event.target.value.trim())} className="max-w-sm" />
        </div>
        {scanning && <video ref={videoRef} className="max-h-80 w-full rounded-md bg-black" muted playsInline />}
        {selected ? <div className="rounded-md border p-3 text-sm"><strong>{selected.name}</strong><div>Current stock: {selected.stockQty}</div></div> : productId ? <p className="text-sm text-destructive">Product not found in your catalogue.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="stock-direction">Adjustment</Label><select id="stock-direction" className="h-10 w-full rounded-md border bg-background px-3" value={direction} onChange={(event) => setDirection(event.target.value as "ADD" | "REMOVE")}><option value="ADD">Add stock</option><option value="REMOVE">Remove stock</option></select></div>
          <div className="space-y-2"><Label htmlFor="stock-quantity">Quantity</Label><Input id="stock-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></div>
        </div>
        <Button type="button" disabled={!selected || pending} onClick={submitAdjustment}>{pending ? "Updating…" : "Confirm stock adjustment"}</Button>
      </CardContent>
    </Card>
  );
}
