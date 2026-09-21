import { View, Text, StyleSheet, ScrollView } from 'react-native'

export default function TermsScreen() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.date}>Last updated: July 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By creating an account or using Cartly, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the platform.
          </Text>

          <Text style={styles.sectionTitle}>2. Use of Service</Text>
          <Text style={styles.paragraph}>
            Cartly provides tools for creating and managing online stores. You are responsible for the
            accuracy of the content you upload, including product listings, pricing, and descriptions.
          </Text>

          <Text style={styles.sectionTitle}>3. Accounts</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account credentials and for
            all activities that occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>4. Orders & Payments</Text>
          <Text style={styles.paragraph}>
            Store owners are solely responsible for fulfilling orders placed through their storefronts.
            Cartly does not process payments on behalf of sellers or buyers in this version of the platform.
          </Text>

          <Text style={styles.sectionTitle}>5. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate accounts that violate these terms or misuse
            the platform in any way that harms other users.
          </Text>

          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Cartly is provided "as is" without warranties of any kind. We are not liable for any indirect,
            incidental, or consequential damages arising from your use of the platform.
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