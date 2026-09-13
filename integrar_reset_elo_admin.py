from pathlib import Path


p = Path("src/routes/admin-dispatcher.js")
text = p.read_text(encoding="utf-8")


import_block = '''import {
  adminEloResetRoute
} from "./admin-elo-reset.js";
'''

anchor_import = '''import {
  adminMaxResourceRoute
} from "./admin-max-resource.js";
'''

if import_block not in text:
    if anchor_import not in text:
        raise RuntimeError("Nao encontrei o import de adminMaxResourceRoute")

    text = text.replace(
        anchor_import,
        anchor_import + "\n" + import_block,
        1
    )


route_block = '''  if (
    command === "elo"
  ) {
    return adminEloResetRoute(
      request,
      env
    );
  }


'''

anchor_route = '''  return adminRoute(
    request,
    env
  );
'''

if route_block not in text:
    if anchor_route not in text:
        raise RuntimeError("Nao encontrei o fallback para adminRoute")

    text = text.replace(
        anchor_route,
        route_block + anchor_route,
        1
    )


p.write_text(text, encoding="utf-8")

print("✅ src/routes/admin-dispatcher.js atualizado")
print("🏆 Reset individual de Elo integrado ao !adm localmente.")
print("- comando: !adm elo reset @usuario")
print("- rating volta para 1000")
print("- Prodígio é removido")
print("- histórico competitivo, anti-farm e AFK são preservados")
print("- reset geral continua bloqueado até existir enumeração global segura")
