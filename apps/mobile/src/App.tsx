import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import {AuthProvider} from './providers/AuthProvider';
import {WorkOrderProvider} from './providers/WorkOrderProvider';
import LoginScreen from './screens/LoginScreen';
import WorkOrderListScreen from './screens/WorkOrderListScreen';
import WorkOrderDetailScreen from './screens/WorkOrderDetailScreen';
import CameraScreen from './screens/CameraScreen';
import {theme} from './theme/theme';

export type RootStackParamList = {
  Login: undefined;
  WorkOrderList: undefined;
  WorkOrderDetail: {workOrderId: string};
  Camera: {workOrderId: string};
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <WorkOrderProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.onPrimary,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{headerShown: false}}
              />
              <Stack.Screen
                name="WorkOrderList"
                component={WorkOrderListScreen}
                options={{title: 'My Work Orders'}}
              />
              <Stack.Screen
                name="WorkOrderDetail"
                component={WorkOrderDetailScreen}
                options={{title: 'Work Order Details'}}
              />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{title: 'Add Photo'}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WorkOrderProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App; 