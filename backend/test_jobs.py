from dotenv import load_dotenv
load_dotenv()
from agents.job_agent import get_real_jobs

jobs = get_real_jobs(
    {'current_role':'Software Developer','skills':['Python','React']},
    {'location':'Calgary'}
)
print(f'Found {len(jobs)} jobs!')
for j in jobs[:3]:
    print(f'  - {j["title"]} at {j["company"]}')