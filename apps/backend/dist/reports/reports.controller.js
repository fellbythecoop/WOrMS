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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const dev_auth_guard_1 = require("../auth/guards/dev-auth.guard");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async generateWorkOrderPdf(workOrderId, res) {
        const pdfBuffer = await this.reportsService.generateWorkOrderPdf(workOrderId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="work-order-${workOrderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    }
    async generateCompletionReport(workOrderId, data, res) {
        const pdfBuffer = await this.reportsService.generateCompletionReport(workOrderId, data.signature, data.completionNotes);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="completion-report-${workOrderId}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    }
    async generateMaintenanceScheduleReport(res) {
        const pdfBuffer = await this.reportsService.generateMaintenanceScheduleReport();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="maintenance-schedule.pdf"',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    }
    async generateDashboardSummaryReport(res) {
        const pdfBuffer = await this.reportsService.generateDashboardSummaryReport();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="dashboard-summary.pdf"',
            'Content-Length': pdfBuffer.length,
        });
        res.send(pdfBuffer);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('work-order/:id/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate work order PDF report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF generated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Work order not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateWorkOrderPdf", null);
__decorate([
    (0, common_1.Post)('work-order/:id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate completion report with signature' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Completion report generated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateCompletionReport", null);
__decorate([
    (0, common_1.Get)('assets/maintenance-schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate asset maintenance schedule report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Maintenance schedule report generated successfully' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateMaintenanceScheduleReport", null);
__decorate([
    (0, common_1.Get)('dashboard/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate dashboard summary report' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard summary report generated successfully' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateDashboardSummaryReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(dev_auth_guard_1.DevAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map