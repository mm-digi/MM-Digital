export type SqlParam = string | number | null | bigint;
export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type Tables = {
  staff: Row[];
  sessions: Row[];
  projects: Row[];
  tasks: Row[];
  announcements: Row[];
  local_completions: Row[];
  settings: Row[];
};

export type SqlStatement = {
  get(...params: SqlParam[]): unknown;
  all(...params: SqlParam[]): unknown[];
  run(...params: SqlParam[]): { changes: number };
};

export type PixelDatabase = {
  prepare(sql: string): SqlStatement;
};

type Val = { kind: "param" } | { kind: "lit"; value: Cell };
type Expr = { op: "value"; value: Val } | { op: "add"; column: string; value: Val };
type Cond =
  | { op: "eq"; column: string; value: Val; lower: boolean }
  | { op: "null"; column: string; negated: boolean };
type BoundExpr = { op: "value"; value: Cell } | { op: "add"; column: string; by: number };
type BoundCond =
  | { op: "eq"; column: string; value: Cell; lower: boolean }
  | { op: "null"; column: string; negated: boolean };

const TABLES = ["staff", "sessions", "projects", "tasks", "announcements", "local_completions", "settings"] as const;

export function emptyTables(): Tables {
  return {
    staff: [],
    sessions: [],
    projects: [],
    tasks: [],
    announcements: [],
    local_completions: [],
    settings: [],
  };
}

export function normaliseTables(input: unknown): Tables {
  const tables = emptyTables();
  if (!input || typeof input !== "object") return tables;
  const source = input as Record<string, unknown>;
  for (const name of TABLES) {
    const rows = source[name];
    if (!Array.isArray(rows)) continue;
    tables[name] = rows.filter(isRow).map(cleanRow);
  }
  return tables;
}

export function createPixelDb(tables: Tables, onWrite?: () => void): PixelDatabase {
  return {
    prepare(sql: string) {
      const text = collapse(sql);
      return {
        get(...params: SqlParam[]) {
          return runStatement(tables, text, params).rows[0];
        },
        all(...params: SqlParam[]) {
          return runStatement(tables, text, params).rows;
        },
        run(...params: SqlParam[]) {
          const result = runStatement(tables, text, params);
          if (result.changes > 0) onWrite?.();
          return { changes: result.changes };
        },
      };
    },
  };
}

function isRow(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanRow(row: Record<string, unknown>): Row {
  const clean: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" || typeof value === "number" || value === null) clean[key] = value;
    else if (typeof value === "boolean") clean[key] = value ? 1 : 0;
  }
  return clean;
}

function collapse(sql: string) {
  let out = "";
  let quote = false;
  let pendingSpace = false;
  for (const ch of sql.trim()) {
    if (ch === "'") {
      if (pendingSpace) out += " ";
      pendingSpace = false;
      quote = !quote;
      out += ch;
      continue;
    }
    if (!quote && /\s/.test(ch)) {
      if (out) pendingSpace = true;
      continue;
    }
    if (pendingSpace) out += " ";
    pendingSpace = false;
    out += ch;
  }
  return out.trim();
}

function splitComma(input: string) {
  const parts: string[] = [];
  let current = "";
  let quote = false;
  let depth = 0;
  for (const ch of input) {
    if (ch === "'") quote = !quote;
    if (!quote && ch === "(") depth += 1;
    if (!quote && ch === ")") depth -= 1;
    if (ch === "," && !quote && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseValue(token: string): Val {
  if (token === "?") return { kind: "param" };
  if (token.toLowerCase() === "null") return { kind: "lit", value: null };
  if (/^-?\d+(?:\.\d+)?$/.test(token)) return { kind: "lit", value: Number(token) };
  if (token.startsWith("'") && token.endsWith("'")) {
    return { kind: "lit", value: token.slice(1, -1).replace(/''/g, "'") };
  }
  throw new Error(`Unsupported pixel value: ${token}`);
}

function parseExpr(token: string): Expr {
  const add = token.match(/^(\w+)\s*\+\s*(\?|null|-?\d+(?:\.\d+)?|'(?:[^']|'')*')$/i);
  if (add) return { op: "add", column: add[1], value: parseValue(add[2]) };
  return { op: "value", value: parseValue(token) };
}

class Binder {
  private index = 0;

  constructor(private readonly params: SqlParam[]) {}

  take(value: Val): Cell {
    if (value.kind === "lit") return value.value;
    const next = this.params[this.index++];
    if (typeof next === "bigint") return Number(next);
    return next ?? null;
  }
}

function rowsOf(tables: Tables, name: string) {
  if (!TABLES.includes(name as (typeof TABLES)[number])) throw new Error(`Unsupported pixel table: ${name}`);
  return tables[name as keyof Tables];
}

function parseWhere(source: string): Cond[] {
  return splitAnd(source).map((part) => {
    const lower = part.match(/^lower\((\w+)\)\s*=\s*(\?|null|-?\d+(?:\.\d+)?|'(?:[^']|'')*')$/i);
    if (lower) return { op: "eq", column: lower[1], value: parseValue(lower[2]), lower: true };
    const eq = part.match(/^(\w+)\s*=\s*(\?|null|-?\d+(?:\.\d+)?|'(?:[^']|'')*')$/i);
    if (eq) return { op: "eq", column: eq[1], value: parseValue(eq[2]), lower: false };
    const missing = part.match(/^(\w+) is (not )?null$/i);
    if (missing) return { op: "null", column: missing[1], negated: Boolean(missing[2]) };
    throw new Error(`Unsupported pixel filter: ${part}`);
  });
}

function splitAnd(source: string) {
  const parts: string[] = [];
  let current = "";
  let quote = false;
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === "'") quote = !quote;
    if (!quote && source.slice(i, i + 5).toLowerCase() === " and ") {
      parts.push(current.trim());
      current = "";
      i += 4;
      continue;
    }
    current += source[i];
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function bindConds(conds: Cond[], binder: Binder): BoundCond[] {
  return conds.map((cond) => (cond.op === "null" ? cond : { ...cond, value: binder.take(cond.value) }));
}

function bindExpr(expr: Expr, binder: Binder): BoundExpr {
  if (expr.op === "value") return { op: "value", value: binder.take(expr.value) };
  return { op: "add", column: expr.column, by: Number(binder.take(expr.value) ?? 0) };
}

function matches(row: Row, conds: BoundCond[]) {
  return conds.every((cond) => {
    const value = row[cond.column];
    if (cond.op === "null") {
      const empty = value === undefined || value === null;
      return cond.negated ? !empty : empty;
    }
    if (cond.lower) return String(value ?? "").toLowerCase() === String(cond.value ?? "").toLowerCase();
    if (value == null || cond.value == null) return value == null && cond.value == null;
    return String(value) === String(cond.value);
  });
}

function applyBound(row: Row, expr: BoundExpr): Cell {
  if (expr.op === "value") return expr.value;
  return Number(row[expr.column] ?? 0) + expr.by;
}

function copy(row: Row): Row {
  return { ...row };
}

function runStatement(tables: Tables, sql: string, params: SqlParam[]) {
  const binder = new Binder(params);
  if (/^select /i.test(sql)) return selectRows(tables, sql, binder);
  if (/^insert /i.test(sql)) return insertRow(tables, sql, binder);
  if (/^update /i.test(sql)) return updateRows(tables, sql, binder);
  if (/^delete /i.test(sql)) return deleteRows(tables, sql, binder);
  throw new Error(`Unsupported pixel query: ${sql}`);
}

function selectRows(tables: Tables, sql: string, binder: Binder) {
  const match = sql.match(/^select (.+) from (\w+)(?: where (.+?))?(?: order by (\w+)(?: (asc|desc))?)?(?: limit (\d+))?$/i);
  if (!match) throw new Error(`Unsupported pixel query: ${sql}`);
  const [, list, table, where, orderBy, direction, limit] = match;
  const conds = where ? bindConds(parseWhere(where), binder) : [];
  let rows = rowsOf(tables, table.toLowerCase()).filter((row) => matches(row, conds));
  if (orderBy) {
    const factor = direction?.toLowerCase() === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => String(a[orderBy] ?? "").localeCompare(String(b[orderBy] ?? "")) * factor);
  }
  if (limit) rows = rows.slice(0, Number(limit));
  const count = list.trim().match(/^count\(\*\)(?: as (\w+))?$/i);
  if (count) {
    const alias = count[1] || "n";
    return { rows: [{ [alias]: rows.length }], changes: 0 };
  }
  if (list.trim() === "*") return { rows: rows.map(copy), changes: 0 };
  const columns = splitComma(list);
  return {
    rows: rows.map((row) => {
      const picked: Row = {};
      for (const column of columns) picked[column] = row[column] ?? null;
      return picked;
    }),
    changes: 0,
  };
}

function insertRow(tables: Tables, sql: string, binder: Binder) {
  const head = sql.match(/^insert into (\w+) \(([^)]+)\) values \(/i);
  if (!head) throw new Error(`Unsupported pixel query: ${sql}`);
  let depth = 1;
  let quote = false;
  let end = head[0].length;
  for (; end < sql.length; end += 1) {
    const ch = sql[end];
    if (ch === "'") quote = !quote;
    else if (!quote && ch === "(") depth += 1;
    else if (!quote && ch === ")") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const values = splitComma(sql.slice(head[0].length, end)).map(parseExpr);
  const columns = splitComma(head[2]);
  if (columns.length !== values.length) throw new Error(`Unsupported pixel query: ${sql}`);
  const rest = sql.slice(end + 1).trim();
  const incoming: Row = {};
  const boundValues = values.map((value) => bindExpr(value, binder));
  columns.forEach((column, index) => {
    incoming[column] = applyBound(incoming, boundValues[index]);
  });
  const table = rowsOf(tables, head[1].toLowerCase());
  const conflict = parseConflict(rest, sql);
  if (conflict) {
    const existing = table.find((row) => conflict.cols.every((column) => String(row[column] ?? "") === String(incoming[column] ?? "")));
    if (existing) {
      if (conflict.action === "nothing") return { rows: [], changes: 0 };
      for (const set of splitComma(conflict.set || "")) {
        const excluded = set.match(/^(\w+)\s*=\s*excluded\.(\w+)$/i);
        if (excluded) {
          existing[excluded[1]] = incoming[excluded[2]] ?? null;
          continue;
        }
        const assigned = set.match(/^(\w+)\s*=\s*(.+)$/);
        if (!assigned) throw new Error(`Unsupported pixel update: ${set}`);
        existing[assigned[1]] = applyBound(existing, bindExpr(parseExpr(assigned[2].trim()), binder));
      }
      return { rows: [], changes: 1 };
    }
  }
  table.push(incoming);
  return { rows: [], changes: 1 };
}

function parseConflict(rest: string, sql: string) {
  if (!rest) return null;
  const match = rest.match(/^on conflict\(([^)]+)\) do (.+)$/i);
  if (!match) throw new Error(`Unsupported pixel query: ${sql}`);
  const action = match[2].trim();
  if (/^nothing$/i.test(action)) return { cols: splitComma(match[1]), action: "nothing" as const, set: "" };
  const update = action.match(/^update set (.+)$/i);
  if (!update) throw new Error(`Unsupported pixel query: ${sql}`);
  return { cols: splitComma(match[1]), action: "update" as const, set: update[1] };
}

function updateRows(tables: Tables, sql: string, binder: Binder) {
  const match = sql.match(/^update (\w+) set (.+) where (.+)$/i);
  if (!match) throw new Error(`Unsupported pixel query: ${sql}`);
  const assignments = splitComma(match[2]).map((part) => {
    const assigned = part.match(/^(\w+)\s*=\s*(.+)$/);
    if (!assigned) throw new Error(`Unsupported pixel update: ${part}`);
    return { column: assigned[1], expr: bindExpr(parseExpr(assigned[2].trim()), binder) };
  });
  const conds = bindConds(parseWhere(match[3]), binder);
  let changes = 0;
  for (const row of rowsOf(tables, match[1].toLowerCase())) {
    if (!matches(row, conds)) continue;
    for (const assignment of assignments) row[assignment.column] = applyBound(row, assignment.expr);
    changes += 1;
  }
  return { rows: [], changes };
}

function deleteRows(tables: Tables, sql: string, binder: Binder) {
  const match = sql.match(/^delete from (\w+)(?: where (.+))?$/i);
  if (!match) throw new Error(`Unsupported pixel query: ${sql}`);
  const tableName = match[1].toLowerCase() as keyof Tables;
  const table = rowsOf(tables, tableName);
  const conds = match[2] ? bindConds(parseWhere(match[2]), binder) : [];
  const kept = table.filter((row) => (conds.length ? !matches(row, conds) : false));
  const changes = table.length - kept.length;
  tables[tableName] = kept;
  return { rows: [], changes };
}
