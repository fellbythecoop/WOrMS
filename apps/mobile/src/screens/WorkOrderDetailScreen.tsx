import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  TextInput,
  Dialog,
  Portal,
  List,
  Divider,
  FAB,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import {useWorkOrders} from '../providers/WorkOrderProvider';
import {useAuth} from '../providers/AuthProvider';
import {WorkOrderStatus, WorkOrderPriority, CreateCommentDto} from '../types';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../App';

type WorkOrderDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkOrderDetail'>;
type WorkOrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'WorkOrderDetail'>;

interface Props {
  navigation: WorkOrderDetailScreenNavigationProp;
  route: WorkOrderDetailScreenRouteProp;
}

const WorkOrderDetailScreen: React.FC<Props> = ({navigation, route}) => {
  const {workOrderId} = route.params;
  const {user} = useAuth();
  const {
    selectedWorkOrder,
    isLoading,
    error,
    fetchWorkOrderById,
    updateWorkOrderStatus,
    addComment,
    clearError,
  } = useWorkOrders();

  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [commentDialogVisible, setCommentDialogVisible] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  useEffect(() => {
    fetchWorkOrderById(workOrderId);
  }, [workOrderId]);

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

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  const handleStatusUpdate = async (newStatus: WorkOrderStatus) => {
    try {
      await updateWorkOrderStatus(workOrderId, {
        status: newStatus,
        completionNotes: newStatus === WorkOrderStatus.COMPLETED ? completionNotes : undefined,
      });
      setStatusDialogVisible(false);
      setCompletionNotes('');
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentData: CreateCommentDto = {
        content: newComment.trim(),
        isInternal: isInternalComment,
      };
      
      await addComment(workOrderId, commentData);
      setCommentDialogVisible(false);
      setNewComment('');
      setIsInternalComment(false);
    } catch (error) {
      console.error('Add comment failed:', error);
    }
  };

  const showStatusDialog = () => {
    setStatusDialogVisible(true);
  };

  const showCommentDialog = () => {
    setCommentDialogVisible(true);
  };

  const navigateToCamera = () => {
    navigation.navigate('Camera', {workOrderId});
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading work order...</Paragraph>
      </View>
    );
  }

  if (!selectedWorkOrder) {
    return (
      <View style={styles.errorContainer}>
        <Paragraph style={styles.errorText}>Work order not found</Paragraph>
      </View>
    );
  }

  const workOrder = selectedWorkOrder;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.title}>{workOrder.title}</Title>
              <Chip
                mode="outlined"
                textStyle={{color: getStatusColor(workOrder.status)}}
                style={[styles.statusChip, {borderColor: getStatusColor(workOrder.status)}]}>
                {workOrder.status.replace('_', ' ')}
              </Chip>
            </View>
            
            <View style={styles.metaRow}>
              <Paragraph style={styles.workOrderNumber}>#{workOrder.workOrderNumber}</Paragraph>
              <Chip
                mode="outlined"
                textStyle={{color: getPriorityColor(workOrder.priority)}}
                style={[styles.priorityChip, {borderColor: getPriorityColor(workOrder.priority)}]}>
                {workOrder.priority}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Description Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph>{workOrder.description}</Paragraph>
          </Card.Content>
        </Card>

        {/* Customer Information */}
        {workOrder.customerName && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Customer Information</Title>
              <Paragraph>Name: {workOrder.customerName}</Paragraph>
              {workOrder.customerAddress && (
                <Paragraph>Address: {workOrder.customerAddress}</Paragraph>
              )}
              {workOrder.customerPhone && (
                <Paragraph>Phone: {workOrder.customerPhone}</Paragraph>
              )}
              {workOrder.customerEmail && (
                <Paragraph>Email: {workOrder.customerEmail}</Paragraph>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Schedule & Estimates */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Schedule & Estimates</Title>
            {workOrder.scheduledStartDate && (
              <Paragraph>Scheduled Start: {formatDate(workOrder.scheduledStartDate)}</Paragraph>
            )}
            {workOrder.scheduledCompletionDate && (
              <Paragraph>Scheduled Completion: {formatDate(workOrder.scheduledCompletionDate)}</Paragraph>
            )}
            {workOrder.estimatedHours && (
              <Paragraph>Estimated Hours: {workOrder.estimatedHours}</Paragraph>
            )}
            {workOrder.estimatedCost && (
              <Paragraph>Estimated Cost: ${workOrder.estimatedCost}</Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* People */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>People</Title>
            <Paragraph>Requested By: {workOrder.requestedBy.name}</Paragraph>
            {workOrder.assignedTo && (
              <Paragraph>Assigned To: {workOrder.assignedTo.name}</Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Comments */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Comments ({workOrder.comments.length})</Title>
            {workOrder.comments.length === 0 ? (
              <Paragraph style={styles.noComments}>No comments yet</Paragraph>
            ) : (
              workOrder.comments.map((comment, index) => (
                <View key={comment.id}>
                  <List.Item
                    title={comment.author.name}
                    description={comment.content}
                    left={props => <List.Icon {...props} icon="comment" />}
                    right={() => (
                      <View style={styles.commentMeta}>
                        {comment.isInternal && (
                          <Chip mode="outlined" compact style={styles.internalChip}>
                            Internal
                          </Chip>
                        )}
                        <Paragraph style={styles.commentDate}>
                          {formatDateTime(comment.createdAt)}
                        </Paragraph>
                      </View>
                    )}
                  />
                  {index < workOrder.comments.length - 1 && <Divider />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Attachments */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Attachments ({workOrder.attachments.length})</Title>
            {workOrder.attachments.length === 0 ? (
              <Paragraph style={styles.noAttachments}>No attachments yet</Paragraph>
            ) : (
              workOrder.attachments.map(attachment => (
                <List.Item
                  key={attachment.id}
                  title={attachment.originalName}
                  description={`${(attachment.fileSize / 1024).toFixed(1)} KB`}
                  left={props => <List.Icon {...props} icon="attachment" />}
                />
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={showStatusDialog}
          style={styles.actionButton}
          icon="update">
          Update Status
        </Button>
        <Button
          mode="outlined"
          onPress={showCommentDialog}
          style={styles.actionButton}
          icon="comment-plus">
          Add Comment
        </Button>
      </View>

      {/* Camera FAB */}
      <FAB
        style={styles.fab}
        icon="camera"
        onPress={navigateToCamera}
      />

      {/* Status Update Dialog */}
      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={() => setStatusDialogVisible(false)}>
          <Dialog.Title>Update Status</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Current Status: {workOrder.status.replace('_', ' ')}</Paragraph>
            
            {Object.values(WorkOrderStatus).map(status => (
              <Button
                key={status}
                mode={status === workOrder.status ? 'contained' : 'outlined'}
                onPress={() => handleStatusUpdate(status)}
                style={styles.statusButton}
                disabled={status === workOrder.status}>
                {status.replace('_', ' ')}
              </Button>
            ))}

            {/* Completion Notes for COMPLETED status */}
            <TextInput
              label="Completion Notes (optional)"
              value={completionNotes}
              onChangeText={setCompletionNotes}
              multiline
              numberOfLines={3}
              style={styles.completionNotesInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Comment Dialog */}
      <Portal>
        <Dialog visible={commentDialogVisible} onDismiss={() => setCommentDialogVisible(false)}>
          <Dialog.Title>Add Comment</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Comment"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              style={styles.commentInput}
            />
            <Button
              mode={isInternalComment ? 'contained' : 'outlined'}
              onPress={() => setIsInternalComment(!isInternalComment)}
              style={styles.internalToggle}>
              {isInternalComment ? 'Internal Comment' : 'Public Comment'}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCommentDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddComment} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={4000}>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#F44336',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    marginRight: 8,
  },
  statusChip: {
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workOrderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  priorityChip: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  noComments: {
    fontStyle: 'italic',
    color: '#666',
  },
  noAttachments: {
    fontStyle: 'italic',
    color: '#666',
  },
  commentMeta: {
    alignItems: 'flex-end',
  },
  internalChip: {
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
  },
  statusButton: {
    marginVertical: 4,
  },
  completionNotesInput: {
    marginTop: 16,
  },
  commentInput: {
    marginBottom: 16,
  },
  internalToggle: {
    alignSelf: 'flex-start',
  },
});

export default WorkOrderDetailScreen; 