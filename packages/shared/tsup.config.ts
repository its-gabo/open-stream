import { defineConfig, type Options } from "tsup"
import tsupBarrelPlugin from "./plugin.mjs"

export default defineConfig((options: Options) => ({
  entry: ["./src/index.ts"],
  format: ["cjs", "esm"],
  plugins: [tsupBarrelPlugin()],
  clean: true,
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  ...options,
}))
