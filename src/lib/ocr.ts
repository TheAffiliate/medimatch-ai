import { createWorker } from 'tesseract.js';

export const performOCR = async (imageSource: string | File) => {
  // 1. Initialize the worker with English language
  const worker = await createWorker('eng');

  try {
    // 2. Perform recognition
    // Note: Tesseract can take a File object or a URL string
    const { data: { text } } = await worker.recognize(imageSource);
    
    // 3. Clean up the worker to free memory
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error("OCR Error:", error);
    if (worker) await worker.terminate();
    return null;
  }
};

/**
 * High-level verification logic
 */
export const verifyHpcsaDocument = async (file: File, expectedName: string) => {
    const rawText = await performOCR(file);
    if (!rawText) return { success: false, reason: "Could not read document" };

    const normalizedText = rawText.toLowerCase();
    
    // Look for keywords
    const hasHpcsa = normalizedText.includes('hpcsa') || normalizedText.includes('health professions');
    const hasName = normalizedText.includes(expectedName.toLowerCase());
    
    // Regex to find HPCSA Registration numbers (Format: MP 1234567 or MP1234567)
    const regNumMatch = rawText.match(/[A-Z]{2}\s?\d{7}/i);
    const regNumber = regNumMatch ? regNumMatch[0].toUpperCase() : null;

    return {
        success: hasHpcsa && hasName,
        regNumber,
        confidence: (hasHpcsa && hasName) ? 'high' : 'low',
        rawText
    };
};