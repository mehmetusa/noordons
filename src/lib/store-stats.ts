import { storeStats as sampleStoreStats } from "@/data/sample-books";
import type { Book, StoreStat } from "@/types/book";

export function buildStoreStats(books: Book[]): StoreStat[] {
  const titleCount = books.length;
  const genreCount = new Set(books.map((book) => book.genre).filter(Boolean)).size;

  const catalogStat: StoreStat = {
    value: new Intl.NumberFormat("en-US").format(titleCount),
    label: titleCount === 1 ? "catalog title" : "catalog titles",
    copy:
      titleCount === 0
        ? "The catalog is ready for its first live title."
        : `A live catalog spanning ${genreCount} genre${
            genreCount === 1 ? "" : "s"
          } and updating with your current inventory.`,
  };

  return [catalogStat, ...sampleStoreStats.slice(1)];
}
