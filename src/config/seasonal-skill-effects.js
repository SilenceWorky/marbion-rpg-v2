export const SEASONAL_SKILL_EFFECTS = Object.freeze([
  "Cegueira",
  "Sono",
  "Confusão",
  "Silêncio",
  "Lentidão",
  "Paralisia",
  "Congelamento",
  "Atordoamento",
  "Veneno",
  "Queimadura",
  "Sangramento",
  "Molhado",
  "Eletrocussão",
  "Evaporação",
  "Cura",
  "Recuperação de Mentalidade",
  "Contra-ataque",
  "Reflexão",
  "Buff de Força",
  "Buff de Força Mágica",
  "Buff de Velocidade",
  "Buff de Evasão",
  "Buff de Precisão",
  "Buff de Defesa",
  "Debuff de Força",
  "Debuff de Força Mágica",
  "Debuff de Velocidade",
  "Debuff de Evasão",
  "Debuff de Precisão",
  "Debuff de Defesa"
]);

function normalizeLookup(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const EFFECT_BY_LOOKUP =
  new Map(
    SEASONAL_SKILL_EFFECTS.map(
      effect => [
        normalizeLookup(effect),
        effect
      ]
    )
  );

export function normalizeSeasonalSkillEffect(
  value
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return (
    EFFECT_BY_LOOKUP.get(
      normalizeLookup(value)
    ) ?? undefined
  );
}
