# WOMS Mobile App

Work Order Management System mobile application for technicians built with React Native.

## Features

- **Authentication**: Microsoft Entra ID integration with development bypass
- **Work Order Management**: View assigned work orders, update status, add comments
- **Camera Integration**: Capture and upload photos to work orders
- **Real-time Updates**: Live synchronization with backend API
- **Offline Support**: (Future enhancement)

## Development Setup

### Prerequisites

- Node.js (v16 or later)
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Installation

```bash
cd apps/mobile
npm install

# iOS setup (macOS only)
cd ios
pod install
cd ..

# Android setup
# Ensure Android SDK is installed and configured
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Architecture

### Project Structure

```
src/
├── App.tsx                 # Main app component with navigation
├── components/             # Reusable UI components
├── screens/               # Screen components
│   ├── LoginScreen.tsx
│   ├── WorkOrderListScreen.tsx
│   ├── WorkOrderDetailScreen.tsx
│   └── CameraScreen.tsx
├── providers/             # Context providers
│   ├── AuthProvider.tsx
│   └── WorkOrderProvider.tsx
├── services/              # API and external services
│   └── api.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
└── theme/                 # UI theme configuration
    └── theme.ts
```

### Key Components

#### AuthProvider
- Handles Microsoft Entra ID authentication
- Development mode bypass for testing
- User session management

#### WorkOrderProvider
- Manages work order state and operations
- API integration for CRUD operations
- Mock data for development

#### API Service
- Centralized backend communication
- Axios-based HTTP client
- Token management and error handling

## Features Implementation

### ✅ Completed Features

1. **US3.2.1: React Native Project Setup**
   - Project structure and configuration
   - TypeScript setup
   - Navigation with React Navigation
   - Material Design with React Native Paper

2. **US3.2.2: Microsoft Entra ID Authentication**
   - MSAL integration (ready for production)
   - Development bypass for testing
   - User context management

3. **US3.2.3: Work Order List View**
   - Display assigned work orders
   - Search and filtering
   - Status and priority indicators
   - Pull-to-refresh functionality

4. **US3.2.4: Work Order Details & Status Updates**
   - Comprehensive work order details
   - Status update functionality
   - Comment system
   - Real-time updates

5. **US3.2.5: Camera Integration**
   - Photo capture from camera
   - Photo selection from gallery
   - File upload to work orders
   - Image preview and management

### 🔧 Development Features

- **Mock Data**: Realistic test data for development
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during operations
- **Responsive Design**: Mobile-optimized layouts

## Configuration

### Environment Variables

Create a `.env` file in the mobile app root:

```bash
API_BASE_URL=http://localhost:3001/api
AZURE_CLIENT_ID=your_client_id
AZURE_TENANT_ID=your_tenant_id
```

### Production Configuration

1. **MSAL Setup**: Replace mock MSAL with actual configuration
2. **API URL**: Update base URL for production backend
3. **Permissions**: Configure proper Android/iOS permissions
4. **Signing**: Set up code signing for app stores

## Development Notes

- Uses development authentication bypass
- Mock data for testing UI components
- Ready for production MSAL integration
- Follows React Native best practices
- TypeScript strict mode enabled

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **Android build issues**: Clean project with `cd android && ./gradlew clean`
3. **iOS build issues**: Clean build folder in Xcode

### Dependencies

Key packages used:
- `react-native`: Core framework
- `@react-navigation/native`: Navigation
- `react-native-paper`: Material Design components
- `react-native-msal`: Microsoft authentication
- `react-native-image-picker`: Camera/gallery access
- `axios`: HTTP client

## Future Enhancements

- Offline support with local storage
- Push notifications
- Barcode/QR code scanning
- Voice notes and recordings
- Advanced filtering and search
- Performance optimizations 