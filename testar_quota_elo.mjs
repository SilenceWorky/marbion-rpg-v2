import assert from "node:assert/strict";
import fs from "node:fs";

console.log("=== QUOTA DURABLE OBJECTS / GERAÇÃO DE ELO ===");

const database = fs.readFileSync(
  "src/core/database.js",
  "utf8"
);

const coordinator = fs.readFileSync(
  "src/durable/PvpCoordinator.js",
  "utf8"
);

assert.doesNotMatch(
  database,
  /marbion-elo-generation/
);

assert.doesNotMatch(
  database,
  /elo-generation\/get/
);

assert.match(
  database,
  /__pvp_elo_generation__/
);

assert.match(
  database,
  /options\s*=\s*\{\}/
);

assert.match(
  database,
  /options\?\.eloGeneration/
);

console.log("✅ leitura de perfil não consulta um segundo Durable Object para a geração");

assert.doesNotMatch(
  coordinator,
  /idFromName\(\s*[\"']marbion-elo-generation[\"']/
);

assert.doesNotMatch(
  coordinator,
  /[\"']\/elo-generation\/get[\"']/
);

assert.doesNotMatch(
  coordinator,
  /[\"']\/elo-generation\/advance[\"']/
);

assert.match(
  coordinator,
  /__pvp_elo_generation__/
);

assert.match(
  coordinator,
  /await this\.advanceStoredEloGeneration\(\)/
);

const forcedGenerationUses =
  coordinator.match(/\{ eloGeneration \}/g) || [];

assert.ok(
  forcedGenerationUses.length >= 4,
  `esperado pelo menos 4 usos de geração forte no PvP; encontrado ${forcedGenerationUses.length}`
);

console.log("✅ reset geral usa o coordenador global + KV, sem DO secundário");
console.log("✅ desafio/aceite usam a geração forte do coordenador");

console.log("\n🏆 TODOS OS TESTES DE REGRESSÃO DE QUOTA PASSARAM.");
