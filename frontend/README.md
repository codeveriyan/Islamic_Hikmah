# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Google Play premium billing setup

Premium purchases use Google Play Billing through RevenueCat and
`react-native-purchases`. Configure `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` and
`EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` from `.env`. In Google Play Console,
create the monthly, annual, and lifetime products; then attach those products
to a RevenueCat offering mapped to the `pro` entitlement.

Real purchases require a Google Play internal-test, closed-test, or production
build. Expo Go and non-Android builds do not contain a billing path. Prices are
read from Google Play at runtime, so each user sees the store-localized price
and currency. There is no UPI or manual payment fallback in the client.

The backend must also have `REVENUECAT_API_KEY`,
`REVENUECAT_WEBHOOK_AUTH_TOKEN`, and `REVENUECAT_ENTITLEMENT_ID` configured.
Point the RevenueCat webhook at `/api/webhooks/revenuecat` and use the exact
same authorization header value as the backend webhook token.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
