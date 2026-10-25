import * as fs from "node:fs"
import * as path from "node:path"
import { globSync } from "glob"

const generateCentralBarrel = () => {
  const srcDir = path.resolve(process.cwd(), "src")
  const files = globSync("**/*.{ts,tsx}", {
    cwd: srcDir,
    ignore: ["**/index.ts", "**/*.d.ts"],
  })

  files.sort()

  return (
    files
      .map((file) => {
        const withoutExt = file.replace(/\.(ts|tsx)$/, "").replace(/\\/g, "/")
        return `export * from "./${withoutExt}"`
      })
      .join("\n") + "\n"
  )
}

/** Regenerates `src/index.ts` so every module under `src` is exported. */
const tsupBarrelPlugin = () => ({
  name: "tsup-barrel-plugin",
  buildStart: async () => {
    const indexFilePath = path.resolve(process.cwd(), "src", "index.ts")
    const newContent = generateCentralBarrel()
    const currentContent = fs.existsSync(indexFilePath)
      ? fs.readFileSync(indexFilePath, "utf8")
      : ""

    if (currentContent === newContent) return

    fs.writeFileSync(indexFilePath, newContent, "utf8")
    console.log(`Generated central barrel at ${indexFilePath}`)
  },
})

export default tsupBarrelPlugin
