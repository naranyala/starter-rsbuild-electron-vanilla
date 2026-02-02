// Simple fuzzy search function
export const fuzzySearch = (text: string, query: string) => {
  if (!query) return { matches: true, matchedText: text };

  const _lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let matchFound = true;
  let queryIndex = 0;

  for (let i = 0; i < _lowerText.length; i++) {
    const lowerChar = _lowerText[i];

    if (queryIndex < lowerQuery.length && lowerChar === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  // Check if all query characters were found in sequence
  matchFound = queryIndex === lowerQuery.length;

  return { matches: matchFound, matchedText: text };
};
