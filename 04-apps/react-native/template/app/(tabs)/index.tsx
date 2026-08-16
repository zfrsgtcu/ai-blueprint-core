<!-- PURPOSE OF THIS FILE: Ana sayfa — hero, featured items, CTA. useQuery ile API'den veri çeker. -->
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { {{ModelName}}Dto } from '../../types/{{modelName}}.types';

export default function HomeScreen() {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<{{ModelName}}Dto[]>({
    queryKey: ['{{model_names}}'],
    queryFn: () => api.get('/api/{{model_names}}'),
  });

  const renderItem = ({ item }: { item: {{ModelName}}Dto }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/{{model_name}}/${item.id}`)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.cardArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{{ProjectName}}</Text>
        <Text style={styles.heroSubtitle}>{{Description}}</Text>
      </View>

      {/* Featured {{ModelName}}s */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{{ModelName}}s</Text>
          <TouchableOpacity onPress={() => router.push('/{{model_names}}')}>
            <Text style={styles.seeAll}>Tümü →</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Veri yüklenirken hata oluştu.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={data ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading && !error ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Henüz kayıt bulunmuyor.</Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  section: { paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  listContent: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 4, width: 240 },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  cardArrow: { fontSize: 20, color: '#2563EB', marginTop: 8, alignSelf: 'flex-end' },
  centered: { padding: 32, alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#DC2626', marginBottom: 8 },
  retryButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#2563EB', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6B7280' },
});
