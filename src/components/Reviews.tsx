import { MapPin, Quote, Star } from 'lucide-react';
import { dir, lang, t } from '../i18n';
import Reveal from './Reveal';

type Review = {
  name: string; // client's name or business name, whichever they approved
  text: string; // their review, as written
  rating?: number; // 1–5, only if they gave one
  url?: string; // link to the original Trustpilot review
  photo?: string; // optional photo in /public/reviews, only with their approval
  location?: string; // e.g. country, as shown on their review
};

// Add genuine reviews here. While the list is empty, the section shows a short note instead of cards.
// Example shape:
// { name: '…', text: '…', rating: 5, url: 'https://www.trustpilot.com/reviews/…' },
const reviews: Review[] = [
  {
    name: 'Andrew Vargas',
    text: "He's one of the smartest developers I've ever worked with. He creates mind boggling and life changing automations and tools just for fun. He's created automations for my business that have saved me hours of time every month and even impressed leads so much they turn into customers. I would give 6 stars if I could. We've worked together for over 2 years.",
    rating: 5,
    url: 'https://www.trustpilot.com/reviews/6ad8f64bec7a9f5c440632b9',
    photo: '/reviews/andrew-vargas.jpg',
    location: 'US',
  },
  {
    name: 'Sara Almujel',
    text: 'تجربتي بالعمل مع أحمد رائعة 🤩 عمل معي على إنشاء وتطوير موقع إلكتروني لمشروعي الخاص وكان مسؤول عن تطوير الموقع بالكامل وقدم نتيجة ممتازة من ناحية جودة الخدمة والتنفيذ وسرعة التجاوب طوال فترة العمل. تجربة مميزة وأوصي فيه بكل ثقة',
    rating: 5,
    url: 'https://www.trustpilot.com/reviews/6ae25af7f6300565ec600612',
    photo: '/reviews/sara-almujel.png',
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={t({ ar: `${rating} من 5`, en: `${rating} out of 5` })}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-primary fill-current' : 'text-line-strong'}`}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section id="reviews" className="py-20 lg:py-28 bg-surface" dir={dir} lang={lang}>
      <Reveal className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-heading text-center leading-snug mb-14 lg:mb-16">
          {t({ ar: 'وش قالوا عن تجربتهم معي؟', en: 'What people say about working with me' })}
        </h2>

        {reviews.length === 0 ? (
          <div className="max-w-xl mx-auto text-center border border-dashed border-line-strong rounded-2xl px-6 py-12">
            <Quote className="w-8 h-8 text-primary/40 mx-auto mb-4 -scale-x-100" />
            <p className="text-lg text-body leading-loose">
              {t({
                ar: 'لسه أجمع آراء الناس اللي اشتغلت معهم، وبشاركها هنا قريب.',
                en: "I'm still collecting feedback from the people I've worked with, and I'll share it here soon.",
              })}
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${reviews.length > 1 ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>
            {reviews.map((review, index) => (
              // dir="auto": an English review reads left-to-right, an Arabic one right-to-left
              <figure
                key={index}
                dir="auto"
                className="bg-white border border-line rounded-2xl p-8 flex flex-col"
              >
                {review.rating !== undefined && (
                  <div className="mb-4">
                    <Stars rating={review.rating} />
                  </div>
                )}
                <blockquote className="text-lg text-heading leading-loose flex-1">
                  {review.text}
                </blockquote>
                <figcaption className="mt-6 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {review.photo && (
                      <img
                        src={review.photo}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-line"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-heading">{review.name}</div>
                      {review.location && (
                        <div className="flex items-center gap-1 text-sm text-muted">
                          <MapPin className="w-3.5 h-3.5" />
                          {review.location}
                        </div>
                      )}
                    </div>
                  </div>
                  {review.url && (
                    <a
                      href={review.url}
                      dir={dir}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary-hover transition-colors duration-200"
                    >
                      {t({ ar: 'التقييم على Trustpilot', en: 'Review on Trustpilot' })}
                    </a>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
