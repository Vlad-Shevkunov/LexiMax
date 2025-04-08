import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(
        dbname="FrenchMax",
        user="postgres",  # Use your actual username
        password="B1tch!63tDAWAY",  # Replace with your actual password
        host="localhost",
        cursor_factory=RealDictCursor
    )
