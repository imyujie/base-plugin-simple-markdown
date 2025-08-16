/**
 * Decodes HTML entities in a string using a textarea element.
 * This is a browser-only implementation.
 * @param text The text containing HTML entities.
 * @returns The decoded text.
 */
function decodeHtmlEntities(text: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return text;
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Fixes markdown strings from MDXEditor that have issues with CJK characters and spacing.
 * It first adds a space before any HTML entity that is not preceded by a space,
 * and then decodes all HTML entities.
 * @param markdown The raw markdown string from the editor.
 * @returns A corrected markdown string.
 */
export function fixMarkdown(markdown: string): string {
  // Step 1: Add a space before an HTML entity if it's preceded by a non-space character.
  // This targets the specific issue of `**word**&#x...;`
  const spacedMarkdown = markdown.replace(/(\S)(&#x[0-9a-fA-F]+;)/g, '$1 $2');

  // Step 2: Decode all HTML entities in the string.
  const decodedMarkdown = decodeHtmlEntities(spacedMarkdown);

  return decodedMarkdown;
}