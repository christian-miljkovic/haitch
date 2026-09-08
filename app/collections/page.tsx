import type { Metadata } from 'next';
import GalleryGrid from '@/components/GalleryGrid';
import SeasonTabs from '@/components/SeasonTabs';
import { CURRENT_SEASON } from '@/lib/gallery';
import { GALLERY_COLUMNS, balanceColumns } from '@/lib/gallery-layout';

export const metadata: Metadata = { title: 'Collections' };

// The current season lives at /collections; earlier seasons at /collections/[season].
export default function CollectionsPage() {
  return (
    <>
      <SeasonTabs active={CURRENT_SEASON.slug} />
      <GalleryGrid columns={balanceColumns(CURRENT_SEASON.stacks, GALLERY_COLUMNS)} />
    </>
  );
}
