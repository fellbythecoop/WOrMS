import React, {useEffect, useState} from 'react';
import {View, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  FAB,
  Searchbar,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import {useWorkOrders} from '../providers/WorkOrderProvider';
import {useAuth} from '../providers/AuthProvider';
import {WorkOrder, WorkOrderStatus, WorkOrderPriority} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App';

type WorkOrderListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkOrderList'>;

interface Props {
  navigation: WorkOrderListScreenNavigationProp;
}

const WorkOrderListScreen: React.FC<Props> = ({navigation}) => {
  const {user, logout} = useAuth();
  const {
    workOrders,
    isLoading,
    error,
    fetchMyWorkOrders,
    clearError,
  } = useWorkOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyWorkOrders();
  }, []);

  useEffect(() => {
    // Filter work orders based on search query
    const filtered = workOrders.filter(
      wo =>
        wo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredWorkOrders(filtered);
  }, [workOrders, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyWorkOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: WorkOrderStatus): string => {
    switch (status) {
      case WorkOrderStatus.PENDING:
        return '#FF9800';
      case WorkOrderStatus.ASSIGNED:
        return '#2196F3';
      case WorkOrderStatus.IN_PROGRESS:
        return '#4CAF50';
      case WorkOrderStatus.ON_HOLD:
        return '#F44336';
      case WorkOrderStatus.COMPLETED:
        return '#8BC34A';
      case WorkOrderStatus.CANCELLED:
        return '#9E9E9E';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: WorkOrderPriority): string => {
    switch (priority) {
      case WorkOrderPriority.LOW:
        return '#4CAF50';
      case WorkOrderPriority.MEDIUM:
        return '#FF9800';
      case WorkOrderPriority.HIGH:
        return '#F44336';
      case WorkOrderPriority.CRITICAL:
        return '#D32F2F';
      default:
        return '#757575';
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  const renderWorkOrderItem = ({item}: {item: WorkOrder}) => (
    <Card
      style={styles.workOrderCard}
      onPress={() => navigation.navigate('WorkOrderDetail', {workOrderId: item.id})}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.workOrderTitle}>{item.title}</Title>
          <Chip
            mode="outlined"
            textStyle={{color: getStatusColor(item.status)}}
            style={[styles.statusChip, {borderColor: getStatusColor(item.status)}]}>
            {item.status.replace('_', ' ')}
          </Chip>
        </View>

        <View style={styles.cardMeta}>
          <Paragraph style={styles.workOrderNumber}>#{item.workOrderNumber}</Paragraph>
          <Chip
            mode="outlined"
            textStyle={{color: getPriorityColor(item.priority)}}
            style={[styles.priorityChip, {borderColor: getPriorityColor(item.priority)}]}>
            {item.priority}
          </Chip>
        </View>

        <Paragraph style={styles.description} numberOfLines={2}>
          {item.description}
        </Paragraph>

        {item.customerName && (
          <Paragraph style={styles.customer}>Customer: {item.customerName}</Paragraph>
        )}

        <View style={styles.cardFooter}>
          <Paragraph style={styles.dateText}>
            Created: {formatDate(item.createdAt)}
          </Paragraph>
          {item.scheduledCompletionDate && (
            <Paragraph style={styles.dateText}>
              Due: {formatDate(item.scheduledCompletionDate)}
            </Paragraph>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && workOrders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading work orders...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search work orders..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredWorkOrders}
        renderItem={renderWorkOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Paragraph style={styles.emptyText}>
              {searchQuery ? 'No work orders match your search.' : 'No work orders assigned to you.'}
            </Paragraph>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="account-circle"
        onPress={() => {
          // TODO: Show user menu or profile
          console.log('User:', user?.name);
        }}
      />

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}
        action={{
          label: 'Retry',
          onPress: fetchMyWorkOrders,
        }}>
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  workOrderCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workOrderTitle: {
    flex: 1,
    fontSize: 18,
    marginRight: 8,
  },
  statusChip: {
    borderWidth: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  priorityChip: {
    borderWidth: 1,
  },
  description: {
    marginBottom: 8,
    color: '#666',
  },
  customer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default WorkOrderListScreen; 