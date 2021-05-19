/**
 * Split a string into lines, regardless of line endings.
 */
export function splitLines(lines: string): string[] {
  let cleanLines = lines.replace(/\r/g, "");
  while (cleanLines.endsWith("\n")) {
    cleanLines = cleanLines.slice(0, cleanLines.length - 1);
  }
  return cleanLines.split("\n");
}

/**
 * Remove newlines (e.g. join with a space) but ensure each line is clean
 * Tries to preserve formatting for anything that's not plain paragraph text
 */
export function formatNewLines(lines: string): string {
  let buffer: string[] = [];
  const out: string[] = [];

  // logic: if line starts with a non-letter, then don't reformat
  splitLines(lines).forEach(line => {
    const cleanLine = line.trimRight();
    const flush = (line.length && !isLetter(line[0])) || cleanLine === "";

    if (flush) {
      if (buffer.length) {
        out.push(buffer.join(" "));
        buffer = [];
      }
      out.push(cleanLine);
      return;
    }
    buffer.push(cleanLine);
  });
  if (buffer.length) {
    out.push(buffer.join(" "));
  }
  return out.join("\n");
}

/**
 * Forcibly make some text into a single line
 */
export function stripNewLines(lines: string): string {
  return splitLines(lines)
    .map(line => line.trim())
    .filter(line => !!line)
    .join(" ");
}

/**
 * Normalize a string into individual lines, removing any blank lines
 */
export function cleanSplitLines(lines: string): string[] {
  return splitLines(lines).filter(e => !!e);
}

export function joinWithAnd(items: string[], separator = ", ") {
  if (items.length <= 1) {
    return items.join(separator);
  }
  return items.slice(0, items.length - 1).join(separator) + " and " + items[items.length - 1];
}

export function maybePlural(word: string, count: number) {
  return count === 1 ? word : `${word}s`;
}

function isLetter(char: string) {
  return /[a-zA-Z]/.test(char);
}

export function truncateString(message: string, maxLength: number, truncationMessage = "") {
  if (message.length > maxLength) {
    return message.slice(0, maxLength) + truncationMessage;
  }
  return message;
}

export const camelToSnakeCase = (text: string): string => {
  if (!text) {
    return "";
  }
  return (
    text[0].toLowerCase() +
    text
      .slice(1)
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/[A-Z]/g, (letter: string) => `-${letter.toLowerCase()}`)
  );
};

export const snakeCaseToCamelCase = (text: string): string => {
  if (!text) {
    return "";
  }
  const words = text.split("-");

  let returnString = words[0];
  for (let i = 1; i < words.length; i++) {
    returnString += initialCaps(words[i]);
  }
  return returnString;
};

export const initialCaps = (text: string): string => {
  if (!text) {
    return "";
  }
  return text[0].toUpperCase() + text.slice(1);
};

const allowedChars = /[a-zA-Z0-9\s-_]/;

export function sanitizeFileName(text: string): string {
  return text
    .split("")
    .filter(e => allowedChars.test(e))
    .join("");
}
