from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
import models
import json
import io
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.resume_agent import (
    extract_text_from_pdf, analyze_resume,
    improve_resume, generate_cover_letter,
    generate_interview_prep
)
from agents.job_agent import (
    match_jobs, analyze_skills_gap, get_salary_insights
)

router = APIRouter()

class CoverLetterRequest(BaseModel):
    job_title      : str
    company        : str
    job_description: str

class InterviewPrepRequest(BaseModel):
    job_title: str
    company  : str

# In-memory store
resume_store = {}

def create_pdf(resume_text: str, analysis: dict = None,
               title: str = "Resume") -> bytes:
    """Create a beautifully formatted PDF resume"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles   import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus     import (SimpleDocTemplate, Paragraph,
                                            Spacer, HRFlowable)
        from reportlab.lib.units    import inch
        from reportlab.lib          import colors
        from reportlab.lib.enums    import TA_LEFT, TA_CENTER

        buffer = io.BytesIO()
        doc    = SimpleDocTemplate(
            buffer,
            pagesize     = letter,
            rightMargin  = 0.6 * inch,
            leftMargin   = 0.6 * inch,
            topMargin    = 0.5 * inch,
            bottomMargin = 0.5 * inch
        )

        # ---- Colors ----
        ORANGE = colors.HexColor('#FF6B2B')
        DARK   = colors.HexColor('#1a1a1a')
        GRAY   = colors.HexColor('#555555')
        LINE   = colors.HexColor('#eeeeee')

        # ---- Styles ----
        name_style = ParagraphStyle(
            'Name',
            fontName  = 'Helvetica-Bold',
            fontSize  = 22,
            textColor = DARK,
            spaceAfter= 4,
            alignment = TA_LEFT
        )
        contact_style = ParagraphStyle(
            'Contact',
            fontName  = 'Helvetica',
            fontSize  = 9,
            textColor = GRAY,
            spaceAfter= 2
        )
        section_style = ParagraphStyle(
            'Section',
            fontName    = 'Helvetica-Bold',
            fontSize    = 10,
            textColor   = ORANGE,
            spaceBefore = 14,
            spaceAfter  = 4
        )
        job_title_style = ParagraphStyle(
            'JobTitle',
            fontName  = 'Helvetica-Bold',
            fontSize  = 10,
            textColor = DARK,
            spaceAfter= 1
        )
        company_style = ParagraphStyle(
            'Company',
            fontName  = 'Helvetica-Oblique',
            fontSize  = 9,
            textColor = GRAY,
            spaceAfter= 4
        )
        bullet_style = ParagraphStyle(
            'Bullet',
            fontName   = 'Helvetica',
            fontSize   = 9,
            textColor  = DARK,
            spaceAfter = 3,
            leftIndent = 12
        )
        body_style = ParagraphStyle(
            'Body',
            fontName  = 'Helvetica',
            fontSize  = 9,
            textColor = DARK,
            spaceAfter= 4,
            leading   = 14
        )
        footer_style = ParagraphStyle(
            'Footer',
            fontName  = 'Helvetica-Oblique',
            fontSize  = 7,
            textColor = colors.HexColor('#aaaaaa'),
            alignment = TA_CENTER
        )

        content = []

        # ---- Parse sections ----
        lines    = resume_text.replace('|', '\n').split('\n')
        sections = {}
        current  = 'header'
        sections['header'] = []

        section_keywords = {
            'PROFESSIONAL SUMMARY': 'summary',
            'SUMMARY'             : 'summary',
            'OBJECTIVE'           : 'summary',
            'TECHNICAL SKILLS'    : 'skills',
            'SKILLS'              : 'skills',
            'WORK EXPERIENCE'     : 'experience',
            'EXPERIENCE'          : 'experience',
            'EMPLOYMENT'          : 'experience',
            'PROJECTS'            : 'projects',
            'EDUCATION'           : 'education',
            'CERTIFICATIONS'      : 'certifications',
            'ACHIEVEMENTS'        : 'achievements',
            'AWARDS'              : 'achievements'
        }

        for line in lines:
            stripped    = line.strip()
            line_upper  = stripped.upper()
            matched     = False

            for keyword, sec_name in section_keywords.items():
                if keyword in line_upper and len(stripped) < 50:
                    current = sec_name
                    if current not in sections:
                        sections[current] = []
                    matched = True
                    break

            if not matched and stripped:
                if current not in sections:
                    sections[current] = []
                sections[current].append(stripped)

        # ---- HEADER ----
        header_lines = sections.get('header', [])
        name = ""
        for line in header_lines:
            if line and len(line) > 2:
                name = (line
                    .replace('— Improved Resume', '')
                    .replace('- Improved Resume', '')
                    .strip()
                )
                break

        if not name and analysis:
            name = analysis.get('name', 'Professional')

        content.append(Paragraph(name or "Resume", name_style))

        # Contact info
        contact_parts = []
        for line in header_lines[1:6]:
            if line and len(line) > 3:
                contact_parts.append(line)

        if contact_parts:
            contact_text = "  ·  ".join(contact_parts[:4])
            # Escape special chars
            contact_text = (contact_text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
            )
            content.append(Paragraph(contact_text, contact_style))

        # Orange divider
        content.append(Spacer(1, 6))
        content.append(HRFlowable(
            width="100%", thickness=2,
            color=ORANGE, spaceAfter=8
        ))

        # ---- HELPER ----
        def add_section(sec_key, sec_label):
            if sec_key not in sections or not sections[sec_key]:
                return
            content.append(Paragraph(sec_label, section_style))
            content.append(HRFlowable(
                width="100%", thickness=0.5,
                color=LINE, spaceAfter=6
            ))

        # ---- SUMMARY ----
        if 'summary' in sections and sections['summary']:
            add_section('summary', 'PROFESSIONAL SUMMARY')
            summary_text = ' '.join(sections['summary'])
            safe = (summary_text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
            )
            content.append(Paragraph(safe, body_style))

        # ---- SKILLS ----
        if 'skills' in sections and sections['skills']:
            add_section('skills', 'TECHNICAL SKILLS')
            for line in sections['skills']:
                if not line:
                    continue
                safe = (line
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                if ':' in safe:
                    parts      = safe.split(':', 1)
                    skill_text = f"<b>{parts[0]}:</b>{parts[1]}"
                else:
                    skill_text = safe
                content.append(Paragraph(skill_text, body_style))

        # ---- EXPERIENCE ----
        if 'experience' in sections and sections['experience']:
            add_section('experience', 'EXPERIENCE')
            role_words = [
                'developer', 'engineer', 'manager', 'designer',
                'analyst', 'lead', 'director', 'intern',
                'coordinator', 'architect', 'consultant'
            ]
            company_words = [
                'ltd', 'inc', 'corp', 'solutions', 'technologies',
                'tartigrade', 'pvt', 'company', 'group', 'services'
            ]
            action_verbs = [
                'implemented', 'developed', 'built', 'created',
                'managed', 'led', 'designed', 'optimized',
                'architected', 'deployed', 'collaborated', 'executed',
                'enhanced', 'integrated', 'improved', 'delivered'
            ]

            for line in sections['experience']:
                if not line:
                    continue
                safe = (line
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                line_lower = line.lower()

                if (('—' in line or '–' in line or '-' in line) and
                     any(w in line_lower for w in role_words) and
                     len(line) < 100):
                    content.append(Spacer(1, 4))
                    content.append(Paragraph(safe, job_title_style))
                elif any(w in line_lower for w in company_words):
                    content.append(Paragraph(safe, company_style))
                elif line.startswith('•') or line.startswith('-'):
                    clean = safe.lstrip('•- ').strip()
                    content.append(Paragraph(f"• {clean}", bullet_style))
                elif any(v in line_lower for v in action_verbs):
                    content.append(Paragraph(f"• {safe}", bullet_style))
                else:
                    content.append(Paragraph(safe, body_style))

        # ---- PROJECTS ----
        if 'projects' in sections and sections['projects']:
            add_section('projects', 'PROJECTS')
            action_verbs = ['built', 'developed', 'implemented',
                           'created', 'designed', 'built']
            for line in sections['projects']:
                if not line:
                    continue
                safe = (line
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                if '(' in line and ')' in line and len(line) < 60:
                    content.append(Spacer(1, 4))
                    content.append(Paragraph(f"<b>{safe}</b>", job_title_style))
                elif (line.startswith('•') or line.startswith('-') or
                      any(v in line.lower() for v in action_verbs)):
                    clean = safe.lstrip('•- ').strip()
                    content.append(Paragraph(f"• {clean}", bullet_style))
                else:
                    content.append(Paragraph(safe, body_style))

        # ---- EDUCATION ----
        if 'education' in sections and sections['education']:
            add_section('education', 'EDUCATION')
            degree_words = [
                'diploma', 'degree', 'bachelor', 'master',
                'phd', 'certificate', 'bsc', 'msc', 'b.tech',
                'b.e', 'm.tech', 'mba'
            ]
            for line in sections['education']:
                if not line:
                    continue
                safe = (line
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                if any(w in line.lower() for w in degree_words):
                    content.append(Paragraph(f"<b>{safe}</b>", job_title_style))
                else:
                    content.append(Paragraph(safe, body_style))

        # ---- CERTIFICATIONS ----
        if 'certifications' in sections and sections['certifications']:
            add_section('certifications', 'CERTIFICATIONS')
            for line in sections['certifications']:
                if line:
                    safe = (line
                        .replace('&', '&amp;')
                        .replace('<', '&lt;')
                        .replace('>', '&gt;')
                    )
                    content.append(Paragraph(f"• {safe}", bullet_style))

        # ---- ACHIEVEMENTS ----
        if 'achievements' in sections and sections['achievements']:
            add_section('achievements', 'ACHIEVEMENTS')
            for line in sections['achievements']:
                if line:
                    safe = (line
                        .replace('&', '&amp;')
                        .replace('<', '&lt;')
                        .replace('>', '&gt;')
                    )
                    content.append(Paragraph(f"• {safe}", bullet_style))

        # ---- FOOTER ----
        content.append(Spacer(1, 20))
        content.append(HRFlowable(
            width="100%", thickness=1,
            color=LINE, spaceAfter=4
        ))
        content.append(Paragraph(
            "Generated by FRIDAY AI Platform", footer_style
        ))

        doc.build(content)
        return buffer.getvalue()

    except Exception as e:
        print(f"PDF generation error: {e}")
        return resume_text.encode('utf-8')


@router.post("/upload")
async def upload_resume(
    file            : UploadFile = File(...),
    location        : str = Form("Calgary"),
    industry        : str = Form("Technology"),
    job_type        : str = Form("Full-time"),
    experience_level: str = Form("Mid-level"),
    salary_range    : str = Form("$60,000-$90,000"),
    current_user    = Depends(get_current_user),
    db              : Session = Depends(get_db)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400,
            detail="Only PDF files supported")

    pdf_bytes   = await file.read()
    resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text or len(resume_text) < 50:
        raise HTTPException(status_code=400,
            detail="Could not read PDF. Make sure it has selectable text.")

    preferences = {
        "location"        : location,
        "industry"        : industry,
        "job_type"        : job_type,
        "experience_level": experience_level,
        "salary_range"    : salary_range
    }

    analysis = analyze_resume(resume_text, preferences)

    resume_store[current_user.id] = {
        "text"       : resume_text,
        "analysis"   : analysis,
        "preferences": preferences,
        "improved"   : None
    }

    db.add(models.SearchHistory(
        user_id    = current_user.id,
        query      = f"Resume: {file.filename}",
        result     = json.dumps(analysis)[:500],
        agent_used = "resume_analyzer"
    ))
    db.commit()

    return {
        "success" : True,
        "analysis": analysis,
        "message" : f"Resume analyzed! Score: {analysis.get('score', 0)}/100"
    }


@router.post("/improve")
async def improve_resume_endpoint(
    current_user = Depends(get_current_user),
    db           : Session = Depends(get_db)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    try:
        result = improve_resume(
            user_data["text"],
            user_data["analysis"],
            user_data["preferences"]
        )
        resume_store[current_user.id]["improved"] = result

        db.add(models.SearchHistory(
            user_id    = current_user.id,
            query      = "Resume improvement",
            result     = f"Score improved to {result.get('new_score', 0)}",
            agent_used = "resume_improver"
        ))
        db.commit()

        return {"success": True, "result": result}

    except Exception as e:
        raise HTTPException(status_code=500,
            detail=f"Improvement failed: {str(e)}")


@router.get("/download-improved")
async def download_improved_resume(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data or not user_data.get("improved"):
        raise HTTPException(status_code=400,
            detail="No improved resume found. Please improve first.")

    improved_text  = user_data["improved"].get("improved_resume", "")
    candidate_name = user_data["analysis"].get("name", "Resume")

    pdf_bytes = create_pdf(
        improved_text,
        analysis = user_data["analysis"],
        title    = f"{candidate_name} — Improved Resume"
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type = "application/pdf",
        headers    = {
            "Content-Disposition":
                f'attachment; filename="improved_resume_{candidate_name}.pdf"'
        }
    )


@router.get("/download-original")
async def download_original_resume(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="No resume found. Please upload first.")

    candidate_name = user_data["analysis"].get("name", "Resume")

    pdf_bytes = create_pdf(
        user_data["text"],
        analysis = user_data["analysis"],
        title    = f"{candidate_name} — Original Resume"
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type = "application/pdf",
        headers    = {
            "Content-Disposition":
                f'attachment; filename="original_resume_{candidate_name}.pdf"'
        }
    )


@router.post("/cover-letter")
async def create_cover_letter(
    request      : CoverLetterRequest,
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    cover_letter = generate_cover_letter(
        user_data["text"],
        request.job_title,
        request.company,
        request.job_description
    )
    return {"success": True, "cover_letter": cover_letter}


@router.post("/interview-prep")
async def get_interview_prep(
    request      : InterviewPrepRequest,
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    prep = generate_interview_prep(
        user_data["text"],
        request.job_title,
        request.company
    )
    return {"success": True, "prep": prep}


@router.get("/jobs")
async def get_job_matches(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    jobs = match_jobs(user_data["analysis"], user_data["preferences"])
    return {"success": True, "jobs": jobs, "total": len(jobs)}


@router.get("/skills-gap")
async def get_skills_gap(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    gap = analyze_skills_gap(user_data["analysis"], user_data["preferences"])
    return {"success": True, "gap": gap}


@router.get("/salary")
async def get_salary(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    analysis = user_data["analysis"]
    salary   = get_salary_insights(
        analysis.get("current_role", "Software Developer"),
        user_data["preferences"].get("location", "Calgary"),
        analysis.get("experience_years", 2)
    )
    return {"success": True, "salary": salary}


@router.get("/status")
async def get_resume_status(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        return {"uploaded": False}

    return {
        "uploaded"      : True,
        "score"         : user_data["analysis"].get("score", 0),
        "name"          : user_data["analysis"].get("name", ""),
        "has_improved"  : user_data.get("improved") is not None,
        "improved_score": user_data["improved"].get("new_score", 0)
                          if user_data.get("improved") else None,
        "preferences"   : user_data["preferences"]
    }

print("✅ Resume Router ready!")