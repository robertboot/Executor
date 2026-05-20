import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#fef2f2' }}
          contentContainerStyle={styles.container}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Heirloom hit an error</Text>
            <Text style={styles.body}>
              The app caught a JavaScript error while starting up. Showing the
              message instead of a blank screen so you can tell me what went
              wrong.
            </Text>
            <View style={styles.box}>
              <Text style={styles.boxLabel}>Message</Text>
              <Text selectable style={styles.boxText}>
                {String(this.state.error.message)}
              </Text>
              {this.state.error.stack ? (
                <>
                  <Text style={[styles.boxLabel, { marginTop: 10 }]}>Stack</Text>
                  <Text selectable style={styles.boxStack}>
                    {String(this.state.error.stack).slice(0, 1500)}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', minHeight: '100%' },
  card: {
    maxWidth: 640,
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: radius.lg,
    borderColor: '#fecaca',
    borderWidth: 1,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#991b1b' },
  body: { color: colors.inkSoft, lineHeight: 20 },
  box: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  boxLabel: { fontWeight: '700', color: colors.ink, fontSize: 12, marginBottom: 4 },
  boxText: { fontFamily: 'Courier', color: '#0f172a', fontSize: 12, lineHeight: 18 },
  boxStack: { fontFamily: 'Courier', color: '#334155', fontSize: 10, lineHeight: 14 },
});
