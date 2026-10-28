"""Single-origin entrypoint for local production, Docker and Vercel."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app.api import router

app = FastAPI(
    title="WindSight API",
    version="1.0.0",
    description="Auditable Elexon WINDFOR as-of selection and FUELHH WIND accuracy. All power values are MW.",
)
app.include_router(router)

frontend = Path(__file__).parent / "frontend" / "dist"
if frontend.is_dir():
    app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
