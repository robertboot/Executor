import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function extractPublicId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/i\/([0-9a-f-]{36})/i);
  if (urlMatch) return urlMatch[1];
  const uuidMatch = trimmed.match(/^[0-9a-f-]{36}$/i);
  if (uuidMatch) return trimmed;
  return null;
}

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [done, setDone] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const goToPublicId = (id: string) => {
    router.replace({ pathname: '/i/[public_id]', params: { public_id: id } });
  };

  const submitManual = () => {
    const id = extractPublicId(manual);
    if (!id) {
      setManualError('Please paste a Heirloom item link or its 36-character ID.');
      return;
    }
    goToPublicId(id);
  };

  const manualSection = (
    <View style={styles.manualBox}>
      <Text style={styles.manualLabel}>Or paste an item link / ID</Text>
      <TextInput
        style={styles.input}
        value={manual}
        onChangeText={(t) => {
          setManual(t);
          setManualError(null);
        }}
        autoCapitalize="none"
        placeholder="https://…/i/abc-123 or just the ID"
      />
      {manualError ? <Text style={styles.error}>{manualError}</Text> : null}
      <Pressable style={styles.button} onPress={submitManual}>
        <Text style={styles.buttonText}>Open</Text>
      </Pressable>
    </View>
  );

  // Web (iPad Safari etc.): expo-camera doesn't reliably work in the browser
  // for QR decoding, so we lead with manual entry.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.heading}>Scan a Heirloom QR sticker</Text>
        <Text style={styles.subhead}>
          From the web app, point your phone's camera at the sticker — your
          camera app will recognise the QR code and open the link. Or paste
          the link below.
        </Text>
        {manualSection}
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading camera…</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera access is required to scan QR codes.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
        {manualSection}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(r) => {
          if (done) return;
          const id = extractPublicId(r.data);
          if (!id) return;
          setDone(true);
          goToPublicId(id);
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Point at a Heirloom QR sticker.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  webContainer: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subhead: { color: '#4b5563', lineHeight: 20 },
  text: { textAlign: 'center', color: '#374151' },
  manualBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
    marginTop: 16,
  },
  manualLabel: { color: '#374151', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
    marginTop: 4,
  },
  error: { color: '#b91c1c' },
  button: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: 'white', fontWeight: '600' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayText: { color: 'white', textAlign: 'center' },
});
