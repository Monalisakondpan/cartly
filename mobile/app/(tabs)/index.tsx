import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { FontAwesome } from '@expo/vector-icons'

export default function LandingScreen() {
  const router = useRouter()

  const handleSocialClick = (platform: string) => {
    Alert.alert(platform, `${platform} page coming soon!`)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
        <Text style={styles.logoText}>Cartly</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Build your store. Sell anywhere.</Text>
          <Text style={styles.heroSubtitle}>
            Cartly gives you everything you need to create a store, manage products, and start selling — in minutes.
          </Text>
          <View style={styles.heroButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/register')}>
              <Text style={styles.primaryButtonText}>Start for free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/explore' as any)}>
              <Text style={styles.secondaryButtonText}>Explore Stores</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Build fast on Cartly</Text>
        <TouchableOpacity style={styles.stepCard} onPress={() => router.push('/register')}>
          <Text style={styles.stepNumber}>01</Text>
          <Text style={styles.stepTitle}>Add your first product</Text>
          <Text style={styles.stepText}>Set a name, price, and photo — your catalog starts here.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stepCard} onPress={() => router.push('/register')}>
          <Text style={styles.stepNumber}>02</Text>
          <Text style={styles.stepTitle}>Customize your store</Text>
          <Text style={styles.stepText}>Give your storefront a name, description, and your own address.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stepCard} onPress={() => router.push('/register')}>
          <Text style={styles.stepNumber}>03</Text>
          <Text style={styles.stepTitle}>Start selling</Text>
          <Text style={styles.stepText}>Share your store link and watch the orders come in.</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Why Cartly</Text>
        <Text style={styles.sectionSubtitle}>
          Most commerce platforms make you choose between simplicity and control. Cartly doesn't.
        </Text>
        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/register')}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureTitle}>Fast Setup</Text>
          <Text style={styles.featureText}>Start selling in minutes, not days. No servers to configure.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/register')}>
          <Text style={styles.featureIcon}>📦</Text>
          <Text style={styles.featureTitle}>All-in-One Dashboard</Text>
          <Text style={styles.featureText}>Manage products, categories, and inventory from one place.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/register')}>
          <Text style={styles.featureIcon}>🔒</Text>
          <Text style={styles.featureTitle}>Secure by Default</Text>
          <Text style={styles.featureText}>Built-in authentication and role-based access control.</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Products</Text>
        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/explore' as any)}>
          <Text style={styles.featureIcon}>🏬</Text>
          <Text style={styles.featureTitle}>Store Management</Text>
          <Text style={styles.featureText}>Create and customize your storefront in a few clicks.</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.featureCard} onPress={() => router.push('/explore' as any)}>
          <Text style={styles.featureIcon}>🛍️</Text>
          <Text style={styles.featureTitle}>Product Catalog</Text>
          <Text style={styles.featureText}>Full CRUD, categories, and image uploads built in.</Text>
        </TouchableOpacity>

        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Pricing</Text>
          <Text style={styles.pricingValue}>Free</Text>
          <Text style={styles.pricingText}>Cartly is currently free to use while in early access.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/register')}>
            <Text style={styles.primaryButtonText}>Start for free</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Cartly</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Start for free</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/explore' as any)}>
                <Text style={styles.footerLink}>Demo Store</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Resources</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.footerLink}>Guides</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.footerLink}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.footerLink}>Pricing</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Support</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Legal</Text>
              <TouchableOpacity onPress={() => router.push('/terms' as any)}>
                <Text style={styles.footerLink}>Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/privacy' as any)}>
                <Text style={styles.footerLink}>Privacy</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerColumn}>
              <Text style={styles.footerHeading}>Follow Us</Text>
              <View style={styles.socialColumn}>
                <TouchableOpacity onPress={() => handleSocialClick('Facebook')} style={styles.socialIcon}>
                  <FontAwesome name="facebook-square" size={20} color="#4A4A4A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSocialClick('Instagram')} style={styles.socialIcon}>
                  <FontAwesome name="instagram" size={20} color="#4A4A4A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSocialClick('X')} style={styles.socialIcon}>
                  <FontAwesome name="twitter" size={20} color="#4A4A4A" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSocialClick('YouTube')} style={styles.socialIcon}>
                  <FontAwesome name="youtube-play" size={20} color="#4A4A4A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.copyright}>© 2026 Cartly. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111111',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  logo: { width: 32, height: 32, borderRadius: 6 },
  logoText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  hero: { alignItems: 'center', marginBottom: 32 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#111111', textAlign: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 14, color: '#4A4A4A', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  heroButtons: { flexDirection: 'row', gap: 10 },
  primaryButton: { backgroundColor: '#FF6600', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
  secondaryButtonText: { color: '#111111', fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111111', marginTop: 20, marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, color: '#4A4A4A', marginBottom: 16, lineHeight: 18 },
  stepCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  stepNumber: { color: '#FF6600', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  stepTitle: { color: '#111111', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stepText: { color: '#4A4A4A', fontSize: 13 },
  featureCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  featureIcon: { fontSize: 24, marginBottom: 6 },
  featureTitle: { color: '#111111', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureText: { color: '#4A4A4A', fontSize: 13 },
  pricingCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  pricingTitle: { color: '#111111', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  pricingValue: { color: '#FF6600', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  pricingText: { color: '#4A4A4A', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  footerColumn: { marginBottom: 16, width: '48%' },
  footerHeading: { color: '#111111', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  footerLink: { color: '#4A4A4A', fontSize: 13, marginBottom: 6 },
  socialColumn: { flexDirection: 'column', gap: 10 },
  socialIcon: { marginBottom: 4 },
  copyright: { color: '#4A4A4A', fontSize: 11, textAlign: 'center', marginTop: 16 },
})