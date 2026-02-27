// Firebase Configuration for GCC-SAE
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDocs, getDoc, deleteDoc, updateDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);

// ============== FIRESTORE COLLECTIONS ==============
const COLLECTIONS = {
  DEAL_ROOMS: 'deal_rooms',
  ADVISORY_LOGS: 'advisory_logs',
  COMPLIANCE_CHECKLISTS: 'compliance_checklists',
  DOCUMENTS: 'documents',
};

// ============== DEAL ROOMS ==============
export const createDealRoom = async (dealRoom) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.DEAL_ROOMS), {
    ...dealRoom,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...dealRoom };
};

export const getDealRooms = async () => {
  const querySnapshot = await getDocs(
    query(collection(db, COLLECTIONS.DEAL_ROOMS), orderBy('createdAt', 'desc'))
  );
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  }));
};

export const getDealRoom = async (dealRoomId) => {
  const docRef = doc(db, COLLECTIONS.DEAL_ROOMS, dealRoomId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
    };
  }
  return null;
};

export const deleteDealRoom = async (dealRoomId) => {
  // Delete deal room
  await deleteDoc(doc(db, COLLECTIONS.DEAL_ROOMS, dealRoomId));
  
  // Cascade delete - advisory logs
  const logsQuery = query(
    collection(db, COLLECTIONS.ADVISORY_LOGS),
    where('dealRoomId', '==', dealRoomId)
  );
  const logsSnapshot = await getDocs(logsQuery);
  for (const docSnap of logsSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  // Cascade delete - compliance checklists
  const checklistsQuery = query(
    collection(db, COLLECTIONS.COMPLIANCE_CHECKLISTS),
    where('dealRoomId', '==', dealRoomId)
  );
  const checklistsSnapshot = await getDocs(checklistsQuery);
  for (const docSnap of checklistsSnapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  
  // Cascade delete - documents (both Firestore and Storage)
  const docsQuery = query(
    collection(db, COLLECTIONS.DOCUMENTS),
    where('dealRoomId', '==', dealRoomId)
  );
  const docsSnapshot = await getDocs(docsQuery);
  for (const docSnap of docsSnapshot.docs) {
    const docData = docSnap.data();
    if (docData.storagePath) {
      try {
        const storageRef = ref(storage, docData.storagePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Could not delete storage file:', e);
      }
    }
    await deleteDoc(docSnap.ref);
  }
};

// ============== ADVISORY LOGS ==============
export const createAdvisoryLog = async (log) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.ADVISORY_LOGS), {
    ...log,
    timestamp: serverTimestamp(),
  });
  return { id: docRef.id, ...log };
};

export const getAdvisoryLogs = async (dealRoomId) => {
  const q = query(
    collection(db, COLLECTIONS.ADVISORY_LOGS),
    where('dealRoomId', '==', dealRoomId),
    orderBy('timestamp', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.() || new Date(),
  }));
};

// ============== COMPLIANCE CHECKLISTS ==============
export const createComplianceChecklist = async (checklist) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.COMPLIANCE_CHECKLISTS), {
    ...checklist,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...checklist };
};

export const getComplianceChecklists = async (dealRoomId) => {
  const q = query(
    collection(db, COLLECTIONS.COMPLIANCE_CHECKLISTS),
    where('dealRoomId', '==', dealRoomId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
  }));
};

export const updateComplianceStatus = async (checklistId, status) => {
  const docRef = doc(db, COLLECTIONS.COMPLIANCE_CHECKLISTS, checklistId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Create default compliance checklists based on jurisdiction
export const createDefaultChecklists = async (dealRoomId, jurisdiction) => {
  let defaults = [];
  
  if (jurisdiction.includes('NIGERIA')) {
    defaults = [
      { name: 'CAMA 2020 Annual Returns', regulatoryBody: 'CAC', status: 'pending', dueDate: null },
      { name: 'NOTAP Certificate Status', regulatoryBody: 'NOTAP', status: 'pending', dueDate: null },
      { name: 'SEC Nigeria Private Placement', regulatoryBody: 'SEC Nigeria', status: 'pending', dueDate: null },
    ];
  } else if (jurisdiction.includes('DELAWARE') || jurisdiction.includes('US')) {
    defaults = [
      { name: 'SEC Form D Filing', regulatoryBody: 'SEC', status: 'pending', dueDate: null },
      { name: 'Delaware Franchise Tax', regulatoryBody: 'Delaware DOS', status: 'pending', dueDate: null },
      { name: 'Blue Sky Compliance', regulatoryBody: 'State Securities', status: 'pending', dueDate: null },
    ];
  } else if (jurisdiction.includes('UK')) {
    defaults = [
      { name: 'Companies House Annual Return', regulatoryBody: 'Companies House', status: 'pending', dueDate: null },
      { name: 'FCA Notification', regulatoryBody: 'FCA', status: 'pending', dueDate: null },
      { name: 'PSC Register Update', regulatoryBody: 'Companies House', status: 'pending', dueDate: null },
    ];
  } else if (jurisdiction.includes('CROSS-BORDER')) {
    defaults = [
      { name: 'CAMA 2020 Annual Returns', regulatoryBody: 'CAC', status: 'pending', dueDate: null },
      { name: 'SEC Form D Filing', regulatoryBody: 'SEC', status: 'pending', dueDate: null },
      { name: 'NOTAP Registration', regulatoryBody: 'NOTAP', status: 'pending', dueDate: null },
      { name: 'CBN Approval', regulatoryBody: 'CBN', status: 'pending', dueDate: null },
    ];
  }
  
  const createdChecklists = [];
  for (const item of defaults) {
    const created = await createComplianceChecklist({
      dealRoomId,
      ...item,
    });
    createdChecklists.push(created);
  }
  
  return createdChecklists;
};

// ============== DOCUMENT VAULT (FIREBASE STORAGE) ==============

// Compute SHA-256 hash
const computeFileHash = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Upload document with resumable upload
export const uploadDocument = async (file, dealRoomId, folder, accessLevel = 'Team', onProgress) => {
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
      accessLevel,
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
        reject(error);
      },
      async () => {
        // Get download URL
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Create document metadata in Firestore
        const docMetadata = {
          dealRoomId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          folder,
          fileHash,
          accessLevel,
          storagePath,
          downloadURL,
          indexingStatus: 'processing',
          version: '1.0',
          uploadedAt: serverTimestamp(),
          indexedAt: null,
        };
        
        const docRef = await addDoc(collection(db, COLLECTIONS.DOCUMENTS), docMetadata);
        
        // Simulate indexing completion (in production, this would be triggered by a Cloud Function)
        setTimeout(async () => {
          try {
            await updateDoc(doc(db, COLLECTIONS.DOCUMENTS, docRef.id), {
              indexingStatus: 'indexed',
              indexedAt: serverTimestamp(),
            });
          } catch (e) {
            console.warn('Could not update indexing status:', e);
          }
        }, 2000);
        
        resolve({
          id: docRef.id,
          ...docMetadata,
          uploadedAt: new Date(),
        });
      }
    );
  });
};

// Get documents for a deal room
export const getDocuments = async (dealRoomId, folder = null) => {
  let q = query(
    collection(db, COLLECTIONS.DOCUMENTS),
    where('dealRoomId', '==', dealRoomId)
  );
  
  if (folder) {
    q = query(q, where('folder', '==', folder));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt?.toDate?.() || new Date(),
    indexedAt: doc.data().indexedAt?.toDate?.() || null,
  }));
};

// Delete document
export const deleteDocument = async (documentId) => {
  const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Delete from Storage
    if (data.storagePath) {
      try {
        const storageRef = ref(storage, data.storagePath);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Could not delete storage file:', e);
      }
    }
    
    // Delete from Firestore
    await deleteDoc(docRef);
  }
};

// ============== AUDIT TRAIL ==============
export const getAuditTrail = async (dealRoomId) => {
  // Get advisory logs
  const advisoryLogs = await getAdvisoryLogs(dealRoomId);
  
  // Get documents
  const documents = await getDocuments(dealRoomId);
  
  // Get compliance checklists
  const checklists = await getComplianceChecklists(dealRoomId);
  
  return {
    advisoryLogs,
    documentUploads: documents,
    complianceUpdates: checklists,
  };
};

// Export Firebase instances for direct use if needed
export { db, storage, app };
export default app;
