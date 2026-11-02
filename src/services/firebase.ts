import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with databaseId from config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CloudSaveData {
  userId: string;
  cityId: string;
  saveJson: string;
  version: number;
  totalPassengers: number;
  totalDays: number;
  updatedAt: string;
}

// Convert username or email to valid email for Firebase Auth
export function formatUsernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@') && clean.includes('.')) {
    return clean;
  }
  const sanitized = clean.replace(/[^a-z0-9_]/g, '');
  return `${sanitized || 'player'}@metro.com`;
}

// Register user with username & password
export async function registerWithUsername(username: string, password: string): Promise<UserProfile> {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    throw new Error('Tên người dùng phải có ít nhất 3 ký tự.');
  }
  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const email = formatUsernameToEmail(cleanUsername);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const profile: UserProfile = {
    uid: user.uid,
    username: cleanUsername,
    email,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...profile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Could not write user profile to Firestore:', error);
  }

  // Cache locally
  localStorage.setItem('metro_user_profile', JSON.stringify(profile));
  return profile;
}

// Login user with username & password
export async function loginWithUsername(username: string, password: string): Promise<UserProfile> {
  const cleanUsername = username.trim();
  const email = formatUsernameToEmail(cleanUsername);

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let profile: UserProfile = {
    uid: user.uid,
    username: cleanUsername,
    email,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      profile = {
        uid: user.uid,
        username: data.username || cleanUsername,
        email: data.email || email,
        createdAt: data.createdAt ? new Date().toISOString() : new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      // update last login
      await setDoc(userDocRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    } else {
      await setDoc(userDocRef, {
        ...profile,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.warn('Could not read user profile from Firestore, using default profile:', error);
  }

  localStorage.setItem('metro_user_profile', JSON.stringify(profile));
  return profile;
}

// 1-Click Guest Login using Firebase Anonymous Auth
export async function loginAsGuest(): Promise<UserProfile> {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;

  const profile: UserProfile = {
    uid: user.uid,
    username: `Khách_${user.uid.slice(0, 5)}`,
    email: undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...profile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Could not sync guest profile with Firestore:', e);
  }

  localStorage.setItem('metro_user_profile', JSON.stringify(profile));
  return profile;
}

// Log out
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('metro_user_profile');
}

// Save city state to Firestore
export async function saveCityToCloud(
  userId: string,
  cityId: string,
  saveJson: string,
  totalPassengers = 0,
  totalDays = 0
): Promise<void> {
  const saveDocRef = doc(db, 'users', userId, 'city_saves', cityId);
  try {
    await setDoc(saveDocRef, {
      userId,
      cityId,
      saveJson,
      version: 3,
      totalPassengers,
      totalDays,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/city_saves/${cityId}`);
  }
}

// Load city state from Firestore
export async function loadCityFromCloud(userId: string, cityId: string): Promise<string | null> {
  const saveDocRef = doc(db, 'users', userId, 'city_saves', cityId);
  try {
    const snap = await getDoc(saveDocRef);
    if (snap.exists()) {
      const data = snap.data() as CloudSaveData;
      return data.saveJson || null;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/city_saves/${cityId}`);
  }
  return null;
}

// Get cached user profile
export function getCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('metro_user_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
