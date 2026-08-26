import os
import datetime

CEF_HEADER = "CEF:0|HardSecNet|Enterprise|1.0"

# Rotation settings: 10 MB per file, keep 5 backups
_MAX_BYTES = 10 * 1024 * 1024
_BACKUP_COUNT = 5


class SecurityLogger:
    def __init__(self, log_path="activity.log"):
        self.log_path = log_path

    # ------------------------------------------------------------------
    # Rotation helpers
    # ------------------------------------------------------------------

    def _rotate_if_needed(self):
        """Roll the log file when it exceeds _MAX_BYTES."""
        if not os.path.exists(self.log_path):
            return
        if os.path.getsize(self.log_path) < _MAX_BYTES:
            return

        # Shift existing backups: .5 → deleted, .4 → .5, …, .1 → .2
        for i in range(_BACKUP_COUNT - 1, 0, -1):
            src = f"{self.log_path}.{i}"
            dst = f"{self.log_path}.{i + 1}"
            if os.path.exists(src):
                os.replace(src, dst)

        # Move current log to .1
        os.replace(self.log_path, f"{self.log_path}.1")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def log_event(
        self,
        signature_id,
        name,
        severity,
        source_ip="127.0.0.1",
        user="System",
        msg="Action Performed",
    ):
        """
        Write one CEF-formatted event to the rotating log file.
        Severity: 1 (Info) – 10 (Critical).
        """
        timestamp = datetime.datetime.now().strftime("%b %d %Y %H:%M:%S")
        cef_log = (
            f"{timestamp} {CEF_HEADER}"
            f"|{signature_id}|{name}|{severity}"
            f"|src={source_ip} suid={user} msg={msg}\n"
        )
        try:
            self._rotate_if_needed()
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(cef_log)
        except Exception as e:
            print(f"Logging Failed: {e}")


# Global singleton — import and call logger.log_event(...)
logger = SecurityLogger()
