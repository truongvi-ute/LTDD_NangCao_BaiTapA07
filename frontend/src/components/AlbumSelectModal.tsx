import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '@/src/context/AlertContext';
import albumService, { Album } from '@/src/services/albumService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AlbumSelectModalProps {
  visible: boolean;
  onClose: () => void;
  momentId: number;
}

export default function AlbumSelectModal({ visible, onClose, momentId }: AlbumSelectModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (visible) {
      loadAlbums();
    }
  }, [visible]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const data = await albumService.getUserAlbums();
      setAlbums(data);
    } catch (error) {
      console.error('Error loading albums:', error);
      showAlert('Lỗi', 'Không thể tải danh sách album');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlbum = async (albumId: number) => {
    try {
      setAdding(true);
      await albumService.addMomentToAlbum(albumId, momentId);
      showAlert('Thành công', 'Đã thêm moment vào album!');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể thêm vào album';
      showAlert('Lỗi', errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) {
      showAlert('Lỗi', 'Vui lòng nhập tên album');
      return;
    }

    try {
      setCreating(true);
      const newAlbum = await albumService.createAlbum({
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim() || undefined
      });
      
      // After creating, automatically add the moment to it
      await albumService.addMomentToAlbum(newAlbum.id, momentId);
      
      showAlert('Thành công', 'Đã tạo album và thêm moment!');
      onClose();
      // Reset state
      setShowCreateNew(false);
      setNewAlbumName('');
      setNewAlbumDescription('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo album';
      showAlert('Lỗi', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => handleSelectAlbum(item.id)}
      disabled={adding}
    >
      <View style={styles.albumIconContainer}>
        <Ionicons name="albums-outline" size={24} color="#1a73e8" />
      </View>
      <View style={styles.albumInfo}>
        <Text style={styles.albumName}>{item.name}</Text>
        <Text style={styles.albumCount}>{item.itemCount} moments</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {showCreateNew ? 'Tạo Album mới' : 'Thêm vào Album'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {showCreateNew ? (
              <View style={styles.createContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tên Album *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tên album..."
                    value={newAlbumName}
                    onChangeText={setNewAlbumName}
                    autoFocus
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mô tả (tùy chọn)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Nhập mô tả..."
                    value={newAlbumDescription}
                    onChangeText={setNewAlbumDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setShowCreateNew(false)}
                  >
                    <Text style={styles.cancelButtonText}>Quay lại</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton, !newAlbumName.trim() && styles.disabledButton]}
                    onPress={handleCreateAlbum}
                    disabled={creating || !newAlbumName.trim()}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Tạo & Thêm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => setShowCreateNew(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#1a73e8" />
                  <Text style={styles.createBtnText}>Tạo Album mới</Text>
                </TouchableOpacity>

                {loading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                  </View>
                ) : albums.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Ionicons name="albums-outline" size={48} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Bạn chưa có album nào</Text>
                  </View>
                ) : (
                  <FlatList
                    data={albums}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderAlbumItem}
                    contentContainerStyle={styles.list}
                  />
                )}
                
                {adding && (
                  <View style={styles.addingOverlay}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.addingText}>Đang thêm...</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderStyle: 'dashed',
  },
  createBtnText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  albumIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumInfo: {
    flex: 1,
    marginLeft: 12,
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  albumCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  createContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A0C3F7',
  },
  addingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
  },
});
