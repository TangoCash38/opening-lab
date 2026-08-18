# Opening Lab — Android (Play)

This folder is a **Trusted Web Activity** wrapper. The Play app is not a
rewrite of Opening Lab: it opens https://www.openinglab.co.uk inside Chrome
in full-screen app mode.

| | |
|---|---|
| Package | `uk.co.openinglab` |
| App name | Opening Lab |
| Host | `www.openinglab.co.uk` |
| minSdk | 24 |
| targetSdk / compileSdk | **36** (Android 16 — required for new Play submissions from 31 Aug 2026) |
| Theme | `#2f5d50` |
| Splash / background | `#f4efe6` |
| Billing | Website Stripe (Play Billing is a later step) |

Launcher icons come from `public/icons/icon-512.png` and
`icon-512-maskable.png`.

## What you need on the machine that builds the upload file

- JDK 17 or 21 (`JAVA_HOME` set)
- Android SDK with **API 36** platform and **build-tools 36.0.0**
  (`ANDROID_HOME` or `android/local.properties` → `sdk.dir=...`)

Do **not** commit a keystore or passwords. Copy
`keystore.properties.example` to `keystore.properties` on the build machine
only.

## Build the file for Play Console

From this `android/` folder:

```bash
# 1. Point Gradle at the Android SDK (once per machine)
echo "sdk.dir=$ANDROID_HOME" > local.properties

# 2. Create an upload key (once). Keep this file safe — Play updates need it.
keytool -genkeypair -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# 3. Create keystore.properties from the example and fill in the passwords
#    you just chose. Do not commit that file.

# 4. Build the Android App Bundle
./gradlew bundleRelease
```

The upload file is:

`app/build/outputs/bundle/release/app-release.aab`

Upload that file to Play Console → **Closed testing**.

### Optional: Bubblewrap

`twa-manifest.json` is here so you can also run
`npx @bubblewrap/cli update` / `build` from this folder if you prefer
Google's generator. After `update`, re-check `targetSdkVersion` is **36**.

## After the first upload: Digital Asset Links

**Do not publish a guessed fingerprint.** A wrong
`public/.well-known/assetlinks.json` will show Chrome's URL bar on every
launch.

1. In Play Console, turn on **Play App Signing**.
2. Copy the **SHA-256 certificate fingerprint** Play shows for the *app
   signing* key (not only the upload key).
3. Add `public/.well-known/assetlinks.json` on the website (example below)
   and deploy, so it is served at
   `https://www.openinglab.co.uk/.well-known/assetlinks.json`.

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "uk.co.openinglab",
    "sha256_cert_fingerprints": [
      "PASTE_PLAY_APP_SIGNING_SHA256_HERE"
    ]
  }
}]
```

Include the upload-key SHA-256 as well if testers sideload a locally signed
build.

Print a local upload-key fingerprint (after you have created the keystore):

```bash
keytool -list -v -keystore upload-keystore.jks -alias upload
```

## Out of scope (this commit)

- Play Billing / Digital Goods — website Stripe stays
- Rewriting the web app, packs, or auth
