import React, { useState, useRef, useCallback } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useAuth } from '../../contexts/AuthContext';
import { uploadProfilePicture } from '../../services/api';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ProfilePicture = () => {
  const { user } = useAuth();
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  
  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result.toString() || '');
        setShowCropModal(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const canvasPreview = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      crop.width,
      crop.height
    );
  }, [completedCrop]);

  // Apply crop when completed crop changes
  React.useEffect(() => {
    canvasPreview();
  }, [canvasPreview]);

  // Handle upload
  const handleUpload = async () => {
    if (!completedCrop || !previewCanvasRef.current) {
      setError('Please crop an image first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Convert canvas to blob
      const canvas = previewCanvasRef.current;
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          setError('Failed to process the image');
          setLoading(false);
          return;
        }
        
        // Create form data
        const formData = new FormData();
        // Add the file with a specific filename
        formData.append('profilePicture', blob, 'profile.jpg');

        console.log('Uploading profile picture...');
        
        try {
          // Use the API service function
          const response = await uploadProfilePicture(formData);
          
          console.log('Upload response:', response);

          setSuccess('Profile picture updated successfully!');
          setShowCropModal(false);
          
          // Reload the page to show the new profile picture
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (err) {
          console.error('Error uploading profile picture:', err);
          setError(err.message || 'Failed to upload profile picture');
        } finally {
          setLoading(false);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image');
      setLoading(false);
    }
  };

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Profile Picture</strong>
        </CCardHeader>
        <CCardBody>
          <CRow>
            <CCol md={6} className="mb-3">
              <div className="text-center">
                <div 
                  className="profile-image-container mb-3" 
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    margin: '0 auto',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '1px solid #ddd'
                  }}
                >
                  {user?.profile_picture ? (
                    <img 
                      src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user.profile_picture}`}
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        console.error('Error loading profile image');
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${user.username}&size=200&background=f0f0f0&color=666`;
                      }}
                    />
                  ) : (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        fontSize: '3rem',
                        color: '#666'
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <CButton 
                    color="primary"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    Change Profile Picture
                  </CButton>
                </div>
              </div>
            </CCol>
            
            <CCol md={6}>
              {error && <CAlert color="danger">{error}</CAlert>}
              {success && <CAlert color="success">{success}</CAlert>}
              
              <p className="text-medium-emphasis">
                Upload a new profile picture. The image will be cropped to a square.
              </p>
              <ul>
                <li>Maximum file size: 5MB</li>
                <li>Supported formats: JPEG, PNG, GIF</li>
                <li>Recommended size: 500x500 pixels</li>
              </ul>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Crop Modal */}
      <CModal 
        visible={showCropModal} 
        onClose={() => setShowCropModal(false)}
        size="lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Crop Profile Picture</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="crop-container">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  style={{ maxHeight: '70vh' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </div>
          
          <div className="preview-container mt-3">
            <p>Preview:</p>
            <canvas
              ref={previewCanvasRef}
              style={{
                width: completedCrop?.width ?? 0,
                height: completedCrop?.height ?? 0,
                borderRadius: '50%',
                objectFit: 'contain'
              }}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => setShowCropModal(false)}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleUpload}
            disabled={loading || !completedCrop?.width || !completedCrop?.height}
          >
            {loading ? <CSpinner size="sm" className="me-2" /> : null}
            {loading ? 'Uploading...' : 'Upload'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProfilePicture; 