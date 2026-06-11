export const isSuspiciousPlateFormat = (plate) => {
  if (!plate) return false;

  const [prefix, suffix] = String(plate).trim().toUpperCase().split("-");
  if (!prefix || !suffix) return false;

  const normalizedSuffix = suffix
    .replaceAll(".", "")
    .replaceAll(" ", "")
    .replaceAll("\n", "")
    .replaceAll("\r", "")
    .replaceAll("\t", "");

  return prefix.length === 4 && normalizedSuffix.length <= 4;
};

