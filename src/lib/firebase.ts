import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBojTXPfio2McpDjyfAYiQRnqbxL6N791k",
  authDomain: "coherent-dream-w4dh4.firebaseapp.com",
  projectId: "coherent-dream-w4dh4",
  storageBucket: "coherent-dream-w4dh4.firebasestorage.app",
  messagingSenderId: "393621089642",
  appId: "1:393621089642:web:8111b803b85969ab474913"
};

const app = initializeApp(firebaseConfig);

// Use the specific custom firestoreDatabaseId
export const db = getFirestore(app, "ai-studio-gerenciamentodec-5dfb9002-fa3f-41de-99af-8c61382e1a69");
