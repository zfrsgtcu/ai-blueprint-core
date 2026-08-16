<!-- PURPOSE OF THIS FILE: {{ModelName}}Card component — listede kullanılan reusable kart, onPress ile detaya yönlendirme. -->
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { {{ModelName}}Dto } from '../types/{{modelName}}.types';

interface {{ModelName}}CardProps {
  item: {{ModelName}}Dto;
  onPress: (item: {{ModelName}}Dto) => void;
}

export default function {{ModelName}}Card({ item, onPress }: {{ModelName}}CardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
          </Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  arrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
