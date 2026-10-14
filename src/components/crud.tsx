"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createContext, use, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types/actions";

export type CrudState<T> =
  | { mode: "create" }
  | { mode: "edit"; item: T }
  | { mode: "delete"; item: T }
  | null;

interface CrudControls {
  create: () => void;
  edit: (item: unknown) => void;
  remove: (item: unknown) => void;
}

const CrudContext = createContext<CrudControls | null>(null);

function useCrudControls() {
  const controls = use(CrudContext);
  if (!controls)
    throw new Error("CRUD buttons must be rendered inside a resource manager.");
  return controls;
}

export function useCrudDialogs<T>(initialCreate = false) {
  const router = useRouter();
  const [state, setState] = useState<CrudState<T>>(
    initialCreate ? { mode: "create" } : null,
  );

  const controls: CrudControls = {
    create: () => setState({ mode: "create" }),
    edit: (item) => setState({ mode: "edit", item: item as T }),
    remove: (item) => setState({ mode: "delete", item: item as T }),
  };

  function close() {
    setState(null);

    const url = new URL(window.location.href);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    }
  }

  return { state, controls, close };
}

export function CrudProvider({
  controls,
  children,
}: {
  controls: CrudControls;
  children: React.ReactNode;
}) {
  return <CrudContext value={controls}>{children}</CrudContext>;
}

export function CreateButton({ label }: { label: string }) {
  const { create } = useCrudControls();

  return (
    <Button
      onClick={create}
      className="bg-[#0057D9] text-white hover:bg-[#0047B3]"
    >
      <Plus />
      {label}
    </Button>
  );
}

export function RowActions({ item, name }: { item: unknown; name: string }) {
  const { edit, remove } = useCrudControls();

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => edit(item)}
        aria-label={`Edit ${name}`}
        title="Edit"
        className="flex size-9 items-center justify-center rounded-lg border border-[#0057D9]/30 bg-[#0057D9]/10 text-[#0057D9] transition-colors hover:border-[#0057D9] hover:bg-[#0057D9]/20 hover:text-[#0057D9]"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => remove(item)}
        aria-label={`Delete ${name}`}
        title="Delete"
        className="flex size-9 items-center justify-center rounded-lg border border-[#FF8A00]/30 bg-[#FF8A00]/10 text-[#FF8A00] transition-colors hover:border-[#FF8A00] hover:bg-[#FF8A00]/20 hover:text-[#FF8A00]"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function useFormSubmit(
  action: (formData: FormData) => Promise<ActionResult>,
  onSuccess: (message: string) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.ok) onSuccess(result.message);
        else setError(result.error);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return { error, pending, handleSubmit };
}