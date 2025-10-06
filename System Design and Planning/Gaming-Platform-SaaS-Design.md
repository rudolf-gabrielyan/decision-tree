# System Design: Turning gPlatform into a Multi-Tenant SaaS

## Problem Statement
Transform a single-tenant gaming platform (gPlatform) currently serving one gaming site into a multi-tenant SaaS solution that can serve multiple gaming companies, each with their own domain.

> **Personal Notes**: This is a classic multi-tenancy problem. I've seen similar challenges at Slack (workspace isolation) and how Shopify handles multiple stores. The key is choosing the right isolation strategy without over-engineering.

---

## Quick Answer Summary (TL;DR)

### Question 1: Multi-Domain System Design
**Answer**: Use a **tenant resolution layer** that maps each domain to a tenant ID. All requests flow through a reverse proxy that identifies the tenant from the domain, then enforces tenant-scoped data isolation throughout the application.

### Question 2: Users Table Modification
**Answer**: Add a `tenant_id` column and change the unique constraint from `UNIQUE(email)` to `UNIQUE(email, tenant_id)`. This allows the same email to exist across different tenants while maintaining uniqueness within each tenant.

### Question 3: Cross-Domain Authentication Security
**Answer**: Embed `tenant_id` and `domain` in JWT tokens, use **domain-specific cookies** (browser-enforced isolation), and implement authorization middleware that validates the token's tenant matches the request domain's tenant on every request.

---

## Before & After Comparison

### Current System (Single Tenant)
```
original-site.com
        ↓
   Backend Server ────► Database
                        - users (email UNIQUE)
                        - games
                        - scores
        
❌ Problems:
• Only one gaming site supported
• Can't add new clients
• Email must be globally unique
```

### New System (Multi-Tenant SaaS)
```
cool-games.com ─┐
                ├─► Load Balancer ──► Backend Cluster ──► Database
luck-games.co.uk┘                     (tenant-aware)       ├─ tenants
                                                           ├─ users (email+tenant_id UNIQUE)
                                                           ├─ games (scoped by tenant_id)
                                                           └─ scores (scoped by tenant_id)
✅ Benefits:
• Multiple clients on different domains
• Each client fully isolated
• Same email can exist across tenants
• Single backend serves all efficiently
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────┬────────────────────┬───────────────────────┘
                     │                    │
          cool-games.com          luck-games.co.uk
                     │                    │
                     └──────────┬─────────┘
                                │
                     ┌──────────▼──────────┐
                     │   CDN / DNS         │
                     │  (SSL Termination)  │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────────────────┐
                     │  Load Balancer / Reverse Proxy  │
                     │  - Inspect Host header          │
                     │  - Pass X-Tenant-Domain header  │
                     └──────────┬──────────────────────┘
                                │
                     ┌──────────▼──────────────────────┐
                     │   Backend Cluster (Shared)      │
                     │                                  │
                     │  ┌────────────────────────────┐ │
                     │  │ Tenant Resolution Layer    │ │
                     │  │ - Maps domain → tenant_id  │ │
                     │  │ - Validates tenant status  │ │
                     │  └──────────┬─────────────────┘ │
                     │             │                    │
                     │  ┌──────────▼─────────────────┐ │
                     │  │ Authorization Middleware   │ │
                     │  │ - Validates JWT token      │ │
                     │  │ - Checks tenant_id match   │ │
                     │  └──────────┬─────────────────┘ │
                     │             │                    │
                     │  ┌──────────▼─────────────────┐ │
                     │  │ Application Logic          │ │
                     │  │ - All queries scoped by    │ │
                     │  │   tenant_id from context   │ │
                     │  └──────────┬─────────────────┘ │
                     └─────────────┼───────────────────┘
                                   │
                     ┌─────────────▼─────────────────┐
                     │   Database (Shared Schema)     │
                     │                                 │
                     │  ┌──────────────────────────┐  │
                     │  │ tenants                  │  │
                     │  │ - id (PK)                │  │
                     │  │ - domain (UNIQUE)        │  │
                     │  │ - settings               │  │
                     │  └──────────────────────────┘  │
                     │                                 │
                     │  ┌──────────────────────────┐  │
                     │  │ users                    │  │
                     │  │ - id (PK)                │  │
                     │  │ - tenant_id (FK)         │  │
                     │  │ - email                  │  │
                     │  │ - UNIQUE(email,tenant_id)│  │
                     │  └──────────────────────────┘  │
                     │                                 │
                     │  ┌──────────────────────────┐  │
                     │  │ games, scores, etc.      │  │
                     │  │ - all with tenant_id     │  │
                     │  └──────────────────────────┘  │
                     └─────────────────────────────────┘
```

---

## Detailed Answers

## 1. System Design for Multi-Domain Support

### Core Strategy: Tenant Identification & Data Isolation

**Initial thought process**: 
- Could we use subdomains? (e.g., companyA.gplatform.com) - NO, clients want their own domains
- URL path prefixes? (e.g., gplatform.com/companyA) - Ugly and doesn't meet requirements
- **Best approach**: Custom domain per client with domain-to-tenant mapping ✓

### Architecture Components

**a) Tenant Identification Layer**
- Implement a **domain-to-tenant mapping service** that identifies which company/tenant owns each domain
- Store mappings in a configuration table:
  ```
  tenant_domains:
    - tenant_id: "company_a"
      domain: "cool-games.com"
      status: "active"
  ```

**b) Request Flow**
1. **Reverse Proxy/Load Balancer** (e.g., nginx, AWS ALB):
   - Inspect incoming `Host` header from HTTP requests
   - Route all domains to the same backend cluster
   - Pass domain information as header (e.g., `X-Tenant-Domain`)

2. **Tenant Resolution Middleware**:
   - Extract domain from request headers
   - Query tenant mapping service to resolve `tenant_id`
   - Attach `tenant_id` to request context
   - Reject requests from unmapped/inactive domains

3. **Data Isolation Layer**:
   - All database queries automatically filter by `tenant_id` from context
   - Use query interceptors/middleware to enforce tenant scoping
   - Implement tenant-aware caching with keys like `{tenant_id}:{resource_id}`

**c) CDN and Static Assets**
- Use a CDN (CloudFront, Cloudflare) with custom domain support
- Configure CNAME records for each client domain pointing to your CDN
- Serve tenant-specific assets using path prefixes: `/tenants/{tenant_id}/assets/`
- Allow white-labeling: custom logos, themes, configurations per tenant

**d) SSL/TLS Certificates**
- Use **wildcard certificates** or **SNI (Server Name Indication)**
- Automate certificate provisioning (Let's Encrypt, AWS ACM)
- Store and serve appropriate certificates per domain

---

---

## 2. Users Table Modifications

### Current Schema Issues
❌ **Problem 1**: Email as unique key prevents users from having accounts across multiple tenants  
❌ **Problem 2**: No tenant isolation at data level  
❌ **Problem 3**: Can't distinguish which user belongs to which company

### Database Schema Diagram

**Quick observation**: The current schema assumes email uniqueness globally. This breaks immediately when john@example.com wants to play on both cool-games.com AND luck-games.co.uk. We need composite uniqueness.

**BEFORE (Single Tenant):**
```
┌─────────────────────────┐
│        users            │
├─────────────────────────┤
│ id (PK)                 │
│ email (UNIQUE)          │◄── Problem: email must be globally unique
│ password_hash           │
│ username                │
│ created_at              │
└─────────────────────────┘

Example data:
  id=1, email="john@example.com"
  id=2, email="jane@example.com"
  ❌ Can't add another "john@example.com" for different company
```

**AFTER (Multi-Tenant):**
```
┌──────────────────────────┐         ┌───────────────────────────┐
│       tenants            │         │         users             │
├──────────────────────────┤         ├───────────────────────────┤
│ id (PK)                  │◄────────│ id (PK)                   │
│ name                     │    ┌────│ tenant_id (FK)            │
│ domain (UNIQUE)          │    │    │ email                     │
│ subscription_tier        │    │    │ password_hash             │
│ status                   │    │    │ username                  │
│ created_at               │    │    │ created_at                │
│ settings (JSONB)         │    │    │                           │
└──────────────────────────┘    │    │ UNIQUE(email, tenant_id)  │◄── Allows same email
                                │    └───────────────────────────┘     across tenants
                                │
                                └─── Foreign Key Relationship

Example data:
  Tenant A: id="company_a", domain="cool-games.com"
  Tenant B: id="company_b", domain="luck-games.co.uk"
  
  User 1: id=1, tenant_id="company_a", email="john@example.com"
  User 2: id=2, tenant_id="company_b", email="john@example.com"  ✅ Now allowed!
  User 3: id=3, tenant_id="company_a", email="jane@example.com"
```

### Required Modifications

**a) Add Tenant Column**
```sql
ALTER TABLE users 
ADD COLUMN tenant_id VARCHAR(255) NOT NULL;

-- Add foreign key constraint
ALTER TABLE users
ADD CONSTRAINT fk_tenant
FOREIGN KEY (tenant_id) REFERENCES tenants(id);
```

**b) Update Unique Constraint**
```sql
-- Remove old unique constraint on email
ALTER TABLE users DROP CONSTRAINT users_email_unique;

-- Add composite unique constraint
ALTER TABLE users 
ADD CONSTRAINT users_email_tenant_unique 
UNIQUE (email, tenant_id);
```

**c) Create Tenants Table**
```sql
CREATE TABLE tenants (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB -- tenant-specific configurations
);
```

**d) Update Primary Key (Optional but Recommended)**
- Consider changing `user.id` from simple auto-increment to compound key or globally unique IDs
- Options:
  - **UUID**: Globally unique, no tenant info needed
  - **Composite Key**: `(tenant_id, user_id)`
  - **Prefixed ID**: `{tenant_id}_{user_id}` (e.g., "company_a_12345")

**e) Add Indexes**
```sql
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email_tenant ON users(email, tenant_id);
```

---

## 3. Cross-Domain Authentication Validation

### Challenge
Ensure users authenticated on `cool-games.com` cannot access resources on `luck-games.co.uk`

**Key insight**: This is actually TWO problems:
1. Prevent accidental access (user accidentally navigates to wrong site)
2. Prevent malicious access (attacker tries to use stolen token on different domain)

The browser's cookie domain isolation handles #1 for free. We need middleware for #2.

### Solution: Token-Based Authentication with Tenant Binding

### Authentication Flow Diagram

```
User on cool-games.com                 Backend                    Database
─────────────────────                 ───────                    ─────────

1. LOGIN REQUEST
   │
   │ POST /api/auth/login
   │ Host: cool-games.com
   │ { email, password }
   ├─────────────────────────────────►│
   │                                   │ Extract domain from Host header
   │                                   │ cool-games.com → tenant_id="company_a"
   │                                   │
   │                                   │ SELECT * FROM users
   │                                   │ WHERE email=? AND tenant_id=?
   │                                   ├──────────────────────────►│
   │                                   │                            │ Find user
   │                                   │◄──────────────────────────┤ with tenant_id
   │                                   │ Validate password
   │                                   │
   │                                   │ Generate JWT:
   │                                   │ {
   │                                   │   user_id: "12345",
   │                                   │   tenant_id: "company_a",
   │                                   │   domain: "cool-games.com",
   │                                   │   email: "john@example.com"
   │                                   │ }
   │                                   │
   │ Set-Cookie: token=<JWT>           │
   │ Domain=cool-games.com             │
   │ HttpOnly; Secure; SameSite       │
   │◄─────────────────────────────────┤
   │
   │ Store token in browser
   │ (only for cool-games.com)
   │


2. AUTHENTICATED REQUEST TO SAME DOMAIN ✅
   │
   │ GET /api/games
   │ Host: cool-games.com
   │ Cookie: token=<JWT>
   ├─────────────────────────────────►│
   │                                   │ Extract domain: cool-games.com
   │                                   │ Resolve: tenant_id="company_a"
   │                                   │
   │                                   │ Decode JWT token
   │                                   │ Token tenant_id: "company_a"
   │                                   │ Request tenant_id: "company_a"
   │                                   │
   │                                   │ ✅ MATCH! Allow request
   │                                   │
   │                                   │ SELECT * FROM games
   │                                   │ WHERE tenant_id="company_a"
   │                                   ├──────────────────────────►│
   │                                   │◄──────────────────────────┤
   │ { games: [...] }                  │
   │◄─────────────────────────────────┤
   │


3. ATTEMPT TO ACCESS DIFFERENT DOMAIN ❌
   │
   │ User somehow tries luck-games.co.uk
   │ GET /api/games
   │ Host: luck-games.co.uk
   │ ❌ NO COOKIE (browser doesn't send)
   ├─────────────────────────────────►│
   │                                   │ No token found
   │                                   │
   │ 401 Unauthorized                  │
   │◄─────────────────────────────────┤
   │

   OR (if attacker manually copies token):
   │
   │ GET /api/games
   │ Host: luck-games.co.uk
   │ Cookie: token=<JWT from cool-games>
   ├─────────────────────────────────►│
   │                                   │ Extract domain: luck-games.co.uk
   │                                   │ Resolve: tenant_id="company_b"
   │                                   │
   │                                   │ Decode JWT token
   │                                   │ Token tenant_id: "company_a"
   │                                   │ Request tenant_id: "company_b"
   │                                   │
   │                                   │ ❌ MISMATCH! Reject
   │                                   │
   │ 403 Forbidden                     │
   │ "Invalid tenant access"           │
   │◄─────────────────────────────────┤
```

### Implementation Details

**a) Login & Token Generation**

1. **Login Request**:
   ```
   POST https://cool-games.com/api/auth/login
   { "email": "user@example.com", "password": "***" }
   ```

2. **Backend Processing**:
   - Extract `tenant_id` from domain (via middleware)
   - Query: `SELECT * FROM users WHERE email = ? AND tenant_id = ?`
   - Validate credentials
   - Generate JWT token with embedded tenant context:
     ```json
     {
       "user_id": "12345",
       "tenant_id": "company_a",
       "email": "user@example.com",
       "domain": "cool-games.com",
       "iat": 1728000000,
       "exp": 1728086400
     }
     ```

3. **Token Storage**:
   - Send token to client (HTTP-only cookie or response body)
   - Set cookie with `SameSite=Strict` and `Secure` flags
   - **Important**: Use domain-specific cookies:
     ```
     Set-Cookie: auth_token=<JWT>; Domain=cool-games.com; HttpOnly; Secure; SameSite=Strict
     ```

**b) Authorization Middleware**

```typescript
function validateTenantAccess(req, res, next) {
  // 1. Extract tenant from request domain
  const requestDomain = req.headers.host;
  const requestTenant = resolveTenantFromDomain(requestDomain);
  
  // 2. Decode and validate JWT token
  const token = extractToken(req);
  const decoded = jwt.verify(token, SECRET_KEY);
  
  // 3. Validate tenant match
  if (decoded.tenant_id !== requestTenant) {
    return res.status(403).json({ 
      error: "Access denied: Invalid tenant" 
    });
  }
  
  // 4. Validate domain match (optional extra layer)
  if (decoded.domain !== requestDomain) {
    return res.status(403).json({ 
      error: "Access denied: Domain mismatch" 
    });
  }
  
  // 5. Attach validated context to request
  req.user = decoded;
  req.tenant_id = requestTenant;
  
  next();
}
```

**c) Additional Security Measures**

1. **Session Management**:
   - Store active sessions in Redis with tenant context:
     ```
     session:{tenant_id}:{user_id}:{session_id} = {
       created_at, last_active, ip_address
     }
     ```
   - Validate session belongs to correct tenant on each request

2. **Token Signing Keys**:
   - Option 1: Use **tenant-specific signing keys** for complete isolation
   - Option 2: Use **single key but validate tenant_id** in token payload

3. **CORS Configuration**:
   - Configure CORS to only accept requests from registered tenant domains
   - Whitelist each tenant's domain dynamically

4. **Rate Limiting**:
   - Apply per-tenant rate limits to prevent cross-tenant abuse
   - Key pattern: `ratelimit:{tenant_id}:{user_id}`

5. **Audit Logging**:
   - Log all authentication attempts with tenant context
   - Monitor for suspicious cross-tenant access attempts

**d) Cookie Domain Isolation**

This is **critical** for security:
- Cookies set for `cool-games.com` are NOT sent to `luck-games.co.uk`
- Browser automatically enforces domain isolation
- Even if a user somehow obtains a token from another domain, the cookie won't be sent
- This provides a natural security boundary

**Common Pitfalls to Avoid:**
- ❌ Don't set cookies with `Domain=.com` (way too broad!)
- ❌ Don't use a single JWT secret across all tenants (consider per-tenant secrets for paranoid mode)
- ❌ Don't forget to validate tenant on EVERY authenticated request
- ❌ Don't trust client-provided tenant_id - always resolve from domain
- ⚠️ Watch out for subdomain cookies bleeding across tenants if not careful

**Real-world war story**: I once saw a multi-tenant app that forgot to check tenant_id in one API endpoint. User A could access User B's data by just changing an ID in the URL. Cost the company $50k in breach fines. Don't be that person.

---

## Additional Considerations & Trade-offs

### Multi-Tenancy Pattern Comparison

| Pattern | Pros | Cons | Best For |
|---------|------|------|----------|
| **Shared DB, Shared Schema** ✅ (Recommended) | • Simple to implement<br>• Cost-effective<br>• Easy maintenance<br>• Efficient resource use | • Risk of data leakage if bugs<br>• Noisy neighbor issues<br>• All tenants affected by downtime | • Most SaaS applications<br>• When starting out<br>• Cost-sensitive projects |
| **Shared DB, Schema-per-Tenant** | • Better isolation<br>• Easier data migration<br>• Can customize per tenant | • More complex<br>• Schema migrations harder<br>• Limited scalability | • Medium-security needs<br>• Tenant customization required |
| **Database-per-Tenant** | • Maximum isolation<br>• Independent scaling<br>• Easy to move tenants<br>• Regulatory compliance | • Expensive<br>• Complex management<br>• Connection pool limits | • Healthcare, finance<br>• Very large tenants<br>• Strict compliance |

**My Recommendation**: **Shared Database, Shared Schema**

Why? Gaming platforms don't need bank-level isolation. Most clients will be small-to-medium sized. Start simple, scale later. Plus we can always move a huge client (think EA or Ubisoft) to their own DB instance if needed.

*(Side note: I initially considered database-per-tenant but the operational overhead would be insane with 50+ clients)*

### Security Layers (Defense in Depth)

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Browser Cookie Isolation (Domain-based)       │ ← Primary defense
├─────────────────────────────────────────────────────────┤
│ Layer 2: JWT Token Validation (tenant_id in payload)   │ ← Prevents manual attacks
├─────────────────────────────────────────────────────────┤
│ Layer 3: Authorization Middleware (tenant_id match)    │ ← Application-level check
├─────────────────────────────────────────────────────────┤
│ Layer 4: Query-level Filtering (WHERE tenant_id=?)     │ ← Data-level isolation
├─────────────────────────────────────────────────────────┤
│ Layer 5: Database Constraints (Foreign Keys)           │ ← Last line of defense
└─────────────────────────────────────────────────────────┘
```

### Data Migration Strategy

**Phase 1: Preparation**
```sql
-- 1. Create tenants table
CREATE TABLE tenants (...);

-- 2. Insert default tenant for existing data
INSERT INTO tenants (id, name, domain) 
VALUES ('legacy', 'Original gSite', 'original-domain.com');

-- 3. Add nullable tenant_id column first
ALTER TABLE users ADD COLUMN tenant_id VARCHAR(255) NULL;
```

**Phase 2: Backfill**
```sql
-- 4. Backfill existing users with default tenant
UPDATE users SET tenant_id = 'legacy' WHERE tenant_id IS NULL;

-- 5. Make column NOT NULL
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
```

**Phase 3: Constraints**
```sql
-- 6. Drop old unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_unique;

-- 7. Add new composite unique constraint
ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique 
UNIQUE (email, tenant_id);

-- 8. Add foreign key
ALTER TABLE users ADD CONSTRAINT fk_tenant
FOREIGN KEY (tenant_id) REFERENCES tenants(id);
```

### Monitoring & Observability

**Key Metrics to Track (Per Tenant):**
- Requests per second
- Error rates
- Response times (p50, p95, p99)
- Database query performance
- Active users/sessions
- Storage usage

**Logging Structure:**
```json
{
  "timestamp": "2025-10-04T10:30:00Z",
  "level": "INFO",
  "tenant_id": "company_a",
  "domain": "cool-games.com",
  "user_id": "12345",
  "action": "game_started",
  "game_id": "tetris",
  "duration_ms": 45
}
```

**Alerting:**
- Unusual cross-tenant access attempts
- Spike in 403 errors (potential attack)
- Query performance degradation
- Tenant-specific downtime

### Cost Allocation & Billing

**Track Per-Tenant Usage:**
- API requests count
- Database queries count
- Storage (MB/GB used)
- Bandwidth consumed
- Compute time

**Implementation:**
```sql
CREATE TABLE tenant_usage (
  tenant_id VARCHAR(255),
  date DATE,
  api_requests INT,
  db_queries INT,
  storage_mb INT,
  bandwidth_mb INT,
  PRIMARY KEY (tenant_id, date)
);
```

### Scalability Considerations

**Horizontal Scaling:**
- Load balancer distributes across multiple backend instances
- All instances share same database (initially)
- Session data in Redis (not local memory)

**Database Scaling:**
- Start with single database with read replicas
- Later: Shard by `tenant_id` if needed
- Option: Move large tenants to dedicated DB instances

**Caching Strategy:**
```
Cache Key Pattern: {tenant_id}:{resource_type}:{resource_id}

Examples:
- company_a:user:12345
- company_b:game:tetris
- company_a:leaderboard:daily
```

**Performance note**: At ~100 tenants with 10k users each, we'll likely hit DB bottlenecks. That's when read replicas become mandatory. Around 500+ tenants, consider sharding by tenant_id ranges.

---

## Implementation Roadmap

### Phase 1: Foundation
- [ ] **Database Changes**
  - [ ] Create `tenants` table
  - [ ] Add `tenant_id` to `users` table (nullable first)
  - [ ] Backfill existing data with default tenant
  - [ ] Make `tenant_id` NOT NULL and add constraints
  - [ ] Add indexes for performance
  - [ ] Update all other tables (games, scores, etc.)

- [ ] **Infrastructure Setup**
  - [ ] Configure load balancer to capture Host header
  - [ ] Set up SSL/TLS wildcard certificates
  - [ ] Configure CDN for multiple domains

### Phase 2: Core Multi-Tenancy
- [ ] **Backend Implementation**
  - [ ] Build tenant resolution middleware
  - [ ] Create tenant-domain mapping service
  - [ ] Implement query interceptor for automatic tenant filtering
  - [ ] Add tenant context to all request handlers
  - [ ] Update all database queries with tenant scoping

- [ ] **Authentication & Authorization**
  - [ ] Modify login to include tenant_id in JWT
  - [ ] Implement domain-specific cookie configuration
  - [ ] Build authorization middleware for tenant validation
  - [ ] Add session management with tenant context

### Phase 3: Security & Testing
- [ ] **Security Hardening**
  - [ ] Implement CORS with tenant domain whitelist
  - [ ] Add rate limiting per tenant
  - [ ] Set up audit logging for all tenant operations
  - [ ] Add alerts for cross-tenant access attempts
  - [ ] Perform security audit and penetration testing

- [ ] **Testing**
  - [ ] Unit tests for tenant isolation
  - [ ] Integration tests for cross-domain scenarios
  - [ ] Load testing with multiple tenants
  - [ ] Test data migration scripts

### Phase 4: Monitoring & Launch
- [ ] **Observability**
  - [ ] Implement tenant-aware logging
  - [ ] Set up per-tenant metrics dashboard
  - [ ] Configure alerting for anomalies
  - [ ] Create admin panel for tenant management

- [ ] **Launch Preparation**
  - [ ] Documentation for onboarding new tenants
  - [ ] Create tenant provisioning workflow
  - [ ] Set up billing and usage tracking
  - [ ] Prepare rollback plan

---

## Key Takeaways

### Question 1: Multi-Domain Architecture
**Core Concept**: Domain → Tenant ID mapping at the entry point
- Reverse proxy captures domain from Host header
- Middleware resolves tenant_id from domain
- All subsequent operations are tenant-scoped
- Single backend cluster serves all tenants

### Question 2: Database Schema Changes
**Core Concept**: Composite uniqueness for tenant isolation
- Add `tenant_id` column to all tenant-specific tables
- Change constraint: `UNIQUE(email)` → `UNIQUE(email, tenant_id)`
- Create `tenants` table with domain mapping
- Every query filters by tenant_id

### Question 3: Authentication Security
**Core Concept**: Multiple layers of tenant validation
- **Layer 1**: Browser isolates cookies by domain (primary defense)
- **Layer 2**: JWT contains tenant_id and domain
- **Layer 3**: Middleware validates token tenant matches request domain tenant
- Even if token is copied, validation fails for wrong domain

### Why This Design Works
✅ **Scalable**: Single cluster serves all tenants efficiently  
✅ **Secure**: Multiple validation layers prevent cross-tenant access  
✅ **Cost-effective**: Shared infrastructure with logical isolation  
✅ **Simple**: Standard multi-tenancy pattern used by most SaaS  
✅ **Flexible**: Can migrate large tenants to dedicated resources later

### Interview Gotchas
- Don't forget to mention **data migration** strategy for existing users
- Talk about **monitoring per tenant** - interviewers love operational thinking
- Mention **cost considerations** - shows business awareness
- Discuss **failure modes** - what if domain mapping service is down? (fallback to cache)
- Consider **compliance** - some regions might require data residency (future consideration)

---

## Further Reading & References

**Multi-Tenancy Patterns:**
- AWS Multi-Tenant SaaS Architecture
- Microsoft SaaS Development Best Practices
- "Multi-Tenant Data Architecture" by Microsoft

**Security:**
- OWASP Multi-Tenancy Cheat Sheet
- JWT Best Current Practices (RFC 8725)
- Cookie Security Best Practices

**Real-World Examples:**
- Salesforce: Database-per-tenant for large enterprises
- Slack: Shared database with workspace isolation
- GitHub: Shared infrastructure with organization isolation

---

## Additional Notes & Thoughts

**Things I'm still thinking about:**
- Should we version the JWT tokens? Probably v1, v2, etc. for future changes
- What happens during tenant migration? Need a maintenance mode flag in tenants table
- API rate limiting: per-tenant or per-user? Probably both (tenant quota + fair use per user)
- How to handle tenant deletion? Soft delete with grace period, then hard delete after 30 days?

**Quick wins for MVP:**
- Start with just 2-3 pilot tenants to validate the approach
- Don't overbuild - we can add features as we learn what clients actually need
- Focus on getting authentication rock-solid first - everything else is secondary

**Open questions to discuss with team:**
- Do we need tenant-specific branding/theming? (Probably yes for premium tier)
- Should tenants be able to configure their own game settings?
- What metrics do clients want to see? Need a basic analytics dashboard

**Things to test:**
- ⚠️ What happens if tenant domain changes? Need migration path
- ⚠️ What if user registers with same email on two different tenants? (Should work fine)
- ⚠️ Performance testing with 100+ concurrent tenants
- ⚠️ Failover scenarios - what if domain resolution service goes down?

**Cost estimates (back-of-napkin):**
- Single DB cluster: ~$500/mo initially
- Load balancer: ~$50/mo
- CDN: ~$100/mo
- Per tenant: Maybe $5-10/mo in infrastructure
- Can charge $99-299/mo per tenant → good margins

