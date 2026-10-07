"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useFormSubmit } from "@/components/crud";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FormAlert,
  FormSection,
  Input,
  Textarea,
} from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { saveStoreItem } from "@/lib/actions/catalog";
import { MAX_FEATURES, SLUG_PATTERN } from "@/lib/constants";
import { STORE_KINDS, type StoreKind } from "@/lib/store-kinds";
import { cn, slugify } from "@/lib/utils";
import type { StoreItem } from "@/types/api";

interface StoreItemFormProps {
  kind: StoreKind;
  item?: StoreItem;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function StoreItemForm({
  kind,
  item,
  onSuccess,
  onCancel,
}: StoreItemFormProps) {
  const { singular } = STORE_KINDS[kind];
  const idPrefix = `${kind}-form`;

  const [name, setName] = useState(item?.name ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(item));
  const [inStock, setInStock] = useState(item?.inStock ?? true);
  const [features, setFeatures] = useState(() =>
    (item?.features.length ? item.features : [""]).map((value, id) => ({
      id,
      value,
    })),
  );
  const nextFeatureId = useRef(features.length);

  const { error, pending, handleSubmit } = useFormSubmit(
    (formData) => saveStoreItem(kind, item?._id ?? null, formData),
    onSuccess,
  );

  function addFeature() {
    if (features.length >= MAX_FEATURES) return;
    const id = nextFeatureId.current++;
    setFeatures((current) => [...current, { id, value: "" }]);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-8">
        <FormSection title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              htmlFor={`${idPrefix}-name`}
              className="sm:col-span-2"
            >
              <Input
                id={`${idPrefix}-name`}
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(slugify(event.target.value));
                }}
                placeholder={
                  kind === "accessories" ? "e.g. Helmet" : "e.g. Battery"
                }
                required
                maxLength={150}
                data-autofocus
              />
            </Field>

            <Field
              label="Slug"
              htmlFor={`${idPrefix}-slug`}
              optional={!item}
              hint={
                item
                  ? "Changing it changes the website address."
                  : "Generated from the name if left blank."
              }
            >
              <Input
                id={`${idPrefix}-slug`}
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value.toLowerCase());
                  setSlugEdited(true);
                }}
                pattern={SLUG_PATTERN}
                title="Lowercase letters, numbers and single hyphens only"
                placeholder={kind === "accessories" ? "helmet" : "battery"}
                className="font-mono"
              />
            </Field>

            <Field label="Price (PKR)" htmlFor={`${idPrefix}-price`}>
              <Input
                id={`${idPrefix}-price`}
                name="price"
                type="number"
                inputMode="numeric"
                min={0}
                step="any"
                defaultValue={item?.price}
                placeholder="e.g. 1200"
                required
              />
            </Field>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line-strong bg-field px-4 py-3 has-focus-visible:ring-2 has-focus-visible:ring-brand/40 sm:col-span-2">
              <span>
                <span className="block text-sm font-medium text-ink-soft">
                  In stock
                </span>
                <span className="block text-xs text-subtle">
                  {inStock
                    ? "Shown as available on the website."
                    : "Shown as out of stock on the website."}
                </span>
              </span>
              <input
                type="checkbox"
                name="inStock"
                value="true"
                checked={inStock}
                onChange={(event) => setInStock(event.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                  inStock ? "bg-brand" : "bg-line-strong",
                )}
              >
                <m.span
                  className="size-5 rounded-full bg-white shadow"
                  animate={{ x: inStock ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                />
              </span>
            </label>

            <Field
              label="Description"
              htmlFor={`${idPrefix}-description`}
              optional
              hint="Up to 2,000 characters."
              className="sm:col-span-2"
            >
              <Textarea
                id={`${idPrefix}-description`}
                name="description"
                defaultValue={item?.description}
                maxLength={2000}
                rows={4}
                placeholder={`What makes this ${singular} worth buying?`}
              />
            </Field>
          </div>
        </FormSection>

        <ImageUpload
          name="image"
          label="Image"
          currentUrl={item?.imageUrl}
          required
        />

        <FormSection
          title="Features"
          description={`Short selling points, up to ${MAX_FEATURES}. Blank lines are ignored.`}
        >
          <ul className="space-y-2.5">
            <AnimatePresence initial={false} mode="popLayout">
              {features.map((feature, index) => (
                <m.li
                  key={feature.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className="flex gap-2"
                >
                  <Input
                    name="features"
                    value={feature.value}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFeatures((current) =>
                        current.map((entry) =>
                          entry.id === feature.id ? { ...entry, value } : entry,
                        ),
                      );
                    }}
                    maxLength={200}
                    placeholder={`Feature ${index + 1}`}
                    aria-label={`Feature ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFeatures((current) =>
                        current.length === 1
                          ? [{ ...current[0], value: "" }]
                          : current.filter((entry) => entry.id !== feature.id),
                      )
                    }
                    aria-label={`Remove feature ${index + 1}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line-strong bg-field text-muted transition-colors hover:border-danger hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>

          <Button
            variant="secondary"
            size="sm"
            onClick={addFeature}
            disabled={features.length >= MAX_FEATURES}
          >
            <Plus />
            Add feature
          </Button>
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
          {item ? "Save changes" : `Add ${singular}`}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function storeItemTitle(kind: StoreKind, item?: StoreItem) {
  return item ? `Edit ${item.name}` : `Add new ${STORE_KINDS[kind].singular}`;
}
