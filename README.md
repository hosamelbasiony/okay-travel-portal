# Okay Travel API Documentation

Welcome to the Okay Travel Administrative Portal API. This API handles travel information (Visa & General info) and user management.

## Authentication
Most endpoints require a valid JWT (JSON Web Token) sent via an HTTP-Only cookie named `token`.

- **POST `/api/login`**: Authenticate a user and receive a session cookie.
- **POST `/api/logout`**: Clear the session cookie.
- **GET `/api/me`**: Get currently authenticated user details.

---

## Visa Info Endpoints
Manage specific visa details, prices, and eligibility.

- `GET /api/visa-info`: Get paginated list of visa info.
- `GET /api/visa-info/all`: Get all visa info records in one array (Protected).
- `POST /api/visa-info`: Add new visa info (Protected).
- `POST /api/visa-info/bulk`: Add multiple visa info records (Protected).
- `PUT /api/visa-info/:id`: Update visa info (Protected).
- `DELETE /api/visa-info/:id`: Delete visa info (Protected).

### General Information
- `GET /api/general-info`: Get paginated list of general info.
- `GET /api/general-info/all`: Get all general info records in one array (Protected).
- `POST /api/general-info`: Add new general info (Protected).
- `POST /api/general-info/bulk`: Add multiple general records (Protected).
- `PUT /api/general-info/:id`: Update general info (Protected).
- `DELETE /api/general-info/:id`: Delete general info (Protected).

---

## User Management Endpoints
Manage administrative access to the portal.

- **GET `/api/users`**: List all registered usernames (Admin).
- **POST `/api/users`**: Create a new system user (Admin).
- **DELETE `/api/users/:id`**: Delete a user (Admin).
- **PUT `/api/change-password`**: Change the password for the current session user (Auth Required).

## Deployment Plan

To deploy this application to a production server (Ubuntu/Debian), follow these steps:

### 1. Prerequisites
- Node.js (v18+) & SQLite3.
- PM2 (Process Manager): `npm install -g pm2`.

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=your_super_secret_key_here
```

### 3. Startup & Persistence
```bash
# Install dependencies
npm install

# Start with PM2
pm2 start index.js --name "okay-travel-app"

# Ensure persistence on reboot
pm2 save
pm2 startup
```

### 4. Reverse Proxy (Nginx)
Sample Nginx configuration for SSL and domain mapping:
```nginx
server {
    listen 80;
    server_name admin.okaytravel.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.okaytravel.com;

    ssl_certificate /etc/letsencrypt/live/admin.okaytravel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.okaytravel.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Backups
To backup the database, simply copy the SQLite file:
```bash
cp database.sqlite ./backups/database_$(date +%F).sqlite
```

---

Developed for **Okay Travel**.

