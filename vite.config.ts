// Keep Lovable's React, TanStack, Tailwind and deployment setup as one configuration.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, PluginOption } from "vite";

const configure = defineConfig({
  tanstackStart: { server: { entry: "server" } },
});

async function protectThreeObjects(option: PluginOption): Promise<PluginOption> {
  const plugin = await option;
  if (Array.isArray(plugin)) return Promise.all(plugin.map(protectThreeObjects));
  if (
    plugin &&
    plugin.name === "@tanstack/devtools:inject-source" &&
    "transform" in plugin &&
    typeof plugin.transform === "object"
  ) {
    // data-tsd-source is a DOM attribute. R3F interprets its dashes as nested object
    // properties and crashes when a measured mesh updates. Keep source tags on DOM UI.
    plugin.transform = {
      ...plugin.transform,
      filter: {
        id: {
          exclude: [
            /node_modules/,
            /\?raw/,
            /\/dist\//,
            /\/build\//,
            /\/components\/viewer\/(Viewer|CadScene|ReferenceViewer)\.tsx(?:\?|$)/,
          ],
        },
      },
    };
  }
  return plugin;
}

export default async (environment: ConfigEnv) => {
  const config = await configure(environment);
  config.plugins = await Promise.all((config.plugins ?? []).map(protectThreeObjects));
  return config;
};
