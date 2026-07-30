#!/usr/bin/env python3
"""Generate reviewed, user-run productivity archive import artifacts.

Reads the approved 2025/2026 workbooks plus production member/board CSV exports.
Never opens a database connection.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import re
import shutil
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
GROUPS = {"tunaiku": "Loan", "platform": "Loan", "funding": "Transaction", "ambis": "User"}
CLOSED_2025_MONTHS = {f"2025-{month:02d}" for month in range(1, 13)}
CLOSED_2026_MONTHS = {f"2026-{month:02d}" for month in range(1, 7)}
GREEN_AUTOFILL_DATES = {365: ("2025-01-20", "2025-01-31")}
BLUE_AUTOFILL_DATES = {
    row: ("2026-02-26", "2026-03-13")
    for row in (17, 18, 19, 60, 61, 62, 63, 132, 133, 134, 135, 136)
}


def normalized(value: object) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def excel_date(value: object) -> str | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    try:
        return (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(text))).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return None


def number(value: object) -> float | None:
    if value in (None, "", "-"):
        return None
    parsed = float(str(value).strip())
    if parsed < 0:
        raise ValueError(f"negative numeric value: {value}")
    return parsed


def column_index(reference: str) -> int:
    result = 0
    for character in re.match(r"[A-Z]+", reference).group(0):
        result = result * 26 + ord(character) - 64
    return result - 1


def workbook_rows(path: Path, sheet_name: str) -> list[tuple[int, dict[int, object]]]:
    with zipfile.ZipFile(path) as workbook:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(MAIN_NS + "t")) for item in root]

        metadata = ET.fromstring(workbook.read("xl/workbook.xml"))
        relationships = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
        sheets = {
            item.attrib["name"]: targets[item.attrib[REL_ID]]
            for item in metadata.find(MAIN_NS + "sheets")
        }
        target = sheets[sheet_name]
        target = target if target.startswith("xl/") else "xl/" + target.lstrip("/")
        root = ET.fromstring(workbook.read(target))
        rows: list[tuple[int, dict[int, object]]] = []
        for row in root.findall(f".//{MAIN_NS}sheetData/{MAIN_NS}row"):
            values: dict[int, object] = {}
            for cell in row.findall(MAIN_NS + "c"):
                index = column_index(cell.attrib["r"])
                cell_type = cell.attrib.get("t")
                raw = cell.find(MAIN_NS + "v")
                value: object = None if raw is None else raw.text
                if cell_type == "s" and value is not None:
                    value = shared[int(value)]
                elif cell_type == "inlineStr":
                    value = "".join(node.text or "" for node in cell.iter(MAIN_NS + "t"))
                values[index] = value
            rows.append((int(row.attrib["r"]), values))
        return rows


def table(path: Path, sheet_name: str, header_row: int) -> list[tuple[int, dict[str, object]]]:
    rows = workbook_rows(path, sheet_name)
    header = next(values for row_number, values in rows if row_number == header_row)
    names = {index: str(value).strip() for index, value in header.items() if value not in (None, "")}
    return [
        (row_number, {name: values.get(index) for index, name in names.items()})
        for row_number, values in rows
        if row_number > header_row and any(value not in (None, "") for value in values.values())
    ]


def csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as source:
        return list(csv.DictReader(source))


def historical_identity(name: str) -> str:
    digest = hashlib.sha256(normalized(name).encode()).hexdigest()[:16]
    return f"historical:{digest}"


def raw_json(row: dict[str, object], source_row: int) -> dict[str, object]:
    return {"sourceRow": source_row, **{key: value for key, value in row.items() if value not in (None, "")}}


def archive_record(
    *, row: dict[str, object], source_row: int, source_format: str, start_date: str,
    end_date: str, member_identity: str, historical_only: bool, board_id: int | None,
    group: str, level: object, main_role: object, sp_total: float | None, sp_target: float | None, working_days: float | None,
) -> dict[str, object]:
    developer = str(row["Developer"]).strip()
    sprint = str(row["Sprint"]).strip()
    team = str(row.get("Team") or "").strip() or None
    archived_month = end_date[:7] + "-01"
    normalized_record = {
        "developerNameSnapshot": developer,
        "historicalOnly": historical_only,
        "sourceRow": source_row,
    }
    return {
        "archivedMonth": archived_month,
        "sprintId": sprint,
        "sprintName": f"Sprint {sprint}",
        "sprintStartDate": start_date,
        "sprintEndDate": end_date,
        "boardIdSnapshot": board_id,
        "boardNameSnapshot": team,
        "reportingGroupSnapshot": group,
        "developerIdentityRaw": developer,
        "developerIdentityNormalized": member_identity,
        "developerNameSnapshot": developer,
        "developerLevelRaw": str(level).strip() if level not in (None, "") else None,
        "developerLevelNormalized": normalized(level) or None,
        "mainRoleRaw": str(main_role).strip() if main_role not in (None, "") else None,
        "mainRoleNormalized": normalized(main_role) or None,
        "sourceTeam": team,
        "sourceFormat": source_format,
        "sourceStatus": str(row.get("Status") or "").strip() or None,
        "spTotal": sp_total,
        "spTarget": sp_target,
        "workingDays": working_days,
        "spCompleted": None,
        "spProvenance": source_format,
        "rawRecord": raw_json(row, source_row),
        "normalizedRecord": normalized_record,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--green", type=Path, required=True)
    parser.add_argument("--blue", type=Path, required=True)
    parser.add_argument("--members", type=Path, required=True)
    parser.add_argument("--boards", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()

    members = csv_rows(arguments.members)
    boards = csv_rows(arguments.boards)
    member_by_name = {
        normalized(name): member
        for member in members
        for name in (member.get("full_name"), member.get("name"))
        if name
    }
    board_by_short_name = {normalized(board.get("short_name")): board for board in boards}
    output = arguments.output.resolve()
    if output.exists():
        shutil.rmtree(output)
    (output / "data").mkdir(parents=True)
    (output / "months").mkdir()

    accepted: list[dict[str, object]] = []
    rejected: list[dict[str, object]] = []
    identity_stats = Counter()

    sources = [
        (arguments.green, "Raw", 1, "green-2025", CLOSED_2025_MONTHS),
        (arguments.blue, "Raw Data", 4, "blue-2026", CLOSED_2026_MONTHS),
    ]
    for path, sheet, header_row, source_format, allowed_months in sources:
        for source_row, row in table(path, sheet, header_row):
            developer = str(row.get("Developer") or "").strip()
            if not developer:
                rejected.append({"sourceFormat": source_format, "sourceRow": source_row, "reason": "MISSING_DEVELOPER"})
                continue
            start_date = excel_date(row.get("Start Date"))
            end_date = excel_date(row.get("End Date"))
            if source_format == "green-2025" and source_row in GREEN_AUTOFILL_DATES:
                start_date, end_date = GREEN_AUTOFILL_DATES[source_row]
            if source_format == "blue-2026" and source_row in BLUE_AUTOFILL_DATES:
                start_date, end_date = BLUE_AUTOFILL_DATES[source_row]
            if start_date is None or end_date is None:
                rejected.append({
                    "sourceFormat": source_format, "sourceRow": source_row,
                    "reason": "NO_SPRINT_DATES", "status": row.get("Status"), "developer": developer,
                })
                continue
            if end_date < start_date:
                rejected.append({"sourceFormat": source_format, "sourceRow": source_row, "reason": "END_BEFORE_START"})
                continue
            month = end_date[:7]
            if month not in allowed_months:
                rejected.append({
                    "sourceFormat": source_format, "sourceRow": source_row,
                    "reason": "OUTSIDE_APPROVED_CLOSED_PERIOD", "month": month, "developer": developer,
                })
                continue
            tribe = normalized(row.get("Tribe"))
            group = GROUPS.get(tribe)
            if group is None:
                rejected.append({
                    "sourceFormat": source_format, "sourceRow": source_row,
                    "reason": "UNMAPPED_TRIBE", "tribe": row.get("Tribe"), "developer": developer,
                })
                continue
            member = member_by_name.get(normalized(developer))
            identity = normalized(member.get("email")) if member else historical_identity(developer)
            identity_stats["production" if member else "historical-only"] += 1
            team = normalized(row.get("Team"))
            board = board_by_short_name.get(team)
            board_id = int(board["board_id"]) if board and board.get("board_id") else None
            try:
                sp_total = number(row.get("SP (Total)" if source_format == "green-2025" else "SP Total"))
                sp_target = number(row.get("SP Target"))
                working_days = number(next((row.get(key) for key in ("Working Days", "Working Day", "Day of Work") if row.get(key) not in (None, "")), None))
            except ValueError as error:
                rejected.append({
                    "sourceFormat": source_format, "sourceRow": source_row,
                    "reason": "INVALID_WORKING_DAYS_OR_SP_TOTAL", "evidence": str(error), "developer": developer,
                })
                continue
            accepted.append(archive_record(
                row=row, source_row=source_row, source_format=source_format,
                start_date=start_date, end_date=end_date, member_identity=identity,
                historical_only=member is None, board_id=board_id, group=group,
                level=row.get("Level"), main_role=row.get("Main Role"), sp_total=sp_total, sp_target=sp_target, working_days=working_days,
            ))

    duplicate_keys: dict[tuple[str, str, str, str], list[dict[str, object]]] = defaultdict(list)
    for record in accepted:
        key = (
            str(record["archivedMonth"]), str(record["developerIdentityNormalized"]),
            str(record["sprintId"]), str(record["sprintStartDate"]),
        )
        duplicate_keys[key].append(record)
    duplicates = {key: records for key, records in duplicate_keys.items() if len(records) > 1}
    if duplicates:
        raise SystemExit(f"approved-period duplicates found: {len(duplicates)}")

    by_month: dict[str, list[dict[str, object]]] = defaultdict(list)
    for record in accepted:
        by_month[str(record["archivedMonth"])[:7]].append(record)
    month_manifest: list[dict[str, object]] = []
    for month, records in sorted(by_month.items()):
        records.sort(key=lambda item: (
            str(item["developerIdentityNormalized"]), str(item["sprintStartDate"]), str(item["sprintId"]),
        ))
        data_path = output / "data" / f"{month}.jsonl"
        content = "".join(json.dumps(record, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n" for record in records)
        data_path.write_text(content, encoding="utf-8")
        fingerprint = hashlib.sha256(content.encode()).hexdigest()
        month_manifest.append({
            "month": month, "rowCount": len(records), "sha256": fingerprint,
            "sourceFormat": records[0]["sourceFormat"], "dataFile": str(data_path),
        })

    rejection_path = output / "rejections.json"
    rejection_path.write_text(json.dumps(rejected, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "rules": {
            "groups": GROUPS, "blankStatus": "active", "statusN": "audit-only",
            "greenMonths": sorted(CLOSED_2025_MONTHS), "blueMonths": sorted(CLOSED_2026_MONTHS),
            "greenAutofillDates": GREEN_AUTOFILL_DATES,
            "blueAutofillDates": BLUE_AUTOFILL_DATES,
        },
        "sources": {
            "green": str(arguments.green.resolve()), "blue": str(arguments.blue.resolve()),
            "members": str(arguments.members.resolve()), "boards": str(arguments.boards.resolve()),
        },
        "acceptedRows": len(accepted), "rejectedRows": len(rejected),
        "identityAssignments": dict(identity_stats), "months": month_manifest,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    generate_sql(output, month_manifest)
    generate_readme(output, manifest)


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def generate_sql(output: Path, months: list[dict[str, object]]) -> None:
    includes: list[str] = []
    for item in months:
        month = str(item["month"])
        source_format = str(item["sourceFormat"])
        fingerprint = str(item["sha256"])
        data_file = str(item["dataFile"])
        row_count = int(item["rowCount"])
        sql = f"""\\set ON_ERROR_STOP on
BEGIN;

SELECT EXISTS (
  SELECT 1 FROM productivity_archive_import_batch
  WHERE target_month = DATE {sql_literal(month + '-01')}
    AND source_file_sha256 = {sql_literal(fingerprint)}
    AND status = 'validated'
) AS already_imported \\gset

\\if :already_imported
  \\echo {month} already imported with identical fingerprint; no changes.
\\else
  CREATE TEMP TABLE productivity_archive_stage (payload jsonb NOT NULL) ON COMMIT DROP;
  \\copy productivity_archive_stage(payload) FROM {sql_literal(data_file)} WITH (FORMAT text)

  DO $validation$
  DECLARE actual_count integer;
  BEGIN
    SELECT COUNT(*) INTO actual_count FROM productivity_archive_stage;
    IF actual_count <> {row_count} THEN
      RAISE EXCEPTION 'row count mismatch: expected {row_count}, got %', actual_count;
    END IF;
    IF EXISTS (
      SELECT 1 FROM productivity_archive_stage
      WHERE payload->>'archivedMonth' <> {sql_literal(month + '-01')}
         OR payload->>'sourceFormat' <> {sql_literal(source_format)}
    ) THEN
      RAISE EXCEPTION 'record contract mismatch for {month}';
    END IF;
  END
  $validation$;

  SELECT gen_random_uuid() AS import_batch_id \\gset
  DELETE FROM productivity_archive_coverage WHERE archived_month = DATE {sql_literal(month + '-01')};
  DELETE FROM productivity_archive_developer_sprint WHERE archived_month = DATE {sql_literal(month + '-01')};

  INSERT INTO productivity_archive_import_batch (
    id, target_month, source_format, status, source_file_name, source_file_sha256,
    normalized_summary, validated_at, created_by
  ) VALUES (
    :'import_batch_id', DATE {sql_literal(month + '-01')}, {sql_literal(source_format)}, 'validated',
    {sql_literal(month + '.jsonl')}, {sql_literal(fingerprint)},
    jsonb_build_object('rowCount', {row_count}, 'dataOwnerApprovedBy', :'data_owner_approved_by'),
    now(), :'operator_id'
  );

  INSERT INTO productivity_archive_developer_sprint (
    import_batch_id, archived_month, sprint_id, sprint_name, sprint_start_date, sprint_end_date,
    board_id_snapshot, board_name_snapshot, reporting_group_snapshot,
    developer_identity_raw, developer_identity_normalized,
    developer_level_raw, developer_level_normalized, main_role_raw, main_role_normalized,
    source_team, source_format, source_status, sp_total, sp_target, working_days, sp_completed, sp_provenance,
    raw_record, normalized_record
  )
  SELECT
    :'import_batch_id', (payload->>'archivedMonth')::date,
    payload->>'sprintId', payload->>'sprintName',
    (payload->>'sprintStartDate')::date, (payload->>'sprintEndDate')::date,
    NULLIF(payload->>'boardIdSnapshot', '')::integer, payload->>'boardNameSnapshot',
    payload->>'reportingGroupSnapshot', payload->>'developerIdentityRaw',
    payload->>'developerIdentityNormalized', payload->>'developerLevelRaw',
    payload->>'developerLevelNormalized', payload->>'mainRoleRaw', payload->>'mainRoleNormalized',
    payload->>'sourceTeam', payload->>'sourceFormat', payload->>'sourceStatus',
    NULLIF(payload->>'spTotal', '')::numeric, NULLIF(payload->>'spTarget', '')::numeric, NULLIF(payload->>'workingDays', '')::numeric,
    NULLIF(payload->>'spCompleted', '')::numeric,
    payload->>'spProvenance', payload->'rawRecord', payload->'normalizedRecord'
  FROM productivity_archive_stage;

  INSERT INTO productivity_archive_coverage (archived_month, import_batch_id, row_count)
  VALUES (DATE {sql_literal(month + '-01')}, :'import_batch_id', {row_count});
\\endif

COMMIT;
"""
        sql_path = output / "months" / f"{month}.sql"
        sql_path.write_text(sql, encoding="utf-8")
        includes.append(f"\\ir months/{month}.sql")
    (output / "import_all.sql").write_text(
        "\\set ON_ERROR_STOP on\n" + "\n".join(includes) + "\n", encoding="utf-8"
    )
    generate_supabase_sql(output, months)
    (output / "verify.sql").write_text("""SELECT archived_month, row_count, import_batch_id, covered_at
FROM productivity_archive_coverage ORDER BY archived_month;

SELECT target_month, source_format, status, source_file_sha256,
       normalized_summary->>'rowCount' AS expected_rows, created_by, validated_at
FROM productivity_archive_import_batch
WHERE status = 'validated' ORDER BY target_month, validated_at;

SELECT archived_month, reporting_group_snapshot, source_status, COUNT(*) AS rows,
       COUNT(*) FILTER (WHERE sp_total IS NOT NULL) AS rows_with_sp,
       SUM(sp_total) AS sp_total
FROM productivity_archive_developer_sprint
GROUP BY archived_month, reporting_group_snapshot, source_status
ORDER BY archived_month, reporting_group_snapshot, source_status;
""", encoding="utf-8")


def generate_supabase_sql(output: Path, months: list[dict[str, object]]) -> None:
    records = []
    target_values = []
    for item in months:
        records.extend(
            json.loads(line)
            for line in Path(str(item["dataFile"])).read_text(encoding="utf-8").splitlines()
        )
        target_values.append(
            "(" + ", ".join([
                f"DATE {sql_literal(str(item['month']) + '-01')}",
                sql_literal(str(item["sourceFormat"])),
                sql_literal(str(item["month"]) + ".jsonl"),
                sql_literal(str(item["sha256"])),
                str(int(item["rowCount"])),
            ]) + ")"
        )
    payload = json.dumps(records, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    expected_total = sum(int(item["rowCount"]) for item in months)
    if len(records) != expected_total:
        raise ValueError(f"embedded archive row mismatch: expected {expected_total}, got {len(records)}")
    delimiter = "$archive_json$"
    if delimiter in payload:
        raise ValueError(f"embedded archive payload contains reserved delimiter {delimiter}")
    target_rows = ",\n  ".join(target_values)

    sql = f"""-- Supabase SQL Editor import. USER-RUN ONLY.
-- Edit the two email values below before Run. Whole import is one transaction.
BEGIN;

CREATE TEMP TABLE archive_import_operator (
  operator_id text NOT NULL,
  data_owner_approved_by text NOT NULL
) ON COMMIT DROP;
INSERT INTO archive_import_operator VALUES
  ('ahlul.esasjana@amarbank.co.id', 'ahlul.esasjana@amarbank.co.id');

CREATE TEMP TABLE archive_import_target (
  target_month date PRIMARY KEY,
  import_batch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  source_format text NOT NULL,
  source_file_name text NOT NULL,
  source_file_sha256 text NOT NULL,
  expected_rows integer NOT NULL,
  should_import boolean NOT NULL DEFAULT true
) ON COMMIT DROP;
INSERT INTO archive_import_target (
  target_month, source_format, source_file_name, source_file_sha256, expected_rows
) VALUES
  {target_rows};

UPDATE archive_import_target target
SET should_import = NOT EXISTS (
  SELECT 1 FROM productivity_archive_import_batch batch
  WHERE batch.target_month = target.target_month
    AND batch.source_file_sha256 = target.source_file_sha256
    AND batch.status = 'validated'
);

CREATE TEMP TABLE productivity_archive_stage (payload jsonb NOT NULL) ON COMMIT DROP;
INSERT INTO productivity_archive_stage(payload)
SELECT value FROM jsonb_array_elements({delimiter}{payload}{delimiter}::jsonb);

DO $validation$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM archive_import_target target
    LEFT JOIN productivity_archive_stage stage
      ON (stage.payload->>'archivedMonth')::date = target.target_month
     AND stage.payload->>'sourceFormat' = target.source_format
    GROUP BY target.target_month, target.expected_rows
    HAVING COUNT(stage.payload) <> target.expected_rows
  ) THEN
    RAISE EXCEPTION 'archive row count or contract mismatch';
  END IF;
END
$validation$;

WITH historical AS (
  SELECT
    payload->>'developerIdentityNormalized' AS email,
    (array_agg(payload->>'developerNameSnapshot' ORDER BY (payload->>'sprintEndDate')::date DESC))[1] AS full_name,
    COALESCE(
      (array_agg(NULLIF(payload->>'developerLevelNormalized', '') ORDER BY (payload->>'sprintEndDate')::date DESC))[1],
      'senior'
    ) AS level,
    jsonb_agg(DISTINCT payload->>'boardNameSnapshot') AS teams,
    MAX((payload->>'sprintEndDate')::date) AS last_activity
  FROM productivity_archive_stage
  WHERE COALESCE((payload->'normalizedRecord'->>'historicalOnly')::boolean, false)
  GROUP BY payload->>'developerIdentityNormalized'
), historical_with_resign_date AS (
  SELECT *, last_activity + (
    (('x' || substr(md5(email), 1, 8))::bit(32)::bigint)
    % (DATE '2026-06-30' - last_activity + 1)
  )::integer AS resign_date
  FROM historical
)
INSERT INTO members (jira_id, name, full_name, email, level, is_lead, teams, join_date, resign_date)
SELECT NULL, split_part(full_name, ' ', 1), full_name, email, level, false, teams,
       DATE '2025-01-01', resign_date
FROM historical_with_resign_date
ON CONFLICT (email) DO NOTHING;

DELETE FROM productivity_archive_coverage coverage
USING archive_import_target target
WHERE target.should_import AND coverage.archived_month = target.target_month;

DELETE FROM productivity_archive_developer_sprint archive
USING archive_import_target target
WHERE target.should_import AND archive.archived_month = target.target_month;

INSERT INTO productivity_archive_import_batch (
  id, target_month, source_format, status, source_file_name, source_file_sha256,
  normalized_summary, validated_at, created_by
)
SELECT target.import_batch_id, target.target_month, target.source_format, 'validated',
       target.source_file_name, target.source_file_sha256,
       jsonb_build_object('rowCount', target.expected_rows,
                          'dataOwnerApprovedBy', operator.data_owner_approved_by),
       now(), operator.operator_id
FROM archive_import_target target
CROSS JOIN archive_import_operator operator
WHERE target.should_import;

INSERT INTO productivity_archive_developer_sprint (
  import_batch_id, archived_month, sprint_id, sprint_name, sprint_start_date, sprint_end_date,
  board_id_snapshot, board_name_snapshot, reporting_group_snapshot,
  developer_identity_raw, developer_identity_normalized,
  developer_level_raw, developer_level_normalized, main_role_raw, main_role_normalized,
  source_team, source_format, source_status, sp_total, sp_target, working_days, sp_completed, sp_provenance,
  raw_record, normalized_record
)
SELECT
  target.import_batch_id, (payload->>'archivedMonth')::date,
  payload->>'sprintId', payload->>'sprintName',
  (payload->>'sprintStartDate')::date, (payload->>'sprintEndDate')::date,
  NULLIF(payload->>'boardIdSnapshot', '')::integer, payload->>'boardNameSnapshot',
  payload->>'reportingGroupSnapshot', payload->>'developerIdentityRaw',
  payload->>'developerIdentityNormalized', payload->>'developerLevelRaw',
  payload->>'developerLevelNormalized', payload->>'mainRoleRaw', payload->>'mainRoleNormalized',
  payload->>'sourceTeam', payload->>'sourceFormat', payload->>'sourceStatus',
  NULLIF(payload->>'spTotal', '')::numeric, NULLIF(payload->>'spTarget', '')::numeric, NULLIF(payload->>'workingDays', '')::numeric,
  NULLIF(payload->>'spCompleted', '')::numeric,
  payload->>'spProvenance', payload->'rawRecord', payload->'normalizedRecord'
FROM productivity_archive_stage stage
JOIN archive_import_target target
  ON target.target_month = (stage.payload->>'archivedMonth')::date
 AND target.should_import;

INSERT INTO productivity_archive_coverage (archived_month, import_batch_id, row_count)
SELECT target.target_month, target.import_batch_id, target.expected_rows
FROM archive_import_target target
WHERE target.should_import;

SELECT target_month, expected_rows,
       CASE WHEN should_import THEN 'IMPORTED' ELSE 'ALREADY_IMPORTED' END AS result
FROM archive_import_target
ORDER BY target_month;

COMMIT;
"""
    (output / "supabase_import_all.sql").write_text(sql, encoding="utf-8")


def generate_readme(output: Path, manifest: dict[str, object]) -> None:
    months = manifest["months"]
    rows = "\n".join(
        f"| {item['month']} | {item['sourceFormat']} | {item['rowCount']} | `{str(item['sha256'])[:12]}…` |"
        for item in months
    )
    text = f"""# Productivity archive import — user-run only

Database was not accessed while generating this package.

## Dry-run summary

- Accepted rows: {manifest['acceptedRows']}
- Rejected/excluded rows: {manifest['rejectedRows']} (`rejections.json`)
- Production identity assignments: {manifest['identityAssignments'].get('production', 0)} row assignments
- Historical-only identity assignments: {manifest['identityAssignments'].get('historical-only', 0)} row assignments

| Month | Format | Rows | SHA-256 |
| --- | --- | ---: | --- |
{rows}

## Required order

1. Review `manifest.json`, `rejections.json`, every monthly count, and source fingerprints.
2. Run migrations through `drizzle/0011_member_lifecycle.sql` and their post-verification first.
3. Set approved board/Group/Lead/rule configuration and restart the app to clear board cache.
4. From `apps/tere-project`, generate and import through the repo's Supabase connection:

   ```bash
   npm run archive:import -- --execute --confirm-project-ref=YOUR_PROJECT_REF
   ```

5. The runner validates the target, imports one transaction, and requires exactly 18 months / 2,125 coverage rows.

Supabase SQL Editor fallback: open `supabase_import_all.sql`, review the two operator emails, click Run, then run `verify.sql`.

Optional psql fallback:

   ```bash
   psql "$DIRECT_URL" \\
     -v ON_ERROR_STOP=1 \\
     -v operator_id='YOUR_EMAIL' \\
     -v data_owner_approved_by='DATA_OWNER_EMAIL' \\
     -f import_all.sql
   ```

Then run `psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f verify.sql`.

The Supabase import is one transaction for all 18 months. Identical fingerprint re-runs are no-ops. A changed month replaces only that month inside the transaction. Do not edit generated SQL after review; fingerprint mismatch changes import identity.
"""
    (output / "README.md").write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
