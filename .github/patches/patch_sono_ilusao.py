from pathlib import Path


# ============================================================
# 1. Sono precisa ter prioridade sobre Debuff genérico.
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")

sleep_block = '''  /*
   * ==============================
   * SONO
   * ==============================
   */
  if (
    controlType ===
    "sono"
  ) {
    return executeSleepAction(
      attacker,
      defender,
      action,
      currentTurn
    );
  }


'''

count = text.count(sleep_block)
if count != 1:
    raise SystemExit(
        f"Esperava 1 bloco de Sono, encontrei {count}"
    )

text = text.replace(
    sleep_block,
    "",
    1
)

debuff_marker = '''  /*
  * DEBUFF
  */
  if (
    skillType === "debuff"
  ) {'''

if debuff_marker not in text:
    raise SystemExit(
        "Roteamento genérico de Debuff não encontrado"
    )

text = text.replace(
    debuff_marker,
    sleep_block + debuff_marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# 2. Ilusão era o nome antigo de Psíquico, não uma fusão.
# ============================================================
path = Path("src/systems/element-compatibility.js")
text = path.read_text(encoding="utf-8")

legacy_fusion = '''  {
    requires: [
      "Psíquico",
      "Luz"
    ],
    unlocks: [
      "Ilusão"
    ]
  },

'''

if legacy_fusion not in text:
    raise SystemExit(
        "Fusão legada Psíquico + Luz -> Ilusão não encontrada"
    )

text = text.replace(
    legacy_fusion,
    "",
    1
)

path.write_text(
    text,
    encoding="utf-8"
)
