/**
 * Relative-path arithmetic for the panels' current folder.
 *
 * §REQ:TWO-PNL-NVGT-OOX-030 a subfolder's path is the current path plus the
 * entry's name, in the same relative form the FilesystemApi expects.
 */
export function childPath(path: string, name: string): string {
  return path === '' ? name : `${path}/${name}`
}
