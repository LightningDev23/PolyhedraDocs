import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  // Expander documentation sidebar
  expanderSidebar: [
    {
      type: "autogenerated",
      dirName: "expander",
    },
  ],
  // EXPchain documentation sidebar
  expchainSidebar: [
    {
      type: "autogenerated",
      dirName: "expchain",
    },
  ],
  litepaperSidebar: [
    {
      type: "doc",
      id: "litepaper/index",
      className: "hidden-sidebar-item",
    },
  ],
  roadmapSidebar: [
    {
        type: "doc",
        id: "roadmap/interactive-tech-tree",
        className: "hidden-sidebar-item",
    }
  ],
};

export default sidebars;
