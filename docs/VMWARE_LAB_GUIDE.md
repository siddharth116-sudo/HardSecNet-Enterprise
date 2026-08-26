# HardSecNet Guide: Testing with VMware Workstation/Player

Testing in a Virtual Machine (VM) is the industry standard for security tools. It isolates your testing and allows you to simulate a real enterprise network on a single laptop.

## Phase 1: Configure VMware Network
**CRITICAL:** By default, VMs use "NAT" which hides them behind your host IP. You need them to appear as separate devices on your WiFi.

1. Open VMware Workstation / Player.
2. Right-click your Windows VM -> **Settings**.
3. Go to **Network Adapter**.
4. Select **Bridged: Connected directly to the physical network**.
   - *Check "Replicate physical network connection state" if available.*
5. Click **OK** and Start the VM.

*Result: Your VM will now get its own IP address (e.g., 192.168.1.50) from your home Router, just like a separate physical laptop.*

---

## Phase 2: Prepare the Target VM

1. **Log in**: Use a Local Account (not Microsoft).
   - *Recommendation: Create a user `HardSecAdmin` with password `HardSec123!`*
2. **Copy the Setup Script**:
   - Drag and drop `Remote_Agent_Setup.ps1` from your Host to the VM Desktop.
   - *If Drag-Drop fails, open Notepad in VM, paste the script code, and save as `setup.ps1`.*
3. **Run the Script**:
   - Right-click `Remote_Agent_Setup.ps1` -> **Run with PowerShell**.
   - Wait for it to change the Network Profile to 'Private' and enable WinRM.
4. **Get the IP**:
   - The script will display the IP at the end (e.g., `192.168.1.x`).
   - Note this down.

---

## Phase 3: Connect from Host (Dashboard)

1. On your **Host Machine** (Physical Laptop), open the HardSecNet Dashboard.
2. Click **"+" (Add Node)**.
3. Select **Remote Node**.
4. Enter Details:
   - **IP**: The VM's IP (from Phase 2).
   - **Username**: `HardSecAdmin` (or whatever local admin you used in VM).
   - **Password**: `HardSec123!`
5. Click **Connect**.

---

## Troubleshooting

**Q: "Connection Failed" or "Timeout"**
- **Ping Test:** Open Host CMD and type `ping <VM_IP>`.
  - If it fails ("Request Timed Out"), your Firewall is blocking ICMP.
  - Fix in VM: Open PowerShell (Admin) and run:
    `Set-NetFirewallRule -Name FPS-ICMP4-ERQ-In -Enabled True`

**Q: "Access Denied"**
- You are likely using a Microsoft Account/PIN (e.g., `user@outlook.com`).
- **Fix:** You MUST use a local account. inside the VM run:
  `net user HardSecAdmin HardSec123! /add`
  `net localgroup Administrators HardSecAdmin /add`
  Then try connecting with internal credentials `HardSecAdmin` / `HardSec123!`.
