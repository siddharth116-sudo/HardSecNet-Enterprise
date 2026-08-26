import requests
import subprocess
import json
import time
import os
import sys
import platform

# --- CONFIGURATION ---
SERVER_URL = "http://YOUR_SERVER_IP:5000/api/submit-report" # CHANGE THIS to the IP of the central server
NODE_ID = platform.node()
SLEEP_INTERVAL = 600 # 10 Minutes

def run_audit():
    print(f"[*] Running Audit on {NODE_ID}...")
    try:
        # Determine script path (assume relative to this script for simplicity, or packed)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        auditor_path = os.path.join(script_dir, "Auditor.ps1")
        
        if not os.path.exists(auditor_path):
            print(f"[!] Error: Auditor.ps1 not found at {auditor_path}")
            return None

        # Execute PowerShell Audit
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", auditor_path, "-Type", "monitor"],
            capture_output=True, text=True
        )
        
        if result.returncode != 0:
            print(f"[!] Audit Script Failed: {result.stderr}")
            return None
            
        # The script outputs the path to the JSON report
        report_path = result.stdout.strip()
        
        if os.path.exists(report_path):
            with open(report_path, 'r', encoding='utf-16') as f:
                audit_data = json.load(f)
            
            # Add metadata
            audit_data['AgentVersion'] = "1.0.0"
            return audit_data
        else:
            print(f"[!] Report file check failed: {report_path}")
            return None

    except Exception as e:
        print(f"[!] Exception running audit: {e}")
        return None

def submit_report(data):
    if not data: return
    print("[*] Submitting report to server (Secure mTLS)...")
    
    # Path to Certificates (Local to Agent)
    # In production, these should be in a secure location
    cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "certs")
    client_cert = os.path.join(cert_dir, "client.crt")
    client_key = os.path.join(cert_dir, "client.key")
    ca_cert = os.path.join(cert_dir, "ca.crt")
    
    try:
        # Switch to HTTPS
        url = SERVER_URL.replace("http://", "https://")
        
        response = requests.post(
            url, 
            json=data, 
            timeout=10,
            verify=ca_cert, # Verify Server is trusted
            cert=(client_cert, client_key) # Authenticate ourselves
        )
        
        if response.status_code == 200:
            print("[+] Success: Server accepted report.")
            cmd = response.json().get('command')
            if cmd == 'remediate':
                print("[!] Received Remote COMMAND: REMEDIATE")
                targets = response.json().get('targets', [])
                
                script_dir = os.path.dirname(os.path.abspath(__file__))
                hardener_path = os.path.join(script_dir, "Hardener.ps1")
                
                if os.path.exists(hardener_path):
                    cmd_list = ["powershell", "-ExecutionPolicy", "Bypass", "-File", hardener_path]
                    if targets:
                        cmd_list.extend(["-Targets", ",".join(targets)])
                        
                    print(f"[*] Executing Hardener with targets: {targets}")
                    subprocess.run(cmd_list, check=True)
                    
                    # Immediate Re-Audit to verify fix
                    print("[*] Verifying Fixes (Immediate Audit)...")
                    verify_data = run_audit()
                    if verify_data: submit_report(verify_data)
                    
                else:
                    print(f"[!] Error: Hardener.ps1 not found at {hardener_path}")
        else:
            print(f"[!] Server Error: {response.status_code} - {response.text}")
    except requests.exceptions.SSLError as e:
        print(f"[!] SSL/Certificate Error: Handshake Failed. Identity Verification Failed.\n{e}")
    except Exception as e:
        print(f"[!] Network Error: {e}")

def main():
    print(f"--- HardSecNet Agent v1.0 ---\nNode: {NODE_ID}\nServer: {SERVER_URL}\n")
    
    while True:
        data = run_audit()
        if data:
            submit_report(data)
        
        print(f"[*] Sleeping for {SLEEP_INTERVAL} seconds...")
        time.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    main()
