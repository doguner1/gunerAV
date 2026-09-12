import fs from "fs";
import path from "path";
import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  name_tr: z.string(),
  name_en: z.string(),
  description_tr: z.string().optional(),
  description_en: z.string().optional(),
  category: z.string(),
  price: z.number().nullable().optional(),
  images: z.array(z.string()).default([]),
  requires_license: z.boolean().default(false),
  in_stock: z.boolean().default(true),
  slug_tr: z.string().optional(),
  slug_en: z.string().optional(),
  variants: z.any().transform((v) => (v === "$undefined" ? null : v)).optional(),
}).passthrough();

const dataPath = path.join(process.cwd(), "data", "products.json");

try {
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const products = JSON.parse(rawData);

  if (!Array.isArray(products)) {
    throw new Error("products.json must contain an array.");
  }

  let hasErrors = false;
  const validatedProducts = products.map((p, idx) => {
    const result = productSchema.safeParse(p);
    if (!result.success) {
      console.error(`\n[Validation Error] Product index ${idx} (ID: ${p.id}):`);
      result.error.issues.forEach((err: any) => {
        console.error(`  - Path: ${err.path.join('.')}, Message: ${err.message}`);
      });
      hasErrors = true;
      return p; // keep original if error just to report
    }
    return result.data;
  });

  if (hasErrors) {
    console.error("\nValidation failed for some products. Fix the data/products.json file.");
    process.exit(1);
  }

  fs.writeFileSync(dataPath, JSON.stringify(validatedProducts, null, 2));
  console.log("Validation passed! products.json has been safely validated and normalized.");

} catch (error: any) {
  console.error("Failed to read or validate products:", error.message);
  process.exit(1);
}
