import assert from "node:assert/strict";

import {
  ADMIN_STATUS_RESET_VALUES,
  resetProfileStatus
} from "./src/systems/admin.js";


const profile = {
  strength: 500,
  magicStrength: 700,
  speed: 525,
  evasion: 300,
  accuracy: 190,
  defense: 10010,
  statusPoints: 999999884
};


const result =
  resetProfileStatus(
    profile
  );


assert.equal(
  result.ok,
  true
);

assert.deepEqual(
  profile,
  ADMIN_STATUS_RESET_VALUES
);

assert.equal(
  profile.statusPoints,
  0
);

assert.equal(
  profile.strength,
  5
);

assert.equal(
  profile.magicStrength,
  5
);

assert.equal(
  profile.speed,
  5
);

assert.equal(
  profile.evasion,
  5
);

assert.equal(
  profile.accuracy,
  90
);

assert.equal(
  profile.defense,
  5
);

console.log(
  "✅ Status Points guardados foram zerados."
);

console.log(
  "✅ Atributos distribuídos voltaram aos valores de reset ADM."
);

console.log(
  "✅ Defesa voltou para 5 conforme a regra definida."
);

console.log(
  "\n🛠️ TODOS OS TESTES DE RESET ADM DE STATUS PASSARAM."
);
