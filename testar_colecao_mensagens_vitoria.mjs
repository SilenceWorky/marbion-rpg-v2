import assert from "node:assert/strict";

import {
  createBaseProfile,
  ensureProfileDefaults
} from "./src/core/profile.js";

import {
  equipVictoryMessage,
  findOwnedVictoryMessage,
  getEquippedVictoryMessage,
  getVictoryMessageCollection,
  grantVictoryMessage,
  unequipVictoryMessage
} from "./src/systems/victory-message-collection.js";


const profile =
  createBaseProfile(
    "mensagem-vitoria-teste"
  );

assert.deepEqual(
  profile.victoryMessages,
  {
    owned: [],
    equipped: null
  }
);
const first =
  grantVictoryMessage(
    profile,
    {
      seasonId: "2026-12",
      messageId: "natal:vitoria-nevada",
      name: "Vitória Nevada",
      text: "A neve cai sobre mais uma vitória!",
      source: "seasonal_chest",
      seasonalChestId:
        "seasonal:2026-12:chest:001",
      chestOrder: 1,
      poolRevision: 7,
      acquiredAt: 1000
    }
  );

assert.equal(first.ok, true);
assert.equal(first.duplicate, false);
assert.equal(
  profile.victoryMessages.owned.length,
  1
);
assert.equal(
  first.message.seasonId,
  "2026-12"
);
assert.equal(
  first.message.messageId,
  "natal:vitoria-nevada"
);
assert.equal(
  first.message.seasonalChestId,
  "seasonal:2026-12:chest:001"
);
assert.equal(first.message.chestOrder, 1);
assert.equal(first.message.poolRevision, 7);

const duplicate =
  grantVictoryMessage(
    profile,
    {
      seasonId: "2026-12",
      messageId: "natal:vitoria-nevada",
      text: "Texto alterado não deve substituir."
    }
  );

assert.equal(duplicate.ok, true);
assert.equal(duplicate.duplicate, true);
assert.equal(
  profile.victoryMessages.owned.length,
  1
);
assert.equal(
  duplicate.message.text,
  "A neve cai sobre mais uma vitória!"
);
const otherSeason =
  grantVictoryMessage(
    profile,
    {
      seasonId: "2027-12",
      messageId: "natal:vitoria-nevada",
      text: "Outra temporada, outra coleção."
    }
  );

assert.equal(otherSeason.ok, true);
assert.equal(otherSeason.duplicate, false);

const nonSeasonal =
  grantVictoryMessage(
    profile,
    {
      messageId: "natal:vitoria-nevada",
      text: "Mensagem permanente não sazonal.",
      source: "global"
    }
  );

assert.equal(nonSeasonal.ok, true);
assert.equal(nonSeasonal.duplicate, false);
assert.equal(
  profile.victoryMessages.owned.length,
  3
);
assert.equal(nonSeasonal.message.seasonId, null);
const foundSeasonal =
  findOwnedVictoryMessage(
    profile,
    "2026-12",
    "natal:vitoria-nevada"
  );

assert.equal(foundSeasonal.ok, true);
assert.equal(foundSeasonal.found, true);
assert.equal(
  foundSeasonal.message.text,
  "A neve cai sobre mais uma vitória!"
);

const foundGlobal =
  findOwnedVictoryMessage(
    profile,
    null,
    "natal:vitoria-nevada"
  );

assert.equal(foundGlobal.ok, true);
assert.equal(foundGlobal.found, true);
assert.equal(
  foundGlobal.message.text,
  "Mensagem permanente não sazonal."
);
const equipFirst =
  equipVictoryMessage(
    profile,
    "2026-12",
    "natal:vitoria-nevada"
  );

assert.equal(equipFirst.ok, true);
assert.equal(equipFirst.changed, true);
assert.deepEqual(
  profile.victoryMessages.equipped,
  {
    seasonId: "2026-12",
    messageId: "natal:vitoria-nevada"
  }
);

const equipSame =
  equipVictoryMessage(
    profile,
    "2026-12",
    "natal:vitoria-nevada"
  );

assert.equal(equipSame.ok, true);
assert.equal(equipSame.changed, false);
const equipOtherSeason =
  equipVictoryMessage(
    profile,
    "2027-12",
    "natal:vitoria-nevada"
  );

assert.equal(equipOtherSeason.ok, true);
assert.equal(equipOtherSeason.changed, true);
assert.deepEqual(
  profile.victoryMessages.equipped,
  {
    seasonId: "2027-12",
    messageId: "natal:vitoria-nevada"
  }
);

const equipGlobal =
  equipVictoryMessage(
    profile,
    null,
    "natal:vitoria-nevada"
  );

assert.equal(equipGlobal.ok, true);
assert.equal(equipGlobal.changed, true);
assert.deepEqual(
  profile.victoryMessages.equipped,
  {
    seasonId: null,
    messageId: "natal:vitoria-nevada"
  }
);
const equipped =
  getEquippedVictoryMessage(profile);

assert.equal(equipped.ok, true);
assert.equal(
  equipped.message.text,
  "Mensagem permanente não sazonal."
);

const denied =
  equipVictoryMessage(
    profile,
    "2026-12",
    "nao-existe"
  );

assert.equal(denied.ok, false);
assert.equal(
  denied.error,
  "VICTORY_MESSAGE_NOT_OWNED"
);
assert.deepEqual(
  profile.victoryMessages.equipped,
  {
    seasonId: null,
    messageId: "natal:vitoria-nevada"
  }
);
const unequipped =
  unequipVictoryMessage(profile);

assert.equal(unequipped.ok, true);
assert.equal(unequipped.changed, true);
assert.equal(
  profile.victoryMessages.equipped,
  null
);

const unequipAgain =
  unequipVictoryMessage(profile);

assert.equal(unequipAgain.ok, true);
assert.equal(unequipAgain.changed, false);

const legacy =
  ensureProfileDefaults(
    {
      user: "perfil-legado",
      xp: 33
    }
  );

assert.deepEqual(
  legacy.victoryMessages,
  {
    owned: [],
    equipped: null
  }
);
const preserved =
  ensureProfileDefaults({
    user: "perfil-preservado",
    victoryMessages: {
      owned: [
        {
          seasonId: "2026-10",
          messageId: "halloween:risada",
          text: "O medo também sabe perder."
        }
      ],
      equipped: {
        seasonId: "2026-10",
        messageId: "halloween:risada"
      }
    }
  });

assert.equal(
  preserved.victoryMessages.owned.length,
  1
);
assert.deepEqual(
  preserved.victoryMessages.equipped,
  {
    seasonId: "2026-10",
    messageId: "halloween:risada"
  }
);
const snapshot =
  getVictoryMessageCollection(profile);

assert.equal(snapshot.ok, true);
assert.equal(snapshot.owned.length, 3);
assert.equal(snapshot.equipped, null);

console.log(
  "OK: coleção permanente de Mensagens de Vitória"
);
