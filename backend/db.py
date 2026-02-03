import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), 'players.db')

TEAMS = ['PL', 'PLR', 'PB', 'PC', 'PE', 'Metro']
GRADE_ORDER = {'Metro': 0, 'PE': 1, 'PC': 2, 'PB': 3, 'PLR': 4, 'PL': 5}

VALID_STATUSES = [
    'Planning to play',
    'Unsure',
    'Unlikely to play',
    'Not heard from',
    'Not returning',
    'Fill-in only',
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS players (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            name                TEXT NOT NULL,
            main_team           TEXT NOT NULL,
            status              TEXT NOT NULL DEFAULT 'Not heard from',
            notes               TEXT DEFAULT '',

            -- Contact
            email               TEXT,
            mobile              TEXT,

            -- From Google Sheet / CSV
            submission_id       TEXT,                  -- unique per submission
            respondent_id       TEXT,                  -- ties dupes together
            submitted_at        TEXT,
            playing_availability TEXT,                 -- raw value from sheet
            fillin_emergency    TEXT,                  -- "Fill-in / emergency" field
            happy_followup      TEXT,                  -- Yes/No
            reason_unsure       TEXT,
            what_describes_you  TEXT,
            interested_in       TEXT,
            club_level_last     TEXT,                  -- "Club and level last played?"
            main_team_last_year TEXT,                  -- "Main team played with last year?"
            did_play_last_year  TEXT,                  -- Yes/No
            club_grade_last     TEXT,                  -- "Club and grade/level last played?"
            playing_preference  TEXT,                  -- "Playing preference for 2026?"
            anything_else       TEXT,                  -- free text

            created_at          TEXT DEFAULT (datetime('now')),
            updated_at          TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS squad_appearances (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id   INTEGER NOT NULL,
            team        TEXT NOT NULL,
            games       INTEGER NOT NULL DEFAULT 0,   -- 2025 games played
            is_main     INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
            UNIQUE(player_id, team)
        );
    ''')
    conn.commit()
    conn.close()