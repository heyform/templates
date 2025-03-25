import fs from "fs/promises";
import path from "path";
import uuid from "uuid-by-string";

async function findJsonFiles(directory) {
  const jsonFiles = [];
  const rootDir = directory;

  async function scanDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (
        entry.isFile() &&
        path.extname(entry.name).toLowerCase() === ".json"
      ) {
        // Get parent directory name as category
        const parentDir = path.dirname(fullPath);
        const category = path.basename(parentDir);

        // Get relative path without root directory
        const relativePath = path.relative(rootDir, fullPath);

        jsonFiles.push({
          category,
          relativePath,
          fullPath,
        });
      }
    }
  }

  await scanDirectory(directory);
  return jsonFiles;
}

async function processJsonFiles() {
  const listAll = [];
  const listSummary = [];

  try {
    const templatesDir = path.resolve("./templates");
    console.log(`Scanning for JSON files in: ${templatesDir}`);

    const jsonFiles = await findJsonFiles(templatesDir);

    console.log(`Found ${jsonFiles.length} JSON files:`);
    for (const file of jsonFiles) {
      console.log(`- Category: ${file.category}, Path: ${file.relativePath}`);

      // Read and parse JSON file
      const content = await fs.readFile(file.fullPath, "utf-8");
      const data = JSON.parse(content);

      const id = uuid(file.relativePath);

      const formJSON = {
        id,
        category: file.category,
        ...data,
      };

      listAll.push(formJSON);
      listSummary.push({
        id,
        name: data.name,
        category: file.category,
        thumbnailUrl: data.thumbnailUrl,
        creator: data.creator,
      })

      // Write the JSON file to the dist directory
      await fs.writeFile(
        path.resolve(`./dist/form/${id}.json`),
        JSON.stringify(formJSON, null, 2),
      );
    }

    await fs.writeFile(
      path.resolve(`./dist/list_all.json`),
      JSON.stringify(listAll, null, 2),
    );

    await fs.writeFile(
      path.resolve(`./dist/list_summary.json`),
      JSON.stringify(listSummary, null, 2),
    );

    await fs.writeFile(
      path.resolve(`./dist/index.html`),
      `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HeyForm Templates</title>
        </head>
        <body>
          <ul>
            ${listSummary.map((item) => `<li><a href="/form/${item.id}.json">${item.name}</a></li>`).join("\n")}
          </ul>
        </body>
      </html>
      `,
    );
  } catch (error) {
    console.error("Error processing JSON files:", error);
  }
}

// Execute the function
processJsonFiles();
