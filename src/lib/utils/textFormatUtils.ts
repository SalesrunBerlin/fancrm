
/**
 * Formats text with line breaks after a specified number of characters
 * with hyphenation for long words and truncation after a specified number of lines
 * @param text The text to format
 * @param maxChars Maximum characters per line (default: 25)
 * @param maxLines Maximum number of lines to display (default: 4)
 * @returns Formatted text with line breaks, hyphenation, and truncation
 */
export function formatWithLineBreaks(
  text: string | null | undefined, 
  maxChars: number = 25,
  maxLines: number = 4
): string {
  if (!text) return '';
  
  let formattedText = '';
  let currentLine = '';
  let lineCount = 0;
  
  // Split the text by existing spaces and process
  const words = String(text).split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if adding this word would exceed the max line count
    if (lineCount >= maxLines) {
      // Trim the last line and add ellipsis
      formattedText = formattedText.trim() + '...';
      break;
    }
    
    // If adding this word would exceed the max chars, add a line break
    if ((currentLine + word).length > maxChars) {
      // Add current line to formatted text with line break
      formattedText += currentLine.trim() + '\n';
      currentLine = word + ' ';
      lineCount++;
      
      // Check if we've reached the max line count
      if (lineCount >= maxLines && i < words.length - 1) {
        formattedText += currentLine.trim() + '...';
        break;
      }
    } else {
      currentLine += word + ' ';
    }
    
    // If word itself is longer than maxChars, we need to split it with hyphens
    if (word.length > maxChars) {
      let longWord = word;
      currentLine = ''; // Reset current line
      
      while (longWord.length > 0) {
        // Check if we've reached the max line count
        if (lineCount >= maxLines) {
          formattedText = formattedText.trim() + '...';
          break;
        }
        
        if (longWord.length > maxChars) {
          // Take the first maxChars-1 characters and add a hyphen
          const chunk = longWord.substring(0, maxChars - 1) + '-';
          formattedText += chunk + '\n';
          longWord = longWord.substring(maxChars - 1);
          lineCount++;
        } else {
          // Add the remaining part of the word
          formattedText += longWord;
          longWord = '';
        }
      }
    }
  }
  
  // Add remaining text if we haven't reached the max line count
  if (currentLine.trim() && lineCount < maxLines) {
    formattedText += currentLine.trim();
  }
  
  return formattedText;
}
