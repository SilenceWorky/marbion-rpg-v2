import {
  handleRequest
} from "./router.js";


export {
  PvpCoordinator
} from "./durable/PvpCoordinator.js";


export default {
  async fetch(
    request,
    env,
    ctx
  ) {
    return handleRequest(
      request,
      env,
      ctx
    );
  }
};