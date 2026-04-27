/**
 * (lecturer)/unit-materials.tsx
 * Lecturer's material management screen for a specific unit.
 * Allows uploading PDF/DOCX/PPTX files or posting external links.
 * Shows real-time list of all posted materials.
 */
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAttendance } from '../../src/context/AttendanceContext';
import {
    ALLOWED_MIME_TYPES,
    listenToMaterials,
    Material,
    uploadLink,
    uploadMaterial,
} from '../../src/firebase/materialService';
import { colors, shadowStyle } from '../../src/theme/colors';

// ─── Icon helper ──────────────────────────────────────────────────────────────
function getMaterialIcon(type: Material['type']) {
  switch (type) {
    case 'pdf':  return { name: 'document-text' as const, color: '#e53935' };
    case 'docx': return { name: 'document'      as const, color: '#1565c0' };
    case 'pptx': return { name: 'easel'         as const, color: '#e65100' };
    case 'link': return { name: 'link'           as const, color: colors.primary };
  }
}

export default function UnitMaterialsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ unitId: string; unitName: string; unitCode: string }>();
  const { currentUser } = useAttendance();

  const [materials, setMaterials]     = useState<Material[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [postType, setPostType]         = useState<'file' | 'link'>('file');
  const [title, setTitle]               = useState('');
  const [linkUrl, setLinkUrl]           = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading]   = useState(false);

  // Pending picked file
  const [pickedFile, setPickedFile] = useState<{
    uri: string; name: string; mimeType: string;
  } | null>(null);

  // ── Real-time materials listener ──────────────────────────────────────────
  useEffect(() => {
    if (!params.unitId) return;
    const unsub = listenToMaterials(params.unitId, (data) => {
      setMaterials(data);
      setLoadingList(false);
    });
    return unsub;
  }, [params.unitId]);

  // ── Pick a file ───────────────────────────────────────────────────────────
  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: Object.keys(ALLOWED_MIME_TYPES),
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? '';

    if (!ALLOWED_MIME_TYPES[mimeType]) {
      Alert.alert(
        'Invalid File Type',
        'Only PDF, DOCX, and PPTX files are accepted. Please pick a supported file.'
      );
      return;
    }

    setPickedFile({ uri: asset.uri, name: asset.name, mimeType });
    if (!title.trim()) setTitle(asset.name.replace(/\.[^/.]+$/, ''));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for this material.');
      return;
    }
    if (!currentUser) return;

    setIsUploading(true);
    try {
      if (postType === 'file') {
        if (!pickedFile) {
          Alert.alert('No File', 'Please pick a file first.');
          setIsUploading(false);
          return;
        }
        await uploadMaterial({
          unitId:       params.unitId,
          title:        title.trim(),
          mimeType:     pickedFile.mimeType,
          fileUri:      pickedFile.uri,
          fileName:     pickedFile.name,
          uploadedBy:   currentUser.uid,
          uploaderName: currentUser.displayName,
          onProgress:   (pct) => setUploadProgress(pct),
        });
      } else {
        await uploadLink({
          unitId:       params.unitId,
          title:        title.trim(),
          url:          linkUrl.trim(),
          uploadedBy:   currentUser.uid,
          uploaderName: currentUser.displayName,
        });
      }
      resetModal();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Something went wrong. Try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setTitle('');
    setLinkUrl('');
    setPickedFile(null);
    setPostType('file');
    setUploadProgress(null);
  };

  // ── Render each material row ──────────────────────────────────────────────
  const renderMaterial = ({ item }: { item: Material }) => {
    const icon = getMaterialIcon(item.type);
    return (
      <View style={[styles.materialCard, shadowStyle]}>
        <View style={[styles.iconBox, { backgroundColor: icon.color + '18' }]}>
          <Ionicons name={icon.name} size={26} color={icon.color} />
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.materialMeta}>
            {item.type.toUpperCase()} · {item.uploadedAt}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: icon.color + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: icon.color }]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.unitCode}>{params.unitCode}</Text>
          <Text style={styles.unitName} numberOfLines={1}>{params.unitName}</Text>
        </View>
        <TouchableOpacity style={styles.postBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Materials list */}
      {loadingList ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : materials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={72} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Materials Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to upload your first file or link.
          </Text>
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          renderItem={renderMaterial}
          contentContainerStyle={styles.list}
        />
      )}

      {/* ── Post Material Modal ──────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Material</Text>
              <TouchableOpacity onPress={resetModal}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Toggle: File vs Link */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, postType === 'file' && styles.toggleBtnActive]}
                onPress={() => setPostType('file')}
              >
                <Ionicons name="document-attach-outline" size={18} color={postType === 'file' ? colors.white : colors.textSecondary} />
                <Text style={[styles.toggleText, postType === 'file' && styles.toggleTextActive]}>File</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, postType === 'link' && styles.toggleBtnActive]}
                onPress={() => setPostType('link')}
              >
                <Ionicons name="link-outline" size={18} color={postType === 'link' ? colors.white : colors.textSecondary} />
                <Text style={[styles.toggleText, postType === 'link' && styles.toggleTextActive]}>Link</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Chapter 3 Notes"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            {/* File picker OR link input */}
            {postType === 'file' ? (
              <>
                <TouchableOpacity style={[styles.pickFileBtn, shadowStyle]} onPress={handlePickFile}>
                  <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                  <Text style={styles.pickFileText}>
                    {pickedFile ? pickedFile.name : 'Pick PDF, DOCX or PPTX'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.mimeHint}>Accepted: PDF, DOCX, PPTX</Text>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://example.com/resource"
                  placeholderTextColor={colors.textSecondary}
                  value={linkUrl}
                  onChangeText={setLinkUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </>
            )}

            {/* Progress bar */}
            {uploadProgress !== null && (
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${uploadProgress}%` as any }]} />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isUploading && styles.submitBtnDisabled, shadowStyle]}
              onPress={handlePost}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={colors.white} />
              )}
              <Text style={styles.submitBtnText}>{isUploading ? 'Uploading…' : 'Post Material'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 12,
  },
  backBtn:    { padding: 4 },
  headerText: { flex: 1 },
  unitCode:   { color: colors.white, fontSize: 12, opacity: 0.8 },
  unitName:   { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  postBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 6,
  },

  loader: { marginTop: 60 },
  list:   { padding: 20, paddingBottom: 40 },

  materialCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox:      { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  materialMeta:  { fontSize: 12, color: colors.textSecondary },
  typeBadge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: 'bold' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 18, marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    gap: 6,
  },
  toggleBtnActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText:       { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.white },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 4 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: 16,
  },

  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    marginBottom: 6,
  },
  pickFileText: { flex: 1, fontSize: 14, color: colors.primary, fontWeight: '500' },
  mimeHint:     { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressBarBg:   { flex: 1, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  progressText:    { fontSize: 12, color: colors.textSecondary, width: 32 },

  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
