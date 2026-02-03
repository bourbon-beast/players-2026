from flask import Flask, jsonify, request
from db import get_db, init_db, TEAMS, VALID_STATUSES

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
# Fields we expose via the API (excludes internal/raw sheet dupes)
PLAYER_FIELDS = [
    'id', 'name', 'main_team', 'status', 'notes',
    'email', 'mobile',
    'submission_id', 'respondent_id', 'submitted_at',
    'playing_availability', 'fillin_emergency', 'happy_followup',
    'reason_unsure', 'what_describes_you', 'interested_in',
    'club_level_last', 'main_team_last_year', 'did_play_last_year',
    'club_grade_last', 'playing_preference', 'anything_else',
    'created_at', 'updated_at',
]

def player_row_to_dict(row):
    return {f: (row[f] if row[f] is not None else '') for f in PLAYER_FIELDS}

def get_appearances(conn, player_id):
    rows = conn.execute(
        'SELECT team, games, is_main FROM squad_appearances WHERE player_id = ? ORDER BY games DESC',
        (player_id,)
    ).fetchall()
    return [{'team': r['team'], 'games': r['games'], 'is_main': bool(r['is_main'])} for r in rows]

def full_player(conn, player_id):
    row = conn.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not row:
        return None
    p = player_row_to_dict(row)
    p['appearances'] = get_appearances(conn, player_id)
    return p

# ---------------------------------------------------------------------------
# Players — CRUD
# ---------------------------------------------------------------------------
@app.route('/api/players', methods=['GET'])
def list_players():
    team_filter = request.args.get('team')
    conn = get_db()
    if team_filter:
        rows = conn.execute('''
            SELECT DISTINCT p.*
            FROM players p
            JOIN squad_appearances sa ON sa.player_id = p.id
            WHERE sa.team = ?
            ORDER BY p.name
        ''', (team_filter,)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM players ORDER BY name').fetchall()

    result = []
    for r in rows:
        p = player_row_to_dict(r)
        p['appearances'] = get_appearances(conn, r['id'])
        result.append(p)
    conn.close()
    return jsonify(result)

@app.route('/api/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    conn = get_db()
    p = full_player(conn, player_id)
    conn.close()
    if not p:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(p)

@app.route('/api/players', methods=['POST'])
def create_player():
    data = request.get_json()
    name = (data.get('name') or '').strip()
    main_team = data.get('main_team')
    if not name or main_team not in TEAMS:
        return jsonify({'error': 'name and valid main_team required'}), 400

    # Build insert with all optional fields
    fields = ['name', 'main_team', 'status', 'notes', 'email', 'mobile',
              'submission_id', 'respondent_id', 'submitted_at',
              'playing_availability', 'fillin_emergency', 'happy_followup',
              'reason_unsure', 'what_describes_you', 'interested_in',
              'club_level_last', 'main_team_last_year', 'did_play_last_year',
              'club_grade_last', 'playing_preference', 'anything_else']
    values = [
        name, main_team,
        data.get('status', 'Not heard from'),
        data.get('notes', ''),
        data.get('email'), data.get('mobile'),
        data.get('submission_id'), data.get('respondent_id'), data.get('submitted_at'),
        data.get('playing_availability'), data.get('fillin_emergency'), data.get('happy_followup'),
        data.get('reason_unsure'), data.get('what_describes_you'), data.get('interested_in'),
        data.get('club_level_last'), data.get('main_team_last_year'), data.get('did_play_last_year'),
        data.get('club_grade_last'), data.get('playing_preference'), data.get('anything_else'),
    ]
    placeholders = ','.join(['?'] * len(fields))
    col_names = ','.join(fields)

    conn = get_db()
    cur = conn.execute(f"INSERT INTO players ({col_names}) VALUES ({placeholders})", values)
    player_id = cur.lastrowid

    # Auto-create main squad appearance
    conn.execute(
        "INSERT INTO squad_appearances (player_id, team, games, is_main) VALUES (?, ?, ?, 1)",
        (player_id, main_team, data.get('games', 0))
    )
    conn.commit()
    p = full_player(conn, player_id)
    conn.close()
    return jsonify(p), 201

@app.route('/api/players/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    data = request.get_json()
    status = data.get('status', row['status'])
    notes = data.get('notes', row['notes'] or '')

    if status not in VALID_STATUSES:
        conn.close()
        return jsonify({'error': 'Invalid status'}), 400

    conn.execute(
        "UPDATE players SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
        (status, notes, player_id)
    )
    conn.commit()
    p = full_player(conn, player_id)
    conn.close()
    return jsonify(p)

@app.route('/api/players/<int:player_id>', methods=['DELETE'])
def delete_player(player_id):
    conn = get_db()
    conn.execute('DELETE FROM players WHERE id = ?', (player_id,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ---------------------------------------------------------------------------
# Squad appearances — add / remove fill-ins
# ---------------------------------------------------------------------------
@app.route('/api/players/<int:player_id>/appearances', methods=['POST'])
def add_appearance(player_id):
    conn = get_db()
    row = conn.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Player not found'}), 404

    data = request.get_json()
    team = data.get('team')
    if team not in TEAMS:
        conn.close()
        return jsonify({'error': 'Invalid team'}), 400

    existing = conn.execute(
        'SELECT id FROM squad_appearances WHERE player_id = ? AND team = ?',
        (player_id, team)
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Already on this team'}), 409

    conn.execute(
        "INSERT INTO squad_appearances (player_id, team, games, is_main) VALUES (?, ?, ?, 0)",
        (player_id, team, data.get('games', 0))
    )
    conn.commit()
    p = full_player(conn, player_id)
    conn.close()
    return jsonify(p), 201

@app.route('/api/players/<int:player_id>/appearances/<string:team>', methods=['DELETE'])
def remove_appearance(player_id, team):
    conn = get_db()
    app_row = conn.execute(
        'SELECT is_main FROM squad_appearances WHERE player_id = ? AND team = ?',
        (player_id, team)
    ).fetchone()
    if not app_row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    if app_row['is_main']:
        conn.close()
        return jsonify({'error': 'Cannot remove main squad appearance'}), 400

    conn.execute('DELETE FROM squad_appearances WHERE player_id = ? AND team = ?', (player_id, team))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ---------------------------------------------------------------------------
# Meta + Dashboard
# ---------------------------------------------------------------------------
@app.route('/api/teams', methods=['GET'])
def get_teams():
    return jsonify(TEAMS)

@app.route('/api/statuses', methods=['GET'])
def get_statuses():
    return jsonify(VALID_STATUSES)

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    conn = get_db()
    result = {}
    for team in TEAMS:
        main_count = conn.execute(
            'SELECT COUNT(*) as cnt FROM players WHERE main_team = ?', (team,)
        ).fetchone()['cnt']

        statuses = conn.execute('''
            SELECT status, COUNT(*) as cnt FROM players WHERE main_team = ? GROUP BY status
        ''', (team,)).fetchall()

        fillin_count = conn.execute(
            'SELECT COUNT(*) as cnt FROM squad_appearances WHERE team = ? AND is_main = 0', (team,)
        ).fetchone()['cnt']

        result[team] = {
            'main_squad': main_count,
            'fill_ins': fillin_count,
            'status_breakdown': {r['status']: r['cnt'] for r in statuses},
        }
    conn.close()
    return jsonify(result)

# ---------------------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)