import React, { useId } from 'react';
import { useTranslation } from 'next-i18next';
import { CarCategory, carCategories, activeCarCategory } from '../../carCategories';
import { CarSearch } from '../../types/car/car.input';

// The generated cars are not equally spaced. Crop at their transparent gaps,
// rather than dividing the sprite into equal columns and cutting vehicle edges.
const categoryFrames = [
 { x: 0, y: 90, width: 420 },
 { x: 420, y: 90, width: 377 },
 { x: 797, y: 90, width: 398 },
 { x: 1195, y: 90, width: 364 },
 { x: 1559, y: 90, width: 424 },
 { x: 0, y: 450, width: 414 },
 { x: 414, y: 450, width: 381 },
 { x: 795, y: 450, width: 392 },
 { x: 1187, y: 450, width: 391 },
 { x: 1578, y: 450, width: 405 },
] as const;

// A shared transparent sprite supplies the ten category thumbnails without ten downloads.
function CarIllustration({ index }: { index: number }) {
 const clipId = `car-category-${useId().replace(/:/g, '')}`;
 const { x, y, width } = categoryFrames[index];
 return <svg viewBox={`${x} ${y} ${width} 270`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">
   <rect x={x} y={y} width={width} height={270} />
  </clipPath></defs>
  <image href="/img/car/category-cars.png" width="1983" height="793" clipPath={`url(#${clipId})`} />
 </svg>;
}

export default function CarTypeCategories({ search, onSelect }: { search: CarSearch; onSelect: (category: CarCategory) => void }) {
 const { t } = useTranslation('common');
 const active = activeCarCategory(search);
 return <div className="car-type-categories" role="group" aria-label={t('Browse by car type')}>
  {carCategories.map((category, index) => <button key={category.key} type="button" aria-pressed={active === category.key}
   className={active === category.key ? 'selected' : ''} onClick={() => onSelect(category)}>
   <CarIllustration index={index} /><span>{t(category.label)}</span>
  </button>)}
 </div>;
}
