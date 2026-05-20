import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import ItemForm, {
  formValuesToDraft,
  itemToFormValues,
  type ItemFormValues,
} from '../../../../../../components/ItemForm';
import { getItem, updateItem } from '../../../../../../lib/api';

export default function EditItem() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const [initial, setInitial] = useState<ItemFormValues | null>(null);

  useEffect(() => {
    if (!itemId) return;
    getItem(itemId).then((it) => {
      if (it) setInitial(itemToFormValues(it));
    });
  }, [itemId]);

  if (!initial) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ItemForm
      initial={initial}
      submitLabel="Save changes"
      onSubmit={async (values) => {
        await updateItem(itemId!, formValuesToDraft(values));
        router.replace(`/(app)/inventory/${id}/item/${itemId}`);
      }}
    />
  );
}
