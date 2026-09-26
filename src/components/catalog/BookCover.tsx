export interface BookCoverProps {
  title: string;
  author: string;
  genre: string[];
  className?: string;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

interface Palette {
  bgTop: string;
  bgBottom: string;
  accent: string;
  text: string;
}

const palettes: Palette[] = [
  { bgTop: "#1e3a5f", bgBottom: "#0f1f35", accent: "#4a90d9", text: "#e8f4fd" }, // Midnight blue
  { bgTop: "#1a3a2a", bgBottom: "#0d1f16", accent: "#5cb85c", text: "#e8f5e9" }, // Forest green
  { bgTop: "#2d1b4e", bgBottom: "#160d27", accent: "#9c5fd4", text: "#f3e8ff" }, // Deep purple
  { bgTop: "#4a0f0f", bgBottom: "#260808", accent: "#e05252", text: "#fff0f0" }, // Crimson
  { bgTop: "#0d3338", bgBottom: "#061a1d", accent: "#2cb5b5", text: "#e0fafa" }, // Teal
  { bgTop: "#3d2800", bgBottom: "#1f1400", accent: "#f0a500", text: "#fff8e1" }, // Amber
  { bgTop: "#3d1020", bgBottom: "#1f0810", accent: "#e05580", text: "#ffe4ef" }, // Rose
  { bgTop: "#1a1f2e", bgBottom: "#0d1018", accent: "#7c8db5", text: "#e8eaf6" }, // Slate
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}

function getPalette(genre: string[], title: string): Palette {
  const seed = genre[0] ?? title;
  return palettes[hashString(seed) % palettes.length];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookCover({
  title,
  author,
  genre,
  className,
}: BookCoverProps) {
  const palette = getPalette(genre, title);
  const hash = hashString(genre[0] ?? title);
  const gradientId = `bg-${hash}`;

  // Title layout
  const maxChars = title.length > 20 ? 16 : 16;
  const titleLines = wrapText(title, maxChars);
  const fontSize = title.length > 30 ? 14 : 18;
  const lineHeight = fontSize + 5;

  // Center title block vertically in the range y≈100–160
  const titleBlockHeight = titleLines.length * lineHeight;
  const titleStartY = 110 - titleBlockHeight / 2;

  // Divider sits below the title block
  const dividerY = titleStartY + titleBlockHeight + 14;

  // First genre label (truncated for the badge)
  const genreLabel = (genre[0] ?? "").slice(0, 12);

  return (
    <svg
      viewBox="0 0 200 280"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Book cover for ${title}`}
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.bgTop} />
          <stop offset="100%" stopColor={palette.bgBottom} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="200" height="280" fill={`url(#${gradientId})`} />

      {/* Decorative top bar */}
      <rect y="0" width="200" height="6" fill={palette.accent} />

      {/* Spine shadow */}
      <rect x="0" y="0" width="12" height="280" fill="rgba(0,0,0,0.3)" />

      {/* Genre badge (top-right) */}
      {genreLabel && (
        <>
          <rect
            x="108"
            y="14"
            width={genreLabel.length * 6 + 12}
            height="18"
            rx="9"
            ry="9"
            fill={palette.accent}
            opacity="0.9"
          />
          <text
            x={108 + (genreLabel.length * 6 + 12) / 2}
            y="27"
            textAnchor="middle"
            fontSize="9"
            fontFamily="sans-serif"
            fontWeight="600"
            fill={palette.bgBottom}
            letterSpacing="0.5"
          >
            {genreLabel}
          </text>
        </>
      )}

      {/* Title lines */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x="108"
          y={titleStartY + i * lineHeight}
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily="Georgia, serif"
          fontWeight="700"
          fill={palette.text}
        >
          {line}
        </text>
      ))}

      {/* Decorative divider */}
      <line
        x1="30"
        y1={dividerY}
        x2="170"
        y2={dividerY}
        stroke={palette.accent}
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* Author */}
      <text
        x="108"
        y="200"
        textAnchor="middle"
        fontSize="11"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fill={palette.text}
        opacity="0.8"
      >
        {author.length > 28 ? author.slice(0, 26) + "…" : author}
      </text>

      {/* Decorative open-book icon at y≈230 */}
      <g transform="translate(85, 218)" opacity="0.4" fill={palette.accent}>
        {/* Simple open book shape using paths */}
        <path d="M15,4 C15,4 10,2 5,3 L5,18 C10,17 15,19 15,19 C15,19 20,17 25,18 L25,3 C20,2 15,4 15,4 Z" />
        <line
          x1="15"
          y1="4"
          x2="15"
          y2="19"
          stroke={palette.bgBottom}
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M5,3 L5,18"
          stroke={palette.bgBottom}
          strokeWidth="0.5"
          fill="none"
        />
        <path
          d="M25,3 L25,18"
          stroke={palette.bgBottom}
          strokeWidth="0.5"
          fill="none"
        />
      </g>

      {/* Bottom bar */}
      <rect y="274" width="200" height="6" fill={palette.accent} />
    </svg>
  );
}
