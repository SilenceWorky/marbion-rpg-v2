from pathlib import Path

PATH = Path("src/durable/PvpCoordinator.js")
text = PATH.read_text(encoding="utf-8")

IMPORT_ANCHOR = '''import {
  getPvpAfkAccess,
  registerPvpAfkIncident
} from "../systems/pvp-afk.js";
'''

IMPORT_BLOCK = '''import {
  getPvpAfkAccess,
  registerPvpAfkIncident
} from "../systems/pvp-afk.js";

import {
  createPvpResultRecord,
  getPvpResultRecord,
  restorePvpRankingState,
  storePvpResultRecord,
  validatePvpResultRecord
} from "../systems/pvp-result-idempotency.js";
'''

if "pvp-result-idempotency.js" not in text:
    if IMPORT_ANCHOR not in text:
        raise SystemExit("❌ Âncora de import não encontrada")
    text = text.replace(IMPORT_ANCHOR, IMPORT_BLOCK, 1)

start_marker = "    async applyRankedBattleResult(\n"
end_marker = "\n  async createChallenge(\n"
start = text.find(start_marker)
end = text.find(end_marker, start)

if start == -1 or end == -1:
    raise SystemExit("❌ Método applyRankedBattleResult não encontrado")

new_method = '''    async applyRankedBattleResult(
    winnerUser,
    loserUser,
    options = {}
    ) {
    const battleId =
      String(
        options?.battleId ?? ""
      ).trim();

    const [
        winnerProfile,
        loserProfile
    ] =
        await Promise.all([
        getProfile(
            this.env,
            winnerUser
        ),

        getProfile(
            this.env,
            loserUser
        )
        ]);


    if (
        !winnerProfile ||
        !loserProfile
    ) {
        return {
        ok: false,
        error:
            "RANKED_PROFILE_NOT_FOUND"
        };
    }


    /*
     * ==============================
     * IDEMPOTÊNCIA DE RESULTADO PvP
     * ==============================
     *
     * Cada batalha possui UUID próprio. Quando um
     * resultado já foi persistido em um ou nos dois
     * perfis, a repetição da finalização NÃO recalcula
     * Elo, streak, estatísticas ou anti-farm.
     *
     * Se somente um perfil foi salvo antes de uma
     * falha parcial, o registro salvo contém o estado
     * determinístico que falta ao outro perfil.
     */
    if (battleId) {
      const winnerRecord =
        getPvpResultRecord(
          winnerProfile,
          battleId
        );

      const loserRecord =
        getPvpResultRecord(
          loserProfile,
          battleId
        );

      const storedRecord =
        winnerRecord ||
        loserRecord;


      if (storedRecord) {
        if (
          !validatePvpResultRecord(
            storedRecord,
            battleId,
            winnerUser,
            loserUser
          )
        ) {
          return {
            ok: false,
            error:
              "RANKED_RESULT_LEDGER_CONFLICT"
          };
        }


        const repairs = [];


        if (!winnerRecord) {
          restorePvpRankingState(
            winnerProfile,
            storedRecord.winnerState
          );

          winnerProfile.lastCombat =
            storedRecord.lastCombat;

          storePvpResultRecord(
            winnerProfile,
            storedRecord
          );

          repairs.push(
            saveProfile(
              this.env,
              winnerUser,
              winnerProfile
            )
          );
        }


        if (!loserRecord) {
          restorePvpRankingState(
            loserProfile,
            storedRecord.loserState
          );

          loserProfile.lastCombat =
            storedRecord.lastCombat;

          storePvpResultRecord(
            loserProfile,
            storedRecord
          );

          repairs.push(
            saveProfile(
              this.env,
              loserUser,
              loserProfile
            )
          );
        }


        if (repairs.length > 0) {
          await Promise.all(
            repairs
          );
        }


        return {
          ok: true,
          idempotent: true,
          repairedPartialWrite:
            repairs.length > 0,
          ...storedRecord.result
        };
      }
    }


    const now =
        Date.now();


    const result =
        applyRankedResult(
        winnerProfile,
        loserProfile,
        {
            ...options,
            winnerUser,
            loserUser,
            now
        }
        );


    winnerProfile.lastCombat =
        now;

    loserProfile.lastCombat =
        now;


    if (battleId) {
      const record =
        createPvpResultRecord({
          battleId,
          winnerUser,
          loserUser,
          result,
          winnerProfile,
          loserProfile,
          lastCombat: now
        });


      if (!record) {
        return {
          ok: false,
          error:
            "RANKED_RESULT_LEDGER_CREATE_FAILED"
        };
      }


      storePvpResultRecord(
        winnerProfile,
        record
      );

      storePvpResultRecord(
        loserProfile,
        record
      );
    }


    /*
     * Os dois saves podem terminar de forma parcial
     * por falha externa. O ledger acima é gravado no
     * mesmo objeto do resultado e permite reparar o
     * lado faltante numa repetição, sem reaplicar Elo.
     *
     * Não capturamos a exceção aqui: se o save falhar,
     * a finalização precisa abortar antes de marcar a
     * batalha como concluída no Durable Object.
     */
    await Promise.all([
        saveProfile(
        this.env,
        winnerUser,
        winnerProfile
        ),

        saveProfile(
        this.env,
        loserUser,
        loserProfile
        )
    ]);


    return {
        ok: true,
        idempotent: false,
        ...result
    };
    }
'''

text = text[:start] + new_method + text[end:]

# Todas as resoluções naturais winner/loser precisam carregar o UUID da batalha.
old_plain = '''await this.applyRankedBattleResult(
              winner,
              loser
            );'''
new_plain = '''await this.applyRankedBattleResult(
              winner,
              loser,
              {
                battleId:
                  battle.id
              }
            );'''
text = text.replace(old_plain, new_plain)

old_plain_alt = '''await this.applyRankedBattleResult(
        winner,
        loser
        );'''
new_plain_alt = '''await this.applyRankedBattleResult(
        winner,
        loser,
        {
          battleId:
            battle.id
        }
        );'''
text = text.replace(old_plain_alt, new_plain_alt)

# Forfeit precisa usar o mesmo UUID, inclusive quando chamado pelo timeout 3/3.
old_forfeit = '''        {
          forfeit: true,
          earlyForfeit
        }
      );'''
new_forfeit = '''        {
          battleId:
            battle.id,
          forfeit: true,
          earlyForfeit
        }
      );'''

if old_forfeit not in text:
    raise SystemExit("❌ Bloco de forfeit para battleId não encontrado")
text = text.replace(old_forfeit, new_forfeit, 1)

# Guardas mínimas: devem existir chamadas com battleId e import do helper.
if text.count("battleId:\n") < 3:
    raise SystemExit("❌ Poucas chamadas ranqueadas receberam battleId")

PATH.write_text(text, encoding="utf-8")
print("✅ src/durable/PvpCoordinator.js atualizado")
print("🛡️ Hardening exact-once do resultado PvP integrado localmente.")
print("- UUID da batalha vira chave idempotente")
print("- retry não reaplica Elo/estatísticas/anti-farm")
print("- save parcial de um perfil pode reparar o outro")
print("- falha de persistência aborta antes de concluir a batalha")
