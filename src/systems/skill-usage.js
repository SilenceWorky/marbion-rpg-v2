import {
  BASIC_PUNCH_SKILL,
  ensureSkillLoadout
} from "./skills.js";


function removeSkillCompletely(
  profile,
  skillId
) {
  ensureSkillLoadout(
    profile
  );


  /*
   * Remove da lista de
   * habilidades aprendidas.
   */
  profile.skills =
    profile.skills.filter(
      ownedSkillId =>
        ownedSkillId !== skillId
    );


  /*
   * Se estiver em algum slot,
   * limpa o slot.
   *
   * Como slot vazio = Soco,
   * automaticamente esse slot
   * passa a utilizar Soco.
   */
  profile.equippedSkills =
    profile.equippedSkills.map(
      equippedSkillId =>
        equippedSkillId === skillId
          ? null
          : equippedSkillId
    );


  /*
   * Remove cooldown salvo.
   */
  if (
    profile.skillCooldowns &&
    typeof profile.skillCooldowns ===
      "object"
  ) {
    delete profile.skillCooldowns[
      skillId
    ];
  }


  /*
   * Remove metadados da habilidade.
   */
  if (
    profile.skillMeta &&
    typeof profile.skillMeta ===
      "object"
  ) {
    delete profile.skillMeta[
      skillId
    ];
  }


  return profile;
}


/*
 * Deve ser chamado somente quando
 * uma habilidade foi REALMENTE executada.
 *
 * Escolher !ataque 2 não conta como uso.
 */
export function consumeSkillUse(
  profile,
  skillId
) {
  ensureSkillLoadout(
    profile
  );


  if (!skillId) {
    return {
      ok: false,
      error: "INVALID_SKILL"
    };
  }


  /*
   * Soco é uma habilidade básica,
   * infinita e virtual.
   *
   * Nunca é consumido.
   */
  if (
    skillId ===
    BASIC_PUNCH_SKILL.id
  ) {
    return {
      ok: true,
      consumed: false,
      removed: false,
      skillId
    };
  }


  /*
   * Se a habilidade nem pertence
   * mais ao jogador, não há o
   * que consumir.
   */
  if (
    !profile.skills.includes(
      skillId
    )
  ) {
    return {
      ok: false,
      error: "SKILL_NOT_OWNED",
      skillId
    };
  }


  const metadata =
    profile.skillMeta[
      skillId
    ];


  /*
   * Habilidade comum/permanente.
   *
   * Pode ser usada normalmente
   * sem ser removida.
   */
  if (
    !metadata ||
    metadata.temporary !== true
  ) {
    return {
      ok: true,
      consumed: false,
      removed: false,
      skillId
    };
  }


  /*
   * Habilidades temporárias do Neutro
   * possuem normalmente 1 uso.
   *
   * Se um dado antigo não tiver
   * usesRemaining, assumimos 1.
   */
  const currentUses =
    Math.max(
      1,
      Number(
        metadata.usesRemaining
      ) || 1
    );


  const remainingUses =
    currentUses - 1;


  /*
   * Ainda possui usos.
   *
   * Isso deixa o sistema preparado
   * caso futuramente exista alguma
   * habilidade temporária com
   * mais de 1 uso.
   */
  if (
    remainingUses > 0
  ) {
    metadata.usesRemaining =
      remainingUses;


    return {
      ok: true,
      consumed: true,
      removed: false,
      skillId,
      usesRemaining:
        remainingUses
    };
  }


  /*
   * Último uso consumido.
   *
   * Remove completamente a habilidade.
   */
  removeSkillCompletely(
    profile,
    skillId
  );


  return {
    ok: true,
    consumed: true,
    removed: true,
    skillId,
    usesRemaining: 0
  };
}