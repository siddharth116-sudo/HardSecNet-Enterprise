# HardSecNet - Project Documentation

## 1. Project Overview

### Project Title
**HardSecNet (Hardware Security Network)**

### Description
HardSecNet is a comprehensive **System Hardening & Auditing Framework** designed to secure Windows environments through automated compliance checks, real-time monitoring, and centralized management. It combines a robust backend, a modern interactive dashboard, and lightweight agents to enforce security policies (based on CIS benchmarks) across a network of nodes.

### Objectives and Goals
*   **Automate Compliance:** Reduce manual effort in auditing system configurations against security best practices.
*   **Centralized Visibility:** Provide a single pane of glass for monitoring multiple nodes.
*   **Real-time Response:** Detect configuration drift and allow for immediate remediation (both manual and automated).
*   **Secure Infrastructure:** Utilize mutual TLS (mTLS) for secure agent-server communication and Role-Based Access Control (RBAC) for user management.

### Key Features
*   **Automated Auditing:** Periodic scans of system configurations (Firewall, UAC, Password Policy, etc.).
*   **One-Click Hardening:** Apply security fixes remotely or locally to bring systems into compliance.
*   **Drift Detection:** Automatically detect when a system's configuration assumes a non-compliant state.
*   **Network Monitoring:** Visualize active TCP connections and potential threats.
*   **RBAC System:** Granular permission control (Super Admin, Security Admin, Auditor, Viewer).
*   **Secure Communication:** Full mTLS support ensuring only authorized agents can report data.
*   **Interactive Dashboard:** React-based UI with live logs, topology maps, and reporting tools.

### Technologies Used
*   **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Socket.IO Client.
*   **Backend:** Python (Flask), Flask-SocketIO, Flask-JWT-Extended.
*   **Database:** MongoDB (Data Storage), Redis (Task Queue & Caching).
*   **Agent Scripting:** PowerShell (Core Logic), Python (Wrapper).
*   **Infrastructure:** Docker, Docker Compose, Nginx (Reverse Proxy).

### Target Audience
*   **System Administrators:** For managing fleet security.
*   **Security Operations Centers (SOC):** For monitoring real-time threats and compliance status.
*   **Auditors:** For generating compliance reports.

---

## 2. Project Structure Documentation

### Root Directory: `e:\HardSecNet_Project\`

| File / Folder | Type | Purpose |
| :--- | :--- | :--- |
| **`Dashboard/`** | Folder | Contains the source code for the React frontend application. |
| **`deployment/`** | Folder | Contains Docker configuration files for containerized deployment. |
| **`certs/`** | Folder | Stores the PKI infrastructure (CA, Server, and Client certificates). |
| **`Reports/`** | Folder | Storage for generated JSON audit reports and PDF summaries. |
| **`Snapshots/`** | Folder | Legacy storage for local PowerShell snapshots. |
| **`app.py`** | File (Python) | **Main Backend Application.** Initializes Flask, connects to DBs, defines API routes, and manages WebSocket events. |
| **`run_host_monitor.py`** | File (Python) | **Primary Agent Script.** Runs on client machines to execute audits, collect network data, and send it to the server securely via mTLS. |
| **`Agent_Client.py`** | File (Python) | *Legacy/Simplified Agent.* An alternative client script for basic reporting (predecessor to `run_host_monitor.py`). |
| **`Auditor.ps1`** | File (PowerShell) | **Core Audit Engine.** Checks system settings (Firewall, UAC, etc.) and outputs a JSON compliance report. |
| **`Hardener.ps1`** | File (PowerShell) | **Remediation Engine.** Applies configuration changes to fix vulnerabilities identified by the Auditor. |
| **`NetworkMonitor.ps1`** | File (PowerShell) | **Network Scanner.** Captures active TCP connections and process information. |
| **`ReportGenerator.py`** | File (Python) | **PDF Engine.** Helper class used by `app.py` to generate printable PDF audit reports. |
| **`pki_setup.py`** | File (Python) | **Infrastructure Setup.** Generates the Certificate Authority (CA) and issues certificates for Server and Agents. |
| **`middleware_auth.py`** | File (Python) | **Security Middleware.** Contains the `@require_client_cert` decorator to enforce mTLS on API endpoints. |
| **`rbac_config.py`** | File (Python) | **Access Control.** Defines User Roles (Super Admin, etc.) and their specific permissions. |
| **`Launcher.py`** | File (Python) | **CLI Tool.** A menu-driven script for running the tools locally (without the full web stack). |
| **`Logger.py`** | File (Python) | **Logging Utility.** standardized logging format (CEF) for system events. |
| **`setup.bat`** | File (Batch) | **Dev Setup.** Automated script to install Python dependencies and set up the environment. |
| **`.env`** | File (Config) | **Environment Variables.** Stores secrets like `JWT_SECRET_KEY`, `MONGO_URI`, and `REDIS_URL`. |
| **`requirements.txt`** | File (Config) | Python dependency list. |

### Dashboard Directory: `e:\HardSecNet_Project\Dashboard\`

| File / Folder | Purpose |
| :--- | :--- |
| **`src/`** | Source code for the React app. |
| **`src/App.jsx`** | Main component handling routing, layout, and global state (Auth, Data). |
| **`src/components/layout/Sidebar.jsx`** | **Navigation.** The main left-hand sidebar for switching views and managing nodes. |
| **`src/components/layout/Terminal.jsx`** | **Live Feed.** The right-hand panel displaying real-time system logs. |
| **`src/components/dashboard/`** | Contains widgets like `AuditTable`, `ScoreCard`, and `AttackSurfaceMap`. |
| **`vite.config.js`** | Configuration for the Vite build tool. |

### Deployment Directory: `e:\HardSecNet_Project\deployment\`

| File / Folder | Purpose |
| :--- | :--- |
| **`docker-compose.yml`** | Orchestrator definition for running Backend, Frontend, Mongo, and Redis together. |
| **`backend.Dockerfile`** | Instructions to build the Python Flask container. |
| **`frontend.Dockerfile`** | Instructions to build the React Nginx container. |

---

## 3. Detailed Documentation

### Architecture & Design
The system follows a **Client-Server Architecture** with a decoupled frontend and backend.

*   **Agents (Clients):** Windows machines utilize `run_host_monitor.py` to periodically invoke PowerShell scripts (`Auditor.ps1`, `NetworkMonitor.ps1`). Data is sent to the server via **HTTPS (mTLS)**.
*   **Server (Backend):** Flask handles API requests.
    *   **MongoDB:** Persists Node state, User credentials (hashed), Audit history, and Activity Logs.
    *   **Redis:** Acts as a **Task Queue** for buffering commands (e.g., "Remediate") intended for passive agents.
    *   **Socket.IO:** Pushes real-time log events from the backend to the frontend.
*   **Frontend:** React polls for node status and listens for live events. It communicates with the backend via **JWT-authenticated** REST APIs.

### Setup & Installation

#### Prerequisites
*   Windows 10/11 or Server (for Agents/Local Testing)
*   Docker Desktop (for Server deployment)
*   Python 3.9+ and Node.js 18+

#### Installation Steps
1.  **Generate Certificates (Crucial):**
    ```bash
    python pki_setup.py
    ```
    *This creates the `certs/` directory with CA, Server, and Client keys.*

2.  **Start Infrastructure:**
    ```bash
    cd deployment
    docker-compose up -d --build
    ```

3.  **Access the Dashboard:**
    *   Open `https://localhost:8443` (Accept the self-signed certificate warning).
    *   **Default Login:**
        *   User: `admin`
        *   Pass: `admin123`

#### Dependencies
*   **Python:** `pip install -r requirements.txt`
*   **Frontend:** `cd Dashboard && npm install`

### Key Features Documentation

#### 1. System Auditing
*   **File:** `Auditor.ps1`
*   **Function:** Checks Registry keys and Netsh output for compliance. Returns a JSON object with a "Score".
*   **Trigger:** Runs automatically every 10 minutes via `run_host_monitor.py` or manually via the "Fix System" button (which re-audits after fixing).

#### 2. Granular Remediation
*   **File:** `Hardener.ps1`
*   **Function:** Accepts a list of `Targets` (e.g., "Firewall,UAC").
*   **Logic:**
    *   If `Targets` contains "Firewall", it executes `netsh advfirewall set allprofiles state on`.
    *   Updates the Registry for UAC and Font Blocking.
    *   Uses `net accounts` for Password policies.

#### 3. Secure Agent Communication
*   **File:** `run_host_monitor.py` & `middleware_auth.py`
*   **Mechanism:**
    *   The Agent uses `requests.post(..., cert=('client.crt', 'client.key'))`.
    *   The Server validates this against the `ca.crt`.
    *   This ensures no unauthorized device can submit fake reports to the dashboard.

### Configuration Files

*   **`.env`**:
    *   `JWT_SECRET_KEY`: Signs authentication tokens. Change this for production!
    *   `MONGO_URI`: Connection string for the database (default: `mongodb://mongo:27017/hardsecnet`).
    *   `REDIS_URL`: Connection string for the cache (default: `redis://redis:6379/0`).
    *   `DRIFT_THRESHOLD`: Score percentage below which alerts are triggered (default: 100).

*   **`rbac_config.py`**:
    *   Defines dictionaries for roles. Example: `security_admin` has `{ "hardening": ["execute", "read"] }`.

### API Endpoints

| Endpoint | Method | Role Required | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/login` | POST | Public | Authenticates user and returns JWT. |
| `/api/node-data/<hostname>` | GET | Any | Retrieves the latest audit state for a specific node. |
| `/api/submit-report` | POST | **mTLS Agent** | Ingests audit data from agents. Returns pending commands. |
| `/api/execute-hardening` | POST | Security Admin | Queues a remediation command for a specific node/target. |
| `/api/network-traffic` | GET | Any | Returns list of active network connections. |

### Database Schema (MongoDB)

*   **`users`**: `{ username, password (hash), role }`
*   **`nodes`**: `{ ip, hostname, type, last_seen, status }`
*   **`audits`**: `{ Timestamp, Hostname, Score, Checks: [ { Name, Value, Status } ] }`
*   **`logs`**: `{ timestamp, severity, user, msg, source_ip }`

### Testing approach
*   **Local Testing:** Use `Launcher.py` to run `Auditor.ps1` and `Hardener.ps1` natively on Windows to verify PowerShell logic errors.
*   **Integration Testing:** Run `run_host_monitor.py` and check the Dashboard `Terminal` view to see if "Report Received" logs appear.

### Future Enhancements
*   **AI Integration:** Re-enable the `ai_engine` to provide natural language summaries of vulnerabilities using a local LLM (Ollama).
*   **Active Directory Integration:** Replace local user management with AD/LDAP.
*   **Linux Agent:** Port PowerShell scripts to Bash/Python for Linux support.

