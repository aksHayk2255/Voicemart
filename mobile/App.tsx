import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, setAccessToken } from './src/api';
import { CartSummary, Category, Order, Product, User } from './src/types';

type Screen = 'home' | 'products' | 'product' | 'cart' | 'orders' | 'account' | 'assistant' | 'checkout';
const TOKEN_KEY = 'voicemart_mobile_token';
const emptyCart: CartSummary = { items: [], subtotal: 0, discount: 0, total: 0, item_count: 0 };

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function Button({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

function ProductCard({ product, onPress, onAdd }: { product: Product; onPress: () => void; onAdd: () => void }) {
  return (
    <View style={styles.productCard}>
      <Pressable onPress={onPress}>
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.rating}>★ {product.rating} · {product.rating_count} reviews</Text>
        <Text style={styles.price}>{money(product.price)}</Text>
      </Pressable>
      <Button title="Add to cart" onPress={onAdd} />
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartSummary>(emptyCart);
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCatalog = useCallback(async () => {
    const [featuredResponse, productResponse, categoryResponse] = await Promise.all([
      api.products.list({ featured: true, limit: 8 }),
      api.products.list({ limit: 30 }),
      api.products.categories(),
    ]);
    setFeatured(featuredResponse.products);
    setProducts(productResponse.products);
    setCategories(categoryResponse);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      return;
    }
    setCart(await api.cart.get());
  }, [user]);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadCatalog();
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (savedToken) {
          setAccessToken(savedToken);
          setUser(await api.auth.me());
        }
      } catch (bootstrapError) {
        setError(bootstrapError instanceof Error ? bootstrapError.message : 'Unable to load VoiceMart.');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [loadCatalog]);

  useEffect(() => {
    refreshCart().catch(() => setCart(emptyCart));
  }, [refreshCart]);

  const openProduct = async (product: Product) => {
    setSelectedProduct(product);
    setScreen('product');
    try {
      setSelectedProduct(await api.products.get(product.id));
    } catch {
      // The list result remains usable if the detail request fails.
    }
  };

  const addToCart = async (productId: number) => {
    if (!user) {
      setScreen('account');
      Alert.alert('Sign in required', 'Sign in to synchronize your cart across devices.');
      return;
    }
    try {
      setCart(await api.cart.add(productId));
      Alert.alert('Added to cart', 'The item is now in your VoiceMart cart.');
    } catch (cartError) {
      Alert.alert('Could not add item', cartError instanceof Error ? cartError.message : 'Please try again.');
    }
  };

  const signIn = async (email: string, password: string, register: boolean, username: string, fullName: string) => {
    const response = register
      ? await api.auth.register(email, username, password, fullName)
      : await api.auth.login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, response.access_token);
    setAccessToken(response.access_token);
    setUser(response.user);
    setScreen('home');
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setCart(emptyCart);
    setScreen('home');
  };

  const loadOrders = async () => {
    if (!user) return setScreen('account');
    try {
      setOrders(await api.orders.list());
      setScreen('orders');
    } catch (ordersError) {
      Alert.alert('Unable to load orders', ordersError instanceof Error ? ordersError.message : 'Please try again.');
    }
  };

  const navigate = (next: Screen) => {
    if (next === 'orders') {
      loadOrders();
      return;
    }
    setScreen(next);
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /><Text style={styles.muted}>Loading VoiceMart...</Text></SafeAreaView>;
  }

  const content = screen === 'home'
    ? <HomeScreen categories={categories} featured={featured} onCategory={(category) => { setSearch(category.slug); setScreen('products'); }} onProduct={openProduct} onAdd={addToCart} onAssistant={() => setScreen('assistant')} />
    : screen === 'products'
      ? <ProductsScreen products={products} search={search} setSearch={setSearch} onProduct={openProduct} onAdd={addToCart} />
      : screen === 'product'
        ? <ProductScreen product={selectedProduct} onBack={() => setScreen('products')} onAdd={addToCart} />
        : screen === 'cart'
          ? <CartScreen cart={cart} onUpdate={async (id, quantity) => setCart(await api.cart.update(id, quantity))} onRemove={async (id) => setCart(await api.cart.remove(id))} onClear={async () => { await api.cart.clear(); setCart(emptyCart); }} onCheckout={() => setScreen('checkout')} />
          : screen === 'checkout'
            ? <CheckoutScreen cart={cart} user={user} onBack={() => setScreen('cart')} onComplete={async () => { await refreshCart(); await loadOrders(); setScreen('orders'); }} />
            : screen === 'orders'
              ? <OrdersScreen orders={orders} />
              : screen === 'assistant'
                ? <AssistantScreen onProduct={openProduct} onAdd={addToCart} />
                : <AccountScreen user={user} onAuth={signIn} onLogout={logout} onOrders={loadOrders} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => setScreen('home')}><Text style={styles.logo}>Voice<Text style={styles.logoAccent}>Mart</Text></Text></Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setScreen('assistant')}><Text style={styles.headerIcon}>✦</Text></Pressable>
          <Pressable onPress={() => setScreen('cart')}><Text style={styles.headerIcon}>🛒{cart.item_count > 0 ? ` ${cart.item_count}` : ''}</Text></Pressable>
        </View>
      </View>
      <View style={styles.content}>
        {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
        {content}
      </View>
      <View style={styles.tabs}>
        {([['home', 'Home'], ['products', 'Shop'], ['assistant', 'Assistant'], ['cart', `Cart${cart.item_count ? ` (${cart.item_count})` : ''}`], ['account', user ? 'Account' : 'Sign in']] as const).map(([key, label]) => (
          <Pressable key={key} onPress={() => navigate(key)} style={styles.tab}><Text style={[styles.tabText, screen === key && styles.tabActive]}>{label}</Text></Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ categories, featured, onCategory, onProduct, onAdd, onAssistant }: {
  categories: Category[]; featured: Product[]; onCategory: (category: Category) => void; onProduct: (product: Product) => void; onAdd: (id: number) => void; onAssistant: () => void;
}) {
  return <ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>VOICE-FIRST AI SHOPPING</Text>
      <Text style={styles.heroTitle}>Your shopping, just a conversation away.</Text>
      <Text style={styles.heroCopy}>Find tech, compare products, and manage your cart with VoiceMart.</Text>
      <Button title="Ask VoiceMart" onPress={onAssistant} />
    </View>
    <SectionTitle title="Browse categories" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
      {categories.map((category) => <Pressable key={category.id} onPress={() => onCategory(category)} style={styles.category}><Text style={styles.categoryIcon}>◈</Text><Text style={styles.categoryText}>{category.name}</Text></Pressable>)}
    </ScrollView>
    <SectionTitle title="Featured products" />
    <FlatList data={featured} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.horizontal} renderItem={({ item }) => <View style={styles.featuredCard}><ProductCard product={item} onPress={() => onProduct(item)} onAdd={() => onAdd(item.id)} /></View>} />
  </ScrollView>;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ProductsScreen({ products, search, setSearch, onProduct, onAdd }: {
  products: Product[]; search: string; setSearch: (value: string) => void; onProduct: (product: Product) => void; onAdd: (id: number) => void;
}) {
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.brand} ${product.category?.name || ''}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  return <View style={styles.flex}>
    <Text style={styles.pageTitle}>Browse products</Text>
    <TextInput value={search} onChangeText={setSearch} placeholder="Search phones, laptops..." placeholderTextColor="#94a3b8" style={styles.input} />
    <Text style={styles.resultCount}>{filtered.length} products</Text>
    <FlatList data={filtered} numColumns={2} keyExtractor={(item) => String(item.id)} columnWrapperStyle={styles.gridRow} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={styles.gridItem}><ProductCard product={item} onPress={() => onProduct(item)} onAdd={() => onAdd(item.id)} /></View>} />
  </View>;
}

function ProductScreen({ product, onBack, onAdd }: { product: Product | null; onBack: () => void; onAdd: (id: number) => void }) {
  if (!product) return <View style={styles.center}><Text>Product not found.</Text><Button title="Back to shop" onPress={onBack} /></View>;
  let specifications: Record<string, string> = {};
  try { specifications = JSON.parse(product.specifications || '{}'); } catch { specifications = {}; }
  return <ScrollView contentContainerStyle={styles.scroll}>
    <Button title="← Back to shop" onPress={onBack} secondary />
    <Image source={{ uri: product.image_url }} style={styles.detailImage} />
    <Text style={styles.brand}>{product.brand}</Text>
    <Text style={styles.detailTitle}>{product.name}</Text>
    <Text style={styles.rating}>★ {product.rating} · {product.rating_count} reviews</Text>
    <Text style={styles.detailPrice}>{money(product.price)}</Text>
    <Text style={styles.description}>{product.description}</Text>
    <Button title="Add to cart" onPress={() => onAdd(product.id)} />
    <SectionTitle title="Specifications" />
    {Object.entries(specifications).map(([key, value]) => <View key={key} style={styles.specRow}><Text style={styles.specKey}>{key}</Text><Text style={styles.specValue}>{value}</Text></View>)}
  </ScrollView>;
}

function CartScreen({ cart, onUpdate, onRemove, onClear, onCheckout }: {
  cart: CartSummary; onUpdate: (id: number, quantity: number) => Promise<void>; onRemove: (id: number) => Promise<void>; onClear: () => Promise<void>; onCheckout: () => void;
}) {
  if (!cart.items.length) return <View style={styles.center}><Text style={styles.pageTitle}>Your cart is empty</Text><Text style={styles.muted}>Add products from the catalog to get started.</Text></View>;
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.pageTitle}>Shopping cart</Text>
    {cart.items.map((item) => <View key={item.id} style={styles.cartItem}><Image source={{ uri: item.product.image_url }} style={styles.cartImage} /><View style={styles.cartInfo}><Text style={styles.productName}>{item.product.name}</Text><Text style={styles.price}>{money(item.product.price * item.quantity)}</Text><View style={styles.quantity}><Pressable onPress={() => onUpdate(item.id, item.quantity - 1)}><Text style={styles.quantityButton}>−</Text></Pressable><Text>{item.quantity}</Text><Pressable onPress={() => onUpdate(item.id, item.quantity + 1)}><Text style={styles.quantityButton}>＋</Text></Pressable><Pressable onPress={() => onRemove(item.id)}><Text style={styles.remove}>Remove</Text></Pressable></View></View></View>)}
    <View style={styles.summary}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryTotal}>{money(cart.total)}</Text></View>
    <Button title="Proceed to checkout" onPress={onCheckout} /><Button title="Clear cart" onPress={() => onClear()} secondary /></ScrollView>;
}

function CheckoutScreen({ cart, user, onBack, onComplete }: { cart: CartSummary; user: User | null; onBack: () => void; onComplete: () => Promise<void> }) {
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('Simulated UPI / QR');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!address.trim()) return Alert.alert('Address required', 'Enter a delivery address.');
    try { setSubmitting(true); await api.orders.create(address.trim(), payment); Alert.alert('Order confirmed', 'Your simulated order has been placed.'); await onComplete(); } catch (checkoutError) { Alert.alert('Checkout failed', checkoutError instanceof Error ? checkoutError.message : 'Please try again.'); } finally { setSubmitting(false); }
  };
  return <ScrollView contentContainerStyle={styles.scroll}><Button title="← Back to cart" onPress={onBack} secondary /><Text style={styles.pageTitle}>Simulated checkout</Text><Text style={styles.muted}>Signed in as {user?.email}</Text><Text style={styles.label}>Delivery address</Text><TextInput value={address} onChangeText={setAddress} multiline placeholder="Flat, street, city, pincode" placeholderTextColor="#94a3b8" style={[styles.input, styles.multiline]} /><Text style={styles.label}>Payment method</Text><TextInput value={payment} onChangeText={setPayment} style={styles.input} /><View style={styles.summary}><Text style={styles.summaryLabel}>Payable total</Text><Text style={styles.summaryTotal}>{money(cart.total)}</Text></View><Button title={submitting ? 'Placing order...' : 'Place simulated order'} onPress={submit} disabled={submitting} /></ScrollView>;
}

function OrdersScreen({ orders }: { orders: Order[] }) {
  return <FlatList data={orders} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} ListHeaderComponent={<Text style={styles.pageTitle}>Order history</Text>} ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>} renderItem={({ item }) => <View style={styles.orderCard}><View style={styles.orderHeader}><Text style={styles.orderNumber}>{item.order_number}</Text><Text style={styles.status}>{item.status}</Text></View><Text style={styles.muted}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text><Text style={styles.orderTotal}>{money(item.total_amount)}</Text>{item.items.map((orderItem) => <Text key={orderItem.id} style={styles.orderItem}>{orderItem.product_name} × {orderItem.quantity}</Text>)}</View>} />;
}

function AssistantScreen({ onProduct, onAdd }: { onProduct: (product: Product) => void; onAdd: (id: number) => void }) {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState('');
  const [resultProducts, setResultProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    if (!command.trim()) return;
    try { setBusy(true); const result = await api.assistant.command(command.trim()); setResponse(result.display_response || result.spoken_response); setResultProducts(result.products || []); if (result.spoken_response) Speech.speak(result.spoken_response); } catch (assistantError) { Alert.alert('Assistant unavailable', assistantError instanceof Error ? assistantError.message : 'Please try again.'); } finally { setBusy(false); }
  };
  return <ScrollView contentContainerStyle={styles.scroll}><View style={styles.hero}><Text style={styles.eyebrow}>VOICE ASSISTANT</Text><Text style={styles.heroTitle}>What can I find for you?</Text><Text style={styles.heroCopy}>Try “Find smartphones below 40000 rupees” or “What is my cart total?”</Text></View><TextInput value={command} onChangeText={setCommand} placeholder="Type a shopping command..." placeholderTextColor="#94a3b8" style={[styles.input, styles.commandInput]} /><Button title={busy ? 'Thinking...' : 'Ask VoiceMart'} onPress={ask} disabled={busy} />{response ? <View style={styles.response}><Text style={styles.responseText}>{response}</Text></View> : null}{resultProducts.map((product) => <ProductCard key={product.id} product={product} onPress={() => onProduct(product)} onAdd={() => onAdd(product.id)} />)}</ScrollView>;
}

function AccountScreen({ user, onAuth, onLogout, onOrders }: { user: User | null; onAuth: (email: string, password: string, register: boolean, username: string, fullName: string) => Promise<void>; onLogout: () => Promise<void>; onOrders: () => void }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState(''); const [fullName, setFullName] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <View style={styles.scroll}><Text style={styles.pageTitle}>Your account</Text><Text style={styles.accountName}>{user.full_name || user.username}</Text><Text style={styles.muted}>{user.email}</Text><Button title="View order history" onPress={onOrders} /><Button title="Sign out" onPress={onLogout} secondary /></View>;
  const submit = async () => { try { setBusy(true); await onAuth(email, password, register, username, fullName); } catch (authError) { Alert.alert('Authentication failed', authError instanceof Error ? authError.message : 'Please try again.'); } finally { setBusy(false); } };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.scroll}><Text style={styles.pageTitle}>{register ? 'Create account' : 'Welcome back'}</Text><Text style={styles.muted}>Sign in to sync your cart and orders with the web app.</Text>{register && <><Text style={styles.label}>Full name</Text><TextInput value={fullName} onChangeText={setFullName} style={styles.input} /><Text style={styles.label}>Username</Text><TextInput value={username} onChangeText={setUsername} style={styles.input} /></>}<Text style={styles.label}>Email or username</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" style={styles.input} /><Text style={styles.label}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} /><Button title={busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'} onPress={submit} disabled={busy} /><Button title={register ? 'Already have an account? Sign in' : 'New to VoiceMart? Create account'} onPress={() => setRegister(!register)} secondary /></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' }, content: { flex: 1 }, flex: { flex: 1 }, errorBanner: { backgroundColor: '#fff1f2', borderBottomWidth: 1, borderBottomColor: '#fecdd3', padding: 10 }, errorText: { color: '#be123c', fontSize: 12 }, scroll: { padding: 20, paddingBottom: 32 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }, header: { height: 64, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerActions: { flexDirection: 'row', gap: 18 }, logo: { fontSize: 24, fontWeight: '800', color: '#0f172a' }, logoAccent: { color: '#4f46e5' }, headerIcon: { fontSize: 17, color: '#4f46e5' }, tabs: { height: 64, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, tab: { padding: 8 }, tabText: { color: '#64748b', fontSize: 12, fontWeight: '600' }, tabActive: { color: '#4f46e5' }, hero: { padding: 22, borderRadius: 24, backgroundColor: '#eef2ff', marginBottom: 24 }, eyebrow: { color: '#4f46e5', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, heroTitle: { color: '#0f172a', fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 10 }, heroCopy: { color: '#475569', fontSize: 15, lineHeight: 22, marginVertical: 12 }, sectionTitle: { color: '#0f172a', fontSize: 19, fontWeight: '800', marginBottom: 12, marginTop: 4 }, horizontal: { gap: 12, paddingBottom: 18 }, category: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 14, minWidth: 104, alignItems: 'center' }, categoryIcon: { color: '#4f46e5', fontSize: 24 }, categoryText: { color: '#334155', fontWeight: '700', fontSize: 12, marginTop: 5 }, featuredCard: { width: 220 }, productCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 7 }, productImage: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#f1f5f9', marginBottom: 8 }, brand: { color: '#4f46e5', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, productName: { color: '#0f172a', fontSize: 14, fontWeight: '700' }, rating: { color: '#b45309', fontSize: 12, marginTop: 4 }, price: { color: '#0f172a', fontSize: 17, fontWeight: '800', marginVertical: 4 }, button: { backgroundColor: '#4f46e5', borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 8 }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' }, secondaryButtonText: { color: '#475569' }, disabled: { opacity: 0.55 }, pageTitle: { color: '#0f172a', fontSize: 26, fontWeight: '800', marginBottom: 14 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, minHeight: 46, paddingHorizontal: 14, color: '#0f172a', marginBottom: 12 }, commandInput: { minHeight: 54 }, multiline: { minHeight: 100, paddingTop: 14, textAlignVertical: 'top' }, label: { color: '#334155', fontWeight: '700', marginBottom: 6, marginTop: 10 }, resultCount: { color: '#64748b', fontSize: 12, marginBottom: 10 }, list: { padding: 20, gap: 12 }, gridRow: { gap: 12, marginBottom: 12 }, gridItem: { flex: 1 }, detailImage: { width: '100%', height: 300, borderRadius: 20, backgroundColor: '#f1f5f9', marginVertical: 14 }, detailTitle: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginVertical: 6 }, detailPrice: { color: '#4f46e5', fontSize: 24, fontWeight: '800', marginVertical: 12 }, description: { color: '#475569', lineHeight: 22, fontSize: 15, marginBottom: 16 }, specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }, specKey: { color: '#64748b', fontWeight: '700', flex: 1 }, specValue: { color: '#0f172a', flex: 1, textAlign: 'right' }, cartItem: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, flexDirection: 'row', marginBottom: 12 }, cartImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: '#f1f5f9' }, cartInfo: { flex: 1, marginLeft: 12 }, quantity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 }, quantityButton: { color: '#4f46e5', fontSize: 20, fontWeight: '800' }, remove: { color: '#e11d48', fontSize: 12, marginLeft: 'auto' }, summary: { backgroundColor: '#eef2ff', borderRadius: 16, padding: 16, marginVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, summaryLabel: { color: '#475569', fontWeight: '700' }, summaryTotal: { color: '#0f172a', fontSize: 20, fontWeight: '800' }, response: { backgroundColor: '#eef2ff', borderRadius: 16, padding: 16, marginTop: 16 }, responseText: { color: '#312e81', lineHeight: 21, fontSize: 15 }, orderCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 12 }, orderHeader: { flexDirection: 'row', justifyContent: 'space-between' }, orderNumber: { color: '#0f172a', fontWeight: '800' }, status: { color: '#4f46e5', fontWeight: '800', textTransform: 'uppercase', fontSize: 11 }, orderTotal: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginVertical: 8 }, orderItem: { color: '#475569', marginTop: 4 }, muted: { color: '#64748b', lineHeight: 20 }, accountName: { color: '#0f172a', fontSize: 22, fontWeight: '800', marginBottom: 4 },
});
