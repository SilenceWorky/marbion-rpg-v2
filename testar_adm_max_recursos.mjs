import {
  applyAdminResourceChange,
  createAdminResourceChange,
  normalizeAdminResource
} from "./src/systems/admin-resources.js";


function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}


console.log("=== ADM MAX RECURSOS ===");


assert(
  normalizeAdminResource("maxhp") === "maxhp",
  "maxhp não normalizou"
);

assert(
  normalizeAdminResource("maxmentalidade") === "maxmentalidade",
  "maxmentalidade não normalizou"
);


{
  const holder = {
    hp: 80,
    maxHp: 100
  };

  const result =
    applyAdminResourceChange(
      holder,
      "maxhp",
      createAdminResourceChange(
        "set",
        250
      )
    );

  assert(result.ok, "maxhp 100 -> 250 falhou");
  assert(holder.maxHp === 250, "maxHp não virou 250");
  assert(holder.hp === 80, "aumentar maxHp curou HP indevidamente");

  console.log("✅ aumentar maxHp preserva HP atual");
}


{
  const holder = {
    hp: 180,
    maxHp: 200
  };

  const result =
    applyAdminResourceChange(
      holder,
      "maxhp",
      createAdminResourceChange(
        "set",
        120
      )
    );

  assert(result.ok, "maxhp 200 -> 120 falhou");
  assert(holder.maxHp === 120, "maxHp não virou 120");
  assert(holder.hp === 120, "HP atual não foi limitado ao novo máximo");

  console.log("✅ reduzir maxHp limita HP atual");
}


{
  const holder = {
    mentalidade: 30,
    maxMentalidade: 50
  };

  const result =
    applyAdminResourceChange(
      holder,
      "maxmentalidade",
      createAdminResourceChange(
        "set",
        120
      )
    );

  assert(result.ok, "maxMentalidade 50 -> 120 falhou");
  assert(holder.maxMentalidade === 120, "maxMentalidade não virou 120");
  assert(holder.mentalidade === 30, "aumentar máximo encheu Mentalidade indevidamente");

  console.log("✅ aumentar maxMentalidade preserva Mentalidade atual");
}


{
  const holder = {
    mentalidade: 90,
    maxMentalidade: 120
  };

  const result =
    applyAdminResourceChange(
      holder,
      "maxmentalidade",
      createAdminResourceChange(
        "set",
        20
      )
    );

  assert(result.ok, "maxMentalidade 120 -> 20 falhou");
  assert(holder.maxMentalidade === 20, "maxMentalidade não virou 20");
  assert(holder.mentalidade === 20, "Mentalidade atual não foi limitada ao novo máximo");

  console.log("✅ reduzir maxMentalidade limita Mentalidade atual");
}


{
  const holder = {
    hp: 1,
    maxHp: 100
  };

  const result =
    applyAdminResourceChange(
      holder,
      "maxhp",
      createAdminResourceChange(
        "set",
        0
      )
    );

  assert(result.ok, "set maxhp 0 deveria ser tratado com segurança");
  assert(holder.maxHp === 1, "máximo deve ter piso 1");
  assert(holder.hp === 1, "HP atual deveria continuar válido");

  console.log("✅ recursos máximos possuem piso 1");
}


{
  const holder = {
    hp: 80,
    maxHp: 100
  };

  const result =
    applyAdminResourceChange(
      holder,
      "hp",
      createAdminResourceChange(
        "set",
        999
      )
    );

  assert(result.ok, "regressão do ADM hp");
  assert(holder.hp === 100, "ADM hp deixou de respeitar maxHp");

  console.log("✅ comportamento antigo de !adm hp preservado");
}


console.log("🛠️ TODOS OS TESTES DE RECURSOS MÁXIMOS PASSARAM.");
