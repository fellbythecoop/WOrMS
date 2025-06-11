import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WorkOrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WorkOrdersGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinWorkOrderRoom')
  handleJoinRoom(
    @MessageBody() data: { workOrderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`workorder_${data.workOrderId}`);
    this.logger.log(`Client ${client.id} joined room: workorder_${data.workOrderId}`);
  }

  @SubscribeMessage('leaveWorkOrderRoom')
  handleLeaveRoom(
    @MessageBody() data: { workOrderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`workorder_${data.workOrderId}`);
    this.logger.log(`Client ${client.id} left room: workorder_${data.workOrderId}`);
  }

  // Emit work order status updates
  emitWorkOrderUpdate(workOrderId: string, data: any) {
    this.server.to(`workorder_${workOrderId}`).emit('workOrderUpdate', {
      workOrderId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit new comment notifications
  emitNewComment(workOrderId: string, comment: any) {
    this.server.to(`workorder_${workOrderId}`).emit('newComment', {
      workOrderId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit assignment notifications
  emitAssignmentChange(workOrderId: string, assignedTo: any, assignedBy: any) {
    this.server.to(`workorder_${workOrderId}`).emit('assignmentChange', {
      workOrderId,
      assignedTo,
      assignedBy,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast general notifications to all connected clients
  broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    this.server.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }
} 