# HardSecNet SMB Deployment Guide (10 Laptops)

This guide outlines the steps to deploy **HardSecNet** in a small business environment with approximately 10 Windows laptops. The goal is to establish a central monitoring server and deploy lightweight agents to each laptop for continuous security auditing and self-healing.

## Architecture: Agent-Based (Pull Model)
Instead of the server trying to connect to laptops (which fails on WiFi/NAT), each laptop will run an agent that "phones home" to the server.

*   **Central Server**: Runs the Dashboard, MongoDB database, and API.
*   **Laptops (Agents)**: Run a lightweight Python script (`Agent_Client.py`) that executes local audits and sends reports to the server.

---

## Phase 1: Server Setup (The "HQ")

Choose one machine to be the server. This can be a dedicated laptop, a desktop, or a small cloud VPS (e.g., AWS Lightsail / DigitalOcean).

1.  **Prerequisites**:
    *   Install **Python 3.10+**
    *   Install **MongoDB Community Server** (Default Settings)
    *   Install **Git** (Optional, to clone code)

2.  **Installation**:
    ```powershell
    # Clone or Copy the Project Folder to C:\HardSecNet
    cd C:\HardSecNet
    pip install -r requirements.txt
    pip install pymongo  # Ensure DB driver is installed
    ```

3.  **Start the Server**:
    *   Open `app.py` and ensure `host='0.0.0.0'` in `app.run` (or use Gunicorn for production).
    *   Run data initialization: `python app.py`
    *   Start the Frontend: `cd Dashboard; npm run dev -- --host` (or build for production `npm run build`).

4.  **Network Config**:
    *   **Static IP**: Assign a static IP to this server (e.g., `192.168.1.100`) so agents can find it.
    *   **Firewall**: Allow inbound traffic on Port **5000** (API) and **3000** (Dashboard) (or **80** if serving via Nginx).

---

## Phase 2: Laptop Deployment (The "Agents")

Repeat this process for each of the 10 laptops.

1.  **Prepare the Agent Package**:
    Create a folder named `HardSecNet_Agent` containing:
    *   `Agent_Client.py`
    *   `Auditor.ps1`
    *   `Hardener.ps1` (Optional, if you want auto-remediation)

2.  **Configure the Agent**:
    *   Open `Agent_Client.py` in a text editor.
    *   Change `SERVER_URL` to your server's IP:
        ```python
        SERVER_URL = "http://192.168.1.100:5000/api/submit-report"
        ```

3.  **Install on Laptop**:
    *   Copy `HardSecNet_Agent` to `C:\Program Files\HardSecNet_Agent` (requires Admin).
    *   Install Python 3 on the laptop (ensure "Add Python to PATH" is checked).
    *   Install dependencies:
        ```powershell
        pip install requests
        ```

4.  **Test Run**:
    *   Open PowerShell as Admin.
    *   Run: `python C:\Program Files\HardSecNet_Agent\Agent_Client.py`
    *   Check the Server Dashboard to see if the new node appears!

5.  **Automate (Persistence)**:
    *   Set up a **Scheduled Task** to run the agent invisibly on startup.
    ```powershell
    $Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "C:\Program Files\HardSecNet_Agent\Agent_Client.py"
    $Trigger = New-ScheduledTaskTrigger -AtLogon
    $Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName "HardSecNet_Agent" -Action $Action -Trigger $Trigger -Principal $Principal
    ```
    *   Now the agent runs automatically in the background, even if no user is logged in.

---

## Phase 3: Improvements & Hardening

1.  **Secure Communication (HTTPS)**:
    *   Currently, data is sent over HTTP. In a real office, use **HTTPS**.
    *   Generate a self-signed cert or use Let's Encrypt on the server.
    *   Update `Agent_Client.py` to use `https://...` and distribute the CA cert if self-signed.

2.  **Central Policy Management**:
    *   Modify `Agent_Client.py` to fetch a "Task List" from the server.
    *   Allows you to trigger a `Hardener.ps1` run remotely without visiting the laptop.

3.  **Patch Management Integration**:
    *   The current `Auditor.ps1` checks *configuration*.
    *   Add a check for Windows Updates:
        ```powershell
        $updateSession = New-Object -ComObject Microsoft.Update.Session
        $searcher = $updateSession.CreateUpdateSearcher()
        $result = $searcher.Search("IsInstalled=0")
        # If $result.Updates.Count > 0, report "Vulnerable"
        ```

4.  **VPN for Remote Workers**:
    *   If laptops leave the office, they won't reach `192.168.1.100`.
    *   Use **Tailscale** or **ZeroTier** (free for <20 devices) to create a virtual mesh network.
    *   Set the Server IP to the Tailscale/ZeroTier IP (e.g., `100.x.x.x`).

---

**Summary Checklist**:
- [ ] Server running MongoDB & App
- [ ] Server has Static IP
- [ ] Agent Script configured with Server IP
- [ ] Agent installed on Laptop 1 (Test)
- [ ] Verify Dashboard Status
- [ ]Deploy to Laptops 2-10
