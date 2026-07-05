export const parseMomNotes = (notes) => {
  if (!notes) return [];

  // Normalize escaped dots like "2\." to "2." and "**" to ""
  const normalizedNotes = notes.replace(/\\?\./g, '.').replace(/\*\*/g, '');
  const lines = normalizedNotes.split('\n');
  
  const points = [];
  let currentPoint = null;
  
  // A regex to match the start of a point: "1.", "1. ", "12."
  const pointStartRegex = /^(\d+)\.\s*(.*)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const match = line.match(pointStartRegex);
    if (match) {
      if (currentPoint) {
        points.push(currentPoint);
      }
      currentPoint = {
        title: match[2],
        details: []
      };
    } else if (currentPoint) {
      currentPoint.details.push(line);
    }
  }
  if (currentPoint) {
    points.push(currentPoint);
  }
  
  return points.map((p, index) => {
    let pageName = '-';
    let issueText = p.title;
    
    // Pattern: Title has a dash, e.g. "Company Profile - Date Format"
    if (p.title.includes(' - ') || p.title.includes(' – ')) {
      const parts = p.title.split(/ [-–] /);
      pageName = parts[0].trim();
      issueText = parts.slice(1).join(' - ').trim();
    } else {
      // General NLP extraction for page/module names
      // Looking for "the [Name] page/module" or "[Name] page/module"
      const pageMatch = p.title.match(/(?:(?:in|on|at|to|improve|update|fix|change|modify|test)\s+)?(?:the|a|an)\s+([A-Za-z0-9\s]{2,35}?)\s+(page|module|dashboard|screen|feature)s?\b/i);
      
      if (pageMatch) {
        pageName = pageMatch[1].trim();
        // Clean up common trailing words like "upload" if they are part of the match but not the core name
        if (pageName.toLowerCase().endsWith(' upload')) pageName = pageName.substring(0, pageName.length - 7);
      } else {
        // Fallback for direct names without "the" e.g., "Dashboard summary cards"
        const directMatch = p.title.match(/^([A-Za-z0-9\s]{2,20}?)\s+(?:page|module|dashboard|screen|feature)s?\b/i) || 
                            p.title.match(/^(Dashboard|Login|Requirements|Minutes of Meeting|Users|Production Issues)\b/i);
        if (directMatch) {
          pageName = directMatch[1].trim();
        }
      }

      // If the sentence starts with "In the X page, ", strip it to make issueText cleaner.
      // Otherwise, leave issueText as the full original sentence (e.g., "Improve the login page...").
      const inTheMatch = p.title.match(/^In the .+?\s*(?:page|module|dashboard|screen|feature)s?,?\s*(.*)$/i);
      if (inTheMatch) {
        issueText = inTheMatch[1].trim();
      }
    }
    
    // Append multiline details
    if (p.details.length > 0) {
      issueText += (issueText ? '\n' : '') + p.details.join('\n');
    }
    
    if (pageName.toLowerCase().endsWith(' page')) {
      pageName = pageName.substring(0, pageName.length - 5);
    }
    
    if (pageName !== '-') {
      pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }
    
    return {
      index: index + 1,
      pageName,
      issueText
    };
  });
};
