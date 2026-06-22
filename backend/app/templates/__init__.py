from pathlib import Path

TEMPLATES_DIR = Path(__file__).parent


def render_template(name: str, **kwargs: str) -> str:
    path = TEMPLATES_DIR / name
    content = path.read_text()
    for key, value in kwargs.items():
        content = content.replace(f"{{{{ {key} }}}}", value)
    return content
