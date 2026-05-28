import { notFound } from 'next/navigation';
import { getItem } from '@/lib/api';
import ItemEditor from './ItemEditor';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();
  return <ItemEditor mode="edit" initial={item} />;
}
