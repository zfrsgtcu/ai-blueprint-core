<!-- PURPOSE OF THIS FILE: {{ModelName}} detay sayfası — useQuery ile fetch, loading/error state, detail card. -->
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { {{ModelName}}Dto } from '../../types/{{modelName}}.types';

export default function {{ModelName}}DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<{{ModelName}}Dto>({
    queryKey: ['{{model_names}}', id],
    queryFn: () => api.get(`/api/{{model_names}}/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Veri yüklenirken hata oluştu.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: data.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Detail Card */}
        <View style={styles.card}>
          <Text style={styles.name}>{data.name}</Text>
          {data.description && (
            <Text style={styles.description}>{data.description}</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Oluşturulma:</Text>
            <Text style={styles.metaValue}>
              {new Date(data.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          {data.updatedAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Güncellenme:</Text>
              <Text style={styles.metaValue}>
                {new Date(data.updatedAt).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
        </View>

        {/* Aksiyonlar */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 16, color: '#DC2626', marginBottom: 16 },
  backButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#E5E7EB', borderRadius: 8 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 20, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  description: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  metaRow: { flexDirection: 'row', marginBottom: 4 },
  metaLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', width: 110 },
  metaValue: { fontSize: 14, color: '#374151' },
  actions: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, padding: 16, alignItems: 'center' },
  editButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  deleteButton: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', padding: 16, alignItems: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
});
