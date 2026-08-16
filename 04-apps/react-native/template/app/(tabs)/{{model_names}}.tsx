<!-- PURPOSE OF THIS FILE: {{ModelName}} liste sayfası — useQuery ile fetch, FlatList, pull-to-refresh, empty/error/loading state, card tap ile detaya git. -->
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { {{ModelName}}Dto } from '../../types/{{modelName}}.types';

export default function {{ModelName}}ListScreen() {
  const router = useRouter();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<{{ModelName}}Dto[]>({
    queryKey: ['{{model_names}}'],
    queryFn: () => api.get('/api/{{model_names}}'),
  });

  const renderItem = ({ item }: { item: {{ModelName}}Dto }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/{{model_name}}/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <Text style={styles.cardArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Henüz Kayıt Yok</Text>
        <Text style={styles.emptyDescription}>
          Henüz hiç {{modelName}} kaydı bulunmuyor. Yeni bir kayıt ekleyerek başlayabilirsiniz.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Veri yüklenirken hata oluştu.</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: 16, flexGrow: 1 },
  errorBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14 },
  retryText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  cardArrow: { fontSize: 20, color: '#9CA3AF', marginLeft: 12 },
  separator: { height: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyDescription: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
