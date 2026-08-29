export async function pvpTestRoute(
  request,
  env
) {
  const id =
    env.PVP_COORDINATOR.idFromName(
      "marbion-global-pvp"
    );


  const coordinator =
    env.PVP_COORDINATOR.get(
      id
    );


  const response =
    await coordinator.fetch(
      new Request(
        "https://pvp.internal/ping"
      )
    );


  return new Response(
    await response.text(),
    {
      status:
        response.status
    }
  );
}