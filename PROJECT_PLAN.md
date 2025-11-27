# Document Manager - Project Implementation Plan

## Overview
A full-featured document management system with user management, document lifecycle, search, sharing, permissions, and admin capabilities.

## Tech Stack (Selected)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (metadata, users, ACLs)
- **Cache/Queue**: Redis (BullMQ for job queue)
- **File Storage**: AWS S3 (with MinIO support for local dev)
- **Search**: PostgreSQL full-text (MVP), Elasticsearch (future)
- **Auth**: JWT + refresh tokens
- **OCR**: Tesseract (optional feature)
- **Testing**: Jest, Supertest, Cypress/Playwright
- **Deployment**: Docker + Docker Compose

## Project Structure
```
docmanager/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   ├── workers/        # Background jobs
│   │   └── server.ts       # Entry point
│   ├── tests/
│   ├── migrations/
│   └── package.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API clients
│   │   ├── store/         # State management
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── docker/
├── docs/
└── docker-compose.yml
```

## Development Phases

### Phase 0: Discovery & Design ✓
- [x] Requirements analysis
- [x] Tech stack selection
- [x] Project structure design

### Phase 1: Project Setup & Core Infrastructure
- [ ] Initialize monorepo structure
- [ ] Set up backend (Node.js + TypeScript + Express)
- [ ] Set up frontend (React + TypeScript + Vite)
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for caching/queues
- [ ] Create Docker development environment
- [ ] Configure ESLint, Prettier
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Database schema design and migrations
- [ ] Implement authentication system (JWT)
- [ ] User registration, login, password reset
- [ ] Basic user profile management

### Phase 2: File Storage & Basic Document Flows
- [ ] Set up S3/MinIO integration
- [ ] Implement presigned URL generation
- [ ] Document metadata API endpoints
- [ ] Upload flow (single file)
- [ ] Bulk upload support
- [ ] Frontend upload UI with progress
- [ ] Download endpoint with presigned URLs
- [ ] File preview system (PDF, images)
- [ ] Soft delete functionality
- [ ] Document rename and description
- [ ] Folder/category CRUD operations
- [ ] Move documents between folders

### Phase 3: Search, Tags, and Metadata
- [ ] Tagging system (add/remove tags)
- [ ] PostgreSQL full-text search setup
- [ ] Search API (filename, tags, description)
- [ ] Filter functionality (type, date, size, owner)
- [ ] Sort options (relevance, date, name)
- [ ] Document versioning system
- [ ] Version comparison UI
- [ ] Rollback to previous version
- [ ] Favorites/starred documents
- [ ] Recent documents tracking

### Phase 4: Sharing, Permissions, Admin
- [ ] Role-based access control (RBAC)
- [ ] Share with users/groups
- [ ] Temporary share links with expiry
- [ ] Password-protected shares
- [ ] Permission checks (view/comment/edit)
- [ ] Audit logging system
- [ ] Admin dashboard UI
- [ ] User management (admin)
- [ ] Storage usage tracking
- [ ] Activity logs viewer

### Phase 5: Reliability & Background Jobs
- [ ] BullMQ setup for job processing
- [ ] Thumbnail generation worker
- [ ] Virus scanning integration
- [ ] OCR processing queue (optional)
- [ ] Search indexing worker
- [ ] Retry mechanisms for failed jobs
- [ ] Job monitoring dashboard
- [ ] Email notifications
- [ ] Upload resumption for large files
- [ ] Batch operations support

### Phase 6: Polish & Hardening
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting middleware
- [ ] Input validation and sanitization
- [ ] XSS/CSRF protection
- [ ] Unit tests (backend services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (Cypress/Playwright)
- [ ] Performance optimization
- [ ] CDN setup for static assets
- [ ] Database query optimization
- [ ] Security audit
- [ ] GDPR compliance features
- [ ] Backup and restore procedures
- [ ] Production monitoring setup

### Phase 7: Advanced Features (Post-MVP)
- [ ] Google Drive/Dropbox integration
- [ ] OneDrive integration
- [ ] ML-based auto-categorization
- [ ] PII detection
- [ ] Office document preview
- [ ] Collaboration features
- [ ] Mobile PWA
- [ ] Offline sync
- [ ] Advanced permissions (teams)
- [ ] Retention policies
- [ ] Secure deletion
- [ ] Analytics dashboard

## MVP Acceptance Criteria
1. ✅ User can register and login
2. ✅ User can upload PDF and preview in browser
3. ✅ User can create folders and organize documents
4. ✅ User can tag documents and search by tag/filename
5. ✅ User can create shareable links with expiry
6. ✅ System stores document versions
7. ✅ Admin can view users and storage usage

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, viewer, editor
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    folder_id UUID REFERENCES folders(id),
    current_version_id UUID,
    is_deleted BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Document Versions Table
```sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    comment TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Folders Table
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id),
    path TEXT, -- materialized path for efficient queries
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tags Table
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_tags (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, tag_id)
);
```

### Shares Table
```sql
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id),
    shared_with_user_id UUID REFERENCES users(id),
    public_link_token VARCHAR(64) UNIQUE,
    password_hash VARCHAR(255),
    permissions JSONB DEFAULT '{"view": true, "download": true, "edit": false}',
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:id` - Get user by ID (admin)
- `GET /api/users` - List all users (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Documents
- `POST /api/documents` - Create document metadata, get presigned upload URL
- `PUT /api/documents/:id/complete` - Mark upload complete
- `GET /api/documents` - List documents with filters
- `GET /api/documents/:id` - Get document metadata
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Soft delete document
- `POST /api/documents/:id/restore` - Restore deleted document
- `DELETE /api/documents/:id/permanent` - Permanently delete (admin)
- `GET /api/documents/:id/download` - Get presigned download URL
- `GET /api/documents/:id/preview` - Get preview URL or stream
- `POST /api/documents/:id/move` - Move to different folder
- `POST /api/documents/:id/copy` - Create copy
- `POST /api/documents/:id/favorite` - Toggle favorite

### Document Versions
- `GET /api/documents/:id/versions` - List all versions
- `GET /api/documents/:id/versions/:versionId` - Get specific version
- `POST /api/documents/:id/versions/:versionId/restore` - Restore version

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `GET /api/folders/:id` - Get folder details
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder
- `GET /api/folders/:id/contents` - Get folder contents

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag
- `POST /api/documents/:id/tags` - Add tags to document
- `DELETE /api/documents/:id/tags/:tagId` - Remove tag from document

### Search
- `GET /api/search` - Search documents
  - Query params: `q`, `type`, `folder`, `tags[]`, `dateFrom`, `dateTo`, `size`, `owner`, `sort`

### Shares
- `POST /api/shares` - Create share
- `GET /api/shares` - List user's shares
- `GET /api/shares/:token` - Access shared document
- `PUT /api/shares/:id` - Update share settings
- `DELETE /api/shares/:id` - Delete share
- `POST /api/shares/:token/access` - Log access to shared document

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/storage` - Storage usage by user
- `GET /api/admin/logs` - Audit logs
- `GET /api/admin/jobs` - Background job status

## Security Checklist
- [x] TLS/HTTPS for all traffic
- [ ] Presigned URLs for uploads/downloads
- [ ] File type validation
- [ ] Malware scanning
- [ ] Rate limiting
- [ ] Bcrypt/Argon2 password hashing
- [ ] RBAC implementation
- [ ] Audit logging
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] Secure session management
- [ ] Environment variable management

## Deployment Strategy
1. Local development: Docker Compose
2. Staging: AWS ECS or Kubernetes
3. Production: AWS ECS/EKS with RDS, S3, ElastiCache
4. CI/CD: GitHub Actions
5. Monitoring: Prometheus + Grafana, Sentry
6. Backups: Automated daily backups of PostgreSQL

## Next Immediate Steps
1. Initialize backend project structure
2. Initialize frontend project structure
3. Set up Docker Compose for local development
4. Create database migrations
5. Implement authentication system
6. Build basic upload/download flow
