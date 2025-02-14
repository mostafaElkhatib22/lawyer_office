"use server";

import connectMongoDB from "@/lib/db_connect";
import Case from "@/models/Case";

async function SearchResult(str: string) {
  await connectMongoDB();

  if (!str || str.trim() === "") {
    return []; // Return empty array if search term is empty or just whitespace
  }

  const searchTerm = str.trim(); // Trim whitespace from search term

  const convertFirstLetter = (text: string): string => {
    if (!text) return ""; // Handle null or undefined input

    return text.replace(/(^\w{1})|(\.\s*\w{1})/g, (match) =>
      match.toUpperCase()
    );
  };

  const searchTermFirst = convertFirstLetter(searchTerm); // This is likely not needed for regex search

  try {
    const results = await Case.find({
      $or: [
        { client: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
        { caseNumber: { $regex: searchTerm, $options: "i" } }, // Case-insensitive search
      ],
    });
    return results;
  } catch (error) {
    console.error("Error searching cases:", error);
    return []
  }
}

export default SearchResult;
