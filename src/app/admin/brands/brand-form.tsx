"use client";

import { Check } from "lucide-react";
import { useFormSubmit } from "@/components/crud";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FormAlert, FormSection, Input, Textarea } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { saveBrand } from "@/lib/actions/catalog";
import type { Brand } from "@/types/api";

const LINK_FIELDS = [
  { name: "websiteUrl", label: "Website", placeholder: "https://example.com" },
  { name: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/…" },
  { name: "twitterUrl", label: "X / Twitter", placeholder: "https://x.com/…" },
  { name: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/…" },
] as const;

interface BrandFormProps {
  brand?: Brand;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function BrandForm({ brand, onSuccess, onCancel }: BrandFormProps) {
  const { error, pending, handleSubmit } = useFormSubmit(
    (formData) => saveBrand(brand?._id ?? null, formData),
    onSuccess,
  );

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-8">
        <FormSection title="Brand">
          <Field label="Brand name" htmlFor="brand-displayName">
            <Input
              id="brand-displayName"
              name="displayName"
              defaultValue={brand?.displayName}
              placeholder="e.g. Okla"
              required
              maxLength={100}
              data-autofocus
            />
          </Field>
          <ImageUpload name="logo" label="Logo" currentUrl={brand?.logoUrl} required />
        </FormSection>

        <FormSection title="Profile" description="Shown on the brand's page on the website.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Origin" htmlFor="brand-origin" optional>
              <Input id="brand-origin" name="origin" defaultValue={brand?.origin} placeholder="e.g. Pakistani" />
            </Field>
            <Field label="Established" htmlFor="brand-established" optional>
              <Input
                id="brand-established"
                name="established"
                defaultValue={brand?.established}
                placeholder="e.g. 2021"
              />
            </Field>
            <Field label="Headquarters" htmlFor="brand-headquarters" optional>
              <Input
                id="brand-headquarters"
                name="headquarters"
                defaultValue={brand?.headquarters}
                placeholder="e.g. Lahore, Pakistan"
              />
            </Field>
          </div>
          <Field label="About" htmlFor="brand-about" optional hint="Up to 2,000 characters.">
            <Textarea
              id="brand-about"
              name="about"
              defaultValue={brand?.about}
              maxLength={2000}
              rows={4}
              placeholder="A short description of the brand and what it makes."
            />
          </Field>
        </FormSection>

        <FormSection title="Links" description="Leave blank to hide a link on the website.">
          <div className="grid gap-4 sm:grid-cols-2">
            {LINK_FIELDS.map((field) => (
              <Field key={field.name} label={field.label} htmlFor={`brand-${field.name}`} optional>
                <Input
                  id={`brand-${field.name}`}
                  name={field.name}
                  defaultValue={brand?.[field.name]}
                  placeholder={field.placeholder}
                  inputMode="url"
                  autoComplete="url"
                />
              </Field>
            ))}
          </div>
        </FormSection>
      </DialogBody>

      {error && (
        <div className="border-t border-line px-5 pt-4 sm:px-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" pending={pending}>
          {!pending && <Check />}
          {brand ? "Save changes" : "Add brand"}
        </Button>
      </DialogFooter>
    </form>
  );
}
