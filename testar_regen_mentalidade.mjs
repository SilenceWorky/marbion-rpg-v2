import assert from "node:assert/strict";

import {
  applyNaturalMentalidadeRegen,
  MENTALIDADE_REGEN_INTERVAL_MS
} from "./src/systems/mentalidade-regen.js";


function makeProfile({
  mentalidade = 20,
  maxMentalidade = 50,
  lastMentalidadeRegenAt = 1_000_000
} = {}) {
  return {
    mentalidade,
    maxMentalidade,
    lastMentalidadeRegenAt
  };
}


/*
 * ==============================
 * TESTE 1
 * PERFIL ANTIGO
 * ==============================
 */
{
  const now =
    2_000_000;

  const profile =
    makeProfile({
      mentalidade: 20,
      lastMentalidadeRegenAt: 0
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      now
    );


  assert.equal(
    result.initialized,
    true
  );

  assert.equal(
    result.restored,
    0
  );

  assert.equal(
    profile.mentalidade,
    20
  );

  assert.equal(
    profile.lastMentalidadeRegenAt,
    now
  );


  console.log(
    "✅ TESTE 1 — Perfil antigo inicializa sem regeneração retroativa."
  );
}


/*
 * ==============================
 * TESTE 2
 * INTERVALO INCOMPLETO
 * ==============================
 */
{
  const start =
    1_000_000;

  const profile =
    makeProfile({
      mentalidade: 20,
      lastMentalidadeRegenAt:
        start
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      start +
      MENTALIDADE_REGEN_INTERVAL_MS -
      1
    );


  assert.equal(
    result.restored,
    0
  );

  assert.equal(
    result.changed,
    false
  );

  assert.equal(
    profile.mentalidade,
    20
  );


  console.log(
    "✅ TESTE 2 — Intervalo incompleto não regenera Mentalidade."
  );
}


/*
 * ==============================
 * TESTE 3
 * UM INTERVALO COMPLETO
 * ==============================
 */
{
  const start =
    1_000_000;

  const profile =
    makeProfile({
      mentalidade: 20,
      lastMentalidadeRegenAt:
        start
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      start +
      MENTALIDADE_REGEN_INTERVAL_MS
    );


  assert.equal(
    result.restored,
    1
  );

  assert.equal(
    profile.mentalidade,
    21
  );

  assert.equal(
    profile.lastMentalidadeRegenAt,
    start +
    MENTALIDADE_REGEN_INTERVAL_MS
  );


  console.log(
    "✅ TESTE 3 — Um intervalo regenera exatamente 1 Mentalidade."
  );
}


/*
 * ==============================
 * TESTE 4
 * VÁRIOS INTERVALOS
 * ==============================
 */
{
  const start =
    1_000_000;

  const profile =
    makeProfile({
      mentalidade: 20,
      lastMentalidadeRegenAt:
        start
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      start +
      3 *
      MENTALIDADE_REGEN_INTERVAL_MS
    );


  assert.equal(
    result.intervals,
    3
  );

  assert.equal(
    result.restored,
    3
  );

  assert.equal(
    profile.mentalidade,
    23
  );


  console.log(
    "✅ TESTE 4 — Vários intervalos regeneram corretamente."
  );
}


/*
 * ==============================
 * TESTE 5
 * RESPEITA O MÁXIMO
 * ==============================
 */
{
  const start =
    1_000_000;

  const now =
    start +
    10 *
    MENTALIDADE_REGEN_INTERVAL_MS;

  const profile =
    makeProfile({
      mentalidade: 48,
      maxMentalidade: 50,
      lastMentalidadeRegenAt:
        start
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      now
    );


  assert.equal(
    result.restored,
    2
  );

  assert.equal(
    profile.mentalidade,
    50
  );

  assert.equal(
    profile.lastMentalidadeRegenAt,
    now
  );


  console.log(
    "✅ TESTE 5 — Regeneração respeita maxMentalidade."
  );
}


/*
 * ==============================
 * TESTE 6
 * NÃO ACUMULA ENQUANTO CHEIO
 * ==============================
 */
{
  const start =
    1_000_000;

  const now =
    start +
    100 *
    MENTALIDADE_REGEN_INTERVAL_MS;

  const profile =
    makeProfile({
      mentalidade: 50,
      maxMentalidade: 50,
      lastMentalidadeRegenAt:
        start
    });


  const result =
    applyNaturalMentalidadeRegen(
      profile,
      now
    );


  assert.equal(
    result.restored,
    0
  );

  assert.equal(
    profile.mentalidade,
    50
  );

  assert.equal(
    profile.lastMentalidadeRegenAt,
    now
  );


  console.log(
    "✅ TESTE 6 — Mentalidade cheia não acumula créditos de regeneração."
  );
}


/*
 * ==============================
 * TESTE 7
 * PRESERVA FRAÇÃO DE TEMPO
 * ==============================
 */
{
  const start =
    1_000_000;

  const extra =
    2 * 60 * 1000;

  const profile =
    makeProfile({
      mentalidade: 20,
      lastMentalidadeRegenAt:
        start
    });


  applyNaturalMentalidadeRegen(
    profile,
    start +
    MENTALIDADE_REGEN_INTERVAL_MS +
    extra
  );


  assert.equal(
    profile.mentalidade,
    21
  );

  assert.equal(
    profile.lastMentalidadeRegenAt,
    start +
    MENTALIDADE_REGEN_INTERVAL_MS
  );


  const second =
    applyNaturalMentalidadeRegen(
      profile,
      start +
      2 *
      MENTALIDADE_REGEN_INTERVAL_MS
    );


  assert.equal(
    second.restored,
    1
  );

  assert.equal(
    profile.mentalidade,
    22
  );


  console.log(
    "✅ TESTE 7 — Fração restante do intervalo é preservada."
  );
}


console.log(
  "\n🧠 TODOS OS TESTES DE REGENERAÇÃO NATURAL DE MENTALIDADE PASSARAM."
);
