import { useLocalSearchParams } from 'expo-router';
import ItemEditor, { EMPTY_VALUES } from '../../../../../components/ItemEditor';
import { createItem } from '../../../../../lib/api';

export default function NewItem() {
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();
  return (
    <ItemEditor
      mode="new"
      inventoryId={id!}
      title="Add new item"
      subtitle="Catalog a new item in your heirloom inventory."
      initial={{ ...EMPTY_VALUES, collection: category ?? null }}
      onSave={async (draft) => {
        const item = await createItem(id!, draft);
        return { id: item.id };
      }}
    />
  );
}
