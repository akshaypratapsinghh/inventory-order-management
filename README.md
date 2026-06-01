# Inventory & Order Management System

Full-stack FastAPI, React, and Postgres implementation of the provided three-tier system design.

## Architecture

- Backend: FastAPI, SQLAlchemy 2, Pydantic v2.
- Frontend: React, Vite, Axios, lucide-react.
- Database: Postgres with database-level unique and check constraints.
- Deployment: Docker Compose with `db`, `backend`, and `frontend` services.

## Important Behavior

- `order_items` stores `unit_price` at order time, so historical totals are stable after product price changes.
- `orders.total_amount` is calculated server-side from line item price snapshots.
- Stock validation and stock deduction happen in one backend flow using row locks and a single commit.
- SKU and customer email are unique at the database layer and surfaced as API `409` responses.
- Low-stock products are filtered by the backend with `GET /products?low_stock=true`.

## Run Locally

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

Optional seed data:

```bash
docker compose exec backend python -m app.seed
```

Run backend tests:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest
```

Local backend preview without Docker:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
DATABASE_URL=sqlite:///./ims_dev.db \
.venv/bin/python -m app.seed
DATABASE_URL=sqlite:///./ims_dev.db \
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Environment Variables

Backend:

```env
DATABASE_URL=postgresql://inventory_app:change_me@db:5432/ims_db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
LOW_STOCK_THRESHOLD=10
```

Database:

```env
POSTGRES_USER=inventory_app
POSTGRES_PASSWORD=change_me
POSTGRES_DB=ims_db
```

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

## API Summary

- `GET /products`
- `GET /products?low_stock=true`
- `POST /products`
- `GET /products/{product_id}`
- `PUT /products/{product_id}`
- `PATCH /products/{product_id}`
- `DELETE /products/{product_id}`
- `GET /customers`
- `POST /customers`
- `GET /customers/{customer_id}`
- `PATCH /customers/{customer_id}`
- `DELETE /customers/{customer_id}`
- `GET /orders`
- `POST /orders`
- `GET /orders/{order_id}`
- `DELETE /orders/{order_id}`

## Deployment Notes

Backend deployment on Render, Railway, or Fly.io:

- Provision a managed PostgreSQL database.
- Set `DATABASE_URL` to the hosted PostgreSQL connection string.
- Set `CORS_ORIGINS` to the deployed frontend URL.
- Set `LOW_STOCK_THRESHOLD` as needed.
- Use the backend Dockerfile or run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Frontend deployment on Vercel or Netlify:

- Set `VITE_API_URL` to the deployed backend API URL.
- Build command: `npm run build`.
- Output directory: `dist`.

Docker Hub backend image:

```bash
docker build -t <dockerhub-username>/inventory-api:latest ./backend
docker push <dockerhub-username>/inventory-api:latest
```
