import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import ItemEditor, {
  itemToValues,
  type ItemEditorValues,
} from '../../../../../../components/ItemEditor';
import { deleteItem, getItem, updateItem } from '../../../../../../lib/api';
import { colors } from '../../../../../../lib/theme';

export default function EditItem() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const [initial, setInitial] = useState<ItemEditorValues | null>(null);

  useEffect(() => {
    if (!itemId) return;
    getItem(itemId).then((it) => {
      if (it) setInitial(itemToValues(it));
    });
  }, [itemId]);

  if (!initial) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cream,
        }}
      >
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <ItemEditor
      mode="edit"
      inventoryId={id!}
      itemId={itemId!}
      title="Edit item"
      subtitle="Update details. Every change is saved to the item's history."
      initial={initial}
      onSave={async (draft) => {
        const item = await updateItem(itemId!, draft);
        return { id: item.id };
      }}
      onDelete={async () => {
        await deleteItem(itemId!);
      }}
    />
  );
}
