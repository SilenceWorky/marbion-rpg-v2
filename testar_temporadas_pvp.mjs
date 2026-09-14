import assert from "node:assert/strict";

import {
  PVP_SEASON_DEFAULT_DURATION_MS,
  createPvpSeason,
  endPvpSeason,
  getPvpSeasonLifecycleStatus,
  getPvpSeasonRemainingMs,
  isPvpSeasonActive,
  normalizePvpSeason
} from "./src/systems/pvp-season.js";


console.log("=== TEMPORADAS RANQUEADAS ===");


{
  const startsAt =
    1_000_000;

  const result =
    createPvpSeason({
      id: "S1",
      name: "Temporada 1",
      startsAt
    });

  assert.equal(result.ok, true);
  assert.equal(result.season.id, "S1");
  assert.equal(result.season.name, "Temporada 1");
  assert.equal(result.season.status, "ACTIVE");
  assert.equal(result.season.startsAt, startsAt);
  assert.equal(
    result.season.endsAt,
    startsAt +
      PVP_SEASON_DEFAULT_DURATION_MS
  );

  console.log("✅ Temporada padrão nasce ativa com duração de 30 dias.");
}


{
  const result =
    createPvpSeason({
      id: "",
      name: "Temporada inválida",
      startsAt: 100
    });

  assert.equal(result.ok, false);
  assert.equal(
    result.error,
    "INVALID_SEASON_ID"
  );

  console.log("✅ ID vazio é rejeitado.");
}


{
  const season =
    createPvpSeason({
      id: "S2",
      name: "Temporada 2",
      startsAt: 1_000,
      endsAt: 2_000
    }).season;

  assert.equal(
    getPvpSeasonLifecycleStatus(
      season,
      500
    ),
    "SCHEDULED"
  );

  assert.equal(
    getPvpSeasonLifecycleStatus(
      season,
      1_500
    ),
    "ACTIVE"
  );

  assert.equal(
    getPvpSeasonLifecycleStatus(
      season,
      2_000
    ),
    "EXPIRED"
  );

  assert.equal(
    isPvpSeasonActive(
      season,
      1_500
    ),
    true
  );

  assert.equal(
    getPvpSeasonRemainingMs(
      season,
      1_500
    ),
    500
  );

  console.log("✅ Ciclo agendada → ativa → expirada funciona corretamente.");
}


{
  const season =
    createPvpSeason({
      id: "S3",
      name: "Temporada 3",
      startsAt: 10_000,
      endsAt: 20_000
    }).season;

  const first =
    endPvpSeason(
      season,
      15_000
    );

  assert.equal(first.ok, true);
  assert.equal(first.changed, true);
  assert.equal(first.season.status, "ENDED");
  assert.equal(first.season.endedAt, 15_000);

  const second =
    endPvpSeason(
      first.season,
      16_000
    );

  assert.equal(second.ok, true);
  assert.equal(second.changed, false);
  assert.equal(second.season.endedAt, 15_000);

  console.log("✅ Encerramento manual é idempotente.");
}


{
  const normalized =
    normalizePvpSeason({
      version: 999,
      id: "  S4  ",
      name: "  Temporada 4  ",
      status: "ACTIVE",
      startsAt: 100,
      endsAt: 200
    });

  assert.equal(normalized.id, "S4");
  assert.equal(normalized.name, "Temporada 4");
  assert.equal(normalized.version, 1);

  console.log("✅ Estado persistido é normalizado com segurança.");
}


console.log("\n🏆 TODOS OS TESTES DO NÚCLEO DE TEMPORADAS PASSARAM.");
