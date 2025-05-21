# Python Flask + React Login Example

This project contains a simple back-end built with Flask and a front-end built with React. The credentials are stored in a JSON file.

## Backend

The backend lives in `backend/` and uses Flask. Run it with:

```bash
python backend/app.py
```

It exposes a POST `/api/login` endpoint expecting JSON payload:

```json
{ "username": "admin", "password": "password" }
```

Default user credentials are defined in `backend/users.json`.

## Frontend

Open `frontend/public/index.html` in your browser. It uses React from CDN. Update the fetch URL if the backend runs on a different host or port.
