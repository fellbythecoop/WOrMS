import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WorkOrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(data: {
        workOrderId: string;
    }, client: Socket): void;
    handleLeaveRoom(data: {
        workOrderId: string;
    }, client: Socket): void;
    handleJoinScheduleRoom(data: {
        technicianId?: string;
        date?: string;
    }, client: Socket): void;
    handleLeaveScheduleRoom(data: {
        technicianId?: string;
        date?: string;
    }, client: Socket): void;
    emitWorkOrderUpdate(workOrderId: string, data: any): void;
    emitNewComment(workOrderId: string, comment: any): void;
    emitAssignmentChange(workOrderId: string, assignedTo: any, assignedBy: any): void;
    broadcastNotification(notification: {
        type: string;
        title: string;
        message: string;
        data?: any;
    }): void;
    emitScheduleUpdate(technicianId: string, date: string, scheduleData: any): void;
    emitWorkOrderReassignment(data: {
        workOrderId: string;
        workOrderNumber: string;
        fromTechnicianId: string;
        toTechnicianId: string;
        fromDate: string;
        toDate: string;
        estimatedHours: number;
    }): void;
    emitScheduleConflict(technicianId: string, date: string, conflictData: any): void;
}
