import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CONFIG_PREVIEW } from '../lib/supabase';

export default function SetupNeeded() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: '#fef2f2' }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Heirloom — setup not complete</Text>
        <Text style={styles.body}>
          This deployment is missing one or both of the Supabase environment
          variables, so the app can't connect to its database yet.
        </Text>

        <Text style={styles.h2}>Fix it in 3 steps</Text>
        <Step n={1}>
          In your hosting provider (Vercel / Netlify), open the project's
          <Text style={styles.bold}> Environment Variables</Text> settings.
        </Step>
        <Step n={2}>
          Add or correct these two values (find them in your Supabase project
          under <Text style={styles.bold}>Project Settings → API</Text>):
          {'\n\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text>
          {'\n'}
          <Text style={styles.help}>e.g. https://abcdef.supabase.co</Text>
          {'\n\n'}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
          {'\n'}
          <Text style={styles.help}>The long "anon public" key (starts with ey…)</Text>
        </Step>
        <Step n={3}>
          <Text style={styles.bold}>Redeploy</Text> the latest build with
          {' '}<Text style={styles.bold}>"Use existing Build Cache"</Text> turned off.
          Env vars are baked in at build time, so a redeploy is required.
        </Step>

        <Text style={styles.h2}>What this build actually saw</Text>
        <View style={styles.diagBox}>
          <Text style={styles.diagLabel}>EXPO_PUBLIC_SUPABASE_URL</Text>
          <Text style={styles.diagValue}>
            length: {CONFIG_PREVIEW.urlLength}
            {CONFIG_PREVIEW.urlLength > 0
              ? `\nstarts: "${CONFIG_PREVIEW.urlStart}…"\nends:   "…${CONFIG_PREVIEW.urlEnd}"`
              : '\n(empty — not set on the host)'}
          </Text>
          <Text style={[styles.diagLabel, { marginTop: 10 }]}>
            EXPO_PUBLIC_SUPABASE_ANON_KEY
          </Text>
          <Text style={styles.diagValue}>
            length: {CONFIG_PREVIEW.keyLength}
            {CONFIG_PREVIEW.keyLength > 0
              ? `\nstarts: "${CONFIG_PREVIEW.keyStart}…"`
              : '\n(empty — not set on the host)'}
          </Text>
        </View>

        <Text style={styles.h2}>Why am I seeing this?</Text>
        <Text style={styles.body}>
          Either the variables aren't set on the host, or they were added
          after the most recent build. Either way the bundle running in your
          browser has empty strings instead of real credentials. We render
          this page so you don't see a blank screen.
        </Text>

        {Platform.OS === 'web' && (
          <Text style={styles.muted}>
            Once env vars are correct and the redeploy finishes, reload this
            page (pull down in Safari).
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', minHeight: '100%' },
  card: {
    maxWidth: 600,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#991b1b' },
  h2: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 16 },
  body: { color: '#374151', lineHeight: 20, marginTop: 4 },
  bold: { fontWeight: '700', color: '#111827' },
  code: {
    fontFamily: 'Courier',
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
  },
  help: { color: '#6b7280', fontSize: 13 },
  muted: { color: '#6b7280', marginTop: 16, fontStyle: 'italic' },
  diagBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  diagLabel: { fontFamily: 'Courier', fontWeight: '700', color: '#0f172a', fontSize: 13 },
  diagValue: {
    fontFamily: 'Courier',
    color: '#334155',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  step: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: 'white', fontWeight: '700' },
  stepBody: { flex: 1, color: '#374151', lineHeight: 20 },
});
