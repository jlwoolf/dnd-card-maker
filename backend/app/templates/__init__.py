"""Jinja2 template renderer for email bodies.

Uses ``fastapi.templating.Jinja2Templates`` (backed by Starlette) for
proper HTML escaping and template inheritance.
"""

from pathlib import Path

from fastapi.templating import Jinja2Templates

TEMPLATES_DIR = Path(__file__).parent
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def render_template(name: str, **kwargs: str) -> str:
    """Render a template file by name, returning the resulting HTML string.

    Maintains backward-compatibility with the previous ``str.replace``
    implementation — callers pass keyword arguments and receive a string.
    """
    # Jinja2Templates.TemplateResponse normally needs a Request, but we
    # render static email bodies here so we use the underlying env directly.
    tmpl = templates.env.get_template(name)
    return tmpl.render(**kwargs)
