import { access, rename } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const apiDir = path.join(rootDir, "app", "api");
const disabledApiDir = path.join(rootDir, "app", "__api_disabled_for_mobile__");

async function exists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function moveApiOutOfTheWay() {
  if (!(await exists(apiDir))) {
    return false;
  }

  if (await exists(disabledApiDir)) {
    throw new Error(`Temporary API directory already exists: ${disabledApiDir}`);
  }

  await rename(apiDir, disabledApiDir);
  return true;
}

async function restoreApiDirectory(moved) {
  if (!moved) {
    return;
  }

  if (await exists(disabledApiDir)) {
    await rename(disabledApiDir, apiDir);
  }
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["next", "build", "--webpack"], {
      cwd: rootDir,
      stdio: "inherit",
      env: {
        ...process.env,
        MOBILE_BUILD: "true",
      },
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Mobile build failed with exit code ${code ?? 1}`));
    });

    child.on("error", reject);
  });
}

let movedApiDirectory = false;

try {
  movedApiDirectory = await moveApiOutOfTheWay();
  await runNextBuild();
} finally {
  await restoreApiDirectory(movedApiDirectory);
}
