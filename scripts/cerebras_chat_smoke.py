from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    from cerebras.cloud.sdk import Cerebras, NotFoundError
except ImportError as exc:  # pragma: no cover - import guard for local setup
    raise SystemExit(
        "Missing dependency: install cerebras-cloud-sdk with "
        "`python -m pip install cerebras-cloud-sdk`."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_PATH = ROOT / ".env.local"
DEFAULT_PROMPT = "Why is fast inference important?"
DEFAULT_PREFERRED_MODEL = "gpt-oss-120b"
DEFAULT_FALLBACK_MODELS = ["llama3.1-8b"]


def load_env_file(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Environment file not found: {path}")

    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        clean_value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), clean_value)


def create_chat_with_fallback(
    client: Cerebras,
    prompt: str,
    preferred_model: str,
    fallback_models: list[str],
):
    last_error: Exception | None = None

    for model in [preferred_model, *fallback_models]:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            return model, response
        except NotFoundError as exc:
            last_error = exc
            continue
        except Exception as exc:
            last_error = exc
            error_text = str(exc).lower()
            if "model_not_found" in error_text or "do not have access" in error_text:
                continue
            raise

    raise RuntimeError(f"No usable Cerebras model found. Last error: {last_error}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a small Cerebras chat completion smoke test with fallback models."
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        default=DEFAULT_PROMPT,
        help="Prompt to send to Cerebras chat completions.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_PATH,
        help="Path to the env file that contains CEREBRAS_API_KEY.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_PREFERRED_MODEL,
        help="Preferred Cerebras model to try first.",
    )
    parser.add_argument(
        "--fallback-model",
        action="append",
        default=[],
        help="Fallback model to try if the preferred model is unavailable. Repeat as needed.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_env_file(args.env_file)

    api_key = os.environ.get("CEREBRAS_API_KEY")
    if not api_key:
        raise RuntimeError(f"CEREBRAS_API_KEY is not set after loading {args.env_file}")

    fallback_models = args.fallback_model or DEFAULT_FALLBACK_MODELS
    client = Cerebras(api_key=api_key)
    used_model, chat_completion = create_chat_with_fallback(
        client=client,
        prompt=args.prompt,
        preferred_model=args.model,
        fallback_models=fallback_models,
    )

    message = chat_completion.choices[0].message.content or ""
    print(f"Model used: {used_model}")
    print(message)
    return 0


if __name__ == "__main__":
    sys.exit(main())
