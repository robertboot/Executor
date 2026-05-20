import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog.
 * React Native's Alert.alert button callbacks don't fire on web,
 * which silently breaks every destructive action. This wraps native
 * Alert and the browser's confirm() into a single Promise<boolean>.
 */
export function confirm(title: string, message?: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(globalThis.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Cross-platform info/error message. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    globalThis.alert(text);
    return;
  }
  Alert.alert(title, message);
}
