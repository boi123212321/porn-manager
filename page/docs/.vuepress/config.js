module.exports = {
  title: "Porn Vault",
  description: "Manage your ever-growing porn collection",
  base: "/porn-vault/",
  dest: "../docs",
  theme: "default-prefers-color-scheme",
  themeConfig: {
    repo: "porn-vault/porn-vault",

    lastUpdated: "Last Updated",
    logo: "/logo.png",
    nav: [
      { text: "Getting started", link: "/guides/getting-started" },
      { text: "Patreon", link: "https://www.patreon.com/pornvault" },
      { text: "Discord", link: "https://discord.gg/t499hxK" },
    ],
    sidebar: [
      "",
      {
        title: "Main Guides",
        collapsable: false,
        children: ["/guides/getting-started", "/guides/docker", "/guides/systemd"],
      },
      {
        title: "Configuration",
        collapsable: false,
        children: [
          "/guides/config",
          "/guides/advanced-config/https",
          "/guides/advanced-config/apply-labels",
          "/guides/advanced-config/matcher",
          "/guides/advanced-config/env",
          "/guides/advanced-config/logging",
          "/guides/advanced-config/startup-options",
        ],
      },
      {
        title: "Plugins",
        collapsable: false,
        children: ["/guides/plugins/plugins-intro", "/guides/plugins/pipe-plugins"],
      },
      {
        title: "Development",
        collapsable: true,
        children: [
          "/guides/development/build-from-source",
          "/guides/development/plugin-development",
        ],
      },
      "faq",
    ],
  },
};
