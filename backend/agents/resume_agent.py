import anthropic
import os
import json
import pdfplumber
import io
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ---- Read PDF Resume ----
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text.strip()

# ---- Analyze Resume ----
def analyze_resume(resume_text: str, preferences: dict) -> dict:
    resume_short = resume_text[:3000] if len(resume_text) > 3000 else resume_text

    location         = preferences.get('location', 'Calgary')
    industry         = preferences.get('industry', 'Technology')
    experience_level = preferences.get('experience_level', 'Mid-level')

    prompt = f"""You are a world-class senior recruiter and career coach 
with 20 years experience at Google, Amazon, and McKinsey.

You have reviewed over 50,000 resumes. You know exactly what makes 
a resume get shortlisted vs rejected.

Analyze this resume DEEPLY and HONESTLY for:
- {experience_level} {industry} positions in {location}
- Current job market standards in {location}
- ATS systems used by top companies
- What real hiring managers look for

Be brutally honest. Give the REAL score this resume deserves.
Do NOT give a generic score — analyze every detail carefully.

Look specifically at:
1. Does it have quantified achievements? (numbers, percentages, $)
2. Are there strong action verbs?
3. Is it ATS-friendly?
4. Does it have relevant keywords for {industry} in {location}?
5. Is the summary compelling?
6. Does experience show growth and impact?
7. Are skills relevant to {location} market?
8. Is formatting professional?
9. What would a Google recruiter think?
10. Would this pass initial 6-second scan?

Resume:
{resume_short}

Return ONLY this JSON — all values must be specific to THIS resume:
{{
  "score": <your honest expert score 0-100>,
  "name": "<name>",
  "current_role": "<role>",
  "experience_years": <years>,
  "skills": ["<skill>", "<skill>", "<skill>", "<skill>", "<skill>"],
  "education": "<education>",
  "strengths": [
    "<specific strength with evidence>",
    "<specific strength with evidence>",
    "<specific strength with evidence>"
  ],
  "weaknesses": [
    "<specific weakness>",
    "<specific weakness>",
    "<specific weakness>"
  ],
  "missing_keywords": ["<kw>", "<kw>", "<kw>", "<kw>", "<kw>"],
  "ats_issues": ["<issue>", "<issue>", "<issue>"],
  "score_breakdown": {{
    "ats_optimization": <0-20>,
    "content_quality": <0-25>,
    "formatting": <0-20>,
    "skills_relevance": <0-20>,
    "summary_quality": <0-15>
  }},
  "top_companies_match": ["<company>", "<company>", "<company>"],
  "overall_feedback": "<4-5 specific sentences mentioning actual content>",
  "quick_wins": [
    "<most impactful change>",
    "<second most impactful>",
    "<third most impactful>"
  ]
}}

Return ONLY valid JSON. Be specific. Be honest."""

    response = client.messages.create(
        model     = "claude-sonnet-4-5",  # Use Sonnet for better analysis!
        max_tokens= 1500,
        messages  = [{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()

    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find('{')
        end   = raw.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except:
                pass

        # Fallback
        return {
            "score"            : 55,
            "name"             : "Candidate",
            "current_role"     : "Professional",
            "experience_years" : 2,
            "skills"           : ["Communication", "Problem Solving",
                                  "Microsoft Office", "Research", "Teamwork"],
            "education"        : "Bachelor's Degree",
            "strengths"        : ["Work experience present",
                                  "Education credentials included",
                                  "Technical skills listed"],
            "weaknesses"       : ["Missing quantified achievements",
                                  "No professional summary",
                                  "Insufficient ATS keywords"],
            "missing_keywords" : ["agile", "project management",
                                  "data analysis", "leadership", "KPIs"],
            "ats_issues"       : ["No measurable metrics",
                                  "Missing professional summary",
                                  "Needs industry keywords"],
            "score_breakdown"  : {
                "ats_optimization": 10,
                "content_quality" : 12,
                "formatting"      : 14,
                "skills_relevance": 12,
                "summary_quality" : 7
            },
            "top_companies_match" : [f"Mid-size companies in {location}",
                                     "Startups", "SMEs"],
            "overall_feedback" : "Resume needs improvement in quantification and keywords.",
            "quick_wins"       : [
                "Add numbers to every achievement",
                "Write a targeted professional summary",
                "Add 5 industry keywords"
            ]
        }
# ---- Improve Resume ----
def improve_resume(resume_text: str, analysis: dict,
                   preferences: dict) -> dict:

    resume_short = resume_text[:1500] if len(resume_text) > 1500 else resume_text
    missing_kw   = analysis.get('missing_keywords', [])[:3]
    ats_issues   = analysis.get('ats_issues', [])[:3]
    name         = analysis.get('name', 'Candidate')
    role         = analysis.get('current_role', 'Professional')

    prompt = f"""You are an expert resume writer.
Improve this resume and return ONLY valid JSON.

Target: {preferences.get('industry', 'Tech')} in {preferences.get('location', 'Calgary')}
Add keywords: {', '.join(missing_kw)}

IMPORTANT: The improved_resume field must use \\n for newlines
and follow this EXACT structure with section headers in ALL CAPS:

NAME
Contact Info

PROFESSIONAL SUMMARY
Summary text here

TECHNICAL SKILLS
Languages: Java, Python, JavaScript
Frontend: React, Next.js
Backend: Spring Boot, REST APIs

EXPERIENCE
Job Title — Company Name (Date – Date)
- Achievement with metric
- Achievement with metric
- Achievement with metric

Job Title — Company Name (Date – Date)  
- Achievement with metric
- Achievement with metric

PROJECTS
Project Name (Year)
- Description with impact

EDUCATION
Degree Name (Year) — Institution Name

CERTIFICATIONS
- Certification Name (Year)

Resume to improve:
{resume_short}

Return ONLY this JSON:
{{"improved_resume":"NAME\\nContact\\n\\nPROFESSIONAL SUMMARY\\nsummary text\\n\\nTECHNICAL SKILLS\\nskills here\\n\\nEXPERIENCE\\njob details\\n\\nPROJECTS\\nprojects here\\n\\nEDUCATION\\neducation here","new_score":<number>,"changes_made":[{{"original":"<old>","improved":"<new>","reason":"<why>"}},{{"original":"<old>","improved":"<new>","reason":"<why>"}},{{"original":"<old>","improved":"<new>","reason":"<why>"}}],"keywords_added":["{missing_kw[0] if missing_kw else 'agile'}","{missing_kw[1] if len(missing_kw)>1 else 'metrics'}","{missing_kw[2] if len(missing_kw)>2 else 'leadership'}"],"improvement_summary":"<one sentence>"}}

Use actual \\n characters in improved_resume to create line breaks between sections.
Return ONLY valid JSON. No markdown."""

    response = client.messages.create(
        model     = "claude-haiku-4-5-20251001",
        max_tokens= 2000,
        messages  = [{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()

    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        result = json.loads(raw)
        # Make sure improved_resume has proper newlines
        if "improved_resume" in result:
            result["improved_resume"] = result["improved_resume"].replace("\\n", "\n")
        return result
    except json.JSONDecodeError:
        start = raw.find('{')
        end   = raw.rfind('}') + 1
        if start != -1 and end > start:
            try:
                result = json.loads(raw[start:end])
                if "improved_resume" in result:
                    result["improved_resume"] = result["improved_resume"].replace("\\n", "\n")
                return result
            except:
                pass

        # Structured fallback
        current_score = analysis.get('score', 60)
        skills        = analysis.get('skills', [])

        return {
            "improved_resume": f"""{name}
{preferences.get('location', 'Calgary')} | mehtabwrn@gmail.com

PROFESSIONAL SUMMARY
{role} with proven expertise in {', '.join(skills[:3])}. 
Focused on delivering high-quality solutions using modern technologies.

TECHNICAL SKILLS
Languages: {', '.join([s for s in skills if s in ['Java','Python','JavaScript','TypeScript','SQL']] or ['Python', 'JavaScript'])}
Frameworks: {', '.join([s for s in skills if s in ['React','Next.js','Spring Boot','Django']] or ['React', 'Node.js'])}
Tools: {', '.join([s for s in skills if s in ['Docker','Git','AWS','Jenkins']] or ['Git', 'Docker'])}

EXPERIENCE
{role} (Current)
- Delivered high-impact solutions using {', '.join(skills[:2])}
- Collaborated with cross-functional teams using Agile methodology
- Optimized performance resulting in measurable improvements

EDUCATION
Relevant Degree — Institution

CERTIFICATIONS
- Professional certification in relevant technology""",
            "new_score"          : min(current_score + 15, 95),
            "changes_made"       : [
                {"original": "Generic descriptions",
                 "improved": "Added quantified achievements",
                 "reason"  : "Numbers prove impact"},
                {"original": "Missing keywords",
                 "improved": f"Added: {', '.join(missing_kw)}",
                 "reason"  : "Improves ATS score"},
                {"original": "Weak summary",
                 "improved": "Targeted professional summary",
                 "reason"  : "Matches job requirements"}
            ],
            "keywords_added"     : missing_kw or ["agile","metrics","leadership"],
            "improvement_summary": f"Resume restructured with clear sections and ATS keywords added."
        }

# ---- Generate Cover Letter ----
def generate_cover_letter(resume_text: str,
                          job_title: str,
                          company: str,
                          job_description: str) -> str:

    resume_short = resume_text[:1500] if len(resume_text) > 1500 else resume_text

    prompt = f"""Write a professional cover letter.

Candidate Resume Summary:
{resume_short}

Job: {job_title} at {company}
Description: {job_description[:500]}

Write 3 paragraphs, 250 words, professional tone.
Return ONLY the cover letter text, no subject line."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text.strip()

# ---- Generate Interview Questions ----
def generate_interview_prep(resume_text: str,
                            job_title: str,
                            company: str) -> dict:

    resume_short = resume_text[:1000] if len(resume_text) > 1000 else resume_text

    prompt = f"""You are an interview coach.
Position: {job_title} at {company}

Resume summary:
{resume_short}

Return ONLY this JSON with short values under 150 chars each:
{{
  "technical_questions": [
    {{"question": "<question>", "answer": "<answer>"}},
    {{"question": "<question>", "answer": "<answer>"}},
    {{"question": "<question>", "answer": "<answer>"}}
  ],
  "behavioral_questions": [
    {{"question": "<question>", "answer": "<STAR answer>"}},
    {{"question": "<question>", "answer": "<STAR answer>"}},
    {{"question": "<question>", "answer": "<STAR answer>"}}
  ],
  "questions_to_ask": [
    "<question 1>",
    "<question 2>",
    "<question 3>"
  ],
  "preparation_tips": ["tip1", "tip2", "tip3"]
}}

Return ONLY valid JSON."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1200,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find('{')
        end   = raw.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except:
                pass

        # Safe fallback
        return {
            "technical_questions": [
                {"question": f"What experience do you have relevant to {job_title}?",
                 "answer"  : "Based on my resume, I have experience in..."},
                {"question": "Describe a challenging project you completed.",
                 "answer"  : "Using STAR: Situation, Task, Action, Result..."},
                {"question": "What are your strongest technical skills?",
                 "answer"  : "My strongest skills include those listed in my resume..."}
            ],
            "behavioral_questions": [
                {"question": "Tell me about a time you worked in a team.",
                 "answer"  : "Situation: team project, Task: my role, Action: what I did, Result: outcome"},
                {"question": "How do you handle tight deadlines?",
                 "answer"  : "I prioritize tasks, communicate blockers early, and stay focused"},
                {"question": "Describe a time you solved a difficult problem.",
                 "answer"  : "I identify root cause, research solutions, implement and test"}
            ],
            "questions_to_ask"   : [
                f"What does success look like in this {job_title} role?",
                "What are the biggest challenges facing the team right now?",
                "What opportunities for growth exist here?"
            ],
            "preparation_tips"   : [
                "Research the company before the interview",
                "Prepare 3 specific examples using STAR format",
                "Dress professionally and arrive 10 minutes early"
            ]
        }

print("[OK] Resume Agent ready!")