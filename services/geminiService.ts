import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = "gemini-2.5-flash";

const schema = {
  type: Type.OBJECT,
  properties: {
    orderTitle: {
      type: Type.STRING,
      description: "The main title or identifier for the order (e.g., '15468 - BHX_DNA_TKH - 8 Thái Thị Bôi'). Can be an empty string if not found, especially for summary files.",
    },
    items: {
      type: Type.ARRAY,
      description: "A list of all items in the order.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the item." },
          quantity: { type: Type.NUMBER, description: "The quantity of the item." },
        },
        required: ["name", "quantity"],
      },
    },
    deliveryDate: {
      type: Type.STRING,
      description: "The requested delivery date (e.g., '31/07/2025'). Can be an empty string if not found.",
    },
    shippingInfo: {
      type: Type.OBJECT,
      description: "Information about the recipient.",
      properties: {
        recipient: {
          type: Type.STRING,
          description: "The FULL recipient string, including any ID and phone number (SĐT). Example: '26178 - Nguyễn Tấn Anh / SĐT: 0825979194'.",
        },
        address: {
          type: Type.STRING,
          description: "The full delivery address.",
        },
      },
      required: ["recipient", "address"],
    },
  },
  required: ["orderTitle", "items", "deliveryDate", "shippingInfo"],
};

export async function extractInfoFromData(csvData: string): Promise<ExtractedData> {
  const prompt = `
    Analyze the provided CSV data from an Excel spreadsheet and extract order information. Follow this prioritized workflow:

    **Priority 1: Summary Format (Check for 'Tổng Cộng')**
    1.  Scan the data for a row containing the text 'Tổng Cộng'.
    2.  If this row is found, you are dealing with a summary file. The items and their total quantities are listed horizontally in this row. The device names are in the header row above it.
    3.  Extract all device names and their corresponding quantities from the 'Tổng Cộng' row.
    4.  The 'orderTitle' and 'deliveryDate' may not be present; return empty strings for them.
    5.  The shipping information is located in a separate area. Find it and extract it.

    **Priority 2: Standard Format (If 'Tổng Cộng' is not found)**
    1.  If no 'Tổng Cộng' row exists, treat this as a standard order file.
    2.  The items are listed vertically in two columns, 'Tên thiết bị' (Item Name) and 'SL' (Quantity).
    3.  Extract the 'orderTitle', 'deliveryDate', and all items with their quantities.
    4.  Extract the shipping information.

    **Key Extraction Rules for both formats:**
    -   **Shipping Information**: For the 'recipient' field, you MUST extract the entire, complete string. This includes any ID numbers, the recipient's name, and the phone number (SĐT). Do not omit any part of it.
    -   **Output**: Your final output must be a single JSON object that strictly adheres to the provided schema.

    CSV Data:
    ---
    ${csvData}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are a highly efficient, specialized API for parsing Excel data. Your sole function is to follow the user's workflow instructions precisely and return the data in the specified JSON format as quickly as possible. Do not add any commentary or explanation.",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("API returned an empty response.");
    }
    
    const extractedData = JSON.parse(text);

    if (!extractedData || !extractedData.shippingInfo || !Array.isArray(extractedData.items)) {
        throw new Error("Extracted data is missing required fields.");
    }

    return extractedData as ExtractedData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to extract information using Gemini AI. Please check the file format and try again.");
  }
}
