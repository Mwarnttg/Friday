import anthropic
import os
import json
import requests
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ---- Real Jobs from JSearch API ----
def get_real_jobs(analysis: dict, preferences: dict) -> list:
    """Fetch REAL jobs from JSearch (Indeed + LinkedIn)"""

    role     = analysis.get('current_role', 'Software Developer')
    location = preferences.get('location', 'Calgary')
    skills   = analysis.get('skills', [])
    query    = f"{role} {location}"

    headers = {
        "X-RapidAPI-Key" : os.getenv("JSEARCH_API_KEY"),
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    params = {
        "query"      : query,
        "page"       : "1",
        "num_results": "10",
        "country"    : "ca"
    }

    try:
        res  = requests.get(
            "https://jsearch.p.rapidapi.com/search",
            headers = headers,
            params  = params,
            timeout = 10
        )
        data = res.json()
        jobs = data.get("data", [])

        if not jobs:
            print("JSearch returned no jobs — falling back to AI")
            return []

        formatted = []
        for job in jobs[:8]:
            job_text  = (
                job.get("job_description", "") +
                job.get("job_title", "")
            ).lower()
            matches   = sum(1 for s in skills
                           if s.lower() in job_text)
            match_pct = min(95, 55 + (matches * 8))

            formatted.append({
                "id"              : job.get("job_id", ""),
                "title"           : job.get("job_title", ""),
                "company"         : job.get("employer_name", ""),
                "location"        : (
                    job.get("job_city", location) +
                    ", " +
                    job.get("job_state", "AB")
                ),
                "salary"          : _format_salary(job),
                "job_type"        : job.get(
                    "job_employment_type", "Full-time"),
                "match_percentage": match_pct,
                "match_reasons"   : _get_match_reasons(job, skills),
                "missing_skills"  : [],
                "description"     : (
                    job.get("job_description", "")[:250] + "..."
                ),
                "requirements"    : _get_requirements(job),
                "apply_url"       : job.get("job_apply_link", "#"),
                "posted"          : _format_date(
                    job.get("job_posted_at_datetime_utc")),
                "applicants"      : "Active listing",
                "logo"            : job.get("employer_logo", None)
            })

        print(f"✅ Found {len(formatted)} real jobs!")
        return formatted

    except Exception as e:
        print(f"JSearch error: {e}")
        return []


def _format_salary(job) -> str:
    min_s = job.get("job_min_salary")
    max_s = job.get("job_max_salary")
    if min_s and max_s:
        return f"${int(min_s):,} — ${int(max_s):,}"
    elif min_s:
        return f"${int(min_s):,}+"
    return "Competitive"


def _format_date(date_str) -> str:
    if not date_str:
        return "Recently posted"
    try:
        posted = datetime.fromisoformat(
            date_str.replace('Z', '+00:00'))
        now    = datetime.now(timezone.utc)
        days   = (now - posted).days
        if days == 0:  return "Today"
        if days == 1:  return "Yesterday"
        if days < 7:   return f"{days} days ago"
        if days < 30:  return f"{days // 7} weeks ago"
        return f"{days // 30} months ago"
    except:
        return "Recently posted"


def _get_match_reasons(job, skills) -> list:
    reasons  = []
    job_text = (
        job.get("job_description", "") +
        job.get("job_title", "")
    ).lower()
    for skill in skills[:6]:
        if skill.lower() in job_text:
            reasons.append(f"{skill} match")
    if not reasons:
        reasons = ["Location match", "Role match"]
    return reasons[:3]


def _get_requirements(job) -> list:
    highlights = job.get(
        "job_highlights", {}
    ).get("Qualifications", [])
    if highlights:
        return [h[:80] for h in highlights[:4]]
    return ["See full job description"]


# ---- AI Fallback Jobs ----
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
        model     = "claude-haiku-4-5-20251001",
        max_tokens= 3000,
        messages  = [{"role": "user", "content": prompt}]
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
  "have_skills": ["skill1", "skill2"],
  "missing_critical": [
    {{"skill": "<skill>", "importance": "critical",
      "learn_time": "<time>",
      "resource": "<free resource URL>"}},
    ...3-5 skills
  ],
  "missing_nice_to_have": [
    {{"skill": "<skill>", "importance": "nice to have",
      "learn_time": "<time>",
      "resource": "<free resource URL>"}},
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
        model     = "claude-haiku-4-5-20251001",
        max_tokens= 1500,
        messages  = [{"role": "user", "content": prompt}]
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
        model     = "claude-haiku-4-5-20251001",
        max_tokens= 800,
        messages  = [{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    return json.loads(raw)


print("✅ Job Agent ready!")