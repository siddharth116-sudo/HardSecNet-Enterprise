from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import datetime

# Enterprise brand palette
NAVY = colors.HexColor('#0B1B34')
ACCENT = colors.HexColor('#2563EB')
ACCENT_SOFT = colors.HexColor('#A9C0E0')
INK = colors.HexColor('#1F2937')
MUTED = colors.HexColor('#6B7280')
LINE = colors.HexColor('#E5E7EB')
OK = colors.HexColor('#16A34A')
OK_BG = colors.HexColor('#ECFDF3')
BAD = colors.HexColor('#DC2626')
BAD_BG = colors.HexColor('#FEF2F2')
WARN = colors.HexColor('#D97706')
HEAD_BG = colors.HexColor('#0F2A4A')
ROW_ALT = colors.HexColor('#F6F8FB')


class ReportGenerator:
    def __init__(self, output_path, audit_data, ai_summary, log_snippet):
        self.output_path = output_path
        self.data = audit_data or {}
        self.summary = ai_summary
        self.log_snippet = log_snippet or ""
        self.styles = getSampleStyleSheet()
        self.width, self.height = A4

        self.s_h2 = ParagraphStyle('hsnH2', parent=self.styles['Heading2'], fontName='Helvetica-Bold',
                                   fontSize=12, textColor=NAVY, spaceBefore=4, spaceAfter=8)
        self.s_body = ParagraphStyle('hsnBody', parent=self.styles['BodyText'], fontName='Helvetica',
                                     fontSize=9.5, leading=14, textColor=INK)
        self.s_cell = ParagraphStyle('hsnCell', parent=self.styles['BodyText'], fontName='Helvetica',
                                     fontSize=8.5, leading=11, textColor=INK)
        self.s_cell_mut = ParagraphStyle('hsnCellMut', parent=self.s_cell, textColor=MUTED, fontName='Courier')

        self.cis_map = {
            "Firewall Domain Profile": "CIS 9.1", "Firewall Private Profile": "CIS 9.2",
            "Firewall Public Profile": "CIS 9.3", "Minimum Password Length": "CIS 1.1.4",
            "Guest Account Status": "CIS 2.3.1.3", "Account Lockout Threshold": "CIS 1.2.2",
            "User Account Control (UAC)": "CIS 2.3.17", "Untrusted Font Blocking": "CIS 18.9.18",
        }

    def _control_id(self, name):
        if name in self.cis_map:
            return self.cis_map[name]
        if name and name.startswith('['):
            return name[1:name.index(']')] if ']' in name else 'Custom'
        return 'Baseline'

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        host = self.data.get('Hostname', 'Unknown')
        ts = self.data.get('Timestamp', datetime.datetime.now().strftime('%Y-%m-%d %H:%M'))

        canvas.setFillColor(NAVY)
        canvas.rect(0, self.height - 0.92 * inch, self.width, 0.92 * inch, fill=1, stroke=0)
        canvas.setFillColor(ACCENT)
        canvas.rect(0, self.height - 0.96 * inch, self.width, 0.045 * inch, fill=1, stroke=0)

        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 15)
        canvas.drawString(0.75 * inch, self.height - 0.55 * inch, "HardSecNet")
        canvas.setFont('Helvetica', 8.5)
        canvas.setFillColor(ACCENT_SOFT)
        canvas.drawString(0.75 * inch, self.height - 0.73 * inch, "Security Audit Report")
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.white)
        canvas.drawRightString(self.width - 0.75 * inch, self.height - 0.5 * inch, f"Host:  {host}")
        canvas.setFillColor(ACCENT_SOFT)
        canvas.drawRightString(self.width - 0.75 * inch, self.height - 0.65 * inch, ts)
        canvas.drawRightString(self.width - 0.75 * inch, self.height - 0.79 * inch,
                               f"{self.data.get('Benchmark', self.data.get('Type', 'CIS baseline'))}")

        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(0.75 * inch, 0.7 * inch, self.width - 0.75 * inch, 0.7 * inch)
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.75 * inch, 0.54 * inch, "Confidential — Internal Security Audit")
        canvas.drawRightString(self.width - 0.75 * inch, 0.54 * inch, f"Page {doc.page}")
        canvas.restoreState()

    def _kpi_band(self, score, passed, failing, total):
        if score >= 80:
            label, fg, bg = "Compliant", OK, OK_BG
        elif score >= 50:
            label, fg, bg = "Needs attention", WARN, colors.HexColor('#FFF7ED')
        else:
            label, fg, bg = "At risk", BAD, BAD_BG

        def cell(big, small, color=NAVY):
            return [Paragraph(f'<font size=20 color="#{color.hexval()[2:]}"><b>{big}</b></font>', self.s_body),
                    Paragraph(f'<font size=8 color="#6B7280">{small}</font>', self.s_body)]

        data = [[
            cell(f"{score}%", "COMPLIANCE SCORE", fg),
            cell(str(passed), "CONTROLS PASSED", OK),
            cell(str(failing), "ACTION REQUIRED", BAD if failing else MUTED),
            cell(label, "POSTURE", fg),
        ]]
        t = Table(data, colWidths=[(self.width - 1.5 * inch) / 4.0] * 4, rowHeights=[0.75 * inch])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12), ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (0, 0), bg),
            ('BACKGROUND', (1, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('LINEAFTER', (0, 0), (-2, -1), 0.5, LINE),
            ('BOX', (0, 0), (-1, -1), 0.5, LINE),
        ]))
        return t

    def build_pdf(self):
        doc = SimpleDocTemplate(self.output_path, pagesize=A4, topMargin=1.25 * inch,
                                bottomMargin=0.9 * inch, leftMargin=0.75 * inch, rightMargin=0.75 * inch)
        story = []
        checks = self.data.get('Checks', [])
        total = len(checks)
        passed = sum(1 for c in checks if c.get('Status') == 'Compliant')
        failing = total - passed
        score = int((passed / total) * 100) if total else 0

        story.append(self._kpi_band(score, passed, failing, total))
        story.append(Spacer(1, 0.3 * inch))

        story.append(Paragraph("Executive summary", self.s_h2))
        summary_text = (self.summary or "No summary available.").replace("\n", "<br/>")
        story.append(Paragraph(summary_text, self.s_body))
        story.append(Spacer(1, 0.28 * inch))

        story.append(Paragraph("Control findings", self.s_h2))
        table_data = [['#', 'Control', 'Current value', 'Status']]
        for check in checks:
            name = check.get('Name', '')
            compliant = check.get('Status') == 'Compliant'
            status_para = Paragraph(
                f'<font color="#{(OK if compliant else BAD).hexval()[2:]}"><b>'
                f'{"COMPLIANT" if compliant else "ACTION REQUIRED"}</b></font>', self.s_cell)
            table_data.append([
                Paragraph(self._control_id(name), self.s_cell_mut),
                Paragraph(name, self.s_cell),
                Paragraph(str(check.get('Value', '')), self.s_cell_mut),
                status_para,
            ])

        t = Table(table_data, colWidths=[0.95 * inch, 3.0 * inch, 1.7 * inch, 1.35 * inch], repeatRows=1)
        style = [
            ('BACKGROUND', (0, 0), (-1, 0), HEAD_BG),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.4, LINE),
            ('BOX', (0, 0), (-1, -1), 0.5, LINE),
        ]
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                style.append(('BACKGROUND', (0, i), (-1, i), ROW_ALT))
        t.setStyle(TableStyle(style))
        story.append(t)

        doc.build(story, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
