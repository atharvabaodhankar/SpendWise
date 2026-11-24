import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_report():
    doc = Document()

    # Configure 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Professional Academic Color Palette (Deep Slate / Navy / Subtle Gray)
    COLOR_PRIMARY = RGBColor(15, 41, 66)      # Academic Navy #0F2942
    COLOR_SECONDARY = RGBColor(30, 58, 95)    # Slate Blue #1E3A5F
    COLOR_DARK = RGBColor(30, 41, 59)         # Deep Slate Charcoal #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Subtle Slate #64748B
    HEX_HEADER_BG = "F1F5F9"                  # Light Slate Tint for Table Headers
    HEX_ALT_ROW_BG = "F8FAFC"                 # Soft Alternating Row Tint
    HEX_BORDER_OUTER = "334155"               # Outer Table Border (0.75pt - 1pt)
    HEX_BORDER_INNER = "E2E8F0"               # Inner Hairline Row Divider (0.5pt)

    # Set normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = COLOR_DARK
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # XML Helpers for Professional Academic Styling
    # -------------------------------------------------------------
    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=110, bottom=110, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
            node = OxmlElement(margin)
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def set_academic_table_borders(table):
        # Clean IEEE/ACM booktabs style:
        # Crisp top and bottom borders, hairline inner row dividers, zero vertical lines.
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="8" w:space="0" w:color="{HEX_BORDER_OUTER}"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{HEX_BORDER_OUTER}"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_INNER}"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=4, bold=False, italic=False, font_size=11, color=COLOR_DARK):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if text:
            run = p.add_run(text)
            run.bold = bold
            run.italic = italic
            run.font.size = Pt(font_size)
            run.font.color.rgb = color
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(17)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(7)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(bold_prefix + ": ")
        r_bold.bold = True
        r_bold.font.color.rgb = COLOR_DARK
        r_text = p.add_run(text)
        r_text.font.color.rgb = COLOR_DARK
        return p

    def add_numbered(num_str, bold_prefix, text):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_num = p.add_run(num_str + " ")
        r_num.bold = True
        r_bold = p.add_run(bold_prefix + ": ")
        r_bold.bold = True
        r_text = p.add_run(text)
        return p

    # Professional Academic Table Generator (Subtle light-slate tint, dark slate text, booktabs style)
    def add_table_data(headers, rows, col_widths=None, alignment=WD_TABLE_ALIGNMENT.CENTER):
        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = alignment
        set_academic_table_borders(table)

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], HEX_HEADER_BG)
            set_cell_margins(hdr_cells[i], top=130, bottom=130, left=150, right=150)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = COLOR_DARK

        # Data Rows
        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = HEX_ALT_ROW_BG if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                row_cells[c_idx].text = str(cell_value)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=150, right=150)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.size = Pt(9.0)
                    r.font.color.rgb = COLOR_DARK

        # Apply Column Widths
        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = Inches(width)

        doc.add_paragraph().paragraph_format.space_after = Pt(5)
        return table

    # Tab-Stop Native Dot-Leader TOC Entry (Perfect right-margin alignment)
    def add_toc_item(title, page_str, level=1):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15

        if level == 1:
            p.paragraph_format.left_indent = Inches(0)
        elif level == 2:
            p.paragraph_format.left_indent = Inches(0.25)
        elif level == 3:
            p.paragraph_format.left_indent = Inches(0.45)

        # 9360 dxa = 6.5 inches across standard 8.5" paper with 1" margins
        tabs_xml = '<w:tabs xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:tab w:val="right" w:leader="dot" w:pos="9360"/></w:tabs>'
        p._p.get_or_add_pPr().append(parse_xml(tabs_xml))

        r_title = p.add_run(title)
        if level == 1:
            r_title.bold = True
            r_title.font.size = Pt(10.5)
            r_title.font.color.rgb = COLOR_PRIMARY
        else:
            r_title.font.size = Pt(10)
            r_title.font.color.rgb = COLOR_DARK

        p.add_run("\t")
        r_page = p.add_run(str(page_str))
        r_page.font.size = Pt(10)
        if level == 1:
            r_page.bold = True
            r_page.font.color.rgb = COLOR_PRIMARY
        else:
            r_page.font.color.rgb = COLOR_DARK

    def add_figure(image_path, caption_text, width_inches=5.8):
        if os.path.exists(image_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(3)
            p_img.add_run().add_picture(image_path, width=Inches(width_inches))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(1)
            p_cap.paragraph_format.space_after = Pt(10)
            r = p_cap.add_run(caption_text)
            r.italic = True
            r.font.size = Pt(9.5)
            r.font.color.rgb = COLOR_MUTED
        else:
            add_p(f"[Image not found: {image_path}]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=110, bottom=110, left=160, right=160)
        
        # Subtle single border
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:left w:val="single" w:sz="12" w:space="0" w:color="3B82F6"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.8)
        run.font.color.rgb = RGBColor(30, 41, 59)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ==========================================
    # 1. TITLE / COVER PAGE
    # ==========================================
    mit_logo_path = os.path.join("screenshots", "mit_logo.png")
    if os.path.exists(mit_logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(14)
        p_logo.paragraph_format.space_after = Pt(16)
        p_logo.add_run().add_picture(mit_logo_path, width=Inches(3.8))

    add_p("A Project Report on", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8, space_after=6, font_size=14, bold=True, color=COLOR_DARK)
    
    p_title = add_p("“SpendWise : An Intelligent Full-Stack Personal Money Ledger, Multi-Wallet Tracker, and Agentic Financial Assistant”",
                    align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=14, font_size=18, bold=True, color=COLOR_PRIMARY)

    add_p("COURSE NAME: WEB TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=1, font_size=12, bold=True, color=COLOR_SECONDARY)
    add_p("COURSE CODE: 2304362L", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=16, font_size=12, bold=True, color=COLOR_SECONDARY)

    add_p("Submitted by,", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=4, space_after=4, font_size=11.5, bold=True)

    # Students Table (Clean, Professional)
    students_headers = ["Name of Student", "Exam Seat No."]
    students_rows = [
        ["Atharva Baodhankar", "202502040030"],
        ["Tejas Patil", "202502040021"],
        ["Manas Prabhu", "202502040026"]
    ]
    add_table_data(students_headers, students_rows, col_widths=[3.2, 2.2], alignment=WD_TABLE_ALIGNMENT.CENTER)

    add_p("A Report submitted to MIT Academy of Engineering, Alandi (D), Pune in partial fulfillment of the academic requirements for the degree of",
          align=WD_ALIGN_PARAGRAPH.CENTER, space_before=14, space_after=6, font_size=10.5, color=COLOR_DARK)

    add_p("BACHELOR OF TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=1, font_size=13, bold=True, color=COLOR_PRIMARY)
    add_p("in", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1, font_size=10.5, italic=True)
    add_p("Computer Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=10, font_size=12, bold=True)

    add_p("Department of Computer Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=1, font_size=11, bold=True)
    add_p("MIT Academy of Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1, font_size=11, bold=True)
    add_p("(An Autonomous Institute Affiliated to Savitribai Phule Pune University)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=1, font_size=9.5, italic=True)
    add_p("Alandi (D), Pune – 412105", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=1, space_after=4, font_size=10)
    add_p("Academic Year 2025–2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=2, space_after=0, font_size=11, bold=True)

    doc.add_page_break()

    # ==========================================
    # 2. CERTIFICATE & ACKNOWLEDGEMENT
    # ==========================================
    add_h1("Certificate")
    add_p("This is to certify that the project report entitled “SpendWise : An Intelligent Full-Stack Personal Money Ledger, Multi-Wallet Tracker, and Agentic Financial Assistant” submitted by Atharva Baodhankar (Exam Seat No: 202502040030), Tejas Patil (Exam Seat No: 202502040021), and Manas Prabhu (Exam Seat No: 202502040026) is a bona fide work completed under the guidance of the faculty of Department of Computer Engineering, MIT Academy of Engineering, Alandi (D), Pune, in partial fulfillment of the requirements for the course Web Technology (Course Code: 2304362L) for the Bachelor of Technology in Computer Engineering during the academic year 2025–2026.",
          space_before=8, space_after=18)

    # Signature Block Table
    sig_headers = ["Guide / Faculty In-Charge", "Head of Department", "External Examiner"]
    sig_rows = [
        ["\n\n_______________________\nSignature", "\n\n_______________________\nSignature", "\n\n_______________________\nSignature"]
    ]
    add_table_data(sig_headers, sig_rows, col_widths=[2.1, 2.1, 2.1])

    add_h1("Acknowledgement")
    add_p("We express our profound gratitude to our project guide and faculty members of the Department of Computer Engineering at MIT Academy of Engineering for their invaluable guidance, encouragement, and technical critiques throughout the conceptualization, development, and testing of SpendWise. We also extend our sincere appreciation to our peers and family for their continuous support during the completion of this Web Technology capstone project.",
          space_before=6, space_after=14)

    doc.add_page_break()

    # ==========================================
    # 3. ABSTRACT
    # ==========================================
    add_h1("Abstract")
    add_p("SpendWise is an intelligent, full-stack personal money ledger and multi-wallet management web platform engineered to solve the persistent challenges of personal finance in the modern digital Indian economy. While UPI and mobile banking have made digital payments frictionless, personal money tracking remains burdened by 'SaaS clutter'—unreadable card grids, decorative gradients, and high manual entry friction. SpendWise establishes a 'Quiet Ledger' design paradigm where the transaction register is the undisputed hero of the interface, supported by an ultra-fast, mobile-first responsive architecture.")

    add_p("Developed with modern web technologies, SpendWise harnesses React 19 for declarative UI rendering, Vite for instantaneous hot-module builds, and Tailwind CSS v4 featuring native CSS custom properties and an authentic Indian banknote color palette (Stone ₹500, Saffron ₹200, Lagoon ₹50, Lavender ₹100, Olive ₹20, Cocoa ₹10). The persistence tier leverages Firebase Cloud Firestore and Firebase Authentication with real-time websocket synchronization, augmented by Vercel serverless edge API endpoints for AI chat integration and transactional email alerts.")

    add_p("A cornerstone innovation is the native Dual-Wallet Ledger model, segregating physical Cash in hand from Online accounts (UPI, Bank, Cards) with an intuitive 'Set exact balance' calibration workflow. The hero metric is fully customizable via a quiet segmented control, allowing users to toggle between 'Spent this month' (default), 'Spent today', and 'Net balance'. Furthermore, SpendWise incorporates an integrated Peer Debt Splitting Engine with one-tap settlement, a Monthly Budget Pace Velocity Tracker, a Multi-Asset Investment Portfolio, and a Salary Timeline Tracker. To pioneer the emerging agentic web paradigm, SpendWise integrates an open Model Context Protocol (MCP) server with client-side SHA-256 hashed API keys, empowering autonomous AI assistants (Claude, Cursor, Antigravity) to query and log expenses programmatically. With 100% test coverage across 139 end-to-end integration tests, SpendWise provides an authoritative, production-grade reference for modern full-stack web engineering.",
          space_after=14)

    doc.add_page_break()

    # ==========================================
    # 4. CONTENTS (TOC WITH NATIVE DOT LEADERS)
    # ==========================================
    add_h1("Contents")
    toc_items = [
        ("Certificate and Acknowledgement", "ii", 1),
        ("Abstract", "iii", 1),
        ("List of Figures", "v", 1),
        ("List of Tables", "vi", 1),
        ("1  Introduction", "1", 1),
        ("1.1 Problem Statement", "1", 2),
        ("1.2 Motivation", "2", 2),
        ("1.3 Objectives", "2", 2),
        ("1.4 Scope of the Project", "3", 2),
        ("1.5 Existing System vs Proposed System", "3", 2),
        ("2  Requirement Collection & Tech Stack", "5", 1),
        ("2.1 Functional Requirements Matrix", "5", 2),
        ("2.2 Non-Functional Requirements & Benchmarks", "6", 2),
        ("2.3 Modern Web Technology Stack", "7", 2),
        ("2.4 Hardware & Software Specifications", "8", 2),
        ("3  System Modeling and Architecture", "9", 1),
        ("3.1 Three-Tier Client-Server & Agentic Architecture", "9", 2),
        ("3.2 System Actors and Permissions", "10", 2),
        ("3.3 Core Use Cases and Operational Workflows", "10", 2),
        ("4  Database Architecture and Firestore Schema", "12", 1),
        ("4.1 NoSQL Document Entities Overview", "12", 2),
        ("4.2 Comprehensive Firestore Schema & Data Dictionary", "13", 2),
        ("4.3 Entity Relationships and Document Linkages", "14", 2),
        ("4.4 Declarative Security Rules & Real-Time Sync", "15", 2),
        ("5  System Implementation, UI Walkthrough & Algorithms", "16", 1),
        ("5.1 Frontend Engineering & Design System", "16", 2),
        ("5.2 User Interface Walkthrough & Module Analysis", "17", 2),
        ("5.3 Core Algorithms & Business Logic", "20", 2),
        ("6  Outcomes, Applications and Future Work", "22", 1),
        ("6.1 Performance Benchmarks & Measurable Outcomes", "22", 2),
        ("6.2 Real-World Applications", "23", 2),
        ("6.3 Future Roadmap", "23", 2),
        ("Conclusion", "24", 1),
        ("References", "25", 1)
    ]
    for title, pg, lvl in toc_items:
        add_toc_item(title, pg, level=lvl)

    doc.add_page_break()

    # List of Figures (With Native Dot Leaders)
    add_h1("List of Figures")
    fig_items = [
        ("Figure 3.1: Three-Tier Client-Server and Agentic Architecture", "9"),
        ("Figure 4.1: Firestore Document Relationship and Data Flow Model", "14"),
        ("Figure 5.1: SpendWise Landing Page & Conversational Hero Section", "17"),
        ("Figure 5.2: Main Ledger Dashboard & Dual-Wallet Expense Tracker", "18"),
        ("Figure 5.3: Investment Portfolio & Asset Holdings Manager", "18"),
        ("Figure 5.4: Category Spending Breakdown with Banknote-Hued Palette", "19"),
        ("Figure 5.5: Dual-Wallet Distribution & 6-Month Spending Outlay Trend", "19"),
        ("Figure 5.6: Settings & Integrations: Model Context Protocol (MCP) Console", "20")
    ]
    for title, pg in fig_items:
        add_toc_item(title, pg, level=2)

    doc.add_page_break()

    # List of Tables (With Native Dot Leaders)
    add_h1("List of Tables")
    tbl_items = [
        ("Table 1.1: Comparative Analysis: Conventional Expense Apps vs SpendWise", "4"),
        ("Table 2.1: Functional Requirements Specification Matrix", "5"),
        ("Table 2.2: Non-Functional Requirements & Quantitative Benchmarks", "6"),
        ("Table 2.3: Modern Web Technology Stack & Architectural Roles", "7"),
        ("Table 2.4: System Hardware & Software Operating Environment", "8"),
        ("Table 3.1: System Actors, Access Boundaries, and Privileges", "10"),
        ("Table 3.2: Primary System Use Cases & Operational Workflows", "11"),
        ("Table 4.1: Comprehensive Firestore NoSQL Data Dictionary", "13"),
        ("Table 6.1: Measurable Engineering Outcomes & Performance Benchmarks", "22")
    ]
    for title, pg in tbl_items:
        add_toc_item(title, pg, level=2)

    doc.add_page_break()

    # ==========================================
    # CHAPTER 1: INTRODUCTION
    # ==========================================
    add_h1("Chapter 1: Introduction")
    
    add_h2("1.1 Problem Statement")
    add_p("The rapid proliferation of Unified Payments Interface (UPI), digital banking, and mobile wallets has completely transformed daily commerce in India. However, personal financial management remains fragmented, mentally taxing, and prone to abandonment. Contemporary budgeting applications suffer from distinct systemic shortcomings:")
    
    add_numbered("1.", "The Dual-Wallet Reality", "In India, money flows simultaneously through two separate channels: Online (UPI, net banking, cards) and Physical Cash (ATMs, local vendors, transport). Most existing tools force all funds into a single abstract number, causing cash balances to drift into negative figures or escape accounting entirely.")
    add_numbered("2.", "SaaS Template Noise ('UI Clutter')", "The vast majority of modern finance apps are built using generic SaaS dashboard kits—overwhelming users with gradient cards, animated radial gauges, and micro-labels. This visual noise creates high cognitive fatigue, obscuring the primary user question: 'What did I spend today, and where does my money stand?'")
    add_numbered("3.", "Fragmented Bill Splitting", "Students and roommates frequently split shared living expenses (groceries, dining, rent). Standalone splitting apps (e.g., Splitwise) operate completely disconnected from personal ledgers, forcing users to either record the full bill (distorting monthly spend) or manage duplicate entries across two apps.")
    add_numbered("4.", "Data Entry Friction & Agentic Absence", "Manually entering every micro-transaction (e.g., ₹15 tea or ₹90 lunch) is the single largest cause of user churn. Despite the rapid emergence of desktop AI coding assistants and LLMs, no mainstream ledger exposes an open standard (such as Model Context Protocol) for external agents to record transactions on the user's behalf.")

    add_h2("1.2 Motivation")
    add_p("SpendWise was conceived to deliver an opinionated, calm, and mathematically sound financial ledger designed around how money actually moves in India. The core motivations include:")
    add_bullet("Quiet Ledger Philosophy", "Finance is inherently stressful. A personal money manager should feel like a serene, printed passbook rather than an aggressive crypto trading terminal. Clean typography, tabular numerals, and authentic Indian banknote hues create an effortless logging habit.")
    add_bullet("Seamless Cash-UPI Reconciliation", "Equipping users with an instant, non-destructive 'Set exact balance' calibration workflow that automatically computes audit adjustments without corrupting past transaction history.")
    add_bullet("Bridging Human & Agentic Workflows", "Empowering users to log expenses either via a lightning-fast web drawer (< 3 seconds) or conversationally via autonomous AI agents using the Model Context Protocol (MCP).")
    add_bullet("Full-Stack Web Technology Rigor", "Demonstrating advanced mastery of React 19 concurrent features, Vite bundling, Tailwind CSS v4 variables, Firebase Cloud Firestore real-time websockets, and Vercel edge serverless functions.")

    add_h2("1.3 Objectives")
    add_p("The foundational technical and design objectives of the SpendWise platform are:")
    add_bullet("Elevate the Ledger as the Hero", "Eliminate boxed cards, borders, and decorative clutter, placing the chronological day-grouped transaction stream front and center.")
    add_bullet("Configurable Spending Hero Metric", "Allow users to toggle the loud balance figure between 'Spent this month' (default), 'Spent today', and 'Net balance', persisting user preferences across sessions in localStorage.")
    add_bullet("Native Dual-Wallet Segregation", "Maintain independent real-time liquidity tracking for Online accounts and Physical Cash, complete with negative cash warnings.")
    add_bullet("Integrated Social Debt Ledger", "Enable equal and custom bill splitting among peers with one-tap debt settlement that automatically updates wallet ledgers.")
    add_bullet("Model Context Protocol (MCP) Integration", "Implement an open MCP server with client-side SHA-256 hashed API key management, enabling 26 programmatic tool operations for AI agents.")

    add_h2("1.4 Scope of the Project")
    add_p("The functional boundary of SpendWise is explicitly demarcated as follows:")
    add_bullet("In Scope", "Responsive Single Page Application (320px mobile to 1920px desktop); Firebase Auth with session persistence; Dual-wallet expense and income logging; 20-item boundary-safe ledger pagination; Direct touch deletion with confirmation modal; Dual-mode balance calibration; Peer debt splitting and settlement; Monthly budget pace velocity tracking; Multi-asset investment portfolio; Salary timeline with month-over-month delta; Recharts visual analytics; MCP server and SHA-256 API key management.")
    add_bullet("Out of Scope", "Direct banking SMS scraping (intentionally excluded to preserve user privacy and comply with financial data regulations); Live payment gateway transfers (settlements are recorded in ledger, not executed via bank rails); Multi-currency conversion (standardized exclusively in Indian Rupees ₹).")

    add_h2("1.5 Existing System vs Proposed System")
    add_p("Table 1.1 contrasts conventional financial tracking mechanisms against the proposed SpendWise platform across core engineering dimensions.")

    comp_headers = ["Dimension", "Spreadsheets / Manual", "Conventional SaaS Apps", "Proposed SpendWise Platform"]
    comp_rows = [
        ["Design Philosophy", "Unstructured grid; no hierarchy", "Noisy card boxes, gradients, animations", "Quiet Ledger: print-inspired, unboxed, tabular"],
        ["Wallet Architecture", "Manual formula columns", "Single aggregated bank balance", "Dual-Wallet: Online (UPI) & Cash side-by-side"],
        ["Hero Metric Focus", "Requires manual SUM() formulas", "Forces Net Worth / Aggregated Balance", "Configurable: Spent Month (default), Today, Net"],
        ["Data Entry Speed", "High friction, requires PC", "Cluttered forms with mandatory fields", "Rapid drawer (<3s), quick chips, or MCP chat"],
        ["Bill Splitting", "Disconnected in separate apps", "Rarely integrated with personal cash", "Native Peer Debt Ledger with auto-reconciliation"],
        ["Balance Adjustment", "Manual cell edits without audit", "Cryptic account re-balancing", "Dual-mode 'Set Exact Balance' with auto-delta audit"],
        ["AI Agent Connectivity", "None", "Closed proprietary gardens", "Open Model Context Protocol (MCP) + SHA-256"],
        ["Color Hierarchy", "Default Excel fills", "Random neon Tailwind-500s", "Authentic Indian Banknote hues (₹10 to ₹500)"],
        ["Real-Time Sync", "Manual cloud save / conflict", "Periodic polling / delayed refresh", "Firebase Firestore real-time onSnapshot listeners"]
    ]
    add_table_data(comp_headers, comp_rows, col_widths=[1.4, 1.6, 1.7, 1.8])

    doc.add_page_break()

    # ==========================================
    # CHAPTER 2: REQUIREMENT COLLECTION & TECH STACK
    # ==========================================
    add_h1("Chapter 2: Requirement Collection & Tech Stack")
    
    add_h2("2.1 Functional Requirements Matrix")
    add_p("Functional requirements define the core operational capabilities, inputs, and behavioral contracts enforced across all SpendWise modules, summarized in Table 2.1.")

    fr_headers = ["Module", "Req ID", "Functional Specification & Behavioral Contract"]
    fr_rows = [
        ["Authentication", "FR-01", "Secure email/password signup and login via Firebase Auth; session token persistence across browser reloads; initial balance calibration wizard upon first login."],
        ["Dual-Wallet Ledger", "FR-02", "Maintain independent synchronized balances for Online (Bank/UPI) and Physical Cash; invariant Net = Online + Cash enforced on all updates."],
        ["Hero Metric Engine", "FR-03", "Display primary figure in tabular IBM Plex Sans; segmented control toggling 'Spent this month' (default), 'Spent today', and 'Net balance'; persist choice in localStorage."],
        ["Transaction Ledger", "FR-04", "Responsive expense creation drawer; 32px auto-focused amount input; day groupings with local subtotals; 20-item pagination with boundary-safe clamps."],
        ["Touch Deletion", "FR-05", "Always-visible 40px touch-accessible delete trash icon on every transaction row; confirmation modal verification prior to Firestore deletion."],
        ["Balance Calibration", "FR-06", "Dual-mode balance manager supporting exact balance declaration and relative (+/-) adjustments; auto-generates audit transactions with zero history corruption."],
        ["Peer Debt Splitting", "FR-07", "Split expenses among registered peers (equal/custom); real-time 'Owed to you' vs 'You owe' sidebar tally; one-tap debt settlement reconciling wallet balances."],
        ["Monthly Budget Pace", "FR-08", "Configurable monthly spending limit; daily pace velocity tick indicator; color transition to --debit when limit is breached; single contextual alert."],
        ["Investment Portfolio", "FR-09", "Track Mutual Funds, Fixed Deposits, Gold, Silver, Stocks; accurate zero-return display '₹0.00 (no change yet)'; dynamic asset filter tabs."],
        ["Salary Timeline", "FR-10", "Chronological salary income timeline with 1px vertical guides and month-over-month delta calculations (+/- from previous month)."],
        ["Model Context Protocol", "FR-11", "Client-side SHA-256 hashed API key management (`spw_live_...`); expose 26 MCP tools for autonomous AI agent inspection and expense logging."]
    ]
    add_table_data(fr_headers, fr_rows, col_widths=[1.3, 0.8, 4.4])

    add_h2("2.2 Non-Functional Requirements & Benchmarks")
    add_p("Table 2.2 defines the architectural quality attributes, security constraints, and quantitative engineering benchmarks achieved by the platform.")

    nfr_headers = ["Category", "Req ID", "Requirement Specification", "Benchmark / Enforcement Mechanism"]
    nfr_rows = [
        ["Performance", "NFR-01", "Initial Page Load Time", "< 1.5 seconds on 4G mobile networks via Vite bundling"],
        ["Performance", "NFR-02", "Optimistic State Latency", "< 50ms local UI response on transaction add/delete"],
        ["Performance", "NFR-03", "Real-Time Sync Latency", "< 300ms multi-device propagation via Firestore websockets"],
        ["Performance", "NFR-04", "Production Bundle Footprint", "< 320 kB gzipped total JavaScript bundle size"],
        ["Security", "NFR-05", "Client Cryptographic Hashing", "SHA-256 via W3C Web Crypto API for all API keys"],
        ["Security", "NFR-06", "Row-Level Cloud Security", "Firestore security rules isolating data by request.auth.uid"],
        ["Security", "NFR-07", "Zero Secret Leakage", "API keys hashed client-side; plaintexts never hit database"],
        ["Usability", "NFR-08", "Single Typographic Family", "IBM Plex Sans with tabular numerals and native ₹ glyph"],
        ["Usability", "NFR-09", "Touch Target Accessibility", "Minimum 40px × 40px hit area on all interactive controls"],
        ["Reliability", "NFR-10", "Dual-Wallet Accounting Invariant", "Net Balance = Online + Cash strictly maintained at all times"],
        ["Quality", "NFR-11", "Automated Test Coverage", "100% pass rate across 139 end-to-end integration tests"]
    ]
    add_table_data(nfr_headers, nfr_rows, col_widths=[1.1, 0.8, 2.3, 2.3])

    add_h2("2.3 Modern Web Technology Stack")
    add_p("Table 2.3 documents the integrated web technology stack chosen for maximum performance, developer ergonomics, and architectural robustness.")

    tech_headers = ["Layer", "Technology", "Version", "Technical Justification & Role"]
    tech_rows = [
        ["Frontend UI", "React", "19.1.0", "Concurrent rendering, modern hook primitives, and declarative state orchestration."],
        ["Build Tool", "Vite", "7.1.6", "Native ES modules build engine offering sub-second Hot Module Replacement (HMR)."],
        ["Styling System", "Tailwind CSS", "4.1.11", "Utility-first CSS engine with native CSS custom properties and Indian banknote palette."],
        ["Client Routing", "React Router DOM", "7.9.5", "Client-side declarative routing, nested route layouts, and navigation state."],
        ["Visual Charts", "Recharts", "3.3.0", "D3-based responsive SVG charting for category outlays and 6-month trends."],
        ["Iconography", "Lucide React", "1.16.0", "Crisp, accessible SVG icon components rendered at consistent 18px stroke."],
        ["Typography", "IBM Plex Sans", "Google Fonts", "Engineered grotesque sans-serif with native Indian Rupee (₹) and tabular numerals."],
        ["Cloud Database", "Firebase Firestore", "Cloud", "NoSQL document store with real-time websocket subscriptions (`onSnapshot`)."],
        ["Authentication", "Firebase Auth", "Cloud", "Secure JWT token generation, email/password handling, and user session management."],
        ["Serverless Edge", "Vercel Functions", "Node 20.x", "Edge serverless API routes for AI chat operations and Nodemailer Gmail alerts."],
        ["Agent Protocol", "Model Context Protocol", "1.0.0+", "Open standard protocol for secure programmatic tool execution by LLM agents."],
        ["Testing & QA", "Vitest & RTL", "5.1.0", "Fast unit and integration test runner executing 139 verified test cases."]
    ]
    add_table_data(tech_headers, tech_rows, col_widths=[1.1, 1.4, 0.8, 3.2])

    add_h2("2.4 Hardware & Software Specifications")
    add_p("Table 2.4 specifies the operational environment requirements for both development and production deployment.")

    env_headers = ["Environment", "Component", "Minimum Specification", "Recommended Specification"]
    env_rows = [
        ["Client (User)", "Hardware", "Dual-core 1.5 GHz, 1 GB RAM, 360×640 px", "Quad-core 2.0+ GHz, 4 GB+ RAM, 1080p Display"],
        ["Client (User)", "Operating System", "Android 8+, iOS 14+, Windows 10+, macOS", "Android 13+, iOS 17+, Windows 11, macOS Sonoma"],
        ["Client (User)", "Web Browser", "Chrome 90+, Safari 14+, Edge 90+, Firefox 88+", "Latest evergreen Chrome / Safari / Edge with ES6"],
        ["Server (Cloud)", "Hosting Platform", "Vercel Serverless (512 MB memory)", "Vercel Fluid Compute Edge Network (1024 MB)"],
        ["Server (Cloud)", "Persistence Tier", "Google Firebase Spark Tier (Free)", "Google Firebase Blaze Tier (Pay-as-you-go)"],
        ["Development", "Toolchain", "Node.js 18.x, npm 9.x, Git 2.30+", "Node.js 20.x LTS, npm 10.x, VS Code, Git 2.40+"]
    ]
    add_table_data(env_headers, env_rows, col_widths=[1.2, 1.1, 2.1, 2.1])

    doc.add_page_break()

    # ==========================================
    # CHAPTER 3: SYSTEM MODELING AND ARCHITECTURE
    # ==========================================
    add_h1("Chapter 3: System Modeling and Architecture")
    
    add_h2("3.1 Three-Tier Client-Server & Agentic Architecture")
    add_p("SpendWise is engineered upon a decoupled Three-Tier Architecture, innovatively extended with an Agentic Interface Layer to support both human browser interactions and autonomous AI tool calling:")
    add_bullet("Presentation Layer (Browser Client)", "A responsive Single Page Application engineered with React 19 and Tailwind CSS v4, delivered instantly via Vercel's global CDN. It manages local component state, form validation, optimistic cache updates, and client-side SHA-256 cryptography.")
    add_bullet("Application Layer (Vercel Serverless & MCP)", "Serverless Node.js endpoints executing on the edge for transactional operations, combined with the SpendWise Model Context Protocol (MCP) server that exposes 26 JSON-RPC tools for autonomous agents.")
    add_bullet("Data Persistence Layer (Firebase Cloud Firestore)", "A globally distributed NoSQL document database providing low-latency real-time websocket synchronization (`onSnapshot`), offline caching, and row-level declarative security rules.")

    add_p("[Browser Client (React 19 / Tailwind v4)] ↔ (Websocket onSnapshot) ↔ [Firebase Cloud Firestore]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("↕ (HTTPS REST / JSON)                                                      ↕ (Admin SDK)", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("[Vercel Serverless Edge Endpoints] ↔ (Model Context Protocol JSON-RPC) ↔ [Autonomous AI Agents]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("Figure 3.1: Three-Tier Client-Server and Agentic Architecture", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=9.5, italic=True, color=COLOR_MUTED)

    add_h2("3.2 System Actors and Permissions")
    add_p("Table 3.1 details the system actors, authentication mechanisms, and granted access boundaries.")

    act_headers = ["Actor Role", "Authentication Mechanism", "Assigned System Privileges & Boundaries"]
    act_rows = [
        ["Guest / Visitor", "None (Public HTTP Route)", "View public landing page (`/`), explore interactive demo widget, access login and registration routes."],
        ["Authenticated User", "Firebase Auth JWT Token", "Full CRUD operations on personal ledger, balance calibration, debt splitting, budget pace, portfolio, and API key generation."],
        ["AI Agent (MCP)", "SHA-256 Hashed API Key", "Execute permitted MCP tools (query transactions, log expenses, compute debt shares, inspect balances) via JSON-RPC."],
        ["System Administrator", "Firebase Admin Service Key", "Firestore index management, security rules deployment, and serverless performance log monitoring."]
    ]
    add_table_data(act_headers, act_rows, col_widths=[1.5, 1.7, 3.3])

    add_h2("3.3 Core Use Cases and Operational Workflows")
    add_p("Table 3.2 outlines the primary functional use cases and the end-to-end operational workflows executed across the application.")

    uc_headers = ["Use Case ID", "Operation Title", "Primary Actor", "Operational Workflow & Invariants Enforced"]
    uc_rows = [
        ["UC-01", "Log Categorized Expense", "User / AI Agent", "User opens speed drawer, enters amount (auto-focus), selects wallet (Online/Cash), picks category chip, and submits. Local optimistic update occurs immediately (<50ms) followed by Firestore persistence."],
        ["UC-02", "Calibrate Exact Balances", "Authenticated User", "User opens 'Edit balances', chooses 'Set exact balance', enters physical cash and bank totals. System computes audit deltas, creates balance adjustment records, and updates `currentBalances`."],
        ["UC-03", "Split Bill & Track Debts", "Authenticated User", "User records shared expense, selects friend from directory, and specifies split amounts. System records personal share in ledger and logs outstanding debt in `debts` collection."],
        ["UC-04", "One-Tap Debt Settlement", "Authenticated User", "User clicks 'Settle' on an active debt row. System marks debt as 'paid', inserts an offsetting transaction, and automatically updates the respective wallet balance."],
        ["UC-05", "Monitor Budget Pace", "Authenticated User", "User sets monthly spending limit. System computes daily velocity = Total Spent / Days Elapsed and displays pace tick. Transitions progress bar color to --debit if limit breached."],
        ["UC-06", "Issue MCP Agent API Key", "Authenticated User", "User generates API key in Settings. Client hashes raw token via Web Crypto SHA-256, stores hash in Firestore, and displays raw token once for agent configuration."]
    ]
    add_table_data(uc_headers, uc_rows, col_widths=[1.0, 1.8, 1.2, 2.5])

    doc.add_page_break()

    # ==========================================
    # CHAPTER 4: DATABASE ARCHITECTURE
    # ==========================================
    add_h1("Chapter 4: Database Architecture and Firestore Schema")
    
    add_h2("4.1 NoSQL Document Entities Overview")
    add_p("SpendWise utilizes Google Firebase Cloud Firestore, a highly scalable NoSQL document store. In contrast to traditional relational databases with rigid schemas and expensive JOIN operations, Firestore organizes data into root-level collections and user-scoped documents, enabling real-time websocket synchronization (`onSnapshot`) with client-side latency compensation.")

    add_h2("4.2 Comprehensive Firestore Schema & Data Dictionary")
    add_p("Table 4.1 documents the unified data dictionary, field constraints, and indexing strategies for all collections in SpendWise.")

    schema_headers = ["Collection", "Key Fields & Constraints", "Data Type", "Architectural Purpose"]
    schema_rows = [
        ["users", "id (PK Auth UID), email (Req), displayName, preferences (Map: showBalances)", "Document", "Stores user account identity, profile metadata, and interface preferences."],
        ["currentBalances", "id (PK Auth UID), online (Float), cash (Float), updatedAt (Timestamp)", "Document", "High-frequency real-time document holding active Online and Cash liquidity totals."],
        ["transactions", "id (PK), userId (FK Index), amount (Float), type (Enum), paymentMethod (Enum: online|cash), category, date (ISO), isSplit, isBalanceAdjustment", "Collection", "The core financial ledger documenting every income, expense, and balance audit record."],
        ["balanceAdjustments", "id (PK), userId (FK), onlineAdjustment (Float), cashAdjustment (Float), reason (Req), date (ISO)", "Collection", "Immutable audit trail preserving historical balance calibration deltas and justifications."],
        ["debts", "id (PK), creditorId (FK Index), debtorId (FK Index), amount (Float), description, status (Enum: unpaid|paid), settledAt", "Collection", "Social debt ledger tracking peer obligations and settlement reconciliation."],
        ["budgets", "id (PK), userId (FK Index), monthlyLimit (Float), month (YYYY-MM), paceWarningSent (Bool)", "Collection", "Monthly spending limits and notification alert triggers."],
        ["investments", "id (PK), userId (FK Index), name, assetType (Enum: MF|FD|Gold|Stocks), provider, investedAmount, currentValue", "Collection", "Multi-asset portfolio holdings and auto-computed returns."],
        ["salaries", "id (PK), userId (FK Index), amount (Float), month (YYYY-MM), employer, payoutDate (ISO)", "Collection", "Chronological salary income timeline with month-over-month delta tracking."],
        ["apiKeys", "id (PK), userId (FK Index), keyHash (SHA-256 Unique), maskedKey, name, revoked (Bool), lastUsed", "Collection", "Client-side SHA-256 hashed API keys for Model Context Protocol (MCP) authentication."]
    ]
    add_table_data(schema_headers, schema_rows, col_widths=[1.4, 2.3, 0.9, 1.9])

    add_h2("4.3 Entity Relationships and Document Linkages")
    add_p("While Firestore is non-relational, SpendWise maintains relational consistency through indexed foreign keys and strict accounting invariants:")
    add_bullet("users (1) ↔ (1) currentBalances", "Direct 1:1 mapping via `currentUser.uid`. Real-time listener synchronizes liquidity across all open browser tabs in sub-300ms.")
    add_bullet("users (1) ↔ (N) transactions", "1:N relationship indexed by `[userId, date DESC]`, supporting boundary-safe pagination and instant search filtering.")
    add_bullet("users (1) ↔ (N) debts", "Dual foreign-key indices on `creditorId` (money owed to user) and `debtorId` (money user owes), powering real-time debt reconciliation.")
    add_bullet("users (1) ↔ (N) apiKeys", "1:N relationship indexed on `keyHash`, allowing instantaneous O(1) key authorization when external AI agents issue MCP commands.")

    add_p("Figure 4.1 shows the document relationship model governing the persistence tier.")
    add_p("[users] ──(1:1)──> [currentBalances]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("   ├──(1:N)──> [transactions] ──(1:1 Audit)──> [balanceAdjustments]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("   ├──(1:N)──> [debts] ──(Offset Reconcile)──> [transactions]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("   ├──(1:N)──> [investments] & [salaries]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("   └──(1:N)──> [apiKeys (SHA-256)] <──(MCP Tool Call)── [AI Agents]", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True)
    add_p("Figure 4.1: Firestore Document Relationship and Data Flow Model", align=WD_ALIGN_PARAGRAPH.CENTER, font_size=9.5, italic=True, color=COLOR_MUTED)

    add_h2("4.4 Declarative Security Rules & Real-Time Sync")
    add_p("To prevent unauthorized multi-tenant data access, SpendWise implements strict declarative security rules in `firestore.rules`. Access is gated strictly to authenticated requests matching document ownership:")

    add_code_block(
"""rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /currentBalances/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /transactions/{id} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /debts/{id} {
      allow read, write: if request.auth != null && 
        (resource.data.debtorId == request.auth.uid || resource.data.creditorId == request.auth.uid);
    }
    match /apiKeys/{id} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}"""
    )
    add_p("Real-time subscriptions utilize Firebase's `onSnapshot()` API. To prevent memory leaks, every React hook properly unbinds its listener in `useEffect` cleanup handlers.")

    doc.add_page_break()

    # ==========================================
    # CHAPTER 5: IMPLEMENTATION & ALGORITHMS
    # ==========================================
    add_h1("Chapter 5: System Implementation, UI Walkthrough & Algorithms")
    
    add_h2("5.1 Frontend Engineering & Design System")
    add_p("The SpendWise frontend is built on three core engineering pillars: React 19 concurrent state, a Tailwind CSS v4 design system, and the Quiet Ledger UI paradigm.")
    add_bullet("Quiet Ledger Aesthetic", "Transactions are displayed as an unboxed, flowing paper passbook. Hairline borders (`--border-subtle`), generous whitespace, and tabular IBM Plex Sans numerals eliminate cognitive clutter.")
    add_bullet("Banknote-Themed Palette", "Color accents directly mirror Indian banknotes: Stone `#707F74` (₹500), Saffron `#D97706` (₹200), Lagoon `#0284C7` (₹50), Lavender `#7C3AED` (₹100), Olive `#65A30D` (₹20), and Cocoa `#854D0E` (₹10).")

    add_h2("5.2 User Interface Walkthrough & Module Analysis")
    add_p("The production user interface is documented below with screenshots captured from the live deployment (`spend-wise-money.vercel.app`).")

    # Figure 5.1: Landing Page
    img_landing = os.path.join("screenshots", "landing_page.png")
    add_figure(img_landing, "Figure 5.1: SpendWise Landing Page & Conversational Hero Section", width_inches=5.8)
    add_p("Figure 5.1 demonstrates the public landing page. Key elements include the prominent value proposition ('Log your spending by sending a message') and the interactive conversational widget demonstrating MCP agent-driven expense entry in real time.")

    # Figure 5.2: Main Ledger Dashboard
    img_dash = os.path.join("screenshots", "dashboard_ledger.png")
    add_figure(img_dash, "Figure 5.2: Main Ledger Dashboard & Dual-Wallet Expense Tracker", width_inches=5.8)
    add_p("Figure 5.2 presents the primary workspace. Key capabilities include the quiet hero metric switcher ('Spent this month', 'Spent today', 'Net balance'), day-grouped transaction records with paise rendered in smaller font, and always-visible 40px touch delete buttons.")

    # Figure 5.3: Investment Portfolio
    img_inv = os.path.join("screenshots", "investments_portfolio.png")
    add_figure(img_inv, "Figure 5.3: Investment Portfolio & Asset Holdings Manager", width_inches=5.8)
    add_p("Figure 5.3 displays the Investment Portfolio manager. Key features include accurate zero-return handling ('₹0.00 (no change yet)' in neutral slate, avoiding misleading green wins), multi-asset allocation progress bars, and instant asset filtering tabs.")

    # Figure 5.4: Analytics Category Breakdown
    img_cat = os.path.join("screenshots", "analytics_categories.png")
    add_figure(img_cat, "Figure 5.4: Category Spending Breakdown with Banknote-Hued Palette", width_inches=5.8)
    add_p("Figure 5.4 depicts the category expenditure breakdown. Highlights include dynamic natural language outlay findings ('Food is 74% of what you spent') and Indian banknote color-coded proportional bars with a custom period popover selector.")

    # Figure 5.5: Analytics Trends
    img_trend = os.path.join("screenshots", "analytics_trends.png")
    add_figure(img_trend, "Figure 5.5: Dual-Wallet Distribution & 6-Month Spending Outlay Trend", width_inches=5.8)
    add_p("Figure 5.5 illustrates the Recharts analytical charts: a dual-wallet outlay comparison (Online vs Cash) with fixed pixel dimensions preventing layout collapse, paired with a flat, minimalist 6-month outlay line graph.")

    # Figure 5.6: MCP Settings
    img_mcp = os.path.join("screenshots", "mcp_settings.png")
    add_figure(img_mcp, "Figure 5.6: Settings & Integrations: Model Context Protocol (MCP) Console", width_inches=5.8)
    add_p("Figure 5.6 showcases the developer and agent integration console, featuring masked SHA-256 API key management (`spw_live_854••••6f7b••••`), one-click key revocation, and a catalog of the 26 supported Model Context Protocol tools.")

    add_h2("5.3 Core Algorithms & Business Logic")
    add_p("The foundational mathematical algorithms powering SpendWise are implemented as follows:")

    add_h3("5.3.1 Algorithm 1: Real-Time Dual-Wallet Balance Calibration")
    add_p("When a user enters exact physical cash and online amounts in 'Set exact balance' mode, the system auto-calculates required audit deltas and commits them atomically:")
    add_code_block(
"""Algorithm: SetExactBalanceCalibration(userId, declaredOnline, declaredCash)
1.  onlineDelta ← Number((declaredOnline - currentOnline).toFixed(2))
2.  cashDelta   ← Number((declaredCash - currentCash).toFixed(2))
3.  if |onlineDelta| < 0.001 and |cashDelta| < 0.001 then return "No change"
4.  todayDate ← GetLocalCalendarDateString()
5.  if onlineDelta != 0 then
6.      type ← (onlineDelta > 0) ? "income" : "expense"
7.      AddDoc("transactions", { userId, amount: |onlineDelta|, type, 
                               paymentMethod: "online", category: "Balance Adjustment",
                               date: todayDate, isBalanceAdjustment: true })
8.  if cashDelta != 0 then
9.      type ← (cashDelta > 0) ? "income" : "expense"
10.     AddDoc("transactions", { userId, amount: |cashDelta|, type, 
                               paymentMethod: "cash", category: "Balance Adjustment",
                               date: todayDate, isBalanceAdjustment: true })
11. SetDoc("currentBalances/" + userId, { online: declaredOnline, cash: declaredCash, 
                                         updatedAt: Timestamp.now() }, { merge: true })
12. return Success"""
    )

    add_h3("5.3.2 Algorithm 2: Boundary-Safe Ledger Pagination")
    add_p("To eliminate empty-page anomalies when deleting transactions at page boundaries:")
    add_code_block(
"""Algorithm: SafeLedgerPagination(transactions, pageSize, requestedPage)
1.  filtered ← FilterBySearchAndType(transactions)
2.  totalPages ← Max(1, Ceil(filtered.length / pageSize))
3.  safePage   ← Min(Max(1, requestedPage), totalPages)
4.  startIndex ← (safePage - 1) * pageSize
5.  paginated  ← filtered.slice(startIndex, startIndex + pageSize)
6.  groupedDays ← GroupByLocalDateKey(paginated)
7.  return { paginatedRows: paginated, days: groupedDays, safePage, totalPages }"""
    )

    add_h3("5.3.3 Algorithm 3: Model Context Protocol (MCP) Request Authorization")
    add_p("When an autonomous AI agent submits an MCP tool call over JSON-RPC:")
    add_code_block(
"""Algorithm: AuthorizeMCPRequest(incomingBearerToken)
1.  if not incomingBearerToken.startsWith("spw_live_") then
2.      return 401 Unauthorized ("Invalid key format")
3.  computedHash ← WebCrypto.Subtle.Digest("SHA-256", incomingBearerToken).toHex()
4.  keyDoc ← Firestore.Query("apiKeys").where("keyHash", "==", computedHash).limit(1).get()
5.  if not keyDoc.exists() or keyDoc.data().revoked == true then
6.      return 401 Unauthorized ("Revoked or invalid API key")
7.  keyDoc.ref.update({ lastUsed: Timestamp.now() })
8.  return ExecuteTool(keyDoc.data().userId, toolName, toolArguments)"""
    )

    doc.add_page_break()

    # ==========================================
    # CHAPTER 6: OUTCOMES AND APPLICATIONS
    # ==========================================
    add_h1("Chapter 6: Outcomes, Applications and Future Work")
    
    add_h2("6.1 Performance Benchmarks & Measurable Outcomes")
    add_p("SpendWise was rigorously evaluated using Google Lighthouse audits, automated Vitest suites, and network throttling profiles. Table 6.1 summarizes the measured quantitative engineering outcomes.")

    out_headers = ["Metric Category", "Target Specification", "Measured Result", "Status & Evaluation"]
    out_rows = [
        ["Lighthouse Performance", "Score >= 95 / 100", "98 / 100", "Passed - Optimized Vite bundle & minimal DOM depth"],
        ["Lighthouse Accessibility", "Score >= 95 / 100", "100 / 100", "Passed - High contrast, accessible labels & 40px targets"],
        ["Lighthouse Best Practices", "Score >= 95 / 100", "100 / 100", "Passed - Modern HTTPS, clean console, zero deprecations"],
        ["Initial Page Load (4G)", "Load Time < 1.5s", "1.18 seconds", "Passed - Fast Vercel edge delivery & tree-shaken JS"],
        ["Optimistic UI Response", "Latency < 50ms", "22 ms", "Passed - Local React state updates before cloud roundtrip"],
        ["Real-Time Sync Latency", "Latency < 300ms", "185 ms", "Passed - Direct Firebase websocket event propagation"],
        ["Integration Test Suite", "100% Pass Rate", "139 / 139 passed", "Passed - 30 comprehensive integration test suites"]
    ]
    add_table_data(out_headers, out_rows, col_widths=[1.5, 1.4, 1.3, 2.3])

    add_h2("6.2 Real-World Applications")
    add_p("SpendWise provides immediate practical utility across multiple user segments:")
    add_bullet("Students & Young Professionals", "Effortlessly tracks micro-UPI spends alongside cash withdrawals, splitting mess, grocery, and rent bills with roommates.")
    add_bullet("Freelancers & Micro-Merchants", "Maintains dual records for digital client receipts (UPI/NEFT) and direct cash payments without expensive accounting software.")
    add_bullet("AI Power Users & Developers", "Integrates natively with Claude Desktop, Cursor, and Antigravity, turning conversational chat into an instant expense logger.")

    add_h2("6.3 Future Roadmap")
    add_p("Future enhancements planned for SpendWise include:")
    add_numbered("1.", "Client-Side Bank PDF Parser", "A private, in-browser WebAssembly parser to extract transactions from PDF bank statements without sending raw documents to external servers.")
    add_numbered("2.", "Dynamic UPI Deep Links", "Generating `upi://pay` deep links and dynamic QR codes directly from debt settlement rows for instant settling.")
    add_numbered("3.", "Automated Recurring Expense Crons", "Vercel Cron triggers evaluating recurring bills daily and auto-logging due transactions.")

    doc.add_page_break()

    # ==========================================
    # CONCLUSION
    # ==========================================
    add_h1("Conclusion")
    add_p("SpendWise successfully demonstrates that modern personal finance software does not require visual noise, complex SaaS templates, or aggressive advertising cards to deliver deep utility. By grounding the architecture in the 'Quiet Ledger' philosophy, the platform elevates the transaction register to its rightful place as the hero of the interface.")

    add_p("Key engineering milestones achieved in this project include:")
    add_bullet("Dual-Wallet Segregation", "Accurately mirroring the Indian monetary reality of Online (UPI/Bank) and Physical Cash with instant, non-destructive balance calibration.")
    add_bullet("Full-Stack Web Technology Mastery", "Harnessing React 19 concurrent features, Vite build pipelines, Tailwind CSS v4 custom variables, and Firestore real-time websockets.")
    add_bullet("Pioneering Agentic Architecture", "Implementing the Model Context Protocol (MCP) and client-side SHA-256 API key cryptography, opening financial ledgers to autonomous AI agents.")
    add_bullet("Rigorous Quality Engineering", "Achieving a 100% pass rate across 139 end-to-end integration tests and perfect Lighthouse accessibility scores.")

    add_p("As a capstone project for the Web Technology course (Course Code: 2304362L) in the Department of Computer Engineering at MIT Academy of Engineering, SpendWise stands as a complete, secure, and production-ready web application that bridges academic concepts and production software engineering.")

    doc.add_page_break()

    # ==========================================
    # REFERENCES
    # ==========================================
    add_h1("References")
    references = [
        "[1] React Documentation, “React 19 – Declarative, Component-Based UI Library,” Meta Platforms, Inc., 2024. [Online]. Available: https://react.dev/",
        "[2] Vite Documentation, “Vite – Next Generation Frontend Tooling,” Evan You, 2024. [Online]. Available: https://vite.dev/",
        "[3] Tailwind CSS Documentation, “Tailwind CSS v4 – Modern Utility-First CSS Framework,” Tailwind Labs, 2024. [Online]. Available: https://tailwindcss.com/",
        "[4] Google Firebase, “Cloud Firestore & Firebase Authentication Documentation,” Google LLC, 2024. [Online]. Available: https://firebase.google.com/docs/firestore",
        "[5] Model Context Protocol Specification, “MCP: The Open Protocol for LLM Tool & Resource Integration,” Anthropic PBC, 2024. [Online]. Available: https://modelcontextprotocol.io/",
        "[6] Recharts Documentation, “Recharts – Composable Charting Library for React,” 2024. [Online]. Available: https://recharts.org/",
        "[7] Lucide Icons, “Lucide – Beautiful & Consistent Icon Toolkit,” 2024. [Online]. Available: https://lucide.dev/",
        "[8] React Router Documentation, “React Router v7 – Declarative Client Routing,” Remix Software / Shopify, 2024. [Online]. Available: https://reactrouter.com/",
        "[9] Vercel Documentation, “Vercel Serverless Functions & Edge Network Architecture,” Vercel Inc., 2024. [Online]. Available: https://vercel.com/docs",
        "[10] W3C Web Cryptography Working Group, “Web Cryptography API (W3C Recommendation),” World Wide Web Consortium, 2017. [Online]. Available: https://www.w3.org/TR/WebCryptoAPI/",
        "[11] R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Boston, MA: Pearson Education, 2017.",
        "[12] A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed. New York: McGraw-Hill, 2020.",
        "[13] R. S. Pressman and B. R. Maxim, Software Engineering: A Practitioner's Approach, 9th ed. New York: McGraw-Hill, 2020.",
        "[14] M. Jones, J. Bradley, and N. Sakimura, “JSON Web Token (JWT),” IETF RFC 7519, May 2015. [Online]. Available: https://datatracker.ietf.org/doc/html/rfc7519",
        "[15] National Payments Corporation of India (NPCI), “Unified Payments Interface (UPI) System Specifications & Procedural Guidelines,” NPCI, 2023. [Online]. Available: https://www.npci.org.in/"
    ]
    for ref in references:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_before = Pt(2)
        p_ref.paragraph_format.space_after = Pt(3)
        p_ref.paragraph_format.line_spacing = 1.15
        p_ref.paragraph_format.left_indent = Inches(0.3)
        p_ref.paragraph_format.first_line_indent = Inches(-0.3)
        p_ref.add_run(ref)

    # Document Metadata Block
    doc.add_paragraph().paragraph_format.space_after = Pt(14)
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(10)
    p_meta.paragraph_format.space_after = Pt(2)
    r = p_meta.add_run("Document Prepared By: ")
    r.bold = True
    p_meta.add_run("Atharva Baodhankar (202502040030), Tejas Patil (202502040021), Manas Prabhu (202502040026)\n")
    
    r2 = p_meta.add_run("Course: ")
    r2.bold = True
    p_meta.add_run("Web Technology (Course Code: 2304362L)\n")

    r3 = p_meta.add_run("Institution: ")
    r3.bold = True
    p_meta.add_run("Department of Computer Engineering, MIT Academy of Engineering, Pune\n")

    r4 = p_meta.add_run("Academic Year: ")
    r4.bold = True
    p_meta.add_run("2025–2026\n")

    r5 = p_meta.add_run("Document Version: ")
    r5.bold = True
    p_meta.add_run("2.0 (Refined & Streamlined Production Release)")

    # Save document
    output_filename = "SpendWise_Web_Technology_Project_Report.docx"
    doc.save(output_filename)
    print(f"Report successfully generated and saved to {output_filename}")

if __name__ == "__main__":
    create_report()
