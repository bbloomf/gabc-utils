export const removeSolesmesMarkings = (gabc?: string) =>
  gabc
    ?.replace(/(\S)[_']+\d?|\.+\d?$/g, "$1")
    .replace(/(\.+\d?)\/+/gi, "//")
    .replace(/(\.+\d?)!/gi, "/")
    .replace(/(\.+\d?)/gi, "");

export const removeSolesmesMarkingsInMixedGabc = (mixedGabc?: string) =>
  mixedGabc?.replace(/\([^\)]+/g, removeSolesmesMarkings);
