"use client";

import { Bike as BikeIcon, Check, Zap } from "lucide-react";
import { useState } from "react";
import { useFormSubmit } from "@/components/crud";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FormAlert,
  FormSection,
  Input,
  Select,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { saveBike } from "@/lib/actions/catalog";
import { BIKE_SPEC_FIELDS, SLUG_PATTERN } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";
import type { Bike, BikeSpecs, Brand } from "@/types/api";

export type BrandOption = Pick<Brand, "_id" | "displayName">;

const TYPE_OPTIONS = [
  {
    value: "bike",
    label: "Bike",
    icon: BikeIcon,
    className:
      "has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:checked]:text-brand",
  },
  {
    value: "scooter",
    label: "Scooter",
    icon: Zap,
    className:
      "has-[:checked]:border-info has-[:checked]:bg-info/10 has-[:checked]:text-info",
  },
] as const;

function firstNumber(text = "") {
  const match = text.match(/\d[\d,]*(?:\.\d+)?/);
  return match ? String(Number(match[0].replace(/,/g, ""))) : "";
}

function UnitHint({
  value,
  unit,
  saved,
}: {
  value: string;
  unit: string;
  saved?: string;
}) {
  const amount = Number(value);
  const stored =
    value.trim() && Number.isFinite(amount) ? `${amount} ${unit}` : null;

  return (
    <>
      {stored ? (
        <>
          Saved as <span className="font-semibold text-ink-soft">{stored}</span>
        </>
      ) : (
        <>Numbers only. &ldquo;{unit}&rdquo; is added for you.</>
      )}
      {saved && saved !== stored && (
        <span className="text-warning">
          {" "}
          · Check it, currently &ldquo;{saved}&rdquo;
        </span>
      )}
    </>
  );
}

interface BikeFormProps {
  bike?: Bike;
  brands: BrandOption[];
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function BikeForm({ bike, brands, onSuccess, onCancel }: BikeFormProps) {
  const [name, setName] = useState(bike?.name ?? "");
  const [slug, setSlug] = useState(bike?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(bike));
  const [amounts, setAmounts] = useState<Partial<BikeSpecs>>(() =>
    Object.fromEntries(
      BIKE_SPEC_FIELDS.filter(({ unit }) => unit).map(({ key }) => [
        key,
        firstNumber(bike?.specs[key]),
      ]),
    ),
  );

  const { error, pending, handleSubmit } = useFormSubmit(
    (formData) => saveBike(bike?._id ?? null, formData),
    onSuccess,
  );

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-8">
        <FormSection title="Model">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Model name"
              htmlFor="bike-name"
              className="sm:col-span-2"
            >
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
                  ? "Renaming keeps this slug so existing links work. Changing it changes the model's address; clear it to generate a new one from the name."
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
              <Select
                id="bike-brand"
                name="brand"
                defaultValue={bike?.brand._id ?? ""}
                required
              >
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
              <legend className="mb-2 text-sm font-medium text-ink-soft">
                Type
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon, className }) => (
                  <label
                    key={value}
                    className={cn(
                      "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong bg-field text-sm font-semibold text-muted transition-colors hover:border-subtle has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
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

            <Field
              label="Rating"
              htmlFor="bike-rating"
              optional
              hint="From 0 to 5."
            >
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

        <ImageUpload
          name="image"
          label="Model image"
          currentUrl={bike?.imageUrl}
          required
        />

        <FormSection
          title="Specifications"
          description={
            bike
              ? "Filled-in specs can't be cleared. Where no unit is shown, type it in (e.g. 72V 30Ah)."
              : "All seven are required. Where no unit is shown, type it in (e.g. 72V 30Ah)."
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {BIKE_SPEC_FIELDS.map(({ key, label, placeholder, unit }) => {
              const id = `bike-spec-${key}`;
              const saved = bike?.specs[key]?.trim();
              const required = !bike || Boolean(saved);

              return (
                <Field
                  key={key}
                  label={label}
                  htmlFor={id}
                  optional={!required}
                  hint={
                    unit && (
                      <UnitHint
                        value={amounts[key] ?? ""}
                        unit={unit}
                        saved={saved}
                      />
                    )
                  }
                >
                  {unit ? (
                    <div className="relative">
                      <Input
                        id={id}
                        name={`specs.${key}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={amounts[key] ?? ""}
                        onChange={(event) =>
                          setAmounts((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder={placeholder}
                        required={required}
                        className="pr-16 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted">
                        {unit}
                      </span>
                    </div>
                  ) : (
                    <Input
                      id={id}
                      name={`specs.${key}`}
                      defaultValue={bike?.specs[key]}
                      placeholder={placeholder}
                      required={required}
                    />
                  )}
                </Field>
              );
            })}
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
