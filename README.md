# Flux

Flux is a comprehensive mobile application designed for efficient site and store management. Built with performance and user experience in mind, it leverages modern technologies to provide real-time data synchronization and a fluid, interactive interface.

## Key Features

- **Site & Store Management**: Seamlessly organize and track multiple sites and stores.
- **Interactive Radial Menu**: A custom-built, animated Floating Action Button (FAB) for quick access to core actions like adding sites, viewing analytics, and accessing the chatbot.
- **Real-Time Updates**: Powered by Firebase for instant data synchronization across devices.
- **Adaptive Theming**: Fully supports both light and dark modes for a comfortable viewing experience in any environment.
- **Secure Authentication**: Robust user authentication system.

## Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: TypeScript
- **Styling**: Custom theming system
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/flux.git
    cd flux
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    - Ensure you have a valid `google-services.json` for Android and `GoogleService-Info.plist` for iOS if building native binaries.
    - Configure your Firebase credentials in `firebaseConfig.ts` if necessary.

4.  **Run the application**
    ```bash
    npx expo start
    ```

## Project Structure

- `app/`: Contains the main application screens and navigation logic (Expo Router).
- `components/`: Reusable UI components (Header, RadialMenu, etc.).
- `constants/`: App-wide constants and theme definitions.
- `context/`: React Context providers (Authentication, etc.).
- `hooks/`: Custom React hooks.
- `assets/`: Static assets like images and fonts.

## Contributing

We welcome contributions to improve Flux. Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourFeature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/YourFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
