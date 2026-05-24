# Auth disabled for hackathon — open guest access

class GuestUser:
    id        = 1
    email     = "guest@friday.ai"
    username  = "guest"
    full_name = "Guest User"

def get_current_user():
    return GuestUser()

print("✅ Auth system ready!")