export const ADMIN_USERS = [
  "silenceworky"
];


export function isAdminUser(
  user
) {
  const normalized =
    String(user ?? "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

  return ADMIN_USERS.includes(
    normalized
  );
}