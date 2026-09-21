import { View, Text, StyleSheet, ScrollView } from 'react-native'

export default function PrivacyScreen() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.date}>Last updated: July 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly, such as your name, email, mobile number,
            address, and store details when you register as an owner or customer.
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            Your information is used to operate your account, process orders, communicate with you
            about your store or purchases, and improve the platform.
          </Text>

          <Text style={styles.sectionTitle}>3. Data Storage</Text>
          <Text style={styles.paragraph}>
            Passwords are hashed and never stored in plain text. Order and account data is stored
            securely and is not sold to third parties for marketing purposes.
          </Text>

          <Text style={styles.sectionTitle}>4. Your Rights</Text>
          <Text style={styles.paragraph}>
            You may request access to, correction of, or deletion of your personal data at any time
            by contacting us.
          </Text>

          <Text style={styles.sectionTitle}>5. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy periodically. Continued use of Cartly after changes
            constitutes acceptance of the revised policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#111111',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  container: { flex: 1 },
  content: { padding: 20 },
  date: { fontSize: 12, color: '#4A4A4A', marginBottom: 20 },
  section: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111111', marginTop: 12, marginBottom: 6 },
  paragraph: { fontSize: 13, color: '#4A4A4A', lineHeight: 20 },
})