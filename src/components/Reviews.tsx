import { Quote } from 'lucide-react';
import { dir, lang, t } from '../i18n';
import Reveal from './Reveal';
import TestimonialMarquee from '@/components/ui/marquee-01';

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
    name: 'Sara Almujel',
    text: 'تجربتي بالعمل مع أحمد رائعة 🤩\n\nعمل معي على إنشاء وتطوير موقع إلكتروني لمشروعي الخاص وكان مسؤول عن تطوير الموقع بالكامل وقدم نتيجة ممتازة من ناحية جودة الخدمة والتنفيذ وسرعة التجاوب طوال فترة العمل\n\nتجربة مميزة وأوصي فيه بكل ثقة',
    rating: 5,
    url: 'https://www.trustpilot.com/reviews/6ae25af7f6300565ec600612',
    photo: '/reviews/sara-almujel.png',
  },
  {
    name: 'Andrew Vargas',
    text: "He's one of the smartest developers I've ever worked with. He creates mind boggling and life changing automations and tools just for fun. He's created automations for my business that have saved me hours of time every month and even impressed leads so much they turn into customers. I would give 6 stars if I could. We've worked together for over 2 years.",
    rating: 5,
    url: 'https://www.trustpilot.com/reviews/6ad8f64bec7a9f5c440632b9',
    photo: '/reviews/andrew-vargas.jpg',
    location: 'US',
  },
  {
    name: 'Zaiyd Alsaleh',
    text: "I’ve had the pleasure of working with Ahmad for over two years on several complex AI automation and web development projects. He has consistently impressed me with his technical brilliance, creativity, and professionalism.\n\nAhmad has an exceptional sense of ownership, approaches every challenge with creativity, and consistently delivers beyond expectations. He’s genuinely talented, and it’s always a pleasure working with him.",
    rating: 5,
    url: 'https://www.trustpilot.com/users/6ae9d2a6342454334c98f121',
    photo: '/reviews/zaiyd-alsaleh.png',
    location: 'SA',
  },
];

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
          <TestimonialMarquee
            reviews={reviews.map((review) => ({
              name: review.name,
              meta: review.location,
              body: review.text,
              profile: review.photo,
              rating: review.rating,
              ratingLabel:
                review.rating !== undefined
                  ? t({ ar: `${review.rating} من 5`, en: `${review.rating} out of 5` })
                  : undefined,
              url: review.url,
              linkDir: dir,
              linkLabel: t({ ar: 'التقييم على Trustpilot', en: 'Review on Trustpilot' }),
            }))}
          />
        )}
      </Reveal>
    </section>
  );
}
