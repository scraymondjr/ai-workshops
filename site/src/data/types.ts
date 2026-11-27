export type LinkRef = { title: string; site: string; href: string };
export type LangCode = { ts: string; py: string; go: string };

export type WorkshopModule = {
  id: string;
  workshop: "context-engineering" | "data-engineering";
  title: string;
  phase: string;
  hours: string;
  builds: string;
  pathLabel?: string;
  scenario: string;
  problem: string[];
  provided: string[];
  build: string[];
  tools: string[];
  code?: LangCode;
  libs?: LangCode;
  snippets?: { label: string; code: string }[];
  criteria: string[];
  evals: string[][];
  tracks?: { vercel: string[]; adk: string[]; claude: string[] };
  stretch: string[];
  sotaNote?: string;
  links: LinkRef[];
  diagram?: string;
  checkpoint: string;
};
