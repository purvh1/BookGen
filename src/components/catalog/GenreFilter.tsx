"use client";

interface GenreFilterProps {
  genres: string[];
  selectedGenre?: string;
  onSelect: (genre: string | undefined) => void;
}

export default function GenreFilter({
  genres,
  selectedGenre,
  onSelect,
}: GenreFilterProps) {
  if (genres.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filter by genre">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Genre:</span>
      {genres.map((genre) => {
        const isSelected = genre === selectedGenre;
        return (
          <button
            key={genre}
            onClick={() => onSelect(isSelected ? undefined : genre)}
            aria-pressed={isSelected}
            className={`text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
              isSelected
                ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}
