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

  @SubscribeMessage('joinScheduleRoom')
  handleJoinScheduleRoom(
    @MessageBody() data: { technicianId?: string; date?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Join rooms for schedule updates
    if (data.technicianId) {
      client.join(`schedule_technician_${data.technicianId}`);
      this.logger.log(`Client ${client.id} joined room: schedule_technician_${data.technicianId}`);
    }
    if (data.date) {
      client.join(`schedule_date_${data.date}`);
      this.logger.log(`Client ${client.id} joined room: schedule_date_${data.date}`);
    }
    // General schedule room for all schedule updates
    client.join('schedules');
    this.logger.log(`Client ${client.id} joined room: schedules`);
  }

  @SubscribeMessage('leaveScheduleRoom')
  handleLeaveScheduleRoom(
    @MessageBody() data: { technicianId?: string; date?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.technicianId) {
      client.leave(`schedule_technician_${data.technicianId}`);
      this.logger.log(`Client ${client.id} left room: schedule_technician_${data.technicianId}`);
    }
    if (data.date) {
      client.leave(`schedule_date_${data.date}`);
      this.logger.log(`Client ${client.id} left room: schedule_date_${data.date}`);
    }
    client.leave('schedules');
    this.logger.log(`Client ${client.id} left room: schedules`);
  }

  // Emit work order status updates
  emitWorkOrderUpdate(workOrderId: string, data: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for workOrderUpdate event');
      return;
    }
    
    this.server.to(`workorder_${workOrderId}`).emit('workOrderUpdate', {
      workOrderId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit new comment notifications
  emitNewComment(workOrderId: string, comment: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for newComment event');
      return;
    }
    
    this.server.to(`workorder_${workOrderId}`).emit('newComment', {
      workOrderId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit assignment notifications
  emitAssignmentChange(workOrderId: string, assignedTo: any, assignedBy: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for assignmentChange event');
      return;
    }
    
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
    if (!this.server) {
      this.logger.warn('WebSocket server not available for notification broadcast');
      return;
    }
    
    this.server.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  // Schedule-related emissions
  emitScheduleUpdate(technicianId: string, date: string, scheduleData: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for scheduleUpdate event');
      return;
    }
    
    // Emit to technician-specific room
    this.server.to(`schedule_technician_${technicianId}`).emit('scheduleUpdate', {
      technicianId,
      date,
      scheduleData,
      timestamp: new Date().toISOString(),
    });

    // Emit to date-specific room
    this.server.to(`schedule_date_${date}`).emit('scheduleUpdate', {
      technicianId,
      date,
      scheduleData,
      timestamp: new Date().toISOString(),
    });

    // Emit to general schedules room
    this.server.to('schedules').emit('scheduleUpdate', {
      technicianId,
      date,
      scheduleData,
      timestamp: new Date().toISOString(),
    });
  }

  emitWorkOrderReassignment(data: {
    workOrderId: string;
    workOrderNumber: string;
    fromTechnicianId: string;
    toTechnicianId: string;
    fromDate: string;
    toDate: string;
    estimatedHours: number;
  }) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for workOrderReassignment event');
      return;
    }
    
    // Emit to both technicians' schedule rooms
    this.server.to(`schedule_technician_${data.fromTechnicianId}`).emit('workOrderReassignment', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    this.server.to(`schedule_technician_${data.toTechnicianId}`).emit('workOrderReassignment', {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Emit to general schedules room
    this.server.to('schedules').emit('workOrderReassignment', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitScheduleConflict(technicianId: string, date: string, conflictData: any) {
    if (!this.server) {
      this.logger.warn('WebSocket server not available for scheduleConflict event');
      return;
    }
    
    this.server.to(`schedule_technician_${technicianId}`).emit('scheduleConflict', {
      technicianId,
      date,
      conflictData,
      timestamp: new Date().toISOString(),
    });

    this.server.to('schedules').emit('scheduleConflict', {
      technicianId,
      date,
      conflictData,
      timestamp: new Date().toISOString(),
    });
  }
} 