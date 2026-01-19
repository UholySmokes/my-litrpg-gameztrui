from pathlib import Path
import re


def fix_markdown(path: Path) -> None:
    if not path.exists():
        print(f"Datei nicht gefunden: {path}")
        return

    lines = path.read_text(encoding="utf-8").splitlines()
    new_lines = []
    after_heading = False
    in_list = False
    inside_code = False
    need_blank_after_code = False

    list_pattern = re.compile(r"^(?:[-*]|\d+\.)\s+")

    for line in lines:
        stripped = line.strip()
        is_heading = stripped.startswith("#")
        is_code = stripped.startswith("```")
        is_list = bool(list_pattern.match(stripped)) and not inside_code

        if need_blank_after_code and stripped != "":
            if new_lines and new_lines[-1].strip() != "":
                new_lines.append("")
            need_blank_after_code = False

        if is_heading and not inside_code:
            if new_lines and new_lines[-1].strip() != "":
                new_lines.append("")
            new_lines.append(stripped)
            after_heading = True
            in_list = False
            continue

        if after_heading and stripped != "":
            new_lines.append("")
            after_heading = False

        if is_code:
            fence = line
            if not inside_code:
                if stripped == '```':
                    fence = "```text"
                inside_code = True
            else:
                inside_code = False
                need_blank_after_code = True
            if new_lines and new_lines[-1].strip() != "":
                new_lines.append("")
            new_lines.append(fence)
            continue

        if stripped == "":
            if new_lines and new_lines[-1].strip() == "":
                continue
            new_lines.append("")
            in_list = False
            after_heading = False
            continue

        if is_list:
            if not in_list and new_lines and new_lines[-1].strip() != "":
                new_lines.append("")
            new_lines.append(line)
            in_list = True
            continue

        if in_list and new_lines and new_lines[-1].strip() != "":
            new_lines.append("")
            in_list = False

        new_lines.append(line)

    text = "\n".join(new_lines).rstrip() + "\n"
    path.write_text(text, encoding="utf-8")
    print(f"Formatierung abgeschlossen: {path.name}")


def main():
    files = [
        Path("README.md"),
        Path("current_state.md"),
        Path("CLASS_SYSTEMS_SUMMARY.md"),
        Path("consolidation_plan.md"),
        Path("IMPLEMENTATION_PLAN.md"),
        Path("LORE_AUDIT_REPORT.md"),
        Path("RPG_BLUEPRINT.md"),
    ]

    for file in files:
        fix_markdown(file)


if __name__ == "__main__":
    main()
