import tesseract from "node-tesseract-ocr";
import { Client, Storage, Databases, Query } from "node-appwrite";

const appwriteFunction = async (context) => {
  const { req, res, log, error } = context;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(client);
  const databases = new Databases(client);

  // Use the ID from your appwrite.json for the medical_aid_cards table
  const DATABASE_ID = process.env.DATABASE_ID; 
  const COLLECTION_ID = "medical_aid_cards"; 

  try {
    const fileId = req.body.$id;
    const bucketId = req.body.bucketId;

    if (!fileId) return res.json({ error: "No file ID" }, 400);

    log(`Downloading file: ${fileId}`);
    const arrayBuffer = await storage.getFileView(bucketId, fileId);
    const fileBuffer = Buffer.from(arrayBuffer); 

    const config = { lang: "eng", oem: 1, psm: 3 };
    const text = await tesseract.recognize(fileBuffer, config);
    
    const schemeNumber = text.match(/\d{7,11}/)?.[0] || "Unknown";
    let detectedScheme = "Other";
    if (/discovery/i.test(text)) detectedScheme = "Discovery Health";
    if (/gems/i.test(text)) detectedScheme = "GEMS";

    // IMPORTANT: We search for the document in 'medical_aid_cards' where 'card_image_id' matches
    const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("card_image_id", fileId)
    ]);

    if (response.documents.length > 0) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, response.documents[0].$id, {
        scheme_name: detectedScheme,
        scheme_number: schemeNumber,
        verification_status: "verified"
      });
      log("Database updated successfully.");
    }

    return res.json({ success: true });
  } catch (err) {
    error("Error: " + err.message);
    return res.json({ error: err.message }, 500);
  }
};

export default appwriteFunction;