import { router, useLocalSearchParams } from 'expo-router';
import ItemForm, {
  formValuesToDraft,
  itemToFormValues,
} from '../../../../../components/ItemForm';
import { createItem } from '../../../../../lib/api';

export default function NewItem() {
  const { id, category } = useLocalSearchParams<{
    id: string;
    category?: string;
  }>();

  return (
    <ItemForm
      initial={itemToFormValues({ category: category ?? null })}
      submitLabel="Create item"
      onSubmit={async (values) => {
        const item = await createItem(id!, formValuesToDraft(values));
        router.replace(`/(app)/inventory/${id}/item/${item.id}`);
      }}
    />
  );
}
