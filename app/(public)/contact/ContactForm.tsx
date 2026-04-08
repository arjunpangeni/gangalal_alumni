"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validations/user";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

export function ContactForm() {
  const { messages } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(messages.publicClients.messageSent);
        reset();
      } else {
        toast.error(json.error ?? messages.publicClients.failedSendMessage);
      }
    } catch {
      toast.error(messages.publicClients.tryAgainError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{messages.publicClients.name}</Label>
          <Input id="name" placeholder={messages.publicClients.yourName} {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{messages.public.email}</Label>
          <Input id="email" type="email" placeholder="your@email.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">{messages.publicClients.subject}</Label>
        <Input id="subject" placeholder={messages.publicClients.subjectPlaceholder} {...register("subject")} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{messages.publicClients.message}</Label>
        <Textarea id="message" rows={5} placeholder={messages.publicClients.messagePlaceholder} {...register("message")} />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={submitting} className="w-full gradient-primary text-white border-0">
        {submitting ? messages.publicClients.sending : <><Send className="mr-2 size-4" />{messages.public.sendMessage}</>}
      </Button>
    </form>
  );
}
