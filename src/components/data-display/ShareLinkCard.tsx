"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export function ShareLinkCard({
  url,
  title = "Share your link",
  description = "Anyone can send you a paid ping from this URL.",
  toastSuccess = "Copied link.",
}: {
  url: string;
  title?: string;
  description?: string;
  toastSuccess?: string;
}) {
  const [copying, setCopying] = useState(false);

  async function onCopy() {
    try {
      setCopying(true);
      await copyText(url);
      toast.success(toastSuccess);
    } catch {
      toast.error("Failed to copy link.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={url} readOnly aria-label="Public inbox link" />
          <Button type="button" variant="outline" onClick={onCopy} disabled={copying}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Copy link</span>
          </Button>
        </div>
        <div className="flex justify-center rounded-md border bg-background p-4">
          <QRCode value={url} size={160} />
        </div>
      </CardContent>
    </Card>
  );
}
