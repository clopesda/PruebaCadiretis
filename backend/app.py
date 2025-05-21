from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    users = load_users()
    if username in users and users[username] == password:
        return jsonify({'success': True})
    return jsonify({'success': False}), 401

if __name__ == '__main__':
    app.run(debug=True)
