"use client";

import { Bike as BikeIcon, Check, Zap } from "lucide-react";
import { useState } from "react";
import { useFormSubmit } from "@/components/crud";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FormAlert, FormSection, Input, Select } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { saveBike } from "@/lib/actions/catalog";
import { BIKE_SPEC_FIELDS, SLUG_PATTERN } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import type { Bike, Brand } from "@/types/api";

export type BrandOption = Pick<Brand, "_id" | "displayName">;

const TYPE_OPTIONS = [
  {
    value: "bike",
    label: "Bike",
    icon: BikeIcon,
    className: "has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:checked]:text-brand",
  },
  {
    value: "scooter",
    label: "Scooter",
    icon: Zap,
    className: "has-[:checked]:border-info has-[:checked]:bg-info/10 has-[:checked]:text-info",
  },
] as const;

interface BikeFormProps {
  bike?: Bike;
  brands: BrandOption[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function BikeForm({ bike, brands, onSuccess, onCancel }: BikeFormProps) {
  const [name, setName] = useState(bike?.name ?? "");
  const [slug, setSlug] = useState(bike?.slug ?? "");
  // While creating, the slug follows the name until it's edited by hand.
  const [slugEdited, setSlugEdited] = useState(Boolean(bike));

  const { error, pending, handleSubmit } = useFormSubmit(
    (formData) => saveBike(bike?._id ?? null, formData),
    onSuccess,
  );

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-8">
        <FormSection title="Model">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Model name" htmlFor="bike-name" className="sm:col-span-2">
              <Input
                id="bike-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(slugify(event.target.value));
                }}
                placeholder="e.g. Crown Electric Spark"
                required
                maxLength={150}
                data-autofocus
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="bike-slug"
              optional={!bike}
              className="sm:col-span-2"
              hint={
                bike
                  ? "Changing the slug changes this model's address on the website."
                  : "Used in the website address. Leave blank to generate it from the name."
              }
            >
              <Input
                id="bike-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value.toLowerCase());
                  setSlugEdited(true);
                }}
                placeholder="crown-electric-spark"
                pattern={SLUG_PATTERN}
                title="Lowercase letters, numbers and single hyphens only"
                className="font-mono"
              />
            </Field>

            <Field label="Brand" htmlFor="bike-brand">
              <Select id="bike-brand" name="brand" defaultValue={bike?.brand._id ?? ""} required>
                <option value="" disabled>
                  Select a brand
                </option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.displayName}
                  </option>
                ))}
              </Select>
            </Field>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-soft">Type</legend>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon, className }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong bg-field text-sm font-semibold text-muted transition-colors hover:border-subtle has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                      className,
                    )}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      defaultChecked={(bike?.type ?? "bike") === value}
                      className="sr-only"
                    />
                    <Icon className="size-4" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Price (PKR)" htmlFor="bike-price">
              <Input
                id="bike-price"
                name="price"
                type="number"
                inputMode="numeric"
                min={0}
                step="any"
                defaultValue={bike?.price}
                placeholder="e.g. 195000"
                required
              />
            </Field>

            <Field label="Rating" htmlFor="bike-rating" optional hint="From 0 to 5.">
              <Input
                id="bike-rating"
                name="rating"
                type="number"
                inputMode="decimal"
                min={0}
                max={5}
                step={0.1}
                defaultValue={bike?.rating}
                placeholder="e.g. 4.5"
              />
            </Field>
          </div>
        </FormSection>

        <ImageUpload name="image" label="Model image" currentUrl={bike?.imageUrl} required />

        <FormSection
          title="Specifications"
          description="Shown as-is on the website, so include units. Leave blank if unknown."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {BIKE_SPEC_FIELDS.map(({ key, label, placeholder }) => (
              <Field key={key} label={label} htmlFor={`bike-spec-${key}`}>
                <Input
                  id={`bike-spec-${key}`}
                  name={`specs.${key}`}
                  defaultValue={bike?.specs[key]}
                  placeholder={placeholder}
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
          {bike ? "Save changes" : "Add model"}
        </Button>
      </DialogFooter>
    </form>
  );
}
