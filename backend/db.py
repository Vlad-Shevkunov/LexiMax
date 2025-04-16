import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
load_dotenv()  # This loads the variables from .env


def get_db_connection():
    return psycopg2.connect(
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),  # Use your actual username
        password=os.environ.get("DB_PASSWORD"),  # Replace with your actual password
        host=os.environ.get("HOST"),
        cursor_factory=RealDictCursor
    )
