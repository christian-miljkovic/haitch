import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GalleryGrid from '@/components/GalleryGrid';
import SeasonTabs from '@/components/SeasonTabs';
import { ARCHIVED_SEASONS } from '@/lib/gallery';
import { GALLERY_COLUMNS, balanceColumns } from '@/lib/gallery-layout';

type Props = { params: Promise<{ season: string }> };

export function generateStaticParams() {
  return ARCHIVED_SEASONS.map((s) => ({ season: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  const match = ARCHIVED_SEASONS.find((s) => s.slug === season);
  return { title: match ? `${match.title} Collection` : 'Collections' };
}

export default async function SeasonPage({ params }: Props) {
  const { season } = await params;
  const match = ARCHIVED_SEASONS.find((s) => s.slug === season);
  if (!match) notFound();
  return (
    <>
      <SeasonTabs active={match.slug} />
      <GalleryGrid columns={balanceColumns(match.stacks, GALLERY_COLUMNS)} />
    </>
  );
}
