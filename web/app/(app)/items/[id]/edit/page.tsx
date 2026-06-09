import { notFound } from 'next/navigation';
import { getItem, listMyAvailableCollections } from '@/lib/api';
import ItemEditor from './ItemEditor';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, collections] = await Promise.all([
    getItem(id),
    listMyAvailableCollections(),
  ]);
  if (!item) notFound();
  return (
    <ItemEditor mode="edit" initial={item} collections={collections} />
  );
}
