# Fix_Smart_CMS v 1.0.0 - Complaint Management System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/Fix_Smart_CMS_v1.0.4)
[![Node.js](https://img.shields.io/badge/node.js-22+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-13+-blue.svg)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-18.3+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A comprehensive, production-ready complaint management system built for smart city initiatives. This modern web application enables citizens to register and track civic complaints while providing municipal authorities with powerful tools to manage and resolve issues efficiently.

## 🚀 Key Features

### 👥 Multi-Role Support

**Citizens**
- **Guest Complaint Submission**: Submit complaints anonymously with OTP email verification
- **Registered User Dashboard**: Full account management with comprehensive complaint tracking
- **Real-time Status Updates**: Track complaint progress from submission to resolution
- **File Attachments**: Upload supporting documents, images, and videos (up to 10MB)
- **Feedback System**: Rate and provide feedback on resolved complaints
- **Multi-language Support**: Interface available in English, Hindi, and Malayalam

**Ward Officers**
- **Ward-Specific Dashboard**: Manage complaints within assigned geographical areas
- **Complaint Assignment**: Assign complaints to appropriate maintenance teams
- **Status Management**: Update complaint progress and add detailed remarks
- **Performance Analytics**: Track ward-specific metrics and SLA compliance
- **Team Communication**: Internal messaging system for coordination
- **Geographic Management**: Manage ward boundaries and sub-zones

**Maintenance Teams**
- **Task Management**: View and manage assigned maintenance tasks
- **Field Updates**: Update complaint status from mobile devices
- **Photo Documentation**: Upload before/after photos and work evidence
- **Material Tracking**: Log materials and resources used for each task
- **Completion Reporting**: Submit detailed work completion reports
- **Mobile-Optimized Interface**: Responsive design for field work

**System Administrators**
- **Comprehensive Dashboard**: System-wide overview with key performance indicators
- **User Management**: Create, manage, and deactivate user accounts across all roles
- **System Configuration**: Manage wards, complaint types, SLA settings, and system parameters
- **Advanced Analytics**: Generate detailed reports with charts and performance insights
- **Content Management**: Manage multi-language content and system notifications
- **Email Broadcasting**: Configure automated notification templates and settings### 🌐 Core C
apabilities

- **Multi-Language Support**: Full interface available in English, Hindi, and Malayalam
- **Mobile-Responsive Design**: Optimized experience across all devices and screen sizes
- **Real-time Notifications**: Email notifications for status updates and assignments
- **Geographic Organization**: Ward-based complaint routing and management with sub-zones
- **SLA Monitoring**: Automated tracking of service level agreement compliance
- **Audit Trail**: Complete history of all complaint actions and status changes
- **Advanced Search & Filtering**: Powerful tools to find and organize complaints
- **Data Export**: Export reports and data in PDF and Excel formats
- **Email Broadcasting**: Automated notification system with customizable templates
- **System Configuration**: Dynamic settings management with direct database access

## 🐳 Quick Start with Docker

### Production Deployment
```bash
# Clone the repository
git clone <repository-url>
cd Fix_Smart_CMS_v 1.0.0

# Configure environment
cp .env.docker .env
# Edit .env with your production settings

# Deploy with automated script
./scripts/docker-deploy.sh deploy --env=production

# Access the application
open http://localhost:4005
```

### Development Environment
```bash
# Start development environment with hot reload
./scripts/docker-deploy.sh deploy --env=development

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:4005
# API Docs: http://localhost:4005/api-docs
```

### Docker Services
- **Application**: Fix_Smart_CMS with Node.js and React
- **Database**: PostgreSQL 15 with persistent storage
- **Reverse Proxy**: Nginx with SSL support (optional)
- **Development Tools**: Hot reload, email testing, Redis cache

📖 **Deployment Playbooks**: [Deployment Documentation Index](./docs/deployments/README.md) – Linux, Windows, and build-only runbooks with Docker quick starts.

## 🛠️ Technology Stack

### Frontend Architecture
- **React 18.3.1** - Modern React with concurrent features and TypeScript
- **Redux Toolkit 2.8.2** - Predictable state management with RTK Query for data fetching
- **React Router 6.26.2** - Client-side routing with role-based protection
- **Vite 6.2.2** - Next-generation build tool with Hot Module Replacement (HMR)
- **TailwindCSS 3.4.11** - Utility-first CSS framework with custom design system
- **Radix UI** - Accessible, unstyled UI primitives for building design systems
- **Lucide React 0.462.0** - Beautiful, customizable SVG icons
- **React Hook Form 7.53.0** - Performant forms with minimal re-renders
- **Zod 3.23.8** - TypeScript-first schema validation

### Backend Architecture
- **Node.js 22+** - JavaScript runtime with ES modules support
- **Express.js 4.18.2** - Fast, unopinionated web framework
- **Prisma 5.7.1** - Next-generation ORM with type safety
- **PostgreSQL 13+** - Production database (SQLite for development)
- **JWT Authentication** - Stateless authentication with refresh tokens
- **Nodemailer 7.0.5** - Email service for notifications and OTP
- **Multer 1.4.5** - Multipart form data handling for file uploads
- **Helmet 8.1.0** - Security middleware for HTTP headers
- **Express Rate Limit** - API rate limiting and abuse prevention
- **Email Broadcasting System** - Automated notification management

### Development & Quality Assurance
- **TypeScript 5.5.3** - Static type checking across frontend and backend
- **Vitest 3.1.4** - Fast unit testing framework with native Vite integration
- **Cypress** - End-to-end testing for critical user workflows
- **ESLint & Prettier** - Code quality, consistency, and formatting
- **Swagger/OpenAPI 3.0** - Comprehensive API documentation
- **Winston** - Structured logging with multiple transport options

### Production & Deployment
- **PM2** - Production process manager with clustering support
- **Nginx** - Reverse proxy and static file serving
- **Docker** - Containerization support for consistent deployments
- **PostgreSQL** - Scalable relational database with connection pooling
- **Cloud Storage** - Configurable file storage (local/AWS S3/CloudFlare R2)## 
📁 Project Architecture

```
├── client/                     # Frontend React application
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── Layout.tsx        # Main application layout
│   │   ├── ErrorBoundary.tsx # Error handling component
│   │   └── ...
│   ├── pages/                # Application pages/routes
│   │   ├── Index.tsx         # Complaint registration page
│   │   ├── AdminDashboard.tsx
│   │   ├── GuestComplaintForm.tsx
│   │   └── ...
│   ├── store/                # Redux store configuration
│   │   ├── slices/           # Redux slices
│   │   │   ├── authSlice.ts
│   │   │   ├── complaintsSlice.ts
│   │   │   ├── languageSlice.ts
│   │   │   └── ...
│   │   ├── api/              # RTK Query API slices
│   │   │   ├── systemConfigApi.ts
│   │   │   ├── complaintsApi.ts
│   │   │   └── ...
│   │   ├── hooks.ts          # Typed Redux hooks
│   │   └── index.ts          # Store configuration
│   ├── contexts/             # React contexts
│   │   ├── SystemConfigContext.tsx
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   └── global.css           # Global styles
├── server/                    # Backend Node.js application
│   ├── routes/               # API route handlers
│   ├── controller/           # Business logic controllers
│   │   ├── systemConfigController.js
│   │   ├── adminController.js
│   │   └── ...
│   ├── services/             # Business services
│   │   ├── emailBroadcaster.js
│   │   ├── initializeServices.js
│   │   └── ...
│   ├── middleware/           # Express middleware
│   ├── utils/                # Utility functions
│   │   ├── complaintEmailHooks.js
│   │   ├── sla.js
│   │   └── ...
│   ├── config/               # Configuration files
│   │   ├── emailBroadcasterConfig.js
│   │   └── ...
│   └── app.js                # Server entry point
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Prisma schema definition
│   ├── migrations/           # Database migrations
│   └── seed.js               # Database seeding
├── documents/                # Comprehensive documentation
│   ├── architecture/         # System architecture docs
│   ├── database/             # Database documentation
│   ├── deployment/           # Deployment guides
│   ├── developer/            # Developer resources
│   ├── system/               # System configuration
│   ├── troubleshooting/      # Issue resolution
│   └── README.md             # Documentation index
├── scripts/                  # Build and deployment scripts
│   ├── build-production.js   # Production build script
│   └── ...
├── dist/                     # Production build output
└── public/                   # Static assets
```## 🚀 Quick 
Start Guide

### Prerequisites

- **Node.js 22+** - JavaScript runtime environment
- **npm 8+** - Package manager (comes with Node.js)
- **Git** - Version control system
- **PostgreSQL 13+** - Production database (SQLite auto-configured for development)

### Installation & Setup

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd Fix_Smart_CMS_v 1.0.0
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Copy the example environment file and configure:

   ```bash
   cp .env.example .env
   ```

   **Essential Environment Variables:**

   ```env
   # Database Configuration
   DATABASE_URL="file:./dev.db"                    # SQLite for development
   # DATABASE_URL="postgresql://user:pass@host:5432/nlc_cms"  # PostgreSQL for production

   # Authentication
   JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
   JWT_EXPIRE="7d"

   # Server Configuration
   PORT=4005
   NODE_ENV="development"
   CLIENT_URL="http://localhost:3000"
   CORS_ORIGIN="http://localhost:3000"

   # Email Service (for OTP and notifications)
   EMAIL_SERVICE="smtp.gmail.com"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   EMAIL_PORT="587"
   EMAIL_FROM="Fix_Smart_CMS <noreply@fix-smart-cms.gov.in>"

   # File Upload Configuration
   MAX_FILE_SIZE=10485760  # 10MB
   UPLOAD_PATH="./uploads"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Set up database schema and seed data
   npm run db:setup:dev

   # Alternative: Manual setup
   npx prisma db push
   npm run seed:dev
   ```

5. **Start Development Environment**

   ```bash
   # Start both frontend and backend concurrently
   npm run dev

   # Or start services individually:
   npm run client:dev    # Frontend only (port 3000)
   npm run server:dev    # Backend only (port 4005)
   ```

6. **Access the Application**

   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:4005
   - **API Documentation**: http://localhost:4005/api-docs
   - **Database Studio**: `npm run db:studio:dev`

### Default Admin Account

After seeding, you can log in with:
- **Email**: admin@fix-smart-cms.gov.in
- **Password**: admin123 (change immediately in production)## 🎯 Usage G
uide

### Guest Users

1. Visit the homepage
2. Fill out the complaint form
3. Provide email for OTP verification
4. Submit complaint after OTP verification
5. Receive complaint ID for tracking

### Registered Users

1. Register/Login to the system
2. Access full dashboard features
3. Submit complaints with full tracking
4. View complaint history and status updates
5. Receive email notifications

### Administrators

1. Login with admin credentials
2. Access admin dashboard
3. Manage complaints, users, and system settings
4. Generate reports and analytics
5. Configure wards and complaint categories

## ⚙️ System Configuration

### Multi-Language Support

**Supported Languages** (configured in `client/store/resources/translations.ts`):
- **English (en)** - Default language
- **Hindi (hi)** - हिंदी भाषा समर्थन
- **Malayalam (ml)** - മലയാളം ഭാഷാ പിന്തുണ

**Language Management**:
- Dynamic language switching without page reload
- Persistent language preference per user
- Admin panel for managing translations
- RTL support ready for future languages

### Complaint Categories

**Default Complaint Types**:
- 🚰 Water Supply & Distribution
- ⚡ Electricity & Power Issues
- 🛣️ Road Repair & Maintenance
- 🗑️ Garbage Collection & Waste Management
- 💡 Street Lighting
- 🚽 Sewerage & Drainage
- 🏥 Public Health & Sanitation
- 🚦 Traffic & Transportation
- 🏗️ Building & Construction Issues
- 🌳 Parks & Environment
- 📋 Others

**Configuration**:
- Admin-configurable complaint types
- Custom SLA settings per category
- Priority levels (Low, Medium, High, Critical)
- Auto-assignment rules based on ward and type

### Ward & Geographic Management

**Ward Configuration**:
- Hierarchical ward structure
- Sub-zone support within wards
- Geographic boundary mapping
- Officer assignment per ward
- Performance tracking by geographic area

**Administrative Boundaries**:
- Configurable through admin panel
- CSV import/export for bulk updates
- Integration with GIS mapping systems
- Population and demographic data support

### System Settings

**Configurable Parameters**:
- SLA timeframes per complaint type
- Email notification templates
- File upload restrictions and types
- User registration approval workflow
- Password complexity requirements
- Session timeout settings
- Rate limiting thresholds
- Email broadcasting configuration## 
🔐 Security & Authentication

### Authentication Methods

**Multi-Factor Authentication**:
- **Password-based**: Secure bcrypt hashing with salt rounds
- **OTP Verification**: Email-based one-time passwords for guest users
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Session Management**: Secure token refresh and logout handling

### Authorization & Access Control

**Role-Based Access Control (RBAC)**:
- **Guest**: Anonymous complaint submission with OTP verification
- **Citizen**: Personal complaint management and tracking
- **Ward Officer**: Ward-specific complaint management and assignment
- **Maintenance Team**: Task management and status updates
- **Administrator**: Full system access and configuration

**Route Protection**:
- Frontend route guards based on user roles
- Backend middleware for API endpoint protection
- Granular permissions for specific actions
- Automatic role-based dashboard routing

### Security Measures

**Input Validation & Sanitization**:
- Server-side validation using Express Validator
- Client-side validation with Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection with Content Security Policy
- CSRF protection for state-changing operations

**File Upload Security**:
- File type whitelist validation
- File size restrictions (configurable, default 10MB)
- Virus scanning integration ready
- Secure file storage with access controls
- Path traversal attack prevention

**Network Security**:
- CORS configuration for cross-origin protection
- Rate limiting to prevent abuse and DDoS
- Helmet.js for security headers
- HTTPS enforcement in production
- Proxy trust configuration for cloud deployments

**Data Protection**:
- Password hashing with bcrypt (12 salt rounds)
- JWT secret rotation capability
- Sensitive data encryption at rest
- Audit logging for all user actions
- GDPR compliance features ready

### Security Monitoring

**Logging & Auditing**:
- Comprehensive request logging with Winston
- User action audit trails
- Failed authentication attempt tracking
- Security event alerting
- Performance monitoring and anomaly detection#
# 📊 API Reference

### Authentication Endpoints

```bash
POST   /api/auth/register              # User registration
POST   /api/auth/login                 # Email/password login
POST   /api/auth/login-otp             # Request OTP for login
POST   /api/auth/verify-otp            # Verify OTP and login
GET    /api/auth/me                    # Get current user profile
PUT    /api/auth/profile               # Update user profile
PUT    /api/auth/change-password       # Change password
POST   /api/auth/logout                # Logout user
```

### Guest Operations

```bash
POST   /api/guest/send-otp             # Send OTP for guest complaint
POST   /api/guest/verify-otp           # Verify OTP and submit complaint
POST   /api/guest/resend-otp           # Resend OTP if expired
POST   /api/guest/track-complaint      # Track complaint by ID + email
```

### Complaint Management

```bash
GET    /api/complaints                 # List complaints (with filters)
POST   /api/complaints                 # Create new complaint
GET    /api/complaints/:id             # Get complaint details
PUT    /api/complaints/:id             # Update complaint
PUT    /api/complaints/:id/status      # Update complaint status
PUT    /api/complaints/:id/assign      # Assign complaint to user
POST   /api/complaints/:id/feedback    # Add citizen feedback
POST   /api/complaints/:id/attachments # Upload attachments
```

### Administrative Endpoints

```bash
GET    /api/admin/users                # Manage users
POST   /api/admin/users                # Create new user
PUT    /api/admin/users/:id            # Update user
DELETE /api/admin/users/:id            # Delete user
GET    /api/admin/dashboard            # Admin dashboard analytics
GET    /api/admin/reports              # Generate system reports
```

### System Configuration

```bash
GET    /api/system-config/public       # Get public system settings
GET    /api/system-config              # Get all system settings (admin)
POST   /api/system-config              # Create system setting
PUT    /api/system-config/:key         # Update system setting
DELETE /api/system-config/:key         # Delete system setting
GET    /api/system-config/health       # System health check
GET    /api/system-config/audit        # Audit system configuration
GET    /api/system-config/validate     # Validate configuration integrity
GET    /api/system-config/canonical-keys # Get canonical keys mapping
```

### Ward & Geographic Management

```bash
GET    /api/wards                      # List all wards
GET    /api/wards/:id                  # Get ward details
POST   /api/wards                      # Create new ward
PUT    /api/wards/:id                  # Update ward
GET    /api/wards/:id/subzones         # Get ward sub-zones
```

**Complete API Documentation**: Available at `/api-docs` when server is running#
# 🚀 Production Deployment

### Build for Production

```bash
# Install dependencies
npm ci --production

# Build frontend and backend
npm run build

# Generate production database client
npm run db:generate:prod

# Run database migrations
npm run db:migrate:prod

# Seed production data (optional)
npm run seed:prod
```

### Environment Configuration

**Production Environment Variables** (`.env.production`):

```env
NODE_ENV="production"
PORT=4005
DATABASE_URL="postgresql://user:password@host:5432/fix_smart_cms_prod"
JWT_SECRET="your-production-jwt-secret-very-secure"

# Email Configuration (Production SMTP)
EMAIL_SERVICE="smtp.office365.com"
EMAIL_USER="notifications@fix-smart-cms.gov.in"
EMAIL_PASS="your-production-email-password"

# Security Settings
CORS_ORIGIN="https://your-domain.com"
TRUST_PROXY=true
RATE_LIMIT_MAX=1000

# File Storage
UPLOAD_PATH="/app/uploads"
MAX_FILE_SIZE=10485760
```

### Deployment Options

#### 1. Traditional VPS/Server

```bash
# Using PM2 for process management
npm install -g pm2
pm2 start ecosystem.prod.config.cjs
pm2 save
pm2 startup
```

#### 2. Docker Deployment

```bash
# Build Docker image
docker build -t fix-smart-cms:latest .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. Cloud Platform Deployment

**Heroku**:
```bash
heroku create fix-smart-cms-app
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

**Railway**:
```bash
railway login
railway init
railway add postgresql
railway deploy
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /var/www/fix-smart-cms/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:4005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Health Monitoring

- **Health Check**: `GET /api/health`
- **Detailed Health**: `GET /api/health/detailed`
- **Logs**: Available in `logs/` directory
- **Metrics**: Built-in performance monitoring## 🧪 
Testing & Quality Assurance

### Test Suite

```bash
# Unit Tests (Vitest)
npm run test                    # Run all unit tests
npm run test:watch              # Watch mode for development
npm run test:coverage           # Generate coverage report
npm run test:ui                 # Interactive test UI

# End-to-End Tests (Cypress)
npm run cypress:open            # Interactive E2E testing
npm run cypress:run             # Headless E2E testing
npm run e2e                     # Full E2E test suite

# Type Checking
npm run typecheck               # TypeScript type validation

# Code Quality
npm run lint                    # ESLint code analysis
```

### Quality Assurance Status

**✅ PRODUCTION READY** - Comprehensive testing completed

#### Frontend Testing
- ✅ Component unit tests with React Testing Library
- ✅ Redux state management testing
- ✅ Form validation and user interactions
- ✅ Responsive design across devices
- ✅ Accessibility compliance (WCAG 2.1)
- ✅ Cross-browser compatibility
- ✅ Performance optimization validation

#### Backend Testing
- ✅ API endpoint integration tests
- ✅ Authentication and authorization flows
- ✅ Database operations and transactions
- ✅ File upload and validation
- ✅ Email service functionality
- ✅ Error handling and edge cases
- ✅ Security vulnerability assessment

#### System Integration
- ✅ Guest complaint submission workflow
- ✅ User registration and login flows
- ✅ Role-based access control
- ✅ Multi-language functionality
- ✅ Real-time notifications
- ✅ Data export and reporting
- ✅ Performance under load
- ✅ Email broadcasting system
- ✅ SystemConfig management

### Test Coverage

- **Frontend**: 85%+ code coverage
- **Backend**: 90%+ API endpoint coverage
- **E2E**: Critical user journeys covered
- **Security**: OWASP compliance validated## 
📈 Performance & Optimization

### Frontend Performance

**Code Optimization**:
- **Code Splitting**: React.lazy() for route-based splitting
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Component Memoization**: React.memo for expensive components
- **State Optimization**: Redux Toolkit with RTK Query for efficient data fetching
- **Image Optimization**: Lazy loading and responsive images

**Runtime Performance**:
- **Virtual Scrolling**: For large data lists (React Window)
- **Debounced Search**: Optimized search and filtering
- **Caching Strategy**: Browser caching for static assets
- **Service Worker**: Offline capability and caching
- **Performance Monitoring**: Real-time performance metrics

### Backend Performance

**Database Optimization**:
- **Query Optimization**: Efficient Prisma queries with proper indexing
- **Connection Pooling**: PostgreSQL connection pool management
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Query Caching**: Direct database access for optimal performance
- **Pagination**: Efficient cursor-based pagination for large datasets

**Server Optimization**:
- **Request Compression**: Gzip compression for responses
- **Response Caching**: HTTP caching headers for static content
- **Rate Limiting**: Intelligent rate limiting to prevent abuse
- **Memory Management**: Efficient memory usage and garbage collection
- **Clustering**: PM2 cluster mode for multi-core utilization
- **Email Broadcasting**: Optimized notification delivery system

### Scalability Features

**Horizontal Scaling Ready**:
- Stateless backend architecture
- Database connection pooling
- File storage abstraction (local/cloud)
- Load balancer compatible
- Microservice architecture ready
- Email service abstraction

**Performance Metrics**:
- **Response Times**: < 200ms for API endpoints
- **Database Queries**: < 50ms average query time
- **File Uploads**: Streaming uploads for large files
- **Concurrent Users**: Tested for 1000+ concurrent users
- **Memory Usage**: < 512MB RAM usage per instance#
# 🤝 Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/your-username/Fix_Smart_CMS_v 1.0.0.git
   cd Fix_Smart_CMS_v 1.0.0
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Setup**
   ```bash
   npm install
   npm run dev:setup
   npm run dev
   ```

4. **Make Changes**
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation as needed

5. **Quality Checks**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

6. **Submit Pull Request**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Reference related issues

### Code Standards

**TypeScript Guidelines**:
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type usage
- Use proper generic constraints

**React Best Practices**:
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use React.memo for performance optimization

**Backend Standards**:
- Follow RESTful API design principles
- Implement proper error handling
- Use middleware for cross-cutting concerns
- Write comprehensive API documentation

**Testing Requirements**:
- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage

### Commit Message Convention

```
type(scope): description

feat(auth): add OTP verification for guest users
fix(complaints): resolve status update bug
docs(readme): update installation instructions
test(api): add integration tests for complaint endpoints
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`#
# 📚 Documentation & Support

### Complete Documentation

**Setup & Deployment**:
- 📖 [Deployment Documentation Index](./docs/deployments/README.md) - Linux, Windows, and build-only deployment runbooks.
- 🚀 [Deployment Department Hub](./docs/Deployment/README.md) - Reverse proxy, automation, and environment orchestration guides.
- 🗂️ [Configuration Reference](./docs/deployments/file-references.md) - Explanation of `.env`, PM2, and web server assets used during rollout.
- 🧾 [System Seed Initialization Update (v1.0.4)](./docs/System/system-seed-initialization-update.md) - Seed coverage for configuration keys, wards, and complaint types.
- 🔄 [PM2 Ecosystem & Environment Strategy](./docs/System/pm2-environment-strategy.md) - Environment separation and process management for Urban-voice deployments.

**Feature Documentation**:
- 👨‍💻 [Developer Documentation Hub](./docs/Developer/README.md) - Architecture, coding standards, and implementation references.
- 🏗️ [Architecture Overview](./docs/architecture/README.md) - System architecture and component relationships.
- 📜 [API Contracts](./docs/Developer/api_contracts.md) - REST interface definitions and integration notes.
- 🌐 [Environment Management](./docs/System/env_management.md) - Environment variable cloning, validation, and secrets handling.

**Quality Assurance**:
- 🧪 [QA Portal](./docs/QA/README.md) - Testing standards and validation workflows.
- ✅ [Release Validation Checklist](./docs/QA/release_validation.md) - Pre-release verification steps.
- 🔄 [Integration Checklist](./docs/QA/integration_checklist.md) - Cross-team deployment readiness review.

### Getting Support

**Development Support**:
- 📖 Check comprehensive documentation in `/docs` directory
- 🔍 Review existing GitHub issues and discussions
- 📊 Consult API documentation at `/api-docs` endpoint
- 🧪 Review QA test results for known issues

**Issue Reporting**:
- 🐛 **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- 💡 **Feature Requests**: Submit enhancement proposals with use cases
- 🔒 **Security Issues**: Report privately to maintainers
- 📝 **Documentation**: Suggest improvements or corrections

**Community Resources**:
- 💬 GitHub Discussions for questions and ideas
- 📧 Email support for enterprise deployments
- 🎓 Training materials for municipal staff
- 🔧 Professional services for customization

## 📊 Project Status

### Current Version: v 1.0.0 (Production Ready)

**Development Status**: ✅ **STABLE**
- All core features implemented and tested
- Production deployments active
- Comprehensive documentation available
- Active maintenance and support

**Feature Completeness**:
- ✅ Multi-role user management
- ✅ Guest complaint submission with OTP
- ✅ Real-time complaint tracking
- ✅ Administrative dashboards
- ✅ Multi-language support (EN/HI/ML)
- ✅ File upload and management
- ✅ Email notifications and broadcasting
- ✅ Advanced reporting and analytics
- ✅ Mobile-responsive design
- ✅ Security and performance optimization
- ✅ System configuration management
- ✅ Direct database access optimization

### Recent Updates (v 1.0.0)

**SystemConfig Enhancements**:
- ✅ Reverted to direct database access for improved performance
- ✅ Enhanced email broadcaster with database integration
- ✅ Updated build system with service integration
- ✅ Fixed API endpoint routing issues
- ✅ Comprehensive documentation reorganization

### Roadmap

**Upcoming Features** (v1.1.0):
- 📱 Mobile application (React Native)
- 🔔 Real-time notifications (WebSocket)
- 🗺️ Advanced GIS mapping integration
- 📊 AI-powered analytics and insights
- 🤖 WhatsApp bot integration
- 🌐 Multi-tenant architecture## 📄 
License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Commercial Use
- ✅ Commercial use permitted
- ✅ Modification and distribution allowed
- ✅ Private use permitted
- ❗ License and copyright notice required

## 🎉 Acknowledgments

**Core Technologies**:
- 🚀 **React Team** - Revolutionary frontend framework
- 🔄 **Redux Toolkit Team** - Predictable state management
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **Radix UI** - Accessible component primitives
- 🗄️ **Prisma Team** - Next-generation database toolkit
- ⚡ **Vite Team** - Lightning-fast build tool

**Infrastructure & Tools**:
- 🌐 **Vercel/Netlify** - Seamless deployment platforms
- 🐳 **Docker** - Containerization technology
- 🔧 **TypeScript Team** - Type-safe JavaScript
- 🧪 **Vitest & Cypress** - Comprehensive testing frameworks

**Special Recognition**:
- 🏛️ **Smart City Initiative** - Vision for digital governance
- 👥 **Municipal Officers** - Real-world feedback and requirements
- 🧑‍💻 **Open Source Community** - Continuous inspiration and support
- 🎯 **Quality Assurance Team** - Ensuring production readiness

---

## 📚 Documentation Index

### Core Documentation
- [🏗️ Architecture Overview](./docs/architecture/README.md) - System design and component topology.
- [🗄️ Database Design](./docs/Database/README.md) - Schema management, migrations, and performance tuning.
- [🚀 Deployment Playbooks](./docs/deployments/README.md) - OS-specific and build-only deployment guidance.
- [👨‍💻 Developer Guide](./docs/Developer/README.md) - Coding standards, API contracts, and implementation notes.

### Operational Documentation
- [⚙️ System Configuration](./docs/System/README.md) - Environment, security, and operations runbooks.
- [📋 Onboarding Guide](./docs/Onboarding/README.md) - New team setup and tooling references.
- [🧪 QA Handbook](./docs/QA/README.md) - Testing processes, checklists, and validation flows.
- [📝 Version History](./docs/legacy-doc/documents-release/VERSION_HISTORY.md) - Historical release notes and changelog.

### Additional Resources
- [🗂️ Deployment File Reference](./docs/deployments/file-references.md) - Configuration assets used across environments.
- [🧾 System Seed Initialization Update](./docs/System/system-seed-initialization-update.md) - Seed data coverage for v1.0.4.
- [🔄 PM2 Ecosystem & Environment Strategy](./docs/System/pm2-environment-strategy.md) - Multi-environment PM2 topology.
- [🌐 Environment Management](./docs/System/env_management.md) - Environment variable templates and validation.

---

<div align="center">

**🏛️ Built for Smart City Initiatives**

*Empowering municipal authorities and citizens through digital transformation*

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Powered by TypeScript](https://img.shields.io/badge/Powered%20by-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Database PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://postgresql.org/)

</div>
