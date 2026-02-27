// Firebase Configuration for GCC-SAE
// Hybrid mode: Firebase Storage + MongoDB for data
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVGXY40wIFGfdIT0YhefZIXYBSBYTcUtk",
  authDomain: "gcc-sae-emergent-build.firebaseapp.com",
  projectId: "gcc-sae-emergent-build",
  storageBucket: "gcc-sae-emergent-build.firebasestorage.app",
  messagingSenderId: "899804180054",
  appId: "1:899804180054:web:0306d98a670d64ba0055f7",
  measurementId: "G-JTN275HESC"
};

// Initialize Firebase (singleton pattern)
let app;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  storage = getStorage(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ============== FIREBASE STORAGE FUNCTIONS ==============

// Compute SHA-256 hash
export const computeFileHash = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error computing hash:', error);
    return Date.now().toString(16); // Fallback to timestamp-based ID
  }
};

// Upload document to Firebase Storage
export const uploadToFirebaseStorage = async (file, dealRoomId, folder, onProgress) => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  // Compute file hash for integrity
  const fileHash = await computeFileHash(file);
  
  // Create storage path: /deals/{dealId}/{folder}/{fileName}
  const storagePath = `deals/${dealRoomId}/${folder}/${file.name}`;
  const storageRef = ref(storage, storagePath);
  
  // Start resumable upload
  const uploadTask = uploadBytesResumable(storageRef, file, {
    customMetadata: {
      dealRoomId,
      folder,
      fileHash,
    }
  });
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          resolve({
            storagePath,
            downloadURL,
            fileHash,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// Delete from Firebase Storage
export const deleteFromFirebaseStorage = async (storagePath) => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.warn('Could not delete from Firebase Storage:', error);
    return false;
  }
};

// Check if Firebase is available
export const isFirebaseAvailable = () => {
  return !!storage;
};

// Export Firebase instances
export { storage, app };
export default app;
