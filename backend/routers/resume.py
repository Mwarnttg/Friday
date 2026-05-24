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
    match_jobs, analyze_skills_gap,
    get_salary_insights, get_real_jobs
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
    """Create beautiful B&W classic resume PDF using xhtml2pdf"""
    import io as _io
    from xhtml2pdf import pisa

    # ── Parse resume into sections ──
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
        stripped   = line.strip()
        line_upper = stripped.upper()
        matched    = False
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

    # ── Name + contact ──
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
        name = analysis.get('name', 'Resume')

    contact_parts = []
    for line in header_lines[1:6]:
        if line and len(line) > 3:
            contact_parts.append(line)
    contact_text = "  ·  ".join(contact_parts[:5])

    # ── HTML escape ──
    def esc(text):
        return (str(text)
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
        )

    # ── Render section ──
    def render_section(label, lines_list):
        if not lines_list:
            return ""

        role_words   = [
            'developer','engineer','manager','designer',
            'analyst','lead','director','intern',
            'coordinator','architect','consultant','specialist',
            'programmer','administrator','officer','executive'
        ]
        action_verbs = [
            'implemented','developed','built','created',
            'managed','led','designed','optimized',
            'architected','deployed','collaborated','executed',
            'enhanced','integrated','improved','delivered',
            'engineered','established','launched','reduced',
            'increased','achieved','streamlined','automated',
            'maintained','supported','worked','utilized','spearheaded',
            'directed','oversaw','coordinated','produced','drove'
        ]
        degree_words = [
            'diploma','degree','bachelor','master','phd',
            'certificate','bsc','msc','b.tech','mba',
            'b.sc','b.eng','m.eng','honours','associates'
        ]

        html = f"""
        <div class="section">
            <div class="section-header">{label}</div>
            <div class="section-line"></div>
            <div class="section-body">
        """

        for line in lines_list:
            if not line.strip():
                continue
            safe       = esc(line.strip())
            line_lower = line.lower()

            # Job title line
            if (('—' in line or '–' in line or '-' in line) and
                 any(w in line_lower for w in role_words) and
                 len(line) < 140):
                html += f'<p class="job-title">{safe}</p>'

            # Degree line
            elif (label == 'EDUCATION' and
                  any(w in line_lower for w in degree_words)):
                html += f'<p class="job-title">{safe}</p>'

            # Skills with colon
            elif label == 'TECHNICAL SKILLS' and ':' in line:
                parts = line.split(':', 1)
                html += (
                    f'<p class="skill-line">'
                    f'<strong>{esc(parts[0])}:</strong>'
                    f' {esc(parts[1])}</p>'
                )

            # Bullet points
            elif (line.strip().startswith('•') or
                  line.strip().startswith('-') or
                  any(v in line_lower for v in action_verbs)):
                clean = line.strip().lstrip('•- ').strip()
                html += f'<p class="bullet">&#8226; {esc(clean)}</p>'

            # Project title
            elif (label == 'PROJECTS' and
                  '(' in line and ')' in line and
                  len(line) < 100):
                html += f'<p class="job-title">{safe}</p>'

            # Certification bullet
            elif label == 'CERTIFICATIONS':
                html += f'<p class="bullet">&#8226; {safe}</p>'

            # Regular line
            else:
                html += f'<p class="body-text">{safe}</p>'

        html += "</div></div>"
        return html

    # ── Build sections HTML ──
    sections_html = ""

    if sections.get('summary'):
        summary_text = ' '.join(sections['summary'])
        sections_html += f"""
        <div class="section">
            <div class="section-header">PROFESSIONAL SUMMARY</div>
            <div class="section-line"></div>
            <div class="section-body">
                <p class="body-text">{esc(summary_text)}</p>
            </div>
        </div>
        """

    if sections.get('skills'):
        sections_html += render_section(
            'TECHNICAL SKILLS', sections['skills'])

    if sections.get('experience'):
        sections_html += render_section(
            'EXPERIENCE', sections['experience'])

    if sections.get('projects'):
        sections_html += render_section(
            'PROJECTS', sections['projects'])

    if sections.get('education'):
        sections_html += render_section(
            'EDUCATION', sections['education'])

    if sections.get('certifications'):
        sections_html += render_section(
            'CERTIFICATIONS', sections['certifications'])

    if sections.get('achievements'):
        sections_html += render_section(
            'ACHIEVEMENTS', sections['achievements'])

    # ── Full HTML ──
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page {{
    size: letter;
    margin: 0.55in 0.65in 0.55in 0.65in;
  }}

  * {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }}

  body {{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #1a1a1a;
    line-height: 1.4;
    background: white;
  }}

  /* ── HEADER ── */
  .header {{
    margin-bottom: 14pt;
    padding-bottom: 12pt;
    border-bottom: 3pt solid #000000;
    text-align: left;
  }}

  .name {{
    font-size: 26pt;
    font-weight: bold;
    color: #000000;
    letter-spacing: 2pt;
    margin-bottom: 5pt;
    text-transform: uppercase;
  }}

  .contact {{
    font-size: 8.5pt;
    color: #555555;
    line-height: 1.7;
  }}

  /* ── SECTION WRAPPER ── */
  .section {{
    margin-bottom: 13pt;
  }}

  /* ── SECTION HEADER ── */
  .section-header {{
    font-size: 11pt;
    font-weight: bold;
    color: #000000;
    letter-spacing: 2.5pt;
    text-transform: uppercase;
    margin-bottom: 0pt;
    padding-bottom: 3pt;
  }}

  /* ── SECTION DIVIDER ── */
  .section-line {{
    border: none;
    border-top: 1.5pt solid #000000;
    margin-top: 2pt;
    margin-bottom: 6pt;
  }}

  .section-body {{
    padding-left: 0pt;
  }}

  /* ── JOB TITLE ── */
  .job-title {{
    font-size: 10pt;
    font-weight: bold;
    color: #000000;
    margin-top: 6pt;
    margin-bottom: 2pt;
  }}

  /* ── BULLET ── */
  .bullet {{
    font-size: 9.5pt;
    color: #222222;
    margin-left: 14pt;
    margin-bottom: 2.5pt;
    line-height: 1.4;
  }}

  /* ── BODY TEXT ── */
  .body-text {{
    font-size: 9.5pt;
    color: #222222;
    margin-bottom: 3pt;
    line-height: 1.45;
  }}

  /* ── SKILL LINE ── */
  .skill-line {{
    font-size: 9.5pt;
    color: #222222;
    margin-bottom: 3pt;
    line-height: 1.45;
  }}

  .skill-line strong {{
    color: #000000;
    font-weight: bold;
  }}

  /* ── FOOTER ── */
  .footer {{
    margin-top: 16pt;
    border-top: 0.5pt solid #cccccc;
    padding-top: 5pt;
    text-align: center;
    font-size: 7pt;
    color: #aaaaaa;
    font-style: italic;
  }}
</style>
</head>
<body>

  <div class="header">
    <div class="name">{esc(name)}</div>
    <div class="contact">{esc(contact_text)}</div>
  </div>

  {sections_html}

  <div class="footer">Generated by FRIDAY AI Platform</div>

</body>
</html>"""

    # ── Convert to PDF ──
    try:
        buffer = _io.BytesIO()
        result = pisa.CreatePDF(
            html_content.encode('utf-8'),
            dest    = buffer,
            encoding= 'utf-8'
        )
        if result.err:
            print(f"xhtml2pdf error: {result.err}")
            return resume_text.encode('utf-8')
        buffer.seek(0)
        return buffer.read()
    except Exception as e:
        print(f"PDF error: {e}")
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

    api_key = os.getenv("JSEARCH_API_KEY", "")
    source  = "ai"

    if api_key and api_key not in ["your_key_here", ""]:
        try:
            jobs = get_real_jobs(
                user_data["analysis"],
                user_data["preferences"]
            )
            if jobs:
                source = "live"
                return {
                    "success": True,
                    "jobs"   : jobs,
                    "total"  : len(jobs),
                    "source" : source
                }
        except Exception as e:
            print(f"Real jobs failed: {e} — falling back to AI")

    jobs = match_jobs(
        user_data["analysis"],
        user_data["preferences"]
    )
    return {
        "success": True,
        "jobs"   : jobs,
        "total"  : len(jobs),
        "source" : source
    }


@router.get("/skills-gap")
async def get_skills_gap(
    current_user = Depends(get_current_user)
):
    user_data = resume_store.get(current_user.id)
    if not user_data:
        raise HTTPException(status_code=400,
            detail="Please upload your resume first")

    gap = analyze_skills_gap(
        user_data["analysis"],
        user_data["preferences"]
    )
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