from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import datetime

class ReportGenerator:
    def __init__(self, output_path, audit_data, ai_summary, log_snippet):
        self.output_path = output_path
        self.data = audit_data
        self.summary = ai_summary
        self.log_snippet = log_snippet
        self.styles = getSampleStyleSheet()
        self.width, self.height = letter

        # Standard CIS Mapping
        self.cis_map = {
            "Firewall Domain Profile": {"id": "CIS 9.1", "desc": "Ensures Domain Firewall is active."},
            "Firewall Private Profile": {"id": "CIS 9.2", "desc": "Ensures Private Firewall is active."},
            "Firewall Public Profile": {"id": "CIS 9.3", "desc": "Ensures Public Firewall is active."},
            "Minimum Password Length": {"id": "CIS 5.2.14", "desc": "Enforces strong password complexity."},
            "Guest Account Status": {"id": "CIS 5.1.2", "desc": "Disables the Guest account."},
            "Account Lockout Threshold": {"id": "CIS 5.2.2", "desc": "Locks accounts after failed login attempts."},
            "User Account Control (UAC)": {"id": "CIS 2.3.17.2", "desc": "Ensures UAC prompts for administrative consent."},
            "Untrusted Font Blocking": {"id": "CIS 18.9.18.2", "desc": "Mitigates parsing vulnerabilities."}
        }

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        # Simple Header
        canvas.setFont('Helvetica-Bold', 14)
        canvas.drawString(inch, self.height - 0.75 * inch, "HardSecNet - Security Audit Report")
        
        canvas.setFont('Helvetica', 9)
        canvas.drawString(inch, self.height - 0.95 * inch, f"Generated: {self.data.get('Timestamp', str(datetime.datetime.now()))} | Host: {self.data.get('Hostname', 'Unknown')}")
        
        canvas.line(inch, self.height - 1.0 * inch, self.width - inch, self.height - 1.0 * inch)

        # Simple Footer
        canvas.setFont('Helvetica-Oblique', 8)
        canvas.drawString(inch, 0.75 * inch, "Confidential - Internal Security Audit")
        canvas.drawRightString(self.width - inch, 0.75 * inch, f"Page {doc.page}")
        canvas.restoreState()

    def build_pdf(self):
        doc = SimpleDocTemplate(self.output_path, pagesize=letter)
        story = []

        # 1. Compliance Summary
        checks = self.data.get('Checks', [])
        total = len(checks)
        passed = sum(1 for c in checks if c.get('Status') == 'Compliant')
        score = int((passed / total) * 100) if total > 0 else 0
        
        story.append(Paragraph(f"Compliance Score: {score}%", self.styles['Heading1']))
        story.append(Spacer(1, 0.2*inch))

        # 2. Executive Summary
        story.append(Paragraph("Executive Summary", self.styles['Heading2']))
        summary_text = self.summary.replace("\n", "<br/>") if self.summary else "No summary available."
        story.append(Paragraph(summary_text, self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))

        # 3. Policy Details
        story.append(Paragraph("Policy Details", self.styles['Heading2']))
        
        # Table Headers
        table_data = [['Control ID', 'Policy Name', 'Result', 'Status']]
        
        for check in checks:
            name = check.get('Name')
            val = str(check.get('Value'))
            status = check.get('Status')
            meta = self.cis_map.get(name, {"id": "Custom", "desc": ""})
            
            # Simple color coding text
            status_text = f"PASS" if status == "Compliant" else "FAIL"
            status_color = colors.green if status == "Compliant" else colors.red
            
            row = [
                meta['id'],
                Paragraph(name, self.styles['BodyText']),
                Paragraph(val, self.styles['BodyText']),
                Paragraph(f"<font color={status_color}>{status_text}</font>", self.styles['BodyText'])
            ]
            table_data.append(row)

        t = Table(table_data, colWidths=[1*inch, 2.5*inch, 1.5*inch, 1*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.4*inch))

        # 4. Audit Log Trace
        story.append(Paragraph("Audit Integrity Trace", self.styles['Heading2']))
        story.append(Paragraph("Recent System Activity (Last 5 Events):", self.styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        
        # Simple monospaced log block
        log_style = ParagraphStyle('Log', parent=self.styles['Code'], fontSize=8, leading=10)
        snippet_fmt = self.log_snippet.replace('\n', '<br/>')
        story.append(Paragraph(snippet_fmt, log_style))

        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)