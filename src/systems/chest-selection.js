import {
  getChestById,
  getChestGroups
} from "./chest-inventory.js";


function normalizeSelection(
  value
) {
  const selection =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      selection
    ) ||
    selection <= 0
  ) {
    return null;
  }

  return selection;
}


export function selectChestByGroupNumber(
  profile,
  selection
) {
  const normalizedSelection =
    normalizeSelection(
      selection
    );

  if (!normalizedSelection) {
    return {
      ok: false,
      error:
        "INVALID_CHEST_SELECTION"
    };
  }

  const grouped =
    getChestGroups(
      profile
    );

  if (!grouped.ok) {
    return grouped;
  }

  const group =
    grouped.groups[
      normalizedSelection - 1
    ];

  if (!group) {
    return {
      ok: false,
      error:
        "CHEST_GROUP_NOT_FOUND"
    };
  }

  /*
   * A lista exibida em !baú agrupa apenas por tipo.
   * A abertura usa a primeira instância daquele grupo
   * para manter FIFO de forma determinística.
   */
  const chestId =
    group.chestIds[0];

  const chestResult =
    getChestById(
      profile,
      chestId
    );

  if (!chestResult.ok) {
    return {
      ok: false,
      error:
        "CHEST_GROUP_EMPTY"
    };
  }

  return {
    ok: true,

    selection:
      normalizedSelection,

    group: {
      type:
        group.type,
      label:
        group.label,
      quantity:
        group.quantity
    },

    chest:
      chestResult.chest
  };
}
