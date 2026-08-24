import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryCard } from '@/components/categories/category-card';
import { CategoryForm, type CategoryFormSubmitPayload } from '@/components/categories/category-form';
import FloatingButton from '@/components/floating-button';
import { AppModal } from '@/components/modal';
import { useTheme } from '@/contexts/theme-context';
import { useCategories } from '@/hooks/use-categories';
import type { Category } from '@/types/app';

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const { categories, loading, error, create, update, remove } = useCategories();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreateModal() {
    setEditingCategory(null);
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setFormError(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCategory(null);
    setFormError(null);
  }

  async function handleSubmit(payload: CategoryFormSubmitPayload) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (payload.mode === 'edit' && editingCategory) {
        await update(editingCategory.id, payload.name);
      } else {
        await create(payload.name);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(category: Category) {
    Alert.alert(
      'Delete category',
      `Delete "${category.name}"? This cannot be undone. Transactions using it will be uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(category.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Categories</Text>

      {loading ? (
        <ActivityIndicator color={theme.tint} style={styles.centered} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() => openEditModal(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.icon }]}>No categories yet. Tap + to add one.</Text>
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FloatingButton onPress={openCreateModal} />

      <AppModal
        visible={modalVisible}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        onClose={closeModal}>
        <CategoryForm
          mode={editingCategory ? 'edit' : 'create'}
          category={editingCategory}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  centered: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 96 },
  empty: { textAlign: 'center', marginTop: 32 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
