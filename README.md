# Work Order Management System (WOMS)

A comprehensive, on-premise work order management system built with modern technologies for efficient tracking and execution of maintenance tasks.

## 🏗️ Architecture Overview

### Tech Stack

**Backend:**
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with TypeORM
- **Cache:** Redis
- **Authentication:** Microsoft Entra ID (Azure AD) with MSAL
- **Real-time:** WebSockets (Socket.IO)
- **PDF Generation:** pdf-lib
- **Logging:** Winston

**Frontend:**
- **Framework:** Next.js 14 with React 18
- **UI Library:** Material-UI (MUI)
- **State Management:** React Query + Zustand
- **Authentication:** MSAL.js for React
- **Real-time:** Socket.IO Client

**DevOps & Deployment:**
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes
- **Reverse Proxy:** Nginx

## 📁 Project Structure

```
work-order-management-system/
├── apps/
│   ├── backend/                 # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── users/          # User management
│   │   │   ├── work-orders/    # Work order management
│   │   │   ├── assets/         # Asset management
│   │   │   ├── reports/        # PDF report generation
│   │   │   ├── websocket/      # Real-time updates
│   │   │   └── config/         # Configuration files
│   │   └── Dockerfile
│   ├── frontend/               # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities and configs
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── types/         # TypeScript definitions
│   │   └── Dockerfile
│   └── mobile/                 # React Native app (future)
├── k8s/                        # Kubernetes manifests
├── docker-compose.yml          # Docker Compose configuration
├── env.example                 # Environment variables template
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd work-order-management-system
cp env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configuration:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=woms

# Azure AD (Microsoft Entra ID)
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
```

### 3. Development Setup

#### Option A: Docker Compose (Recommended)

```bash
# Install dependencies
npm install

# Start all services
npm run docker:up

# View logs
docker-compose logs -f
```

#### Option B: Local Development

```bash
# Install dependencies
npm install

# Start database and Redis
docker-compose up postgres redis -d

# Start backend
npm run dev:backend

# Start frontend (in another terminal)
npm run dev:frontend
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs

## 🔧 Configuration

### Microsoft Entra ID Setup

1. Register a new application in Azure Portal
2. Configure redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
3. Add API permissions:
   - Microsoft Graph: `User.Read`
   - Your API: `access_as_user`
4. Create client secret
5. Update environment variables

### Database Setup

The application uses PostgreSQL with TypeORM. Database schema is automatically created through migrations.

```bash
# Generate migration
cd apps/backend
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🏢 Production Deployment

### Docker Compose Deployment

```bash
# Build and start production containers
docker-compose -f docker-compose.yml up -d

# Scale services
docker-compose up -d --scale backend=3
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n woms

# View logs
kubectl logs -f deployment/woms-backend -n woms
```

### Environment-Specific Configurations

Create environment-specific files:
- `.env.development`
- `.env.staging`
- `.env.production`

## 🔐 Security Features

- **Authentication:** Microsoft Entra ID integration
- **Authorization:** Role-based access control (RBAC)
- **Data Protection:** Input validation and sanitization
- **API Security:** JWT tokens, CORS configuration
- **Database Security:** Parameterized queries, connection encryption

## 📊 Features

### Core Functionality

- **Work Order Management:** Create, assign, track, and complete work orders
- **Asset Management:** Maintain asset inventory with maintenance schedules
- **User Management:** Role-based user access and permissions
- **Real-time Updates:** Live notifications and status updates
- **PDF Reports:** Generate and sign completion reports
- **Dashboard Analytics:** Visual insights and metrics

### User Roles

- **Requester:** Submit work order requests
- **Technician:** Execute assigned work orders
- **Manager:** Oversee operations and approve requests
- **Administrator:** System configuration and user management

## 🧪 Testing

```bash
# Run backend tests
cd apps/backend
npm test

# Run frontend tests
cd apps/frontend
npm test

# Run e2e tests
npm run test:e2e
```

## 📈 Monitoring and Logging

- **Application Logs:** Winston logger with structured logging
- **Database Monitoring:** Connection pooling and query performance
- **Real-time Metrics:** WebSocket connection monitoring
- **Health Checks:** Built-in health endpoints for containers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 API Documentation

The API documentation is automatically generated using Swagger/OpenAPI and available at:
- Development: http://localhost:3001/api/docs
- Production: https://your-domain.com/api/docs

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **Authentication Issues**
   - Verify Azure AD configuration
   - Check redirect URIs
   - Validate client ID and tenant ID

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Logs Location

- **Backend Logs:** `apps/backend/logs/`
- **Docker Logs:** `docker-compose logs [service-name]`
- **Kubernetes Logs:** `kubectl logs [pod-name] -n woms`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for efficient work order management** 