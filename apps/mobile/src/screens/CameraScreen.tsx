import React, {useState} from 'react';
import {View, StyleSheet, Alert, Image} from 'react-native';
import {Button, Card, Title, Paragraph, ActivityIndicator, Snackbar} from 'react-native-paper';
import {launchImageLibrary, launchCamera, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {useWorkOrders} from '../providers/WorkOrderProvider';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../App';

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Camera'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
}

const CameraScreen: React.FC<Props> = ({navigation, route}) => {
  const {workOrderId} = route.params;
  const {uploadAttachment, isLoading, error, clearError} = useWorkOrders();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const showImagePicker = () => {
    Alert.alert(
      'Select Photo',
      'Choose an option to add a photo',
      [
        {text: 'Camera', onPress: openCamera},
        {text: 'Photo Library', onPress: openImageLibrary},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    };

    launchCamera(options, handleImageResponse);
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      if (asset.uri) {
        setSelectedImage(asset.uri);
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    try {
      setUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      } as any);

      await uploadAttachment(workOrderId, formData);
      
      Alert.alert(
        'Success',
        'Photo uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Add Photo to Work Order</Title>
          <Paragraph style={styles.subtitle}>
            Capture or select a photo to attach to this work order.
          </Paragraph>

          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{uri: selectedImage}} style={styles.previewImage} />
              <View style={styles.imageActions}>
                <Button
                  mode="outlined"
                  onPress={clearImage}
                  style={styles.actionButton}
                  icon="delete">
                  Remove
                </Button>
                <Button
                  mode="contained"
                  onPress={uploadImage}
                  style={styles.actionButton}
                  loading={uploading}
                  disabled={uploading}
                  icon="upload">
                  Upload Photo
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.noImageContainer}>
              <Paragraph style={styles.noImageText}>No photo selected</Paragraph>
              <Button
                mode="contained"
                onPress={showImagePicker}
                style={styles.selectButton}
                icon="camera">
                Select Photo
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {(isLoading || uploading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Paragraph style={styles.loadingText}>
            {uploading ? 'Uploading photo...' : 'Loading...'}
          </Paragraph>
        </View>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}>
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  noImageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noImageText: {
    marginBottom: 24,
    color: '#666',
    fontSize: 16,
  },
  selectButton: {
    paddingHorizontal: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

export default CameraScreen; 