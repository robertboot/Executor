import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getItem } from '../../../../../../lib/api';
import { qrUrlForItem } from '../../../../../../lib/supabase';
import type { Item } from '../../../../../../lib/types';

export default function ItemQR() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    if (itemId) getItem(itemId).then(setItem);
  }, [itemId]);

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const url = qrUrlForItem(item.public_id);

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'Link copied to clipboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.help}>
        Stick this QR code on the item. When someone scans it, they'll see a locked landing
        page asking for an executor access code.
      </Text>
      <View style={styles.qrWrap}>
        <QRCode value={url} size={240} />
      </View>
      <Text selectable style={styles.url}>
        {url}
      </Text>
      <Pressable style={styles.button} onPress={copy}>
        <Text style={styles.buttonText}>Copy link</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: '#111827' },
  help: { color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  qrWrap: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  url: { fontFamily: 'Courier', textAlign: 'center', color: '#4b5563' },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '600' },
});
