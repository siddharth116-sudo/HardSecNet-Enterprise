# HardSecNet: Comprehensive Project Analysis & Build Guide

## 1. Project Capabilities Analysis

HardSecNet is an Enterprise-grade Autonomous System Hardening & Security Orchestration Platform. Upon analyzing the codebase, the project possesses the following core capabilities:

- **Automated Auditing:** Runs periodic, automated checks against Windows endpoints using CIS benchmarks (Firewall, Registry, Password Policies, UAC).
- **One-Click Remediation:** Administrators can push hardening commands (via `Hardener.ps1`) directly from the dashboard to instantly fix vulnerabilities.
- **Drift Detection & Auto-Remediation:** Background schedulers detect configuration drift (if a secure setting is altered) and can automatically roll it back to a secure baseline.
- **Secure Agent Communication (mTLS):** Remote agents communicate with the orchestrator using Mutual TLS (mTLS), ensuring that only verified nodes with a valid client certificate can submit audit reports.
- **Role-Based Access Control (RBAC):** Strict permission scoping via JWT for Super Admins, Security Admins, Auditors, and Viewers.
- **Real-Time Network Monitoring:** Live feed of system logs and network connections streamed to the frontend via WebSockets (Socket.IO).
- **Multi-Node Architecture:** Supports managing remote nodes via WinRM or via a lightweight standalone Python agent (`run_host_monitor.py`).
- **Containerized Infrastructure:** Backend APIs, Frontend, MongoDB, and Redis task queues are packaged cleanly via `docker-compose`.

---

## 2. The BMAD (Build Method And Design) Step-by-Step Guide

If you are looking to build this kind of project from scratch, this is the exact chronological path you should take. 

### **What is the FIRST thing you have to make?**
The **Core Scripting Engine**. You cannot orchestrate security without the scripts that actually perform the security checks. The PowerShell modules are the foundation of this project.

### Phase 1: Initial Setup & Source Control
1. **Create the Project Directory:** Create a folder named `HardSecNet_Project` and open it in your terminal.
2. **Initialize Git:** Run `git init` to track your code changes.
3. **Create a `.gitignore` file:** Add standard exclusions like `node_modules/`, `__pycache__/`, `.env`, `certs/`, and `*.log` to prevent committing sensitive data.
4. **Setup Python Environment:** 
   - Run `python -m venv .venv`
   - Activate it (`.venv\Scripts\activate`)
5. **Initial Commit:** Run `git add .` and `git commit -m "Initial commit - Project Structure"`.

### Phase 2: Core Engine (PowerShell Logic)
1. **Create `Auditor.ps1`:** Write PowerShell scripts to query the Windows Registry (e.g., UAC status) and Netsh (Firewall status). Output the compliance status as a JSON payload.
2. **Create `Hardener.ps1`:** Write the inverse logic. If the auditor finds the firewall is off, the hardener runs `netsh advfirewall set allprofiles state on`.
3. **Create `Rollback.ps1`:** Implement logic to undo the changes made by the Hardener in case of an emergency.

### Phase 3: Backend Infrastructure (Python / Flask)
1. **Setup Dependencies:** Create `requirements.txt` and include `Flask`, `Flask-JWT-Extended`, `Flask-SocketIO`, `pymongo`, `redis`, and `psutil`. Run `pip install -r requirements.txt`.
2. **Environment Variables:** Create a `.env` file for `MONGO_URI`, `REDIS_URL`, and `JWT_SECRET_KEY`.
3. **Create `app.py`:** Initialize the Flask server, connect to MongoDB, and configure the background scheduler.
4. **Implement RBAC & Auth:** Create `rbac_config.py` to define user roles. Implement a `/api/login` route in `app.py` to distribute JWTs.
5. **Implement Core Endpoints:** Build APIs to receive node data (`/api/submit-report`) and trigger actions (`/api/execute-hardening`).

### Phase 4: Secure Communication & Agent Design
1. **PKI Setup:** Create `pki_setup.py` using Python's `cryptography` library to generate a self-signed Root CA, and issue certificates for the Server and Agents.
2. **Create `middleware_auth.py`:** Add a Flask decorator to verify incoming mTLS client certificates.
3. **Build the Agent (`run_host_monitor.py`):** Create the python script that will be deployed to target machines. It should loop every 10 minutes, execute `Auditor.ps1`, and POST the JSON data back to the server using the client certificates.

### Phase 5: Frontend Dashboard (React / Vite)
1. **Initialize Frontend:** In the root directory, run `npm create vite@latest Dashboard -- --template react` and navigate into it.
2. **Install Packages:** Run `npm install react-router-dom axios tailwindcss lucide-react socket.io-client`.
3. **Configure Styling:** Initialize TailwindCSS (`npx tailwindcss init -p`) and configure your theme.
4. **Build the UI Layout:** Create a `Sidebar.jsx` for navigation and a main routing wrapper in `App.jsx`.
5. **Build Features:** 
   - Create a `Terminal.jsx` component that connects to Socket.IO to stream logs.
   - Create an `AuditTable.jsx` to parse the JSON data from `/api/node-data` and display compliance scores.
6. **Authentication Flow:** Create a Login page that saves the JWT to `localStorage` and injects it into all subsequent Axios requests.

### Phase 6: Infrastructure & Deployment
1. **Dockerize:** Create `backend.Dockerfile` (Python) and `frontend.Dockerfile` (Nginx/Node).
2. **Compose:** Create `docker-compose.yml` to orchestrate the backend, frontend, a `mongo` container, and a `redis` container.
3. **Final Polish:** Create `setup.bat` or a `Makefile` to give users a 1-click installation experience.

---

## 3. Full Prompt to Recreate This Project

If you want an AI to generate the skeleton of this exact project for you, use the following mega-prompt:

> **PROMPT:**
> "I want to build a comprehensive 'Autonomous System Hardening & Security Orchestration Platform' called HardSecNet. The project will manage and secure Windows endpoints. 
>
> Please generate the code and architecture step-by-step for the following components:
> 
> **1. Core PowerShell Scripts (The Agents):**
> - `Auditor.ps1`: A script that checks Windows CIS benchmarks (Firewall domain profile, Password length, Guest account status, UAC registry keys, Untrusted font blocking). It should output a JSON object containing a list of 'Checks' with their 'Status' (Compliant or Action Required).
> - `Hardener.ps1`: A script that takes target arguments and applies fixes to the Windows system to make them compliant (e.g., enabling firewall, modifying registry keys for UAC).
> 
> **2. The Backend Server (Python Flask):**
> - Create an `app.py` utilizing Flask, Flask-JWT-Extended, Flask-SocketIO, and PyMongo.
> - Include a Role-Based Access Control (RBAC) system with Super Admin, Security Admin, and Auditor roles. 
> - Create endpoints for `/api/login` (JWT generation), `/api/node-data` (fetching system audit scores), and `/api/submit-report` (for agents to push their JSON data).
> - Include a background thread using `apscheduler` to monitor configuration drift.
> - The server must interact with a Redis queue to push remediation commands to remote nodes.
> 
> **3. The Secure Agent Client (Python):**
> - Create a `run_host_monitor.py` script meant to run on target endpoints. 
> - It should run `Auditor.ps1` via a subprocess and POST the resulting JSON back to the Flask backend over HTTPS. 
> - It must use Mutual TLS (mTLS) to authenticate itself. Please also generate a helper script `pki_setup.py` to generate the necessary CA and client/server certificates.
> 
> **4. The Frontend Dashboard (React + Vite + Tailwind):**
> - Provide the setup commands and core component code for a modern dark-themed dashboard.
> - Include an authentication layer (Login screen).
> - Include a Dashboard view that fetches data from `/api/node-data` and renders a compliance score card and table.
> - Include a live 'Terminal' component that connects via Socket.IO to stream real-time activity logs from the backend.
> 
> **5. Containerization:**
> - Provide a `docker-compose.yml`, `backend.Dockerfile`, and `frontend.Dockerfile` to run the entire stack (including MongoDB and Redis) locally.
> 
> Please output the directory structure first, and then sequentially provide the code for each major file."
