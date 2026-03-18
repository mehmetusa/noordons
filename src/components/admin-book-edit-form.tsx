"use client";

import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useState,
  useTransition,
} from "react";

import type { Book } from "@/types/book";

type AdminBookEditFormProps = {
  book: Book;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

type FormState = {
  error: string | null;
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

export function AdminBookEditForm({
  book,
  onCancel,
  onSaved,
}: AdminBookEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrlValue, setImageUrlValue] = useState(book.imageUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(book.imageUrl ?? null);
  const [state, setState] = useState<FormState>({ error: null });

  function handleImageUrlChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const trimmedValue = value.trim();

    setImageUrlValue(value);
    setPreviewUrl(trimmedValue || book.imageUrl || null);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(imageUrlValue.trim() || book.imageUrl || null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Unable to preview image.",
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      setState({ error: null });

      try {
        const response = await fetch(
          `/api/admin/books/${encodeURIComponent(book.slug)}`,
          {
            method: "PUT",
            body: formData,
          },
        );

        const payload = (await response.json()) as {
          message?: string;
          slug?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message || "Unable to update book.");
        }

        router.refresh();
        onSaved(payload.message || `${book.title} updated successfully.`);
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : "Unable to update book.",
        });
      }
    });
  }

  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white/60 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Edit product</p>
          <h3 className="mt-2 font-serif text-3xl leading-none text-[#1b140f]">
            {book.title}
          </h3>
        </div>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Close editor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
        <input
          type="text"
          name="title"
          placeholder="Title"
          className="input-shell"
          defaultValue={book.title}
          required
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          className="input-shell"
          defaultValue={book.author}
          required
        />
        <input
          type="text"
          name="slug"
          placeholder="Slug"
          className="input-shell"
          defaultValue={book.slug}
        />
        <input
          type="text"
          name="genre"
          placeholder="Genre"
          className="input-shell"
          defaultValue={book.genre}
          required
        />
        <input
          type="text"
          name="format"
          placeholder="Format"
          className="input-shell"
          defaultValue={book.format}
          required
        />
        <input
          type="text"
          name="language"
          placeholder="Language"
          className="input-shell"
          defaultValue={book.language}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          min="0"
          step="0.01"
          className="input-shell"
          defaultValue={book.price}
          required
        />
        <input
          type="number"
          name="compareAtPrice"
          placeholder="Compare at price"
          min="0"
          step="0.01"
          className="input-shell"
          defaultValue={book.compareAtPrice ?? ""}
        />
        <input
          type="number"
          name="inventory"
          placeholder="Inventory"
          min="0"
          className="input-shell"
          defaultValue={book.inventory}
          required
        />
        <input
          type="number"
          name="pages"
          placeholder="Pages"
          min="1"
          className="input-shell"
          defaultValue={book.pages}
          required
        />
        <input
          type="number"
          name="publishedYear"
          placeholder="Published year"
          min="1000"
          max="9999"
          className="input-shell"
          defaultValue={book.publishedYear}
          required
        />
        <input
          type="text"
          name="isbn"
          placeholder="ISBN"
          className="input-shell"
          defaultValue={book.isbn}
          required
        />
        <input
          type="text"
          name="badge"
          placeholder="Badge"
          className="input-shell"
          defaultValue={book.badge ?? ""}
        />
        <input
          type="text"
          name="imageUrl"
          placeholder="Cover image URL"
          className="input-shell"
          value={imageUrlValue}
          onChange={handleImageUrlChange}
        />
        <input
          type="color"
          name="paletteStart"
          aria-label="Palette start"
          defaultValue={book.palette[0]}
          className="h-14 w-full rounded-full border border-black/10 bg-white/70 px-4"
        />
        <input
          type="color"
          name="paletteEnd"
          aria-label="Palette end"
          defaultValue={book.palette[1]}
          className="h-14 w-full rounded-full border border-black/10 bg-white/70 px-4"
        />
        <label className="lg:col-span-2 rounded-[1.4rem] border border-dashed border-black/15 bg-white/50 px-5 py-4 text-sm text-[#5d493d]">
          <span className="section-kicker">Replace cover</span>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            className="mt-3 block w-full text-sm"
            onChange={handleImageChange}
          />
          <p className="mt-3 text-sm leading-7 text-[#5d493d]">
            Leave the cover URL and upload empty to keep the current image.
          </p>
        </label>
        <textarea
          name="description"
          placeholder="Short description"
          className="input-shell min-h-28 rounded-[1.6rem]"
          defaultValue={book.description}
          required
        />
        <textarea
          name="longDescription"
          placeholder="Long description paragraphs (one per line)"
          className="input-shell min-h-28 rounded-[1.6rem]"
          defaultValue={book.longDescription.join("\n")}
        />
        <textarea
          name="highlights"
          placeholder="Highlights (comma separated)"
          className="input-shell min-h-28 rounded-[1.6rem]"
          defaultValue={book.highlights.join(", ")}
        />
        <textarea
          name="tags"
          placeholder="Tags (comma separated)"
          className="input-shell min-h-28 rounded-[1.6rem]"
          defaultValue={book.tags.join(", ")}
        />
        <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white/50 px-5 py-4 text-sm text-[#5d493d]">
          <input type="checkbox" name="featured" defaultChecked={book.featured} />
          Mark as featured
        </label>
        <div className="flex flex-col justify-between rounded-[1.5rem] border border-black/10 bg-white/50 p-4">
          <p className="section-kicker">Cover preview</p>
          {previewUrl ? (
            <div
              className="mt-4 h-52 rounded-[1.25rem] bg-center bg-cover"
              style={{ backgroundImage: `url("${previewUrl}")` }}
            />
          ) : (
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              This title has no current cover image. Add a URL or upload a file
              to replace it.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Saving changes..." : "Save changes"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          {state.error ? (
            <p className="text-sm leading-7 text-[#8f443f]">{state.error}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
