<div align="center">
<h1>E Home (Casă Inteligentă)</h1>
<p>Proiectul este împărțit în Frontend (Next.js) și Backend (Python/FastAPI) pentru o separare clară a logicii părții de client și a logicii serverului.</p>
</div>

## Descrierea Arhitecturii

Proiectul a fost modificat și adaptat în conformitate cu cerințele lucrării de laborator (Lab #03). 
În loc de baze de date în cloud și Node.js, backend-ul utilizează acum framework-ul **FastAPI**, o bază de date locală **SQLite** și sistem de autentificare bazat pe **JWT** (JSON Web Tokens).

Frontend-ul este realizat folosind **Next.js** și interacționează cu backend-ul prin intermediul unui API REST.

---

## Rularea Proiectului

Deoarece proiectul este împărțit în două părți distincte, va trebui să rulați backend-ul și frontend-ul separat — în două ferestre de terminal diferite.

### Pasul 1. Rularea Backend-ului (FastAPI + SQLite)

Backend-ul este responsabil pentru gestionarea și stocarea datelor utilizatorilor și dispozitivelor în baza de date locală `smart_home.db`. Această bază de date va fi creată automat la prima pornire a serverului.

1. Deschideți un terminal și navigați în directorul backend-ului:
   ```bash
   cd backend
   ```
2. Creați și activați un mediu virtual (virtual environment):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Instalați dependențele necesare:
   ```bash
   pip install -r requirements.txt
   ```
4. Porniți serverul (cu opțiunea de reîncărcare automată):
   ```bash
   uvicorn main:app --port 3001 --reload
   ```
   *Serverul va porni la adresa `http://localhost:3001`. Documentația interactivă Swagger UI va fi disponibilă la `http://localhost:3001/docs`.*

### Pasul 2. Rularea Frontend-ului (Next.js)

1. Deschideți al doilea terminal și navigați în directorul frontend-ului:
   ```bash
   cd frontend
   ```
2. (Opțional) Creați fișierul `.env` pe baza exemplului, dacă este necesar:
   ```bash
   cp .env.example .env
   ```
3. Instalați pachetele și modulele necesare:
   ```bash
   npm install
   ```
4. Porniți aplicația client în modul de dezvoltare:
   ```bash
   npm run dev
   ```
   *Aplicația va porni la adresa `http://localhost:3000`.* 

---
