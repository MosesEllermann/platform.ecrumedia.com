import { jsPDF } from 'jspdf';
import { outfitRegular, outfitBold } from './outfitFontData';

/**
 * Loads and adds the Outfit font to a jsPDF instance
 */
export const addOutfitFont = (pdf: jsPDF): void => {
  try {
    // Add Outfit Regular
    pdf.addFileToVFS('Outfit-Regular.ttf', outfitRegular);
    pdf.addFont('Outfit-Regular.ttf', 'Outfit', 'normal');
    
    // Add Outfit Bold
    pdf.addFileToVFS('Outfit-Bold.ttf', outfitBold);
    pdf.addFont('Outfit-Bold.ttf', 'Outfit', 'bold');
    
    // Set Outfit as default font
    pdf.setFont('Outfit', 'normal');
  } catch (error) {
    console.warn('Could not load Outfit font, using Helvetica:', error);
    pdf.setFont('helvetica', 'normal');
  }
};

/**
 * Set font with fallback
 */
export const setFont = (pdf: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
  try {
    pdf.setFont('Outfit', style);
  } catch {
    // Fallback to Helvetica
    pdf.setFont('helvetica', style);
  }
};
