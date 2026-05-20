import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QR_LANDING_BASE_URL } from '../../lib/supabase';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [done, setDone] = useState(false);

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
          setDone(true);
          const url = r.data;
          // Extract public_id if it matches our pattern.
          const match = url.match(/\/i\/([0-9a-f-]{36})/i);
          if (match) {
            router.replace({ pathname: '/i/[public_id]', params: { public_id: match[1] } });
          } else {
            router.replace({ pathname: '/i/[public_id]', params: { public_id: 'unknown' } });
          }
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          Point at a Keepsake QR sticker. Expected URL prefix: {QR_LANDING_BASE_URL}/i/…
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { textAlign: 'center', color: '#374151' },
  button: { backgroundColor: '#111827', padding: 14, borderRadius: 8 },
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
