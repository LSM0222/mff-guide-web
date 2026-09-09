import { accountGuide } from "./guides/account";
import { inventoryGuide } from "./guides/inventory";
import { legendWorldBossGuide } from "./guides/legend-world-boss";
import { earlySkillRotationGuide } from "./guides/early-skill-rotation";
import { heroSelectionGuide } from "./guides/hero-selection";
import { contentGuideGuide } from "./guides/content-guide";
import { shadowlandGuide } from "./guides/shadowland";
import { promotionMaterialsGuide } from "./guides/promotion-materials";
import { specupGuide } from "./guides/specup";
import { comicCardGuide } from "./guides/comic-card";
import { xOfSwordGuide } from "./guides/x-of-sword";
import { jarvisGuide } from "./guides/jarvis";
import { ctpGuide } from "./guides/ctp";
import { seasonUniformGuide } from "./guides/season-uniform";
import { artifactGuide } from "./guides/artifact";
import { tipsGuide } from "./guides/tips";
import { damageBuffGuide } from "./guides/damage-buff";
import { statusCleanseGuide } from "./guides/status-cleanse";
import { otherworldGuide } from "./guides/otherworld";
import { spendingGuide } from "./guides/spending";
import { allianceBattleGuide } from "./guides/alliance-battle";
import { eventsGuide } from "./guides/events";

import { glossary } from "./glossary";
import { categoryMeta, homeSections, links, popular, updates } from "./site";

export const guides = [
  accountGuide,
  inventoryGuide,
  legendWorldBossGuide,
  earlySkillRotationGuide,
  heroSelectionGuide,
  contentGuideGuide,
  shadowlandGuide,
  promotionMaterialsGuide,
  specupGuide,
  comicCardGuide,
  xOfSwordGuide,
  jarvisGuide,
  ctpGuide,
  seasonUniformGuide,
  artifactGuide,
  tipsGuide,
  damageBuffGuide,
  statusCleanseGuide,
  otherworldGuide,
  spendingGuide,
  allianceBattleGuide,
  eventsGuide,
];

export const guideMap = new Map(guides.map((guide) => [guide.slug, guide]));

export { categoryMeta, glossary, homeSections, links, popular, updates };
