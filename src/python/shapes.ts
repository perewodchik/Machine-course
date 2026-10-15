// Формы промежуточных выражений ячейки (S3.06, идея A6). Python-функция определяется в воркере один раз и после
// запуска ячейки смотрит её код: у каждого «A @ B» без вызовов функций — формы операндов и результата, у присвоенных
// массивов — форма. Только верхний уровень ячейки: внутри функций имена значат другое. Если ячейка упала, остаются
// только произведения с несовпавшими внутренними размерами.

/** Элемент списка форм: выражение из кода ячейки и его формы. */
export interface ShapeItem {
  expr: string;
  shape: string;
  /** Внутренние размеры не совпадают. */
  bad?: boolean;
}

export const SHAPES_PY = String.raw`
def _mlf_shapes(src, ns, failed):
    import ast, json

    try:
        tree = ast.parse(src)
    except SyntaxError:
        return "[]"

    def pure(node):
        bad = (ast.Call, ast.NamedExpr, ast.Lambda, ast.Await, ast.Yield, ast.YieldFrom)
        return not any(isinstance(n, bad) for n in ast.walk(node))

    def shape_of(node):
        try:
            value = eval(compile(ast.fix_missing_locations(ast.Expression(node)), "<формы>", "eval"), ns)
        except Exception:
            return None
        s = getattr(value, "shape", None)
        return tuple(s) if s is not None and hasattr(value, "dtype") else None

    def fmt(s):
        return "(" + ", ".join(str(x) for x in s) + ("," if len(s) == 1 else "") + ")"

    # только верхний уровень ячейки: внутри функций и классов имена значат другое
    scoped = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)

    def top(nodes):
        for n in nodes:
            if isinstance(n, scoped):
                continue
            yield n
            yield from top(ast.iter_child_nodes(n))

    out, seen = [], set()
    for node in top(tree.body):
        if not (isinstance(node, ast.BinOp) and isinstance(node.op, ast.MatMult) and pure(node)):
            continue
        seg = ast.get_source_segment(src, node)
        if not seg or seg in seen:
            continue
        seen.add(seg)
        left, right = shape_of(node.left), shape_of(node.right)
        if not left or not right:
            continue
        inner = right[-2] if len(right) > 1 else right[0]
        if left[-1] != inner:
            out.append({"expr": seg, "shape": f"{fmt(left)} @ {fmt(right)}: внутренние размеры {left[-1]} и {inner} не совпадают", "bad": True})
        elif not failed:
            whole = shape_of(node)
            if whole is not None:
                out.append({"expr": seg, "shape": f"{fmt(left)} @ {fmt(right)} → {fmt(whole)}"})
    if not failed:
        for stmt in tree.body:
            if isinstance(stmt, ast.Assign):
                names = [n for t in stmt.targets for n in (t.elts if isinstance(t, ast.Tuple) else [t])]
                for t in names:
                    if isinstance(t, ast.Name) and t.id not in seen:
                        seen.add(t.id)
                        s = shape_of(ast.Name(t.id, ast.Load()))
                        if s is not None:
                            out.append({"expr": t.id, "shape": fmt(s)})
    return json.dumps(out[:12], ensure_ascii=False)
`;
