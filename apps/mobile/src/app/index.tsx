import { View, Text, StyleSheet } from 'react-native';
import { APP_NAME } from '@zuridrop/shared';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Bienvenue sur l&apos;application mobile.</Text>
      <Text style={styles.placeholder}>
        Cette page est un placeholder. Les features seront implémentées dans les prochaines étapes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
