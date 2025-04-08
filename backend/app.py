from flask import Flask, jsonify, request
from db import get_db_connection
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor  # ✅ Add this import


app = Flask(__name__)
CORS(app)

# Updated API to handle multiple translations
@app.route('/add_word', methods=['POST'])
def add_word():
    try:
        data = request.json
        word = data.get('word')
        translation = data.get('translation')  # Single translation
        part_of_speech = data.get('part_of_speech')
        article = data.get('article')
        if article in ["none", "", None]:  
            article = "none"

        if not word or not translation:
            return jsonify({"error": "Word and translation are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ Check if the word already exists
        cur.execute("SELECT id, translations FROM vocabulary WHERE LOWER(word) = LOWER(%s);", (word,))
        result = cur.fetchone()

        if result:
            word_id = result["id"]  # ✅ Use dictionary-style access
            existing_translations = result["translations"]

            # ✅ Append new translation only if it's unique
            if translation not in existing_translations:
                updated_translations = existing_translations + [translation]
                cur.execute(
                    "UPDATE vocabulary SET translations = %s WHERE id = %s;",
                    (updated_translations, word_id)
                )
        else:
            # ✅ Insert new word & get ID
            cur.execute(
                "INSERT INTO vocabulary (word, translations, part_of_speech, article) VALUES (%s, %s, %s, %s) RETURNING id;",
                (word, [translation], part_of_speech, article)
            )
            result=cur.fetchone()
            word_id = result["id"]

            # ✅ Insert into word_tracking
            cur.execute(
                "INSERT INTO word_tracking (word_id, word, total_attempts, mistake_timestamps, last_accessed, score) "
                "VALUES (%s, %s, 0, ARRAY[]::TIMESTAMPTZ[], NOW(), 5);",
                (word_id, word)
            )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Word added successfully!", "word_id": word_id}), 201

    except Exception as e:
        print("❌ Error in add_word:", str(e))  # Debugging log
        return jsonify({"error": str(e)}), 500

    
@app.route('/get_words', methods=['GET'])
def get_words():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM vocabulary;")
        words = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(words)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update_word/<int:word_id>', methods=['PUT'])
def update_word(word_id):
    try:
        data = request.json
        new_word = data.get('word').strip().lower()
        translations = data.get('translation', [])  # Now handling a full list
        part_of_speech = data.get('part_of_speech')
        article = data.get('article')

        if article in ["none", "", None]:  
            article = "none"

        if not new_word or not translations or len(translations) == 0:
            return jsonify({"error": "Word and at least one translation are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # ✅ Fetch the existing word before updating
        cur.execute("SELECT word FROM vocabulary WHERE id = %s;", (word_id,))
        result = cur.fetchone()

        if not result:
            return jsonify({"error": "Word not found"}), 404

        old_word = result["word"]

        # ✅ Update `vocabulary` table
        cur.execute("""
            UPDATE vocabulary 
            SET word = %s, translations = %s, part_of_speech = %s, article = %s
            WHERE id = %s;
        """, (new_word, translations, part_of_speech, article, word_id))

        # ✅ If the word itself changed, update `word_tracking`
        if old_word != new_word:
            cur.execute("""
                UPDATE word_tracking 
                SET word = %s
                WHERE word_id = %s;
            """, (new_word, word_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Word updated successfully!"}), 200

    except Exception as e:
        print("❌ ERROR in update_word:", str(e))  
        return jsonify({"error": str(e)}), 500



@app.route('/delete_word/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ First, check if the word exists before deleting
        cur.execute("SELECT word FROM vocabulary WHERE id = %s;", (word_id,))
        result = cur.fetchone()

        if not result:
            return jsonify({"error": "Word not found"}), 404

        # ✅ Delete from `word_tracking` first (to avoid orphaned references)
        cur.execute("DELETE FROM word_tracking WHERE word_id = %s;", (word_id,))

        # ✅ Delete from `vocabulary`
        cur.execute("DELETE FROM vocabulary WHERE id = %s;", (word_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Word deleted successfully!"}), 200

    except Exception as e:
        print("❌ ERROR in delete_word:", str(e))  
        return jsonify({"error": str(e)}), 500



@app.route("/start_game", methods=["POST"])
def start_game():
    try:
        if not request.is_json:
            return jsonify({"error": "Invalid JSON format"}), 400

        data = request.get_json()
        print("Received JSON Data:", data)

        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ Step 1: Check for inconsistencies between `vocabulary` and `word_tracking`
        cur.execute("""
            SELECT wt.word_id
            FROM word_tracking wt
            LEFT JOIN vocabulary v ON wt.word_id = v.id
            WHERE v.id IS NULL;
        """)
        invalid_entries = cur.fetchall()

        if invalid_entries:
            print("❌ ERROR: Inconsistent word IDs in word_tracking:", invalid_entries)
            return jsonify({"error": "Invalid word IDs found in word_tracking"}), 500

        # ✅ Step 2: Check for words in `vocabulary` that are missing from `word_tracking`
        cur.execute("""
            SELECT v.id FROM vocabulary v
            LEFT JOIN word_tracking wt ON v.id = wt.word_id
            WHERE wt.word_id IS NULL;
        """)
        missing_words = cur.fetchall()

        if missing_words:
            print("❌ ERROR: Missing word IDs in word_tracking:", missing_words)
            return jsonify({"error": "Words in vocabulary not found in word_tracking"}), 500

        # ✅ Step 3: Update scores in `word_tracking`
        cur.execute("""
            UPDATE word_tracking
            SET score = GREATEST(
                1 + (array_length(mistake_timestamps, 1) * 2) + 
                EXTRACT(EPOCH FROM (NOW() - COALESCE(last_accessed, '2000-01-01'::TIMESTAMPTZ))) / 3600,
                1
            )
            WHERE score IS NULL OR score < 1;
        """)
        conn.commit()
        print("✅ Updated scores for existing words.")

        # ✅ Step 4: Preload words (return full word data)
        cur.execute("""
            SELECT v.id, v.word, v.translations, v.part_of_speech, v.article
            FROM vocabulary v
            JOIN word_tracking wt ON v.id = wt.word_id
            ORDER BY RANDOM() * wt.score DESC
            LIMIT 500;
        """)
        words = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify({"words": words}), 200  # 🔥 Only return words, no game_id

    except psycopg2.Error as e:
        print("❌ PostgreSQL Error:", e.pgcode, e.pgerror)
        return jsonify({"error": f"PostgreSQL Error: {e.pgerror}"}), 500
    except Exception as e:
        print("❌ General Database Error:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/end_game", methods=["POST"])
def end_game():
    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 400

    data = request.get_json()
    results = data.get("results")       # List of word attempts
    time_limit = data.get("time_limit") / 60
    game_type = data.get("game_type")
    zen_mode = data.get("zen_mode")
    total_attempts = data.get("total_attempts")  # total words attempted
    score = data.get("score")                   # final correct words
    ungraded = data.get("ungraded", False)      # new boolean

    if results is None or total_attempts is None or score is None:
        return jsonify({"error": "Missing required data"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert a row in game_runs, now including 'ungraded'
        cur.execute("""
            INSERT INTO game_runs 
              (time_limit, game_type, zen_mode, total_words_attempted, correct_words, ungraded)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (time_limit, game_type, zen_mode, total_attempts, score, ungraded))

        # For each word attempt, update word_tracking
        for result in results:
            word_id = result["word_id"]
            correct = result["correct"]

            # update last_accessed, total_attempts, mistake_timestamps
            cur.execute("""
                UPDATE word_tracking
                SET last_accessed = NOW(),
                    total_attempts = total_attempts + 1,
                    mistake_timestamps = CASE
                        WHEN %s = FALSE THEN array_append(mistake_timestamps, NOW())
                        ELSE mistake_timestamps
                    END
                WHERE word_id = %s;
            """, (correct, word_id))

            # Adjust the word's score
            cur.execute("""
                UPDATE word_tracking
                SET score = GREATEST(
                    3 + (array_length(mistake_timestamps, 1) * 2) +
                        EXTRACT(EPOCH FROM (NOW() - last_accessed)) / 3600,
                    3
                )
                WHERE word_id = %s;
            """, (word_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Game ended successfully!"}), 200

    except Exception as e:
        print("❌ Error in end_game:", str(e))
        return jsonify({"error": str(e)}), 500



# ✅ Add a new conjugation entry
@app.route('/add_conjugation', methods=['POST'])
def add_conjugation():
    try:
        data = request.json
        verb = data.get('verb').strip().lower()
        person = data.get('person').strip().lower()
        tense = data.get('tense').strip().lower()
        conjugation = data.get('conjugation').strip().lower()
        irregular = data.get('irregular', False)  # Boolean flag
        # New fields
        pronominal = data.get('pronominal', False)  # boolean
        verb_group = data.get('verb_group', 0)      # int

        if not verb or not person or not tense or not conjugation:
            return jsonify({"error": "All fields (verb, person, tense, conjugation) are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # ✅ Check if this conjugation already exists for this verb
        cur.execute("""
            SELECT id FROM conjugations
            WHERE verb = %s AND person = %s AND tense = %s;
        """, (verb, person, tense))
        result = cur.fetchone()

        if result:
            # ✅ Conjugation already exists; return its ID
            conjugation_id = result["id"]
            message = "Conjugation already exists."
        else:
            # ✅ Insert new conjugation and get its ID
            cur.execute("""
                INSERT INTO conjugations (verb, person, tense, conjugation, irregular, pronominal, verb_group)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (verb, person, tense, conjugation, irregular, pronominal, verb_group))
            result = cur.fetchone()
            conjugation_id = result["id"]
            message = "Conjugation added successfully."

            # ✅ Also insert into `conjugation_tracking`
            cur.execute("""
                INSERT INTO conjugation_tracking (id, verb, person, tense, total_attempts, mistake_timestamps, last_accessed, score)
                VALUES (%s, %s, %s, %s, 0, ARRAY[]::TIMESTAMPTZ[], NOW(), 5);
            """, (conjugation_id, verb, person, tense))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": message, "conjugation_id": conjugation_id}), 201

    except Exception as e:
        print("❌ ERROR in add_conjugation:", str(e))  
        return jsonify({"error": str(e)}), 500


# ✅ Retrieve all conjugations
@app.route('/get_conjugations', methods=['GET'])
def get_conjugations():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM conjugations;")
        conjugations = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(conjugations), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/update_conjugation/<int:conjugation_id>', methods=['PUT'])
def update_conjugation(conjugation_id):
    try:
        data = request.json
        new_verb = data.get('verb').strip().lower()
        new_person = data.get('person').strip().lower()
        new_tense = data.get('tense').strip().lower()
        new_conjugation = data.get('conjugation').strip().lower()
        irregular = data.get('irregular', False)  # Boolean flag

        # new fields
        pronominal = data.get('pronominal', False)
        verb_group = data.get('verb_group', 0)

        if not new_verb or not new_person or not new_tense or not new_conjugation:
            return jsonify({"error": "All fields (verb, person, tense, conjugation) are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # ✅ Fetch the existing conjugation before updating
        cur.execute("""
            SELECT verb, person, tense FROM conjugations WHERE id = %s;
        """, (conjugation_id,))
        result = cur.fetchone()

        if not result:
            return jsonify({"error": "Conjugation not found"}), 404

        old_verb, old_person, old_tense = result["verb"], result["person"], result["tense"]

        # ✅ Update `conjugations` table
        cur.execute("""
            UPDATE conjugations 
            SET verb = %s, person = %s, tense = %s, conjugation = %s, irregular = %s, pronominal = %s, verb_group= %s
            WHERE id = %s;
        """, (new_verb, new_person, new_tense, new_conjugation, irregular, pronominal, verb_group, conjugation_id))

        # ✅ If the verb, person, or tense changed, update `conjugation_tracking`
        if (old_verb, old_person, old_tense) != (new_verb, new_person, new_tense):
            cur.execute("""
                UPDATE conjugation_tracking 
                SET verb = %s, person = %s, tense = %s
                WHERE id = %s;
            """, (new_verb, new_person, new_tense, conjugation_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Conjugation updated successfully!"}), 200

    except Exception as e:
        print("❌ ERROR in update_conjugation:", str(e))  
        return jsonify({"error": str(e)}), 500
    
@app.route('/delete_conjugation/<int:conjugation_id>', methods=['DELETE'])
def delete_conjugation(conjugation_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ First, check if the conjugation exists
        cur.execute("SELECT verb FROM conjugations WHERE id = %s;", (conjugation_id,))
        result = cur.fetchone()

        if not result:
            return jsonify({"error": "Conjugation not found"}), 404

        # ✅ Delete from `conjugation_tracking` first
        cur.execute("DELETE FROM conjugation_tracking WHERE id = %s;", (conjugation_id,))

        # ✅ Delete from `conjugations`
        cur.execute("DELETE FROM conjugations WHERE id = %s;", (conjugation_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Conjugation deleted successfully!"}), 200

    except Exception as e:
        print("❌ ERROR in delete_conjugation:", str(e))  
        return jsonify({"error": str(e)}), 500



@app.route("/start_conjugation_game", methods=["POST"])
def start_conjugation_game():
    try:
        if not request.is_json:
            return jsonify({"error": "Invalid JSON format"}), 400

        data = request.get_json()
        print("Received JSON Data:", data)

        # 1) Parse advanced filters
        time_limit = data.get("time_limit", 300)
        mode = data.get("mode", "both")   # "regular", "irregular", or "both"
        tenses = data.get("tenses", [])   # array of strings
        groups = data.get("groups", [])   # array of ints
        pronominal_mode = data.get("pronominal_mode", "both")  # "only", "exclude", "both"

        conn = get_db_connection()
        cur = conn.cursor()

        # --- Step 1: Validate your tracking tables (same as before) ---
        # (unchanged code) ...
        cur.execute("""
            SELECT ct.id
            FROM conjugation_tracking ct
            LEFT JOIN conjugations c ON ct.id = c.id
            WHERE c.id IS NULL;
        """)
        invalid_entries = cur.fetchall()
        if invalid_entries:
            print("❌ ERROR: Inconsistent IDs in conj tracking:", invalid_entries)
            return jsonify({"error": "Inconsistent conj IDs found"}), 500

        cur.execute("""
            SELECT c.id FROM conjugations c
            LEFT JOIN conjugation_tracking ct ON c.id = ct.id
            WHERE ct.id IS NULL;
        """)
        missing_conjugations = cur.fetchall()
        if missing_conjugations:
            print("❌ ERROR: Missing conj in tracking:", missing_conjugations)
            return jsonify({"error": "Some conj are missing from tracking"}), 500

        # Step 2: Update scores if needed (same as before)
        cur.execute("""
            UPDATE conjugation_tracking
            SET score = GREATEST(
                1 + (array_length(mistake_timestamps, 1) * 2) + 
                EXTRACT(EPOCH FROM (NOW() - COALESCE(last_accessed, '2000-01-01'::TIMESTAMPTZ))) / 3600,
                1
            )
            WHERE score IS NULL OR score < 1;
        """)
        conn.commit()

        # 2) Build WHERE clauses
        where_clauses = []
        params = {}

        # (a) Filter by "mode" => irregular
        if mode == "regular":
            where_clauses.append("c.irregular = FALSE")
        elif mode == "irregular":
            where_clauses.append("c.irregular = TRUE")
        # if "both", we do no filter

        # (b) Filter by tenses
        if len(tenses) > 0:
            where_clauses.append("c.tense = ANY(%(tenses)s)")
            params["tenses"] = tenses  # e.g. ["présent","imparfait"]

        # (c) Filter by groups
        if len(groups) > 0:
            where_clauses.append("c.verb_group = ANY(%(groups)s)")
            params["groups"] = groups  # e.g. [1,2]

        # (d) pronominal mode
        if pronominal_mode == "only":
            where_clauses.append("c.pronominal = TRUE")
        elif pronominal_mode == "exclude":
            where_clauses.append("c.pronominal = FALSE")
        # if "both", no filter

        # Build final WHERE
        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        # Step 3: Query
        query = f"""
            SELECT c.id, c.verb, c.person, c.tense, c.conjugation, 
                   c.irregular, c.pronominal, c.verb_group
            FROM conjugations c
            JOIN conjugation_tracking ct ON c.id = ct.id
            {where_sql}
            ORDER BY RANDOM() * ct.score DESC
            LIMIT 500;
        """

        cur.execute(query, params)
        conjugations = cur.fetchall()

        cur.close()
        conn.close()

        return jsonify({"conjugations": conjugations}), 200

    except Exception as e:
        print("❌ Error in start_conjugation_game:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/end_conjugation_game", methods=["POST"])
def end_conjugation_game():
    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 400

    data = request.get_json()
    results = data.get("results")  # List of attempts
    time_limit = data.get("time_limit")  # in seconds
    mode = data.get("mode")  # "regular","irregular","both"
    zen_mode = data.get("zen_mode", False)
    ungraded = data.get("ungraded", False)
    tenses = data.get("tenses", [])  # array of strings
    groups = data.get("groups", [])  # array of ints
    pronominal_mode = data.get("pronominal_mode", "both")

    total_attempts = data.get("total_attempts")
    correct_answers = data.get("correct_answers")  # or "score"

    if results is None or total_attempts is None or correct_answers is None:
        return jsonify({"error": "Missing required data"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Insert a row in "conjugation_game_runs"
        # storing each field in the new columns
        # e.g. "end_time" is optional
        cur.execute("""
            INSERT INTO conjugation_game_runs (
              end_time,
              time_limit,
              mode,
              zen_mode,
              ungraded,
              tenses,
              groups,
              pronominal_mode,
              total_attempts,
              correct_answers
            )
            VALUES (
              NOW(),
              %s, %s, %s, %s,
              %s, %s, %s,
              %s, %s
            );
        """, (
            time_limit,
            mode,
            zen_mode,
            ungraded,
            tenses,            # TEXT[]
            groups,            # INT[]
            pronominal_mode,   # TEXT
            total_attempts,
            correct_answers
        ))

        # Update each attempt in "conjugation_tracking"
        for result in results:
            conj_id = result["id"]
            correct = result["correct"]

            # update usage
            cur.execute("""
                UPDATE conjugation_tracking
                SET last_accessed = NOW(),
                    total_attempts = total_attempts + 1
                WHERE id = %s;
            """, (conj_id,))

            if not correct:
                cur.execute("""
                    UPDATE conjugation_tracking
                    SET mistake_timestamps = array_append(mistake_timestamps, NOW())
                    WHERE id = %s;
                """, (conj_id,))

            # re-calc score
            cur.execute("""
                UPDATE conjugation_tracking
                SET score = GREATEST(
                    3 + (array_length(mistake_timestamps, 1) * 2) +
                        EXTRACT(EPOCH FROM (NOW() - last_accessed)) / 3600,
                    3
                )
                WHERE id = %s;
            """, (conj_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Conjugation game ended successfully!"}), 200

    except Exception as e:
        print("❌ ERROR in end_conjugation_game:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
def get_stats():
    """
    Returns statistics for a given date range.
    Query Parameter:
      - range: "all", "week", or "month"
    
    The JSON response contains:
      - overallStats: overview counts and computed average accuracy and most frequent format
      - cumulativeGrowth: cumulative totals (words and conjugations) by day
      - gradedWordRuns: array of graded word game runs (with run_date and accuracy)
      - gradedConjRuns: array of graded conjugation game runs (with run_date and accuracy)
      - ungradedWordRuns: array of ungraded word game runs (with run_date, score, time_limit, ratio)
      - ungradedConjRuns: array of ungraded conjugation game runs (with run_date, score, time_limit, ratio)
      - bestWords / worstWords: arrays from word_tracking with computed accuracy
      - bestConjugations / worstConjugations: arrays from conjugation_tracking with computed accuracy
    """
    try:
        time_range = request.args.get("range", "all")
        if time_range == "week":
            vocab_filter = "WHERE created_at >= NOW() - INTERVAL '7 days'"
            conj_filter = "WHERE created_at >= NOW() - INTERVAL '7 days'"
            game_filter = "WHERE timestamp >= NOW() - INTERVAL '7 days'"
            conj_game_filter = "WHERE end_time >= NOW() - INTERVAL '7 days'"
            tracking_filter = "WHERE last_accessed >= NOW() - INTERVAL '7 days'"
        elif time_range == "month":
            vocab_filter = "WHERE created_at >= NOW() - INTERVAL '30 days'"
            conj_filter = "WHERE created_at >= NOW() - INTERVAL '30 days'"
            game_filter = "WHERE timestamp >= NOW() - INTERVAL '30 days'"
            conj_game_filter = "WHERE end_time >= NOW() - INTERVAL '30 days'"
            tracking_filter = "WHERE last_accessed >= NOW() - INTERVAL '30 days'"
        else:
            vocab_filter = ""
            conj_filter = ""
            game_filter = ""
            conj_game_filter = ""
            tracking_filter = ""

        # For graded/ungraded queries we need to add an extra condition.
        if game_filter.strip() == "":
            graded_game_filter = "WHERE ungraded = FALSE"
            ungraded_game_filter = "WHERE ungraded = TRUE"
        else:
            graded_game_filter = game_filter + " AND ungraded = FALSE"
            ungraded_game_filter = game_filter + " AND ungraded = TRUE"

        if conj_game_filter.strip() == "":
            graded_conj_game_filter = "WHERE ungraded = FALSE"
            ungraded_conj_game_filter = "WHERE ungraded = TRUE"
        else:
            graded_conj_game_filter = conj_game_filter + " AND ungraded = FALSE"
            ungraded_conj_game_filter = conj_game_filter + " AND ungraded = TRUE"

        if tracking_filter.strip() == "":
            word_tracking_filter = "WHERE total_attempts > 0"
            conj_tracking_filter = "WHERE total_attempts > 0"
        else:
            word_tracking_filter = tracking_filter + " AND total_attempts > 0"
            conj_tracking_filter = tracking_filter + " AND total_attempts > 0"

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # --- OVERVIEW STATS ---
        cur.execute(f"SELECT COUNT(*) AS words_added FROM vocabulary {vocab_filter};")
        words_added = cur.fetchone()["words_added"]

        cur.execute(f"SELECT COUNT(*) AS conj_added FROM conjugations {conj_filter};")
        conj_added = cur.fetchone()["conj_added"]

        cur.execute(f"SELECT COUNT(*) AS word_games_played FROM game_runs {game_filter};")
        word_games_played = cur.fetchone()["word_games_played"]

        cur.execute(f"SELECT COUNT(*) AS conj_games_played FROM conjugation_game_runs {conj_game_filter};")
        conj_games_played = cur.fetchone()["conj_games_played"]

        # Accuracy calculations for graded attempts
        cur.execute(f"""
            SELECT COALESCE(SUM(correct_words),0) AS word_correct,
                   COALESCE(SUM(total_words_attempted),0) AS word_attempts
            FROM game_runs {graded_game_filter};
        """)
        word_stats = cur.fetchone()

        cur.execute(f"""
            SELECT COALESCE(SUM(correct_answers),0) AS conj_correct,
                   COALESCE(SUM(total_attempts),0) AS conj_attempts
            FROM conjugation_game_runs {graded_conj_game_filter};
        """)
        conj_stats = cur.fetchone()

        total_attempts = word_stats["word_attempts"] + conj_stats["conj_attempts"]
        total_correct = word_stats["word_correct"] + conj_stats["conj_correct"]
        avg_accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

        # Most frequent format played
        cur.execute(f"""
            SELECT CONCAT('Vocabulary (', game_type, '), ', (time_limit * 60), 's, ',
                          CASE WHEN zen_mode THEN 'Zen' ELSE 'Non-Zen' END) AS format, COUNT(*) AS cnt
            FROM game_runs {game_filter}
            GROUP BY format;
        """)
        word_formats = cur.fetchall()

        cur.execute(f"""
            SELECT CONCAT('Conjugation, ', time_limit, 's, ',
                          CASE WHEN zen_mode THEN 'Zen' ELSE 'Non-Zen' END) AS format, COUNT(*) AS cnt
            FROM conjugation_game_runs {conj_game_filter}
            GROUP BY format;
        """)
        conj_formats = cur.fetchall()

        all_formats = word_formats + conj_formats
        most_frequent_format = "N/A"
        if all_formats:
            all_formats.sort(key=lambda x: x["cnt"], reverse=True)
            most_frequent_format = all_formats[0]["format"]

        overall_stats = {
            "wordsAdded": words_added,
            "conjugationsAdded": conj_added,
            "wordGamesPlayed": word_games_played,
            "conjugationGamesPlayed": conj_games_played,
            "averageAccuracy": round(avg_accuracy, 2),
            "mostFrequentFormat": most_frequent_format
        }

        # --- CUMULATIVE GROWTH DATA ---
        cur.execute(f"""
            SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
            FROM vocabulary {vocab_filter}
            GROUP BY day
            ORDER BY day;
        """)
        word_daily = cur.fetchall()

        cur.execute(f"""
            SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count
            FROM conjugations {conj_filter}
            GROUP BY day
            ORDER BY day;
        """)
        conj_daily = cur.fetchall()

        cumulative = {}
        for row in word_daily:
            day_str = row["day"].strftime("%Y-%m-%d")
            cumulative[day_str] = {"newWords": row["count"], "newConjugations": 0}
        for row in conj_daily:
            day_str = row["day"].strftime("%Y-%m-%d")
            if day_str in cumulative:
                cumulative[day_str]["newConjugations"] = row["count"]
            else:
                cumulative[day_str] = {"newWords": 0, "newConjugations": row["count"]}
        dates = sorted(cumulative.keys())
        cumulative_growth = []
        cum_words = 0
        cum_conjs = 0
        for d in dates:
            cum_words += cumulative[d]["newWords"]
            cum_conjs += cumulative[d]["newConjugations"]
            cumulative_growth.append({
                "date": d,
                "cumulativeWords": cum_words,
                "cumulativeConjugations": cum_conjs
            })

        # --- RUN DATA FOR GRAPHS ---
        # Use CASE in SQL to avoid division by zero.
        cur.execute(f"""
            SELECT timestamp AS run_date,
                   CASE WHEN total_words_attempted = 0 THEN 0
                        ELSE (correct_words::float/total_words_attempted*100)
                   END AS accuracy
            FROM game_runs {graded_game_filter}
            ORDER BY timestamp;
        """)
        graded_word_runs = cur.fetchall()

        cur.execute(f"""
            SELECT end_time AS run_date,
                   CASE WHEN total_attempts = 0 THEN 0
                        ELSE (correct_answers::float/total_attempts*100)
                   END AS accuracy
            FROM conjugation_game_runs {graded_conj_game_filter}
            ORDER BY end_time;
        """)
        graded_conj_runs = cur.fetchall()

        cur.execute(f"""
            SELECT timestamp AS run_date, correct_words AS score, time_limit,
                   (correct_words::float/(time_limit * 60)) AS ratio
            FROM game_runs {ungraded_game_filter}
            ORDER BY timestamp;
        """)
        ungraded_word_runs = cur.fetchall()

        cur.execute(f"""
            SELECT end_time AS run_date, correct_answers AS score, time_limit,
                   (correct_answers::float/time_limit) AS ratio
            FROM conjugation_game_runs {ungraded_conj_game_filter}
            ORDER BY end_time;
        """)
        ungraded_conj_runs = cur.fetchall()

        # --- BEST/WORST WORDS ---
        cur.execute(f"""
            SELECT word, total_attempts,
                   COALESCE(array_length(mistake_timestamps, 1), 0) AS mistakes
            FROM word_tracking {word_tracking_filter};
        """)
        word_stats_rows = cur.fetchall()
        for row in word_stats_rows:
            attempts = row["total_attempts"]
            mistakes = row["mistakes"]
            row["accuracy"] = ( (attempts - mistakes) / attempts * 100 ) if attempts > 0 else 0
        best_words = sorted(word_stats_rows, key=lambda r: (r["accuracy"], r["total_attempts"]), reverse=True)[:5]
        worst_words = sorted(word_stats_rows, key=lambda r: (r["mistakes"], r["total_attempts"]), reverse=True)[:5]

        # --- BEST/WORST CONJUGATIONS ---
        cur.execute(f"""
            SELECT verb, total_attempts,
                   COALESCE(array_length(mistake_timestamps, 1), 0) AS mistakes
            FROM conjugation_tracking {conj_tracking_filter};
        """)
        conj_stats_rows = cur.fetchall()
        for row in conj_stats_rows:
            attempts = row["total_attempts"]
            mistakes = row["mistakes"]
            row["accuracy"] = ( (attempts - mistakes) / attempts * 100 ) if attempts > 0 else 0
        best_conjs = sorted(conj_stats_rows, key=lambda r: (r["accuracy"], r["total_attempts"]), reverse=True)[:5]
        worst_conjs = sorted(conj_stats_rows, key=lambda r: (r["mistakes"], r["total_attempts"]), reverse=True)[:5]

        result = {
            "overallStats": overall_stats,
            "cumulativeGrowth": cumulative_growth,
            "gradedWordRuns": graded_word_runs,
            "gradedConjRuns": graded_conj_runs,
            "ungradedWordRuns": ungraded_word_runs,
            "ungradedConjRuns": ungraded_conj_runs,
            "bestWords": best_words,
            "worstWords": worst_words,
            "bestConjugations": best_conjs,
            "worstConjugations": worst_conjs
        }

        cur.close()
        conn.close()
        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in get_stats:", str(e))
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
