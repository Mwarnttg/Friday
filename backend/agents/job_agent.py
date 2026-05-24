import anthropic
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ---- Match Jobs to Resume ----
def match_jobs(resume_analysis: dict, preferences: dict) -> list:
    skills    = resume_analysis.get('skills', [])
    role      = resume_analysis.get('current_role', '')
    exp_years = resume_analysis.get('experience_years', 0)
    location  = preferences.get('location', 'Calgary')
    industry  = preferences.get('industry', 'Technology')
    job_type  = preferences.get('job_type', 'Full-time')
    salary    = preferences.get('salary_range', '$50,000-$80,000')

    prompt = f"""You are a job matching expert.

Based on this candidate profile, generate 8 realistic job matches.

Candidate Profile:
- Current Role: {role}
- Experience: {exp_years} years
- Skills: {', '.join(skills[:10])}
- Location: {location}
- Industry: {industry}
- Job Type: {job_type}
- Salary Range: {salary}

Return ONLY a JSON array:
[
  {{
    "id": 1,
    "title": "<job title>",
    "company": "<real company name in {location}>",
    "location": "{location}, AB",
    "salary": "<realistic salary range>",
    "job_type": "{job_type}",
    "match_percentage": <60-98>,
    "match_reasons": ["reason1", "reason2", "reason3"],
    "missing_skills": ["skill1", "skill2"],
    "description": "<2-3 sentence job description>",
    "requirements": ["req1", "req2", "req3", "req4"],
    "apply_url": "https://www.linkedin.com/jobs/search/?keywords={role}&location={location}",
    "posted": "<1-14 days ago>",
    "applicants": "<number> applicants"
  }},
  ...8 jobs total
]

Return ONLY the JSON array."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    return json.loads(raw)

# ---- Skills Gap Analysis ----
def analyze_skills_gap(resume_analysis: dict,
                       preferences: dict) -> dict:
    skills   = resume_analysis.get('skills', [])
    location = preferences.get('location', 'Calgary')
    industry = preferences.get('industry', 'Technology')

    prompt = f"""You are a career development expert.

Analyze the skills gap for this candidate.

Candidate Skills: {', '.join(skills)}
Target: {industry} jobs in {location}

Return ONLY a JSON response:
{{
  "have_skills": ["skill1", "skill2", ...],
  "missing_critical": [
    {{"skill": "<skill>", "importance": "critical", 
      "learn_time": "<time>", "resource": "<free resource URL>"}},
    ...3-5 skills
  ],
  "missing_nice_to_have": [
    {{"skill": "<skill>", "importance": "nice to have",
      "learn_time": "<time>", "resource": "<free resource URL>"}},
    ...3-5 skills
  ],
  "market_insights": [
    "<insight about {location} job market>",
    "<salary insight>",
    "<hiring trend>"
  ],
  "recommended_certifications": [
    {{"name": "<cert name>", "provider": "<provider>",
      "cost": "<cost>", "time": "<time to complete>"}},
    ...2-3 certs
  ]
}}

Return ONLY the JSON."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    return json.loads(raw)

# ---- Salary Insights ----
def get_salary_insights(role: str, location: str,
                        experience_years: int) -> dict:
    prompt = f"""You are a compensation expert.

Provide salary insights for:
- Role: {role}
- Location: {location}, Canada
- Experience: {experience_years} years

Return ONLY a JSON response:
{{
  "role": "{role}",
  "location": "{location}",
  "salary_range": {{
    "min": <number>,
    "max": <number>,
    "median": <number>,
    "currency": "CAD"
  }},
  "by_experience": {{
    "entry_level": "<salary range>",
    "mid_level": "<salary range>",
    "senior_level": "<salary range>"
  }},
  "your_estimate": "<personalized salary estimate>",
  "negotiation_tips": ["tip1", "tip2", "tip3"],
  "top_paying_companies": ["company1", "company2", "company3"]
}}

Return ONLY the JSON."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    return json.loads(raw)

print("✅ Job Agent ready!")