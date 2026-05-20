import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deletePhoto, listPhotos, photoPublicUrl, uploadPhoto } from '../lib/api';
import type { ItemPhoto } from '../lib/types';

interface Props {
  inventoryId: string;
  itemId: string;
  canEdit: boolean;
}

export default function PhotoStrip({ inventoryId, itemId, canEdit }: Props) {
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setPhotos(await listPhotos(itemId));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [itemId]);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Could not read image');
      return;
    }
    setUploading(true);
    try {
      await uploadPhoto({
        inventoryId,
        itemId,
        base64: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      await load();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? String(e));
    } finally {
      setUploading(false);
    }
  };

  const remove = (p: ItemPhoto) => {
    Alert.alert('Delete photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(p);
            await load();
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? String(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
      {photos.map((p) => (
        <Pressable
          key={p.id}
          style={styles.photoWrap}
          onLongPress={canEdit ? () => remove(p) : undefined}
        >
          <Image source={{ uri: photoPublicUrl(p.storage_path) }} style={styles.photo} />
        </Pressable>
      ))}
      {canEdit && (
        <Pressable
          style={styles.addButton}
          onPress={pick}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator /> : <Text style={styles.addText}>+ Photo</Text>}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { padding: 8, gap: 8, alignItems: 'center' },
  empty: { height: 100, alignItems: 'center', justifyContent: 'center' },
  photoWrap: { borderRadius: 8, overflow: 'hidden' },
  photo: { width: 120, height: 120, backgroundColor: '#e5e7eb' },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  addText: { color: '#374151', fontWeight: '500' },
});
