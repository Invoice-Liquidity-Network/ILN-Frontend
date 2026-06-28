'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

const testimonials = [
  {
    name: 'Alejandro R.',
    initials: 'AR',
    quote:
      'ILN let me earn consistent yield on idle USDC. The trustless settlement is a game-changer — I never worry about counterparty risk.',
    yieldEarned: '8.4% APY',
    location: 'Mexico City',
  },
  {
    name: 'Priya S.',
    initials: 'PS',
    quote:
      'I started with a small position and grew my portfolio steadily. The transparent on-chain data gives me confidence every funding decision.',
    yieldEarned: '7.9% APY',
    location: 'Singapore',
  },
  {
    name: 'James O.',
    initials: 'JO',
    quote:
      "Real-world invoice assets backed by verified freelancers. This is the yield opportunity I've been searching for in DeFi.",
    yieldEarned: '9.1% APY',
    location: 'Lagos',
  },
  {
    name: 'Marie-Claire D.',
    initials: 'MD',
    quote:
      "Short 30–90 day terms mean my capital isn't locked up forever. I can rotate in and out as market conditions change.",
    yieldEarned: '8.2% APY',
    location: 'Paris',
  },
  {
    name: 'Kevin T.',
    initials: 'KT',
    quote:
      "The Stellar network makes settlements fast and fees negligible. I've funded dozens of invoices without a single hiccup.",
    yieldEarned: '7.6% APY',
    location: 'Toronto',
  },
];

function TestimonialCard({ testimonial }: { testimonial: (typeof testimonials)[0] }) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-surface-container-highest/10 p-6">
      {/* Quote */}
      <p className="text-sm leading-relaxed text-on-surface-variant">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="mt-6 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-surface-container-lowest"
          aria-hidden="true"
        >
          {testimonial.initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground">{testimonial.name}</p>
          <p className="text-xs text-on-surface-variant">{testimonial.location}</p>
        </div>
        {/* Yield badge */}
        <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {testimonial.yieldEarned}
        </span>
      </div>
    </div>
  );
}

export default function ForLPs() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const features = [
    {
      title: t('landing.lpFeatures.realWorldAssets'),
      description: t('landing.lpFeatures.realWorldAssetsDesc'),
    },
    {
      title: t('landing.lpFeatures.superiorYields'),
      description: t('landing.lpFeatures.superiorYieldsDesc'),
    },
    {
      title: t('landing.lpFeatures.trustlessSettlements'),
      description: t('landing.lpFeatures.trustlessSettlementsDesc'),
    },
  ];

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + testimonials.length) % testimonials.length);
  }, []);

  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Auto-advance every 5 seconds unless paused
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [isPaused]);

  return (
    <section id="for-lps" className="bg-surface-dim px-8 py-24 transition-colors duration-300">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <h2 className="mb-6 font-headline text-4xl text-foreground">{t('landing.forLPsTitle')}</h2>

        <ul className="mb-12 grid gap-8 text-left md:grid-cols-3">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-surface-container-highest/10 p-6"
            >
              <span
                className="material-symbols-outlined text-3xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                currency_exchange
              </span>
              <div>
                <p className="mb-2 font-bold text-foreground">{feature.title}</p>
                <p className="text-sm text-on-surface-variant">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Testimonials */}
        <div className="w-full">
          <h3 className="mb-8 font-headline text-2xl text-foreground">
            What liquidity providers say
          </h3>

          {/* Desktop: show 3 cards */}
          <div className="hidden gap-6 md:grid md:grid-cols-3">
            {testimonials.slice(0, 3).map((t, i) => (
              <TestimonialCard key={i} testimonial={t} />
            ))}
          </div>

          {/* Mobile: carousel */}
          <div
            className="relative md:hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div role="region" aria-label="Testimonials carousel" aria-live="polite">
              <TestimonialCard testimonial={testimonials[activeIndex]} />
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  chevron_left
                </span>
              </button>

              {/* Dots */}
              <div className="flex gap-2" role="tablist" aria-label="Testimonial slides">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === activeIndex}
                    aria-label={`Go to testimonial ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-outline-variant/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Next testimonial"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-2xl rounded-2xl border border-primary/10 bg-primary-container/20 p-8">
          <h4 className="mb-2 flex items-center justify-center gap-2 font-bold">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              info
            </span>
            {t('landing.lpHowItWorksTitle')}
          </h4>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {t('landing.lpHowItWorksDesc')}
          </p>
        </div>
      </div>
    </section>
  );
}
