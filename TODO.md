# ecrumedia Client Portal - Project Roadmap

**Project Goal:** Transform TailAdmin dashboard into a German client portal for ecrumedia customers to manage invoices, WordPress sites, hosting, domains, and email accounts.

**Key Features:**
- Multi-role authentication (Client & Admin)
- "Als Kunde einloggen" - Admin impersonation of client accounts
- Invoice management and downloads
- One-click WordPress installation
- Hetzner API integration for all infrastructure
- Full German localization

---

## Phase 1: Foundation & Core Authentication

### ✅ Project Setup
- [x] Initial project review and setup
- [x] Dependencies installed
- [x] Development server running

### 🔐 Authentication & User Management
- [x] Setup multi-role authentication system with client and admin accounts
  - [x] JWT/session management implementation
  - [x] Login/logout functionality
  - [x] Functional SignIn page with existing design
  - [x] Functional SignUp page with existing design
  - [x] Password confirmation validation on signup
  - [x] Success message after registration
  - [x] Route protection (ProtectedRoute component)
  - [x] AuthContext for global state management
  - [x] User dropdown with logout functionality
  - [x] Removed social login/signup buttons (Google, X)
  - [x] Full German translations for auth forms
  - [ ] Password reset flow
  - [x] "Als Kunde einloggen" (login as customer) functionality for admin users
    - [x] Backend endpoint with multi-layer security
    - [x] Frontend button (admin-only visibility)
    - [x] New tab opening with token-based authentication
    - [x] Comprehensive audit logging
    - [x] Defense-in-depth security (6+ security layers)
    - [x] Prevention of admin-to-admin impersonation
    - [x] Prevention of self-impersonation
    - [x] Security breach attempt logging
  - [x] Session management and timeout handling

### 🏗️ Backend API Infrastructure
- [x] Create Node.js/Express backend (or similar)
  - [x] Project structure setup (NestJS)
  - [x] PostgreSQL/MySQL database connection
  - [x] User management endpoints
  - [x] Authentication middleware
  - [x] RESTful API structure
  - [x] Error handling and logging

### 🗄️ Database Schema Design
- [x] Design and implement database tables:
  - [x] Users table (clients/admins)
  - [x] Invoices table
  - [x] WordPress sites table
  - [x] Hosting plans table
  - [x] Domains table
  - [x] Email accounts table
  - [x] Audit logs table (for admin impersonation tracking)
  - [x] Sessions table

### 🌍 Localization - German Translation
- [x] Implement i18n (react-i18next or similar)
- [x] Translate all UI elements to German
- [x] Translate authentication forms (SignIn/SignUp)
  - [x] All field labels (Email, Password, First Name, Last Name, Company, Phone)
  - [x] All placeholders
  - [x] All buttons and loading states
  - [x] Success and error messages
  - [x] Terms and conditions text
- [x] Format dates for German locale (dd.mm.yyyy)
- [x] Format currency (EUR)
- [x] German error messages
- [ ] German email templates

### 👥 Client Management
- [x] Client list view with all clients
- [x] Client detail page
  - [x] Read-only view by default
  - [x] Edit mode toggle with "Bearbeiten" button
  - [x] "Als Kunde anmelden" functionality
  - [x] Form validation
  - [x] Client data update
  - [x] Password change functionality
  - [x] User-friendly button design (rounded-full, shadow-theme-xs)
  - [x] Vertical alignment of action buttons
- [ ] Client creation workflow
- [ ] Client deletion/deactivation

---

## Phase 2: Invoice Management

### 📄 Invoice Management System
- [ ] Build invoice viewing and download functionality for clients
- [ ] Admin interface to create invoices
- [ ] Upload and assign invoices to client accounts
- [ ] PDF generation/viewing
- [ ] Invoice search and filtering

### 👨‍💼 Admin Dashboard - Overview
- [ ] Create admin dashboard with overview of:
  - [ ] All clients list
  - [ ] All invoices overview
  - [ ] Hosting plans summary
  - [ ] Domains overview
  - [ ] Statistics and monitoring
  - [ ] Client management interface
  - [ ] Quick actions panel

### 👤 Client Dashboard - Invoice View
- [ ] Create client-facing dashboard
- [ ] Invoice list with filter and search
- [ ] Download capabilities
- [ ] Invoice history
- [ ] Payment status display
- [ ] Invoice notifications

---

## Phase 3: WordPress Management

### 🌐 WordPress Management Integration
- [ ] Build WordPress management interface
  - [ ] Show all client WP sites
  - [ ] Site status monitoring
  - [ ] PHP version display
  - [ ] Storage usage metrics
  - [ ] One-click WordPress installation feature
  - [ ] Site backup/restore interface

### ☁️ Hetzner API Integration - Server Management
- [ ] Integrate Hetzner Cloud API
  - [ ] Server management functionality
  - [ ] Automated WordPress provisioning
  - [ ] SSL certificate management via Let's Encrypt
  - [ ] Server monitoring and alerts
  - [ ] Resource usage tracking

### ⚙️ WordPress Automation Scripts
- [ ] Create backend scripts for one-click WP install:
  - [ ] Database creation automation
  - [ ] WP-CLI automation
  - [ ] nginx/Apache vhost configuration
  - [ ] Automatic backups setup
  - [ ] WordPress hardening scripts
  - [ ] Plugin/theme installation automation

---

## Phase 4: Hosting Services Management

### 📦 Hosting Plan Management
- [ ] Build hosting plan overview
  - [ ] Storage usage display
  - [ ] Bandwidth monitoring
  - [ ] Database count and limits
  - [ ] Email accounts count
  - [ ] Upgrade/downgrade functionality
  - [ ] Admin approval workflow
  - [ ] Plan comparison view

### 🌐 Domain Management Interface
- [ ] Create domain management section:
  - [ ] Domain list view
  - [ ] DNS management interface
  - [ ] Domain transfer functionality
  - [ ] Renewal notifications
  - [ ] WHOIS information display
  - [ ] Nameserver configuration
  - [ ] Subdomain management

### 🔌 Hetzner DNS API Integration
- [ ] Integrate Hetzner DNS API
  - [ ] Domain management automation
  - [ ] Automated DNS record creation/editing
  - [ ] Bulk DNS operations
  - [ ] DNS zone management
  - [ ] DNSSEC support

### 📧 Email Management System
- [ ] Build email account management:
  - [ ] Create/delete email accounts
  - [ ] Mailbox quota management
  - [ ] Email forwarders setup
  - [ ] Autoresponders configuration
  - [ ] Webmail link integration
  - [ ] Email aliases management
  - [ ] Spam filter settings

### ⚙️ Client Settings & Profile
- [ ] Create settings page for clients:
  - [ ] Profile information editor
  - [ ] Password change functionality
  - [ ] Notification preferences
  - [ ] Contact information
  - [ ] Billing address management
  - [ ] Language preferences
  - [ ] Two-factor authentication (optional)

---

## Phase 5: Security & Production Preparation

### 🔒 Security & Production Prep
- [ ] Implement security best practices:
  - [ ] Rate limiting
  - [ ] CSRF protection
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] Secure headers (HSTS, CSP, etc.)
  - [ ] Input validation and sanitization
  - [ ] API authentication tokens
  - [ ] Brute force protection

### 💾 Backup & Recovery System
- [ ] Setup automated backups
  - [ ] Database backup scheduling
  - [ ] WordPress sites backup
  - [ ] Restore functionality
  - [ ] Backup storage on Hetzner Storage Box
  - [ ] Backup rotation policy
  - [ ] Backup verification

### 🔔 Notification System
- [ ] Email notifications for:
  - [ ] New invoices
  - [ ] Payment reminders
  - [ ] Domain expiration warnings
  - [ ] Hosting plan limits reached
  - [ ] System maintenance announcements
  - [ ] Password reset
  - [ ] Account changes

### 📝 Activity Logging & Audit Trail
- [x] Implement comprehensive logging:
  - [x] Admin actions logging (especially 'Als Kunde einloggen')
    - [x] LOGIN_AS_CLIENT audit action
    - [x] FAILED_LOGIN_AS_CLIENT_ATTEMPT audit action
    - [x] Detailed metadata logging (admin info, client info, timestamp)
    - [x] Security breach attempt logging
  - [ ] Invoice operations tracking
  - [ ] Critical changes logging
  - [ ] Security events
  - [x] Login attempts
  - [ ] API access logs

---

## Phase 6: Deployment & Launch

### 🖥️ Hetzner Server Setup & Configuration
- [ ] Provision dedicated Hetzner server
- [ ] Configure firewall rules
- [ ] Install Docker/nginx
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure database server
- [ ] Setup monitoring (Uptime Kuma/Grafana)
- [ ] Configure email server (Postfix/Dovecot)

### 🚀 CI/CD Pipeline Setup
- [ ] Setup deployment pipeline:
  - [ ] Git repository configuration
  - [ ] Automated builds
  - [ ] Staging environment
  - [ ] Production deployment scripts
  - [ ] Rollback capability
  - [ ] Automated testing in pipeline
  - [ ] Environment variables management

### 🧪 Testing & Quality Assurance
- [ ] Write tests for critical features:
  - [ ] Authentication flows
  - [ ] Invoice operations
  - [ ] WordPress provisioning
  - [ ] Admin impersonation
  - [ ] Security vulnerabilities testing
  - [ ] Integration tests
  - [ ] End-to-end tests

### 📚 Documentation
- [ ] Create documentation:
  - [ ] API documentation
  - [ ] Admin user guide (German)
  - [ ] Client user guide (German)
  - [ ] Deployment documentation
  - [ ] Troubleshooting guide
  - [ ] System architecture documentation
  - [ ] Database schema documentation

### ⚡ Performance Optimization
- [ ] Optimize frontend:
  - [ ] Bundle size optimization
  - [ ] Implement lazy loading
  - [ ] Setup CDN for static assets
  - [ ] Image optimization
  - [ ] Code splitting
- [ ] Optimize backend:
  - [ ] Database query optimization
  - [ ] Caching strategy (Redis)
  - [ ] API response compression
  - [ ] Database indexing

### 🎯 Launch Preparation & Go-Live
- [ ] Final security audit
- [ ] Load testing
- [ ] Migrate existing data
- [ ] DNS configuration
- [ ] SSL setup verification
- [ ] Monitoring setup verification
- [ ] Soft launch with test clients
- [ ] Production go-live
- [ ] Post-launch monitoring

---

## Progress Tracking

**Started:** November 7, 2025  
**Current Phase:** Phase 1 - Foundation (In Progress)  
**Completion:** 7/25 major tasks (28%)

### Session Notes

#### Session 1 - November 7, 2025
- Initial project review completed
- Dependencies installed successfully
- Development server running at http://localhost:5173/
- Created comprehensive project roadmap

#### Session 2 - November 7, 2025
**MAJOR PROGRESS - Phase 1 Foundation Complete!**

✅ **Backend Infrastructure:**
- Created NestJS backend in `/backend` directory
- Setup PostgreSQL + Redis with Docker Compose
- Implemented complete Prisma database schema with all required models:
  - Users (with roles: CLIENT, ADMIN)
  - Sessions (JWT token management)
  - Invoices & InvoiceItems (with Austrian VAT 20% and Reverse Charge support)
  - WordPressSites
  - HostingPlans
  - Domains & DnsRecords
  - EmailAccounts
  - AuditLogs (for admin action tracking)
- Database running and migrations applied successfully

✅ **Authentication System:**
- Implemented JWT authentication with Passport.js
- Created auth endpoints:
  - POST /auth/register - User registration
  - POST /auth/login - User login with JWT tokens
  - POST /auth/logout - Session cleanup
  - GET /auth/me - Get current user profile
- JWT guards and role-based access control (RBAC)
- Password hashing with bcrypt
- Audit logging for security events
- Session management in database

✅ **German Localization:**
- Installed and configured react-i18next
- Created comprehensive German translation file (`de.json`)
- Translations for all authentication flows
- German error messages and validation
- Currency and date formatting ready

✅ **Frontend Authentication UI:**
- Created Login page component with German UI
- Created Registration page component with German UI
- Form validation with error handling
- Integration with backend API
- Token storage in localStorage
- Responsive dark mode compatible design

**Backend API Running:** `http://localhost:3000`
- Database: PostgreSQL (Docker) on port 5432
- Redis: Cache/Sessions (Docker) on port 6379

**Frontend Running:** `http://localhost:5173`

**Next Steps:**
1. Add routes for login/register pages
2. Create protected route wrapper component
3. Build client dashboard
4. Build admin dashboard with "Als Kunde einloggen" feature
5. Start Phase 2: Invoice Management

#### Session 3 - November 8, 2025
**Phase 2: Invoice Management - In Progress**

✅ **Invoice Backend API:**
- Created complete Invoice module with CRUD endpoints
- Automatic invoice number generation (INV-2025-0001)
- Austrian VAT support (20% default)
- Reverse Charge support for EU companies outside Austria
  - Zero tax rate when reverse charge applies
  - Automatic note: "Die Umsatzsteuerschuld geht auf den Leistungsempfänger über (Reverse Charge System)"
- Invoice items with quantity and pricing
- Invoice statistics endpoint
- Role-based access control (Clients see only their invoices)

✅ **Invoice Frontend (Client View):**
- Created `/invoices` page with full functionality
- Statistics dashboard (total, paid, unpaid, overdue)
- Searchable invoice table with filters
- Status badges with color coding
- German currency formatting (EUR)
- German date formatting
- Sidebar navigation added

✅ **Tax Configuration for Austria:**
- Changed default tax rate from 19% (Germany) to 20% (Austria)
- Added `isReverseCharge` boolean field to invoices
- Added `reverseChargeNote` field for automatic reverse charge text
- Database migration applied successfully
- Updated DTOs for create and update operations
- Default country changed to "Österreich"

**API Endpoints Created:**
- POST /invoices - Create invoice (Admin only)
- GET /invoices - List invoices with filters
- GET /invoices/stats - Invoice statistics
- GET /invoices/:id - Get single invoice
- PATCH /invoices/:id - Update invoice (Admin only)
- DELETE /invoices/:id - Delete invoice (Admin only)

**Next Steps:**
1. Create Admin Invoice Overview page
2. Create Admin Invoice Creation form with line items
3. Implement PDF generation with Austrian formatting

---

## Technical Stack (Decided)

### Frontend
- **React 19** + TypeScript
- **Vite 6.1** (build tool)
- **Tailwind CSS 4.0** (styling)
- **react-i18next** (German localization)
- **React Router 7** (routing)
- **TanStack Query** (data fetching & caching)
- **Zustand** (state management - optional)

### Backend - **RECOMMENDED STACK** ✅
- **Node.js 20+** (LTS)
- **NestJS** (TypeScript framework)
  - Modular architecture for complex features
  - Built-in authentication with Passport
  - Swagger/OpenAPI documentation
  - Guards & interceptors for security
  - Dependency injection
- **PostgreSQL 16+** (database)
  - ACID compliance for invoices/financial data
  - JSON support for flexible data
  - Full-text search capabilities
  - Excellent performance on dedicated server
- **Prisma** (ORM)
  - Type-safe database queries
  - Automatic migrations
  - Easy schema management
- **JWT** (authentication tokens)
- **Passport** (authentication strategies)
- **Bcrypt** (password hashing)
- **Class-validator** (request validation)

### Additional Backend Services
- **Redis 7+** (caching & sessions)
  - Session storage
  - Rate limiting
  - Queue management
- **Bull/BullMQ** (background jobs)
  - WordPress installation queue
  - Email notifications
  - Scheduled tasks (backups, renewals)
- **Nodemailer** (email sending)
  - SMTP configuration
  - Template engine for German emails
- **Multer** (file uploads)
  - Invoice PDF uploads
  - Image handling

### Infrastructure - Hetzner Dedicated Server
- **Operating System:** Ubuntu Server 24.04 LTS
- **Web Server:** nginx (reverse proxy, SSL termination)
- **Process Manager:** PM2 (Node.js process management)
- **SSL:** Let's Encrypt (automated renewal)
- **Firewall:** UFW (Uncomplicated Firewall)
- **File Storage:** Hetzner Storage Box (backups, invoices)
- **Monitoring:** 
  - Uptime Kuma (uptime monitoring)
  - Grafana + Prometheus (metrics)
  - Loki (log aggregation)

### WordPress Infrastructure
- **Web Server:** nginx with PHP-FPM 8.3
- **WP-CLI** (WordPress automation)
- **MariaDB/MySQL** (WordPress databases)
- **Certbot** (SSL for WP sites)

### API Integrations
- **Hetzner Cloud API** (server management)
- **Hetzner DNS API** (domain management)
- **Hetzner Storage Box** (via SFTP/WebDAV)

### DevOps & Deployment
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
  - Automated testing
  - Build & deployment
  - Staging environment
- **Containerization:** Docker (optional, for easier deployment)
- **Backup Strategy:**
  - Database: pg_dump + cron
  - Files: rsync to Hetzner Storage Box
  - WordPress: automated snapshots
- **Secrets Management:** dotenv + encrypted environment files

### Development Tools
- **API Testing:** Postman/Insomnia
- **Database GUI:** pgAdmin / TablePlus
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest (unit), Supertest (integration)

### Why This Stack for Hetzner Dedicated Server?

**Performance Benefits:**
- PostgreSQL optimized for dedicated server resources
- Redis provides fast caching without external services
- nginx efficiently handles static files and SSL
- PM2 ensures zero-downtime deployments

**Cost Efficiency:**
- All services run on one dedicated server
- No need for external database hosting
- Hetzner Storage Box is cost-effective for backups

**Scalability:**
- Can easily add more PM2 instances
- PostgreSQL handles high concurrent connections
- Bull queues prevent server overload
- Can move to load balancer later if needed

**Developer Experience:**
- Full TypeScript stack (frontend + backend)
- Shared types between frontend/backend
- Excellent tooling and documentation
- Large community support

**Security:**
- Full control over server configuration
- Direct management of firewall rules
- Isolated environment for each WP site
- Complete audit trail capabilities

---

## Next Steps
1. ✅ ~~Decide on backend technology stack~~ **DECIDED: NestJS + PostgreSQL + Prisma**
2. Setup backend project structure (NestJS CLI)
3. Design and implement database schema with Prisma
4. Configure PostgreSQL on development machine
5. Implement authentication system (JWT + Passport)
6. Begin German translation setup (react-i18next)
7. Create basic API endpoints structure
8. Setup Redis for caching and sessions
