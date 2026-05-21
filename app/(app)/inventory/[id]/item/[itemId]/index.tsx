import { useLocalSearchParams } from 'expo-router';
import ItemDetailView from '../../../../../../components/ItemDetailView';

export default function ItemDetailRoute() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  if (!id || !itemId) return null;
  return <ItemDetailView inventoryId={id} itemId={itemId} />;
}
