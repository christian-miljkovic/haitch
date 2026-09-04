import looks from './looks.json';
import type { Product, ProductDetailGroup } from './product';

// Copy from the "Website 2.0 Outline" line sheet, keyed to the photo look
// each garment was shot in. Edit text here; images come from lib/looks.json
// (regenerate with `npm run import:looks -- <folder>`). Handles are URLs and
// are persisted in visitors' bags, so they stay fixed when titles change.
type Look = {
  look: number;
  handle: string;
  title: string;
  sizes: string;
  description: string;
  details: ProductDetailGroup[];
};

const TAILORED_SIZES = '44, 46, 48, 50, 52, 54, 56, 58 EU';
const SHIRT_SIZES = 'XS, S, M, L, XL, XXL';
const MADE_TO_ORDER = 'Made to order. 5-6 week production time.';

const LOOKS: Look[] = [
  {
    look: 1,
    handle: 'contrast-collar-shirt-in-blue-stripe',
    title: 'CONTRAST COLLAR SHIRT IN BLUE STRIPE',
    sizes: SHIRT_SIZES,
    description: `Blue striped cotton shirt, featuring a pointed contrast collar in white. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Pointed collar in white', 'One-button French cuff', 'White buttons'] },
      { heading: 'Materials and Product Care', items: ['100% cotton', 'Dry clean only'] },
    ],
  },
  {
    look: 2,
    handle: 'contrast-collar-shirt-in-silver-sateen',
    title: 'CONTRAST COLLAR SHIRT IN SILVER SATEEN',
    sizes: SHIRT_SIZES,
    description: `Silver sateen cotton shirt, featuring a pointed contrast collar in white and covered placket. ${MADE_TO_ORDER}`,
    details: [
      {
        heading: 'Styling Details',
        items: ['Pointed collar in white', 'Covered placket', 'One-button French cuff', 'White buttons'],
      },
      { heading: 'Materials and Product Care', items: ['100% cotton', 'Dry clean only'] },
    ],
  },
  {
    look: 3,
    handle: 'tuxedo-trousers-in-black-barathea',
    title: 'TUXEDO TROUSERS IN BLACK BARATHEA',
    sizes: TAILORED_SIZES,
    description: `Plain front tailored tuxedo trousers made with British worsted barathea. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Plain front', 'Side adjusters', 'Vertical satin band', 'Back right pocket'] },
      { heading: 'Materials and Product Care', items: ['100% worsted barathea', 'Dry clean only'] },
    ],
  },
  {
    look: 4,
    handle: 'shirt-in-pink-stripe',
    title: 'SHIRT IN PINK STRIPE',
    sizes: SHIRT_SIZES,
    description: `White cotton shirt with pink stripe, featuring a pointed collar and three-button cuff. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Pointed collar', 'Three-button cuff', 'White buttons'] },
      { heading: 'Materials and Product Care', items: ['100% cotton', 'Dry clean only'] },
    ],
  },
  {
    look: 5,
    handle: 'light-grey-cotton-trousers',
    title: 'LIGHT GREY COTTON TROUSERS',
    sizes: TAILORED_SIZES,
    description: `Plain front tailored trousers made with pure British cotton. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Plain front', 'Belt loops', 'Back right pocket'] },
      { heading: 'Materials and Product Care', items: ['100% pure cotton', 'Dry clean only'] },
    ],
  },
  {
    look: 6,
    handle: 'double-breasted-jacket-in-petrol-blue-gabardine',
    title: 'DOUBLE-BREASTED JACKET IN PETROL BLUE GABARDINE',
    sizes: TAILORED_SIZES,
    description: `Double-breasted tailored jacket made with a petrol blue British gabardine. ${MADE_TO_ORDER}`,
    details: [
      {
        heading: 'Styling Details',
        items: [
          'Six-button closure',
          '4 1/4” peak lapel with satin',
          'Two straight jet pockets',
          'Center vent',
          'Brown horn buttons',
        ],
      },
      { heading: 'Materials and Product Care', items: ['100% wool', 'Dry clean only'] },
    ],
  },
  {
    look: 7,
    handle: 'dark-navy-jacket-with-grey-pinstripe',
    title: 'DARK NAVY JACKET WITH GREY PINSTRIPE',
    sizes: TAILORED_SIZES,
    description: `Single-breasted tailored jacket made with British worsted wool, featuring a peak lapel. ${MADE_TO_ORDER}`,
    details: [
      {
        heading: 'Styling Details',
        items: [
          'One-button closure',
          '4 1/4” peak lapel with satin',
          'Two straight jet pockets',
          'Center vent',
          'Brown horn buttons',
        ],
      },
      { heading: 'Materials and Product Care', items: ['100% worsted wool', 'Dry clean only'] },
    ],
  },
  {
    look: 8,
    handle: 'black-plain-weave-jacket',
    title: 'BLACK PLAIN WEAVE JACKET',
    sizes: TAILORED_SIZES,
    description: `Single-breasted tailored jacket made with British worsted wool, featuring a peak lapel. ${MADE_TO_ORDER}`,
    details: [
      {
        heading: 'Styling Details',
        items: [
          'One-button closure',
          '4 1/4” peak lapel with satin',
          'Two straight jet pockets',
          'Center vent',
          'Black horn buttons',
        ],
      },
      { heading: 'Materials and Product Care', items: ['100% worsted wool', 'Dry clean only'] },
    ],
  },
  {
    look: 9,
    handle: 'grey-marle-pinstripe-trousers',
    title: 'GREY MARLE PINSTRIPE TROUSERS',
    sizes: TAILORED_SIZES,
    description: `Single-pleat tailored trousers made with British worsted wool. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Single-pleat', 'Belt loops', 'Back right pocket'] },
      { heading: 'Materials and Product Care', items: ['100% worsted wool', 'Dry clean only'] },
    ],
  },
  {
    look: 10,
    handle: 'black-plain-weave-trousers',
    title: 'BLACK PLAIN WEAVE TROUSERS',
    sizes: TAILORED_SIZES,
    description: `Single-pleat tailored trousers made with British worsted wool. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Single-pleat', 'Belt loops', 'Back right pocket'] },
      { heading: 'Materials and Product Care', items: ['100% worsted wool', 'Dry clean only'] },
    ],
  },
  {
    look: 11,
    handle: 'tuxedo-jacket-in-black-barathea',
    title: 'TUXEDO JACKET IN BLACK BARATHEA',
    sizes: TAILORED_SIZES,
    description: `Single-breasted tailored tuxedo jacket made with British worsted barathea, featuring a satin peak lapel. ${MADE_TO_ORDER}`,
    details: [
      {
        heading: 'Styling Details',
        items: [
          'One-button closure',
          '4 1/4” peak lapel with satin',
          'Two straight jet pockets',
          'Center vent',
          'Satin-covered buttons',
        ],
      },
      { heading: 'Materials and Product Care', items: ['100% worsted barathea', 'Dry clean only'] },
    ],
  },
  {
    look: 12,
    handle: 'stone-grey-gabardine-trousers',
    title: 'STONE GREY GABARDINE TROUSERS',
    sizes: TAILORED_SIZES,
    description: `Single-pleat tailored trousers made with stone grey British gabardine. ${MADE_TO_ORDER}`,
    details: [
      { heading: 'Styling Details', items: ['Single-pleat', 'Belt loops', 'Back right pocket', '1 ¼” cuff'] },
      { heading: 'Materials and Product Care', items: ['100% wool', 'Dry clean only'] },
    ],
  },
];

const PRODUCTS: Product[] = LOOKS.map((entry) => ({
  id: entry.look,
  handle: entry.handle,
  title: entry.title,
  description: entry.description,
  images: looks.looks.find((l) => l.look === entry.look)?.images ?? [],
  sizes: entry.sizes,
  details: entry.details,
  variants: [],
}));

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(handle: string): Product | undefined {
  return PRODUCTS.find((p) => p.handle === handle);
}
