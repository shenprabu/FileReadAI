/**
 * PromptService - Centralized prompt management for all AI providers
 * Manages prompts for form extraction
 */
class PromptService {
  /**
   * Get the main fields extraction prompt
   * @returns {string} Fields extraction prompt
   */
  getFieldsExtractionPrompt() {
    return `Analyze this form image and extract ALL form fields, including both filled and empty fields. 
Return the data as a JSON object with the following structure:
{
  "fields": [
    {
      "label": "field name",
      "value": "field value or empty string if blank",
      "type": "text|number|date|email|phone|checkbox|radio|select|textarea",
      "confidence": 0.0-1.0,
      "boundingBox": {
        "x": 0.0-1.0,
        "y": 0.0-1.0,
        "width": 0.0-1.0,
        "height": 0.0-1.0
      }
    }
  ],
  "formTitle": "detected form title if any"
}

Guidelines:
- Extract ALL visible fields from the form, whether they are filled or empty
- If a field is empty/blank, include it with an empty string "" as the value
- For checkboxes/radio buttons, use "checked" or "unchecked" as the value
- Identify the field type accurately based on context
- Provide confidence scores based on text clarity (use 1.0 for clearly visible labels even if value is empty)
- If handwritten, note lower confidence for the value
- Include the form title if visible at the top
- For boundingBox, provide normalized coordinates (0.0 to 1.0) relative to image dimensions:
  - x: LEFT edge position as fraction of image width (0.0 = left edge, 1.0 = right edge)
  - y: TOP edge position as fraction of image height (0.0 = top edge, 1.0 = bottom edge)
  - width: box width as fraction of total image width (e.g., 0.3 = 30% of image width)
  - height: box height as fraction of total image height (e.g., 0.05 = 5% of image height)
- The bounding box should encompass the entire field (label + input area)
- IMPORTANT: x and y are the TOP-LEFT corner coordinates, NOT center point
- Example: A field at top-left corner spanning 30% width and 5% height would be: {"x": 0.0, "y": 0.0, "width": 0.3, "height": 0.05}`;
  }
}

export default new PromptService();

