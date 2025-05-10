
/**
 * Formats text with line breaks after a specified number of characters
 * @param text The text to format
 * @param maxChars Maximum characters per line
 * @returns Formatted text with line breaks
 */
export function formatWithLineBreaks(text: string | null | undefined, maxChars: number = 15): string {
  if (!text) return '';
  
  let formattedText = '';
  let currentLine = '';
  
  // Split the text by existing spaces and process
  const words = String(text).split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // If adding this word would exceed the max chars, add a line break
    if ((currentLine + word).length > maxChars) {
      // Add current line to formatted text with line break
      formattedText += currentLine.trim() + '\n';
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
    
    // If word itself is longer than maxChars, we need to split it
    if (word.length > maxChars) {
      let longWord = word;
      currentLine = ''; // Reset current line
      
      while (longWord.length > 0) {
        const chunk = longWord.substring(0, maxChars);
        formattedText += chunk;
        longWord = longWord.substring(maxChars);
        
        if (longWord.length > 0) {
          formattedText += '\n';
        }
      }
    }
  }
  
  // Add remaining text
  if (currentLine.trim()) {
    formattedText += currentLine.trim();
  }
  
  return formattedText;
}
