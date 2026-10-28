import { readdirSync, statSync, unlinkSync, rmSync } from "fs";
import { resolve } from "path";

try {
    [
        "./plugins/commands/cache/",
        resolve(process.cwd(), process.env.DATA_DIR || "core/var/data", "cache"),
    ]
        .forEach(path => {
            const files = readdirSync(path);
            files.forEach(file => {
                const filePath = `${path}${file}`;
                if (statSync(filePath).isFile() && file != "README.txt") {
                    unlinkSync(filePath);
                }
            });
        });
} catch (e) {
    console.error(e);
}
