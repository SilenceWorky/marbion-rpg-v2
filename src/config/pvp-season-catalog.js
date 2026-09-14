/*
 * Catálogo oficial de temporadas do Marbion.
 *
 * Nesta fase base, o código funciona como a fonte inicial
 * de configuração. Mais adiante, o painel do site poderá
 * gravar planejamento/agendamento diretamente no storage.
 *
 * Regra importante:
 * - presença no catálogo = mês autorizado a ser preparado;
 * - ausência = nenhuma temporada é inventada automaticamente;
 * - o sincronizador nunca sobrescreve uma definição já salva
 *   no planejamento anual, preservando futuras edições do site.
 *
 * Os nomes oficiais de 2026/2027 serão preenchidos depois,
 * em conjunto, sem inventar temporadas que ainda não foram
 * aprovadas.
 */

export const PVP_SEASON_CATALOG_VERSION = 1;


export const PVP_SEASON_CATALOG =
  Object.freeze({
    2026: Object.freeze({
      // Exemplo de formato:
      // 10: Object.freeze({ name: "Nome da temporada" })
    }),

    2027: Object.freeze({
      // Janeiro a dezembro serão preenchidos quando aprovados.
    })
  });
