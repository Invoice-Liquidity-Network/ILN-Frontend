'use client';

import { useTranslation } from 'react-i18next';

export default function ForFreelancers() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('landing.freelancerFeatures.instantLiquidity'),
      description: t('landing.freelancerFeatures.instantLiquidityDesc'),
    },
    {
      title: t('landing.freelancerFeatures.transparentPricing'),
      description: t('landing.freelancerFeatures.transparentPricingDesc'),
    },
    {
      title: t('landing.freelancerFeatures.globalMarket'),
      description: t('landing.freelancerFeatures.globalMarketDesc'),
    },
  ];

  return (
    <section
      id="for-freelancers"
      className="bg-surface-container-low py-24 px-4 sm:px-6 md:px-8 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <div>
          <h2 className="text-4xl font-headline mb-6">{t('landing.forFreelancersTitle')}</h2>
          <p className="text-on-surface-variant text-base max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('landing.forFreelancersSubtitle')}
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-left">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex flex-col gap-4 p-6 bg-surface-container rounded-2xl border border-outline-variant/10"
              >
                <span
                  className="material-symbols-outlined text-primary-container text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <p className="font-bold mb-2">{feature.title}</p>
                  <p className="text-on-surface-variant text-sm">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
