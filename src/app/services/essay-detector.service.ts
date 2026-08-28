import { Injectable } from '@angular/core';

export interface EssayTelemetry {
  pastedWords: number;
  typedWords: number;
  totalTimeSeconds: number;
  isPasteDetected: boolean;
  pastePercentage: number;
}

export interface EssayAnalysisResult {
  aiScore: number; // 0 - 100%
  pastePercentage: number; // 0 - 100%
  riskLevel: 'low' | 'medium' | 'high';
  detectedPhrases: string[];
  telemetry: EssayTelemetry;
  cleanContent: string;
}

@Injectable({ providedIn: 'root' })
export class EssayDetectorService {
  
  // List of common AI generator phrases and stylistic fingerprints (ChatGPT / Claude / Gemini)
  private readonly AI_PHRASES: string[] = [
    'in conclusion',
    'it is important to note',
    'it is crucial to note',
    'it is worth noting',
    'multifaceted',
    'delve into',
    'delve deeper',
    'testament to',
    'landscape of',
    'ever-evolving landscape',
    'fostering a',
    'foster a',
    'pivotal role',
    'crucial role',
    'paramount importance',
    'paramount role',
    'seamlessly',
    'harness the power',
    'embarks on',
    'embark on',
    'illuminate',
    'underscores',
    'underscore the',
    'noteworthy',
    'comprehensive understanding',
    'in summary',
    'furthermore',
    'moreover',
    'nonetheless',
    'consequently',
    'by and large',
    'plays a vital role',
    'plays a key role',
    'serves as a beacon',
    'a tapestry of',
    'nestled in',
    'shed light on',
    'speaks volumes',
    'resonate with',
    'in today\'s fast-paced world',
    'in this modern era',
    'in the realm of',
    'it goes without saying',
    'vital importance'
  ];

  /**
   * Analyzes an essay content string for AI characteristics and telemetry metrics.
   */
  analyzeEssay(rawContent: string, currentTelemetry?: Partial<EssayTelemetry>): EssayAnalysisResult {
    const { cleanContent, extractedTelemetry } = this.extractTelemetry(rawContent);

    // Merge telemetry from extracted metadata or provided telemetry
    const telemetry: EssayTelemetry = {
      pastedWords: currentTelemetry?.pastedWords ?? extractedTelemetry?.pastedWords ?? 0,
      typedWords: currentTelemetry?.typedWords ?? extractedTelemetry?.typedWords ?? 0,
      totalTimeSeconds: currentTelemetry?.totalTimeSeconds ?? extractedTelemetry?.totalTimeSeconds ?? 0,
      isPasteDetected: currentTelemetry?.isPasteDetected ?? extractedTelemetry?.isPasteDetected ?? false,
      pastePercentage: currentTelemetry?.pastePercentage ?? extractedTelemetry?.pastePercentage ?? 0
    };

    const textOnly = this.stripHtml(cleanContent);
    const textLower = textOnly.toLowerCase();
    const totalWords = this.countWords(textLower);

    // 1. Find suspicious AI phrases
    const detectedPhrases: string[] = [];
    let phraseMatchesCount = 0;

    for (const phrase of this.AI_PHRASES) {
      if (textLower.includes(phrase)) {
        detectedPhrases.push(phrase);
        phraseMatchesCount++;
      }
    }

    // 2. Check for AI typography fingerprints: Long dashes (Em-dash —, En-dash –)
    const emDashRegex = /[—–]/g;
    const emDashMatches = textOnly.match(emDashRegex);
    const emDashCount = emDashMatches ? emDashMatches.length : 0;

    if (emDashCount > 0) {
      detectedPhrases.push(`Em-Dash / En-Dash typography (${emDashCount}x)`);
    }

    // 3. Calculate AI Probability Score (heuristic)
    let aiScore = 0;

    // Weight 1: Phrase density (up to 55 points)
    if (totalWords > 0) {
      const phraseDensity = (phraseMatchesCount / (totalWords / 50)); // matches per ~50 words
      aiScore += Math.min(Math.round(phraseDensity * 25), 55);
    }

    // Weight 2: Long dashes (up to 20 points)
    if (emDashCount > 0) {
      aiScore += Math.min(emDashCount * 10, 20);
    }

    // Weight 3: Paste percentage (up to 25 points)
    if (telemetry.pastePercentage > 0) {
      aiScore += Math.round((telemetry.pastePercentage / 100) * 25);
    }

    // Weight 4: Super fast typing speed / instant creation (up to 20 points)
    if (totalWords > 40 && telemetry.totalTimeSeconds > 0 && telemetry.totalTimeSeconds < 30) {
      aiScore += 20;
    }

    aiScore = Math.min(Math.max(aiScore, 0), 99); // cap 0-99%

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (aiScore >= 70 || telemetry.pastePercentage >= 75) {
      riskLevel = 'high';
    } else if (aiScore >= 40 || telemetry.pastePercentage >= 40) {
      riskLevel = 'medium';
    }

    return {
      aiScore,
      pastePercentage: telemetry.pastePercentage,
      riskLevel,
      detectedPhrases,
      telemetry,
      cleanContent
    };
  }

  /**
   * Embeds telemetry metrics into the HTML content as a hidden metadata element.
   */
  embedTelemetry(content: string, telemetry: EssayTelemetry): string {
    const jsonStr = JSON.stringify(telemetry);
    const metaTag = `<span data-essay-telemetry="${encodeURIComponent(jsonStr)}" style="display:none;"></span>`;
    return content + metaTag;
  }

  /**
   * Extracts embedded telemetry from HTML content and returns clean content without the metadata tag.
   */
  extractTelemetry(content: string): { cleanContent: string; extractedTelemetry: EssayTelemetry | null } {
    if (!content) return { cleanContent: '', extractedTelemetry: null };

    const regex = /<span data-essay-telemetry="([^"]+)"[^>]*><\/span>/i;
    const match = content.match(regex);

    if (match && match[1]) {
      try {
        const jsonStr = decodeURIComponent(match[1]);
        const telemetry: EssayTelemetry = JSON.parse(jsonStr);
        const cleanContent = content.replace(regex, '');
        return { cleanContent, extractedTelemetry: telemetry };
      } catch (e) {
        console.error('Failed to parse essay telemetry:', e);
      }
    }

    return { cleanContent: content, extractedTelemetry: null };
  }

  /**
   * Highlights detected AI phrases and long dashes (em-dash / en-dash) in HTML content for teacher inspection.
   */
  highlightAiPhrases(htmlContent: string, phrases: string[]): string {
    if (!htmlContent) return '';

    let result = htmlContent;

    // 1. Highlight Em-dash (—) and En-dash (–)
    result = result.replace(/([—–])/g, '<mark class="bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 px-1 rounded font-bold" title="AI Typography Fingerprint (Em-Dash / En-Dash)">$1</mark>');

    // 2. Highlight text phrases
    if (phrases && phrases.length > 0) {
      for (const phrase of phrases) {
        if (phrase.includes('Em-Dash')) continue; // Skip custom tag phrase
        const regex = new RegExp(`\\b(${this.escapeRegExp(phrase)})\\b`, 'gi');
        result = result.replace(regex, '<mark class="bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 px-1 rounded font-semibold" title="AI Stylistic Fingerprint">$1</mark>');
      }
    }

    return result;
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
  }

  private countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
