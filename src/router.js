
import { raceRoute } from "./routes/race.js";
import { elementRoute } from "./routes/element.js";
import { profileRoute } from "./routes/profile.js";
import { statusRoute } from "./routes/status.js";
import { dailyRoute } from "./routes/daily.js";
import { skillsRoute } from "./routes/skills.js";
import { adminRoute } from "./routes/admin.js";
import { slotRoute } from "./routes/slot.js";
import { slotsRoute } from "./routes/slots.js";





export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);

  const path =
    decodeURIComponent(url.pathname);

  if (
    path === "/raca" ||
    path === "/raça"
  ) {
    return raceRoute(
      request,
      env
    );
  }

  if (path === "/elemento") {
    return elementRoute(
      request,
      env
    );
  }

  if (path === "/pinfo") {
    return profileRoute(
      request,
      env
    );
  }

  if (path === "/status") {
    return statusRoute(
      request,
      env
    );
  }

  if (path === "/daily") {
    return dailyRoute(
      request,
      env
    );
  }

  if (path === "/habilidades") {
    return skillsRoute(
      request,
      env
    );
  }

  if (path === "/adm") {
    return adminRoute(
      request,
      env
    );
  }

  if (path === "/slot") {
    return slotRoute(
      request,
      env
    );
  }

  if (path === "/slots") {
    return slotsRoute(
      request,
      env
    );
  }

  return new Response(
    "Marbion RPG V2 | Rota não encontrada",
    {
      status: 404
    }
  );
}