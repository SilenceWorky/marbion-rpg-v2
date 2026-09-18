import assert from "node:assert/strict";

import {
  callBankPixProfileSide
} from "./src/systems/bank-pix-profile-client.js";


function createEnv() {
  const calls = [];

  return {
    calls,

    env: {
      PVP_COORDINATOR: {
        idFromName(name) {
          calls.push({
            type: "id",
            name
          });

          return `id:${name}`;
        },

        get(id) {
          calls.push({
            type: "get",
            id
          });

          return {
            async fetch(request) {
              const url =
                new URL(
                  request.url
                );

              const body =
                await request.json();

              calls.push({
                type: "fetch",
                path:
                  url.pathname,
                side:
                  url.searchParams.get(
                    "side"
                  ),
                user:
                  url.searchParams.get(
                    "user"
                  ),
                body
              });

              return Response.json({
                profileStore: true,
                pixSide: true,
                ok: true,
                applied: true,
                user:
                  url.searchParams.get(
                    "user"
                  )
              });
            }
          };
        }
      }
    }
  };
}


const transaction = {
  transactionId:
    "pix:origem:1",
  sender:
    "origem",
  recipient:
    "destino",
  amount: 1,
  coin: "gold",
  totalBronze: 100
};


const sender =
  createEnv();

const debit =
  await callBankPixProfileSide(
    sender.env,
    {
      side: "debit",
      user: "@Origem",
      transaction
    }
  );

assert.equal(
  debit.ok,
  true
);

assert.equal(
  sender.calls[0].name,
  "marbion-profile:origem",
  "o cliente deve apontar para o DO forte do remetente"
);

const fetchCall =
  sender.calls.find(
    call =>
      call.type === "fetch"
  );

assert.equal(
  fetchCall.path,
  "/profile-store/pix-side"
);

assert.equal(
  fetchCall.side,
  "debit"
);

assert.equal(
  fetchCall.user,
  "origem"
);

assert.deepEqual(
  fetchCall.body,
  transaction
);


const recipient =
  createEnv();

const credit =
  await callBankPixProfileSide(
    recipient.env,
    {
      side: "credit",
      user: "Destino",
      transaction
    }
  );

assert.equal(
  credit.ok,
  true
);

assert.equal(
  recipient.calls[0].name,
  "marbion-profile:destino"
);


const invalidSide =
  await callBankPixProfileSide(
    sender.env,
    {
      side: "x",
      user: "origem",
      transaction
    }
  );

assert.equal(
  invalidSide.ok,
  false
);

assert.equal(
  invalidSide.error,
  "INVALID_PIX_PROFILE_SIDE"
);


const unavailable =
  await callBankPixProfileSide(
    {},
    {
      side: "debit",
      user: "origem",
      transaction
    }
  );

assert.equal(
  unavailable.ok,
  false
);

assert.equal(
  unavailable.error,
  "PIX_PROFILE_STORE_UNAVAILABLE"
);


const invalidResponse =
  await callBankPixProfileSide(
    {
      PVP_COORDINATOR: {
        idFromName() {
          return "id";
        },

        get() {
          return {
            async fetch() {
              return new Response(
                "not-json"
              );
            }
          };
        }
      }
    },
    {
      side: "debit",
      user: "origem",
      transaction
    }
  );

assert.equal(
  invalidResponse.ok,
  false
);

assert.equal(
  invalidResponse.error,
  "PIX_PROFILE_STORE_INVALID_RESPONSE"
);


console.log(
  "✅ Cliente interno do Pix entre profile-stores validado."
);
