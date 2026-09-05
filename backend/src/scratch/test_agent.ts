import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/connectDB";
import { recipeAgentService } from "../container/container";
import logger from "../config/logger";

async function runTests() {
  console.log("=== CONNECTING TO MONGO ===");
  await connectDB();

  const queries = [
    "Give me a high-protein chicken dinner under 500 calories",
    "Give me an authentic Kerala vegetarian lunch",
    "give me a vegan sushi recipe under 300 calories using avocado and cucumber"
  ];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`\n======================================================`);
    console.log(`TEST QUERY #${i + 1}: "${query}"`);
    console.log(`======================================================`);

    try {
      const result = await recipeAgentService.executeAgentQuery(query);
      console.log("\n--- AGENT RESULT ---");
      console.log(`Parsed Intent: ${JSON.stringify(result.parsedIntent, null, 2)}`);
      console.log(`Tools Called: ${JSON.stringify(result.toolsCalled)}`);
      console.log("\nFinal Response Markdown:\n");
      console.log(result.response);
    } catch (error: any) {
      console.error(`Error executing query: ${error.message}`);
    }
  }

  console.log("\n=== DISCONNECTING FROM MONGO ===");
  await mongoose.disconnect();
  console.log("Disconnected successfully. Test run completed.");
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  mongoose.disconnect();
});
