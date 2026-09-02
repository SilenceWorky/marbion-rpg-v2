from pathlib import Path


# ============================================================
# PvpCoordinator.js
# ============================================================
path = Path("src/durable/PvpCoordinator.js")
text = path.read_text(encoding="utf-8")


marker = '''  async saveData(data) {
    await this.state.storage.put(
      "pvp",
      data
    );
  }
'''

addition = '''  async saveData(data) {
    await this.state.storage.put(
      "pvp",
      data
    );
  }


  /*
   * ==============================
   * PROFILE STORE FORTE
   * ==============================
   *
   * O KV continua como espelho/backup,
   * mas a fonte autoritativa após a
   * primeira leitura passa a ser um
   * Durable Object individual por usuário.
   *
   * Isso evita que uma leitura antiga do
   * KV sobrescreva Status, Skills, Slots ou
   * outros campos recém-alterados.
   */
  async getStrongProfile(
    user
  ) {
    user =
      normalizeUser(
        user
      );


    if (!user) {
      return {
        ok: false,
        error: "INVALID_USER"
      };
    }


    const initialized =
      await this.state.storage.get(
        "profile_initialized"
      );


    if (initialized) {
      const profile =
        await this.state.storage.get(
          "profile"
        );


      return {
        ok: true,
        profile:
          profile ||
          null,
        source:
          "durable"
      };
    }


    const raw =
      await this.env.MARBION_USERS_V2.get(
        user
      );


    let profile =
      null;


    if (raw) {
      profile =
        JSON.parse(raw);
    }


    await this.state.storage.put(
      "profile_initialized",
      true
    );

    await this.state.storage.put(
      "profile_user",
      user
    );


    if (profile) {
      await this.state.storage.put(
        "profile",
        profile
      );
    }
    else {
      await this.state.storage.delete(
        "profile"
      );
    }


    return {
      ok: true,
      profile,
      source:
        "kv-import"
    };
  }


  async saveStrongProfile(
    user,
    profile
  ) {
    user =
      normalizeUser(
        user
      );


    if (
      !user ||
      !profile ||
      typeof profile !==
        "object"
    ) {
      return {
        ok: false,
        error:
          "INVALID_PROFILE"
      };
    }


    const storedUser =
      await this.state.storage.get(
        "profile_user"
      );


    if (
      storedUser &&
      storedUser !== user
    ) {
      return {
        ok: false,
        error:
          "PROFILE_USER_MISMATCH"
      };
    }


    await this.state.storage.put(
      "profile_user",
      user
    );

    await this.state.storage.put(
      "profile_initialized",
      true
    );

    await this.state.storage.put(
      "profile",
      profile
    );


    /*
     * KV permanece sincronizado para
     * backup, inspeção e compatibilidade.
     * Leituras normais do jogo não dependem
     * mais da consistência imediata dele.
     */
    await this.env.MARBION_USERS_V2.put(
      user,
      JSON.stringify(profile)
    );


    return {
      ok: true,
      profile
    };
  }


  async deleteStrongProfile(
    user
  ) {
    user =
      normalizeUser(
        user
      );


    if (!user) {
      return {
        ok: false,
        error:
          "INVALID_USER"
      };
    }


    await this.state.storage.put(
      "profile_user",
      user
    );

    await this.state.storage.put(
      "profile_initialized",
      true
    );

    await this.state.storage.delete(
      "profile"
    );

    await this.env.MARBION_USERS_V2.delete(
      user
    );


    return {
      ok: true
    };
  }
'''

if marker not in text:
    raise SystemExit("saveData marker not found")

text = text.replace(
    marker,
    addition,
    1
)


marker = '''    if (
      url.pathname ===
      "/challenge"
    ) {'''

profile_routes = '''    if (
      url.pathname ===
      "/profile-store/get"
    ) {
      const result =
        await this.getStrongProfile(
          url.searchParams.get(
            "user"
          )
        );


      return Response.json({
        profileStore: true,
        ...result
      });
    }


    if (
      url.pathname ===
      "/profile-store/put"
    ) {
      let profile =
        null;


      try {
        profile =
          await request.json();
      }
      catch {
        return Response.json({
          profileStore: true,
          ok: false,
          error:
            "INVALID_JSON"
        }, {
          status: 400
        });
      }


      const result =
        await this.saveStrongProfile(
          url.searchParams.get(
            "user"
          ),
          profile
        );


      return Response.json({
        profileStore: true,
        ...result
      }, {
        status:
          result.ok
            ? 200
            : 400
      });
    }


    if (
      url.pathname ===
      "/profile-store/delete"
    ) {
      const result =
        await this.deleteStrongProfile(
          url.searchParams.get(
            "user"
          )
        );


      return Response.json({
        profileStore: true,
        ...result
      }, {
        status:
          result.ok
            ? 200
            : 400
      });
    }


'''

if marker not in text:
    raise SystemExit("fetch challenge marker not found")

text = text.replace(
    marker,
    profile_routes + marker,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)


# ============================================================
# profile.js
# ============================================================
path = Path("src/core/profile.js")
text = path.read_text(encoding="utf-8")

old = '''    pvp: {
      ...defaults.pvp,
      ...(profile.pvp || {})
    },

    updatedAt: Date.now()
  };
}'''

new = '''    pvp: {
      ...defaults.pvp,
      ...(profile.pvp || {})
    }
  };
}'''

if old not in text:
    raise SystemExit("profile updatedAt marker not found")

text = text.replace(
    old,
    new,
    1
)

path.write_text(
    text,
    encoding="utf-8"
)
