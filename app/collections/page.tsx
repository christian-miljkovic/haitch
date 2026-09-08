import type { Metadata } from 'next';
import GalleryGrid from '@/components/GalleryGrid';
import SeasonTabs from '@/components/SeasonTabs';
import { SEASONS } from '@/lib/gallery';
import { GALLERY_COLUMNS, balanceColumns } from '@/lib/gallery-layout';

export const metadata: Metadata = { title: 'Collections' };

// The current season lives at /collections; earlier seasons at /collections/[season].
export default function CollectionsPage() {
  const current = SEASONS[0];
  return (
    <>
      <SeasonTabs active={current.slug} />
      <GalleryGrid columns={balanceColumns(current.stacks, GALLERY_COLUMNS)} />
    </>
  );
}
