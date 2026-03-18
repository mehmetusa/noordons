"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState, useTransition } from "react";

type AdminBookFormState = {
  error: string | null;
  success: string | null;
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

export function AdminBookForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<AdminBookFormState>({
    error: null,
    success: null,
  });

  function handleImageUrlChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value.trim();
    setPreviewUrl(value || null);
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Unable to preview image.",
        success: null,
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      setState({ error: null, success: null });

      try {
        const response = await fetch("/api/admin/books", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as {
          message?: string;
          slug?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message || "Unable to create book.");
        }

        form.reset();
        setPreviewUrl(null);
        setState({
          error: null,
          success: payload.message || "Book created successfully.",
        });
        router.refresh();
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : "Unable to create book.",
          success: null,
        });
      }
    });
  }

  return (
    <section className="section-panel px-6 py-6 sm:px-7">
      <p className="section-kicker">Add product</p>
      <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
        Create a new book with a cover image.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d493d]">
        Upload a cover image file or provide an image URL. The admin API now
        pushes the image to Cloudinary and stores the returned asset URL in the
        catalog.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 lg:grid-cols-2">
        <input type="text" name="title" placeholder="Title" className="input-shell" required />
        <input type="text" name="author" placeholder="Author" className="input-shell" required />
        <input type="text" name="slug" placeholder="Slug (optional)" className="input-shell" />
        <input type="text" name="genre" placeholder="Genre" className="input-shell" required />
        <input type="text" name="format" placeholder="Format" className="input-shell" defaultValue="Hardcover" required />
        <input type="text" name="language" placeholder="Language" className="input-shell" defaultValue="English" required />
        <input type="number" name="price" placeholder="Price" min="0" step="0.01" className="input-shell" required />
        <input type="number" name="compareAtPrice" placeholder="Compare at price (optional)" min="0" step="0.01" className="input-shell" />
        <input type="number" name="inventory" placeholder="Inventory" min="0" className="input-shell" required />
        <input type="number" name="pages" placeholder="Pages" min="1" className="input-shell" required />
        <input type="number" name="publishedYear" placeholder="Published year" min="1000" max="9999" className="input-shell" required />
        <input type="text" name="isbn" placeholder="ISBN" className="input-shell" required />
        <input type="text" name="badge" placeholder="Badge (optional)" className="input-shell" />
        <input
          type="text"
          name="imageUrl"
          placeholder="Cover image URL (optional)"
          className="input-shell"
          onChange={handleImageUrlChange}
        />
        <input type="color" name="paletteStart" aria-label="Palette start" defaultValue="#60453b" className="h-14 w-full rounded-full border border-black/10 bg-white/70 px-4" />
        <input type="color" name="paletteEnd" aria-label="Palette end" defaultValue="#deaf91" className="h-14 w-full rounded-full border border-black/10 bg-white/70 px-4" />
        <label className="lg:col-span-2 rounded-[1.4rem] border border-dashed border-black/15 bg-white/50 px-5 py-4 text-sm text-[#5d493d]">
          <span className="section-kicker">Upload cover</span>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            className="mt-3 block w-full text-sm"
            onChange={handleImageChange}
          />
        </label>
        <textarea
          name="description"
          placeholder="Short description"
          className="input-shell min-h-28 rounded-[1.6rem]"
          required
        />
        <textarea
          name="longDescription"
          placeholder="Long description paragraphs (one per line)"
          className="input-shell min-h-28 rounded-[1.6rem]"
        />
        <textarea
          name="highlights"
          placeholder="Highlights (comma separated)"
          className="input-shell min-h-28 rounded-[1.6rem]"
        />
        <textarea
          name="tags"
          placeholder="Tags (comma separated)"
          className="input-shell min-h-28 rounded-[1.6rem]"
        />
        <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white/50 px-5 py-4 text-sm text-[#5d493d]">
          <input type="checkbox" name="featured" />
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
              Upload a file or paste an image URL to preview the cover before saving.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Saving book..." : "Create book"}
          </button>
          {state.success ? (
            <p className="text-sm leading-7 text-[#3b6f4e]">{state.success}</p>
          ) : null}
          {state.error ? (
            <p className="text-sm leading-7 text-[#8f443f]">{state.error}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
