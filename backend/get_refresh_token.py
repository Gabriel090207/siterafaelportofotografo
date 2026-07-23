import os

from dotenv import load_dotenv
from google_auth_oauthlib.flow import Flow

load_dotenv()

flow = Flow.from_client_config(
    {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=[
        "https://www.googleapis.com/auth/drive"
    ],
)

flow.redirect_uri = "http://localhost:8000/oauth2callback"

authorization_url, _ = flow.authorization_url(
    access_type="offline",
    prompt="consent",
)

print("\nAbra esta URL no navegador:\n")
print(authorization_url)

code = input(
    "\nCole aqui o parâmetro 'code' da URL de retorno:\n"
)

flow.fetch_token(code=code)

print("\nGOOGLE_REFRESH_TOKEN=\n")
print(flow.credentials.refresh_token)