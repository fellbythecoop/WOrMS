import React, {useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {Button, Card, Title, Paragraph, ActivityIndicator} from 'react-native-paper';
import {useAuth} from '../providers/AuthProvider';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {isAuthenticated, login, isLoading} = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('WorkOrderList');
    }
  }, [isAuthenticated, navigation]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      // TODO: Show error message to user
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Initializing...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Title style={styles.title}>WOMS Mobile</Title>
        <Paragraph style={styles.subtitle}>Work Order Management System</Paragraph>
      </View>

      <Card style={styles.loginCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Welcome</Title>
          <Paragraph style={styles.cardDescription}>
            Sign in with your Microsoft account to access your work orders.
          </Paragraph>
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
            icon="microsoft">
            Sign in with Microsoft
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Paragraph style={styles.footerText}>
          For technicians and maintenance staff
        </Paragraph>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loginCard: {
    elevation: 4,
    marginBottom: 40,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  cardDescription: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  loginButton: {
    paddingVertical: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen; 