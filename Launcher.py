import sys
import ctypes
import subprocess
import os
import time

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_powershell(script_name, *args):
    cmd = ["powershell", "-ExecutionPolicy", "Bypass", "-File", script_name] + list(args)
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False) # Let strict output show in console
    return result.returncode

def choice_snapshot():
    run_powershell("Snapshot.ps1")

def choice_audit(audit_type="before"):
    run_powershell("Auditor.ps1", "-Type", audit_type)

def choice_harden():
    run_powershell("Hardener.ps1")

def choice_workflow():
    print("\n--- Step 1: Audit (Before) ---")
    choice_audit("before")
    
    print("\n--- Step 2: Harden System ---")
    choice_harden()
    
    print("\n--- Step 3: Audit (After) ---")
    choice_audit("after")
    
    print("\n--- Step 4: AI Analysis ---")
    # Run python script
    subprocess.run([sys.executable, "AI_Summarizer.py"])

def main():
    if not is_admin():
        print("This script requires Administrator privileges.")
        # Re-run as admin
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
        return

    while True:
        print("\n=== HardSecNet Launcher ===")
        print("1. Run Snapshot")
        print("2. Run Auditor (Audit Before)")
        print("3. Automated Workflow (Audit->Harden->Audit->AI)")
        print("4. Exit")
        
        choice = input("Select an option: ")
        
        if choice == "1":
            choice_snapshot()
        elif choice == "2":
            choice_audit("before")
        elif choice == "3":
            choice_workflow()
        elif choice == "4":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()
