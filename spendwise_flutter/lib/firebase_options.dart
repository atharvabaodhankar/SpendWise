// ┌─────────────────────────────────────────────────────────────────────┐
// │ FIREBASE OPTIONS — Auto-generated placeholder                      │
// │                                                                     │
// │ This file needs to be regenerated using the FlutterFire CLI:       │
// │   dart pub global activate flutterfire_cli                          │
// │   flutterfire configure --project=spendwise-a875c                  │
// │                                                                     │
// │ OR you can manually fill in the values from your Firebase console. │
// └─────────────────────────────────────────────────────────────────────┘

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return web;
    }
  }

  // ── Web (same config as your existing web app) ──
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDnYvwZqMeNEnEAqDvn-0sTbW91xx2cMbI',
    appId: '1:519017200057:web:b4856f6b77e13ba2185e68',
    messagingSenderId: '519017200057',
    projectId: 'spendwise-a875c',
    authDomain: 'spendwise-a875c.firebaseapp.com',
    storageBucket: 'spendwise-a875c.firebasestorage.app',
    measurementId: 'G-QJ8L7JLHCS',
  );

  // ── Android ──
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDgpniwY_XBnCUIvfaIdA0CJnDTblM6HoA',
    appId: '1:519017200057:android:305383a0fd4fc4f4185e68',
    messagingSenderId: '519017200057',
    projectId: 'spendwise-a875c',
    storageBucket: 'spendwise-a875c.firebasestorage.app',
  );

  // ── iOS ──
  // TODO: Run `flutterfire configure` to generate the correct values.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_WITH_IOS_API_KEY',
    appId: '1:519017200057:ios:REPLACE_WITH_IOS_APP_ID',
    messagingSenderId: '519017200057',
    projectId: 'spendwise-a875c',
    storageBucket: 'spendwise-a875c.firebasestorage.app',
    iosBundleId: 'com.spendwise.app',
  );
}
