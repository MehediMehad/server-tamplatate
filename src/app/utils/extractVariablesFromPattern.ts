export const extractVariablesFromPattern = (
  input: string,
  pattern: string
): Record<string, string> | null => {
  const regexString = pattern
    .replace(/\$\{([a-zA-Z0-9_]+)\}/g, "(?<$1>[^/]+)")
    .replace(/\//g, "\\/")
    .replace(/\./g, "\\.");

  const regex = new RegExp(`^${regexString}$`);
  const match = input.match(regex);

  if (!match || !match.groups) {
    return null;
  }

  // ✅ Convert to plain object
  return { ...match.groups };
};

/*
  🔹 Example Usage:

  const input = "/product/456/category/mobile";
  const pattern = "/product/${productId}/category/${categoryName}";

  const result = extractVariablesFromPattern(input, pattern);
  console.log(result);

  🔸 Output:
  {
    productId: "456",
    categoryName: "mobile"
  }

  💡 This function dynamically extracts values from a URL-like string based on a template pattern with variable placeholders (e.g., ${productId}).
*/
