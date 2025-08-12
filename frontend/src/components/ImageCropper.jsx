import React, { useState, useRef, useEffect } from 'react';
import './ImageCropper.css';
import { toast } from 'react-hot-toast';

const ImageCropper = ({ imageSrc, onCrop, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (imageRef.current && imageSrc) {
      const img = imageRef.current;
      
      const handleLoad = () => {
        console.log('🖼️ Image loaded');
        
        // Wait for image to be fully rendered
        setTimeout(() => {
          const rect = img.getBoundingClientRect();
          console.log('📏 Image rect:', rect);
          
          // Calculate crop size (square, 80% of smaller dimension)
          const cropSize = Math.min(rect.width, rect.height) * 0.8;
          
          // Center the crop area
          const cropX = (rect.width - cropSize) / 2;
          const cropY = (rect.height - cropSize) / 2;
          
          const cropArea = {
            x: cropX,
            y: cropY,
            width: cropSize,
            height: cropSize
          };
          
          console.log('✂️ Setting crop area:', cropArea);
          setCrop(cropArea);
        }, 200);
      };
      
      if (img.complete) {
        handleLoad();
      } else {
        img.onload = handleLoad;
      }
    }
  }, [imageSrc]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within crop area
    if (x >= crop.x && x <= crop.x + crop.width && 
        y >= crop.y && y <= crop.y + crop.height) {
      console.log('🖱️ Starting drag at:', { x, y });
      setIsDragging(true);
      setDragStart({
        x: x - crop.x,
        y: y - crop.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = x - dragStart.x;
    const newY = y - dragStart.y;
    
    // Constrain to image bounds
    const imgRect = imageRef.current.getBoundingClientRect();
    const maxX = imgRect.width - crop.width;
    const maxY = imgRect.height - crop.height;
    
    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    }));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      console.log('🖱️ Drag ended, crop area:', crop);
    }
    setIsDragging(false);
  };

  const handleCrop = async () => {
    console.log('🚀 Starting HD crop process...');
    
    if (!imageRef.current || isCropping) {
      console.log('❌ Cannot crop: image not ready or already cropping');
      return;
    }

    setIsCropping(true);
    
    try {
      const img = imageRef.current;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set HD output size (increased from 300 to 512 for better quality)
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      console.log('📏 HD Canvas size:', { width: canvas.width, height: canvas.height });
      
      // Get image dimensions
      const imgRect = img.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      
      console.log('📏 Image dimensions:', {
        natural: { width: naturalWidth, height: naturalHeight },
        display: { width: imgRect.width, height: imgRect.height }
      });
      
      // Calculate scale factors
      const scaleX = naturalWidth / imgRect.width;
      const scaleY = naturalHeight / imgRect.height;
      
      // Calculate actual crop coordinates
      const actualX = crop.x * scaleX;
      const actualY = crop.y * scaleY;
      const actualWidth = crop.width * scaleX;
      const actualHeight = crop.height * scaleY;
      
      console.log('✂️ HD Crop calculations:', {
        crop,
        scaleX,
        scaleY,
        actualX,
        actualY,
        actualWidth,
        actualHeight
      });
      
      // Clear canvas
      ctx.clearRect(0, 0, outputSize, outputSize);
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the cropped image
      console.log('🎨 Drawing HD image to canvas...');
      ctx.drawImage(
        img,
        actualX,
        actualY,
        actualWidth,
        actualHeight,
        0,
        0,
        outputSize,
        outputSize
      );
      
      console.log('✅ HD Image drawn to canvas successfully');
      
      // Convert to blob with high quality (increased from 0.9 to 0.95)
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          console.log('✅ HD crop successful! Blob size:', blob.size, 'bytes');
          console.log('✅ Blob type:', blob.type);
          console.log('✅ Calling onCrop with HD blob...');
          onCrop(blob);
        } else {
          console.error('❌ Failed to create blob or blob is empty');
          console.error('❌ Blob details:', blob);
          toast.error('Failed to crop image. Please try again.');
        }
        setIsCropping(false);
      }, 'image/jpeg', 0.95);
      
    } catch (error) {
      console.error('❌ HD Crop error:', error);
      toast.error(`Failed to crop image: ${error.message}`);
      setIsCropping(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal glass-card border border-white/20 backdrop-blur-2xl">
        <div className="image-cropper-header bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wide">Crop Your Photo</h2>
          <button onClick={onClose} className="text-white hover:text-pink-200 text-2xl font-bold px-2 py-1 rounded-full transition-all">&times;</button>
        </div>
        <div className="image-cropper-content flex flex-col items-center justify-center">
          <div 
            className="image-cropper-container relative bg-white/10 rounded-2xl shadow-xl border border-purple-200"
            ref={containerRef}
            style={{ maxWidth: 400, maxHeight: 400 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop"
              className="image-cropper-image rounded-2xl shadow-lg"
              draggable={false}
            />
            {/* Crop area overlay */}
            <div
              className="image-cropper-crop-area rounded-2xl border-4 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg animate-pulse"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
                pointerEvents: 'auto',
              }}
            />
          </div>
        </div>
        <div className="image-cropper-footer flex justify-end gap-4 bg-gradient-to-r from-white/60 to-purple-100/60 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 shadow transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={isCropping}
            className="px-6 py-2 rounded-full font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCropping ? 'Cropping...' : 'Crop & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 