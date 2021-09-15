export function removeSolesmesMarkings(gabc?: string) {
  return gabc
    ?.replace(/(\S)[_']+\d?|\.+\d?$/g, "$1")
    .replace(/(\.+\d?)\/+/gi, "//")
    .replace(/(\.+\d?)!/gi, "/")
    .replace(/(\.+\d?)/gi, "");
}

export function removeSolesmesMarkingsInMixedGabc(mixedGabc?: string) {
  return mixedGabc?.replace(/\([^\)]+/g, removeSolesmesMarkings);
}
