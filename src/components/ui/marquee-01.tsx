import { Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/marquee-01-utils/marquee";

export type MarqueeReview = {
  name: string;
  /** Small line under the name, e.g. a country or handle */
  meta?: string;
  body: string;
  /** Avatar image URL */
  profile?: string;
  /** 1–5 */
  rating?: number;
  /** Screen-reader text for the rating, e.g. "5 out of 5" */
  ratingLabel?: string;
  /** Link to the original review */
  url?: string;
  /** Visible text of that link, e.g. "Review on Trustpilot" */
  linkLabel?: string;
  /** Direction of the link row: follows the site language, not the review's own language */
  linkDir?: "rtl" | "ltr";
};

// An Arabic review reads right-to-left, an English one left-to-right
const hasArabic = (text: string) => /[؀-ۿ]/.test(text);

const ReviewCard = ({ profile, name, meta, body, rating, ratingLabel, url, linkLabel, linkDir }: MarqueeReview) => {
  return (
    <Card
      dir={hasArabic(body) ? "rtl" : "ltr"}
      className="relative flex h-full w-80 flex-col overflow-hidden border-border bg-card p-5 shadow-none sm:w-96"
    >
      <CardContent className="flex flex-1 flex-col gap-3 p-0">
        <div className="flex flex-row items-center gap-3">
          {profile && (
            <img
              className="h-10 w-10 rounded-full border border-border object-cover"
              width="40"
              height="40"
              alt=""
              src={profile}
            />
          )}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            {meta && <p className="text-xs font-medium text-muted-foreground">{meta}</p>}
          </div>
        </div>
        {rating !== undefined && (
          <div className="flex gap-0.5" role="img" aria-label={ratingLabel ?? `${rating} / 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? "fill-current text-primary" : "text-line-strong"}`}
              />
            ))}
          </div>
        )}
        <p className="flex-1 whitespace-pre-line text-sm leading-loose text-foreground">{body}</p>
        {url && linkLabel && (
          <div dir={linkDir} className="mt-1 border-t border-border pt-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary transition-colors duration-200 hover:text-primary-hover"
            >
              {linkLabel}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function TestimonialMarquee({ reviews }: { reviews: MarqueeReview[] }) {
  // Few reviews: one row. Enough for two rows: split them and scroll the second one the other way.
  const twoRows = reviews.length >= 6;
  const firstRow = twoRows ? reviews.slice(0, Math.ceil(reviews.length / 2)) : reviews;
  const secondRow = twoRows ? reviews.slice(Math.ceil(reviews.length / 2)) : [];

  return (
    // dir="ltr": the scrolling track must always run left-to-right, even on the Arabic page
    <div dir="ltr" className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:45s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.name} {...review} />
        ))}
      </Marquee>
      {secondRow.length > 0 && (
        <Marquee reverse pauseOnHover className="[--duration:45s]">
          {secondRow.map((review) => (
            <ReviewCard key={review.name} {...review} />
          ))}
        </Marquee>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background" />
    </div>
  );
}
