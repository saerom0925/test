/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase Configuration & Initialization Utility
 * 
 * 이 파일은 Firebase Firestore 데이터베이스를 초기화하고 내보내는 역할을 합니다.
 * Firebase를 처음 사용하는 사람도 쉽게 이해할 수 있도록 구조화되어 있습니다.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 콘솔에서 발급받은 구성 키값들입니다.
// 이 값들은 firebase-applet-config.json에서 자동으로 프로비저닝된 값들과 일치합니다.
const firebaseConfig = {
  apiKey: "AIzaSyAWqNF7Lbv6RrzuEy5X-4urd_kAhvuC4os",
  authDomain: "gen-lang-client-0478577882.firebaseapp.com",
  projectId: "gen-lang-client-0478577882",
  storageBucket: "gen-lang-client-0478577882.firebasestorage.app",
  messagingSenderId: "541365906558",
  appId: "1:541365906558:web:515073702830251e5a3c2f"
};

// 1. Firebase 앱 인스턴스를 하나로 초기화합니다.
const app = initializeApp(firebaseConfig);

// 2. 지정된 커스텀 databaseId를 사용하여 Firestore 데이터베이스 인스턴스를 초기화합니다.
// AI Studio 환경에서는 멀티 데이터베이스가 프로비저닝되므로 명시적으로 데이터베이스 ID를 기입합니다.
export const db = getFirestore(app, "ai-studio-34e8d4b4-5b07-487e-8b1e-620b02844cc2");

