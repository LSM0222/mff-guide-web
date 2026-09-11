export type GuideStatus = "published" | "coming" | string;

export type Guide = {
  slug: string;
  title: string;
  category: string;
  status: GuideStatus;
  description: string;
  html: string;
  aliases?: string[];
  searchText?: string;
  text: string;
  bodySearchTargets?: GuideBodySearchTarget[];
};

export type GuideBodySearchTarget = {
  text: string;
  anchor?: string;
};

export type GlossaryEntry = {
  id: string;
  term: string;
  category: string;
  html: string;
  aliases?: string[];
  searchText?: string;
  text: string;
};

export type HomeCard = {
  title: string;
  desc: string;
  icon: string;
  route: string;
  coming?: boolean;
};

export type HomeSection = {
  title: string;
  category: string;
  cards: HomeCard[];
};

export type UpdateItem = {
  date: string;
  tag: string;
  title: string;
  route: string;
};

export type UsefulLink = {
  label: string;
  url: string;
};

export type CategoryMeta = Record<
  string,
  {
    label: string;
    desc: string;
  }
>;
