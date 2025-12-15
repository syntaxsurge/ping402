"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SolanaPayPingSheet } from "@/components/solana-pay/SolanaPayPingSheet";
import { type PingTier, getPingTierConfig } from "@/lib/ping/tiers";

const PingComposeSchema = z.object({
  senderName: z.string().trim().max(80, "Keep your name under 80 characters.").optional(),
  senderContact: z
    .string()
    .trim()
    .max(120, "Keep your contact under 120 characters.")
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, "Enter a message to continue.")
    .max(280, "Message must be 280 characters or fewer."),
});

type PingComposeValues = z.infer<typeof PingComposeSchema>;

export function PingComposeFormClient({
  toHandle,
  tier,
  recipient,
  error,
}: {
  toHandle: string;
  tier: PingTier;
  recipient: { handle: string; displayName: string } | null;
  error?: string;
}) {
  const tierConfig = useMemo(() => getPingTierConfig(tier), [tier]);

  const form = useForm<PingComposeValues>({
    resolver: zodResolver(PingComposeSchema),
    mode: "onChange",
    defaultValues: {
      senderName: "",
      senderContact: "",
      body: "",
    },
  });

  const senderNameValue = form.watch("senderName") ?? "";
  const senderContactValue = form.watch("senderContact") ?? "";
  const bodyValue = form.watch("body");
  const canPay = Boolean(recipient) && Boolean(toHandle) && Boolean(bodyValue.trim());

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Please check the form and try again.
        </div>
      ) : null}

      {!toHandle ? (
        <p className="text-sm text-muted-foreground">
          Go to a profile page and pick a tier to start.
        </p>
      ) : (
        <Form {...form}>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Alex"
                        maxLength={80}
                        autoComplete="name"
                      />
                    </FormControl>
                    <FormDescription>Optional.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senderContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. @alex or email"
                        maxLength={120}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormDescription>Optional, so the creator can reply.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write your ping…"
                      maxLength={280}
                      className="min-h-[140px] resize-y"
                    />
                  </FormControl>
                  <div className="flex items-start justify-between gap-4">
                    <FormDescription className="text-xs">
                      Paying uses your connected wallet, or you can scan a QR code from any Solana
                      wallet.
                    </FormDescription>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      {field.value.length}/280
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <SolanaPayPingSheet
                toHandle={toHandle}
                tier={tier}
                body={bodyValue}
                senderName={senderNameValue}
                senderContact={senderContactValue}
                disabled={!recipient || !form.formState.isValid}
              />
            </div>

            {!recipient ? (
              <p className="text-xs text-destructive">
                Recipient not found. Pick a different handle.
              </p>
            ) : null}

            {recipient && !canPay ? (
              <p className="text-xs text-muted-foreground">
                Enter a message to pay {tierConfig.priceUsd} and deliver your{" "}
                {tierConfig.label.toLowerCase()} ping.
              </p>
            ) : null}
          </form>
        </Form>
      )}
    </div>
  );
}
