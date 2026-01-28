// Utility to ensure DOMMatrix is polyfilled before loading pdf-parse
function getPdfParser() {
    if (typeof DOMMatrix === 'undefined') {
        (global as any).DOMMatrix = class DOMMatrix { };
    }
    return require('pdf-parse');
}

export async function extractTextFromPdfUrl(url: string): Promise<string> {
    try {
        const pdf = getPdfParser();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const data = await pdf(buffer);

        // Remove excessive whitespace and clean up
        return data.text
            .replace(/\n\s*\n/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .trim();
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        return "";
    }
}
