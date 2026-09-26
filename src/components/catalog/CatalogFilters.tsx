"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import SearchBar from "./SearchBar";
import GenreFilter from "./GenreFilter";

interface CatalogFiltersProps {
  genres: string[];
  initialSearch: string;
  initialGenre: string;
}

export default function CatalogFilters({
  genres,
  initialSearch,
  initialGenre,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 on filter/search change
      params.delete("page");
      router.push(`/catalog?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(value: string) {
    updateParam({ search: value || undefined });
  }

  function handleGenreSelect(genre: string | undefined) {
    updateParam({ genre });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <SearchBar initialValue={initialSearch} onSearch={handleSearch} />
      <GenreFilter
        genres={genres}
        selectedGenre={initialGenre || undefined}
        onSelect={handleGenreSelect}
      />
    </div>
  );
}
