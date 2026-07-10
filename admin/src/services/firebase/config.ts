import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDYgGQKrLdgNM0U0JrKEexLr7FwQSGKCdQ",
  authDomain: "rafaelporto-fotografo.firebaseapp.com",
  projectId: "rafaelporto-fotografo",
  storageBucket: "rafaelporto-fotografo.firebasestorage.app",
  messagingSenderId: "913085660152",
  appId: "1:913085660152:web:8b0378b4dad8fff696340d",
  measurementId: "G-GKJ00SDNXL"
};

const app = initializeApp(firebaseConfig);

export default app;