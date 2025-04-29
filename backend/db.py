import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
load_dotenv()  # This loads the variables from .env

def get_db_connection():
    return psycopg2.connect(
        dsn=os.environ["DATABASE_URL"],
        sslmode=os.environ.get("PGSSLMODE", "require"),
        cursor_factory=RealDictCursor
    )
