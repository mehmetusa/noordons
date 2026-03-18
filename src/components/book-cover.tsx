import type { CSSProperties } from "react";

type BookCoverProps = {
  title: string;
  author: string;
  palette: [string, string];
  imageUrl?: string;
  badge?: string;
  className?: string;
};

export function BookCover({
  title,
  author,
  palette,
  imageUrl,
  badge,
  className = "",
}: BookCoverProps) {
  const showGeneratedCoverText = !imageUrl;
  const style: CSSProperties = {
    background: imageUrl
      ? `linear-gradient(180deg, rgba(18, 12, 8, 0.16), rgba(18, 12, 8, 0.52)), url("${imageUrl}") center / cover no-repeat`
      : `linear-gradient(160deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
  };

  return (
    <div className={`book-cover ${className}`.trim()} style={style}>
      <div className="book-cover__shine" />
      <div className="book-cover__grain" />

      {badge ? <span className="book-cover__badge">{badge}</span> : null}

      {showGeneratedCoverText ? (
        <div className="book-cover__content">
          <p className="book-cover__title">{title}</p>
          <p className="book-cover__author">{author}</p>
        </div>
      ) : null}
    </div>
  );
}
