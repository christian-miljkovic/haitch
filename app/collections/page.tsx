import type { Metadata } from 'next';
import GalleryGrid from '@/components/GalleryGrid';
import { GALLERY_STACKS } from '@/lib/gallery';
import { balanceColumns } from '@/lib/gallery-layout';

export const metadata: Metadata = { title: 'Collections' };

const COLUMNS = 3;

export default function CollectionsPage() {
  return <GalleryGrid columns={balanceColumns(GALLERY_STACKS, COLUMNS)} />;
}
