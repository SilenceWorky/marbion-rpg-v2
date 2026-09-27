import assert from "node:assert/strict";

import {
  createBaseProfile
} from "./src/core/profile.js";

import {
  grantVictoryMessage
} from "./src/systems/victory-message-collection.js";

import {
  getEligibleSeasonalChestVictoryMessages,
  resolveSeasonalChestVictoryMessageRewards
} from "./src/systems/seasonal-chest-victory-message-resolver.js";


const chest1 = {
  id: "seasonal:2026-12:chest:message1",
  seasonId: "2026-12",
  order: 1,
  name: "Baú de Pinheiro",
  poolRevision: 9,
  createdAt: 1,
  updatedAt: 1
};

const chest2 = {
  id: "seasonal:2026-12:chest:message2",
  seasonId: "2026-12",
  order: 2,
  name: "Baú Rena",
  poolRevision: 9,
  createdAt: 1,
  updatedAt: 1
};

const content = {
  version: 4,
  id: "2026-12",
  year: 2026,
  month: 12,
  revision: 9,
  featuredElements: [],
  seasonalChests: [
    chest1,
    chest2
  ],
  seasonalVictoryMessages: [
    {
      id: "natal:neve",
      text:
        "A neve cai sobre mais uma vitória!",
      introducedInSeasonalChestId:
        chest1.id,
      introducedInSeasonalChestOrder: 1
    },
    {
      id: "natal:rena",
      text:
        "A rena chegou primeiro à vitória!",
      introducedInSeasonalChestId:
        chest2.id,
      introducedInSeasonalChestOrder: 2
    }
  ],
  updatedAt: 1
};

function pendingFor(
  chest,
  count = 1
) {
  return {
    seasonId: chest.seasonId,
    seasonalChestId: chest.id,
    chestOrder: chest.order,
    poolRevision: chest.poolRevision,
    createdAt: 10,
    rewardPlan: {
      rewards:
        Array.from(
          { length: count },
          () => ({
            type:
              "seasonal_victory_message",
            resolved: false
          })
        ),
      hasUnresolvedRewards: true
    }
  };
}


const clean =
  createBaseProfile("clean");

const eligibleChest1 =
  getEligibleSeasonalChestVictoryMessages(
    clean,
    pendingFor(chest1),
    content
  );

assert.equal(
  eligibleChest1.ok,
  true
);

assert.deepEqual(
  eligibleChest1.catalogCandidates
    .map(item => item.id),
  ["natal:neve"]
);

assert.deepEqual(
  eligibleChest1.candidates
    .map(item => item.id),
  ["natal:neve"]
);
const resolvedChest1 =
  resolveSeasonalChestVictoryMessageRewards(
    clean,
    pendingFor(chest1),
    content,
    () => 0.99
  );

assert.equal(
  resolvedChest1.ok,
  true
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .message.id,
  "natal:neve"
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .seasonalChestId,
  chest1.id
);

assert.equal(
  resolvedChest1.pendingOpen
    .rewardPlan.rewards[0]
    .poolRevision,
  9
);


const ownsFirst =
  createBaseProfile("owns-first");

grantVictoryMessage(
  ownsFirst,
  {
    seasonId: "2026-12",
    messageId: "natal:neve",
    text:
      "A neve cai sobre mais uma vitória!"
  }
);

const chest1Fallback =
  resolveSeasonalChestVictoryMessageRewards(
    ownsFirst,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(chest1Fallback.ok, true);
assert.equal(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0].type,
  "money"
);
assert.equal(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0]
    .fallbackFrom,
  "seasonal_victory_message"
);
assert.deepEqual(
  chest1Fallback.pendingOpen
    .rewardPlan.rewards[0].money,
  {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 1
  }
);
const chest2Pending =
  pendingFor(chest2);

const eligibleChest2 =
  getEligibleSeasonalChestVictoryMessages(
    ownsFirst,
    chest2Pending,
    content
  );

assert.equal(
  eligibleChest2.ok,
  true
);

assert.deepEqual(
  eligibleChest2.catalogCandidates
    .map(item => item.id),
  [
    "natal:neve",
    "natal:rena"
  ]
);

assert.deepEqual(
  eligibleChest2.candidates
    .map(item => item.id),
  ["natal:rena"]
);

const resolvedChest2 =
  resolveSeasonalChestVictoryMessageRewards(
    ownsFirst,
    chest2Pending,
    content,
    () => 0
  );

assert.equal(
  resolvedChest2.ok,
  true
);

assert.equal(
  resolvedChest2.pendingOpen
    .rewardPlan.rewards[0]
    .message.id,
  "natal:rena"
);


const otherSeason =
  createBaseProfile("other-season");

grantVictoryMessage(
  otherSeason,
  {
    seasonId: "2027-12",
    messageId: "natal:neve",
    text:
      "Mesmo ID, outra temporada."
  }
);

const otherSeasonResult =
  resolveSeasonalChestVictoryMessageRewards(
    otherSeason,
    pendingFor(chest1),
    content,
    () => 0
  );

assert.equal(
  otherSeasonResult.ok,
  true
);

assert.equal(
  otherSeasonResult.pendingOpen
    .rewardPlan.rewards[0]
    .message.id,
  "natal:neve"
);
const twoNew =
  createBaseProfile("two-new");

const threeRewards =
  resolveSeasonalChestVictoryMessageRewards(
    twoNew,
    pendingFor(chest2, 3),
    content,
    () => 0
  );

assert.equal(threeRewards.ok, true);

const rewardPlan =
  threeRewards.pendingOpen
    .rewardPlan.rewards;

assert.equal(
  rewardPlan[0].message.id,
  "natal:neve"
);

assert.equal(
  rewardPlan[1].message.id,
  "natal:rena"
);

assert.equal(
  rewardPlan[2].type,
  "money"
);

assert.equal(
  rewardPlan[2].money.platinum,
  1
);


const badRevision =
  pendingFor(chest1);

badRevision.poolRevision = 8;

const mismatch =
  resolveSeasonalChestVictoryMessageRewards(
    clean,
    badRevision,
    content,
    () => 0
  );

assert.equal(
  mismatch.ok,
  false
);

assert.equal(
  mismatch.error,
  "SEASONAL_CHEST_CONTENT_MISMATCH"
);
let randomCalls = 0;

const alreadyResolved =
  pendingFor(chest1);

alreadyResolved.rewardPlan.rewards[0] = {
  type: "seasonal_victory_message",
  resolved: true,
  message: {
    id: "natal:neve",
    text:
      "A neve cai sobre mais uma vitória!"
  }
};

const retry =
  resolveSeasonalChestVictoryMessageRewards(
    clean,
    alreadyResolved,
    content,
    () => {
      randomCalls += 1;
      return 0.5;
    }
  );

assert.equal(retry.ok, true);

assert.deepEqual(
  retry.resolvedIndexes,
  []
);

assert.equal(
  randomCalls,
  0
);


const emptyContent = {
  ...content,
  seasonalVictoryMessages: []
};

const empty =
  resolveSeasonalChestVictoryMessageRewards(
    clean,
    pendingFor(chest1),
    emptyContent,
    () => 0
  );

assert.equal(empty.ok, false);

assert.equal(
  empty.error,
  "SEASONAL_VICTORY_MESSAGE_CATALOG_EMPTY"
);


console.log(
  "OK: resolver de Mensagens de Vitória Sazonais"
);
