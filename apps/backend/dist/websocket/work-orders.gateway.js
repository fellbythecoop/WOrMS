"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let WorkOrdersGateway = class WorkOrdersGateway {
    constructor() {
        this.logger = new common_1.Logger('WorkOrdersGateway');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinRoom(data, client) {
        client.join(`workorder_${data.workOrderId}`);
        this.logger.log(`Client ${client.id} joined room: workorder_${data.workOrderId}`);
    }
    handleLeaveRoom(data, client) {
        client.leave(`workorder_${data.workOrderId}`);
        this.logger.log(`Client ${client.id} left room: workorder_${data.workOrderId}`);
    }
    emitWorkOrderUpdate(workOrderId, data) {
        this.server.to(`workorder_${workOrderId}`).emit('workOrderUpdate', {
            workOrderId,
            data,
            timestamp: new Date().toISOString(),
        });
    }
    emitNewComment(workOrderId, comment) {
        this.server.to(`workorder_${workOrderId}`).emit('newComment', {
            workOrderId,
            comment,
            timestamp: new Date().toISOString(),
        });
    }
    emitAssignmentChange(workOrderId, assignedTo, assignedBy) {
        this.server.to(`workorder_${workOrderId}`).emit('assignmentChange', {
            workOrderId,
            assignedTo,
            assignedBy,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastNotification(notification) {
        this.server.emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.WorkOrdersGateway = WorkOrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WorkOrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinWorkOrderRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WorkOrdersGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveWorkOrderRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WorkOrdersGateway.prototype, "handleLeaveRoom", null);
exports.WorkOrdersGateway = WorkOrdersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    })
], WorkOrdersGateway);
//# sourceMappingURL=work-orders.gateway.js.map