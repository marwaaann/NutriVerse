import {
  recipeImageService,
  buildRecipeImagePrompt,
} from "../src/services/recipe_image_service";

describe("RecipeImageService Tests", () => {
  it("should generate a rich culinary prompt containing title, cuisine, and ingredients", () => {
    const prompt = buildRecipeImagePrompt({
      title: "Spicy Paneer Tikka",
      cuisine: "North Indian",
      ingredients: [
        { name: "Paneer" },
        { name: "Bell Pepper" },
        { name: "Yogurt" },
      ],
    });

    expect(prompt).toContain("Spicy Paneer Tikka");
    expect(prompt).toContain("North Indian");
    expect(prompt).toContain("Paneer");
    expect(prompt).toContain("Bell Pepper");
  });

  it("should resolve curated authentic photo for Kerala Sadya fallback", async () => {
    const result = await recipeImageService.resolveRecipeImage({
      title: "Authentic Kerala Vegetarian Sadya",
    });

    expect(result.url).toBeDefined();
    expect(result.url).toContain("photo-1589301760014-d929f3979dbc");
  });

  it("should resolve curated authentic photo for Sushi fallback", async () => {
    const result = await recipeImageService.resolveRecipeImage({
      title: "Avocado and Cucumber Vegan Sushi Roll",
    });

    expect(result.url).toBeDefined();
    expect(result.url).toContain("photo-1579871494447-9811cf80d66c");
  });

  it("should resolve safe neutral fallback for unmatched dish", async () => {
    const result = await recipeImageService.resolveRecipeImage({
      title: "Grandma Secret Mystery Stew With Exotic Spices",
    });

    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe("string");
    expect(result.url.length).toBeGreaterThan(10);
  });
});
