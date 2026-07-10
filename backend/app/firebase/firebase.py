import json
import os

from pathlib import Path

import firebase_admin

from firebase_admin import credentials
from dotenv import load_dotenv

load_dotenv()

if not firebase_admin._apps:

    firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")

    if firebase_credentials:

        cred = credentials.Certificate(
            json.loads(firebase_credentials)
        )

    else:

        base_dir = Path(__file__).resolve().parent

        cred = credentials.Certificate(
            base_dir / "chave-firebase.json"
        )

    firebase_admin.initialize_app(
        cred,
        {
            "storageBucket": os.getenv(
                "FIREBASE_STORAGE_BUCKET"
            )
        }
    )