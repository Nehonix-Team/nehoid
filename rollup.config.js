import ts from "typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { readFileSync } from "fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

function typescriptPlugin() {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
    esModuleInterop: true,
    sourceMap: true,
  };

  return {
    name: "ts-plugin",
    transform(code, id) {
      if (!id.endsWith(".ts") && !id.endsWith(".tsx")) {
        return null;
      }
      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions,
      });
      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      };
    },
  };
}

export default [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      commonjs(),
      typescriptPlugin(),
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      "crypto",
      "node:crypto",
    ],
  },
  // CommonJS build - Fixed configuration
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
      exports: "named",
      esModule: true,
    },
    plugins: [
      resolve({ extensions: [".ts", ".js"] }),
      commonjs(),
      typescriptPlugin(),
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
      "crypto",
      "node:crypto",
    ],
  },
  // TypeScript declarations
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
    external: ["nehonix-uri-processor"],
  },
];
