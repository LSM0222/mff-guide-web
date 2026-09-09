import type { CategoryMeta, HomeSection, UsefulLink, UpdateItem } from "@/content/types";

export const categoryMeta: CategoryMeta = {
  "beginner": {
    "label": "뉴비 시작하기",
    "desc": "게임 설치 직후부터 초반 진행에 필요한 공략"
  },
  "growth": {
    "label": "성장 · 세팅",
    "desc": "계정과 영웅 스펙을 올리는 세팅 공략"
  },
  "content": {
    "label": "콘텐츠 공략",
    "desc": "PVE·PVP 콘텐츠 진행과 보스 공략"
  },
  "tips": {
    "label": "정보 · 팁",
    "desc": "재료, 버프, 인벤토리, 이벤트 등 유용한 정보"
  }
};

export const homeSections: HomeSection[] = [
  {
    "title": "처음 시작한다면",
    "category": "beginner",
    "cards": [
      {
        "title": "계정 관련",
        "desc": "계정 연동과 기본 세팅을 먼저 확인하세요.",
        "icon": "◎",
        "route": "/guides/account"
      },
      {
        "title": "인게임 설정",
        "desc": "그래픽, 전투, 알림 등 필수 설정 가이드.",
        "icon": "⚙",
        "route": "/guides/account?section=%EC%9D%B8%EA%B2%8C%EC%9E%84-%EC%84%A4%EC%A0%95-%EA%B3%B5%EB%9E%B5-260409"
      },
      {
        "title": "콘텐츠 안내",
        "desc": "주요 콘텐츠와 초반 숙제 진행 순서 정리.",
        "icon": "▤",
        "route": "/guides/content-guide"
      },
      {
        "title": "영웅 선택권",
        "desc": "초반 선택권과 생체 데이터 사용 우선순위.",
        "icon": "◆",
        "route": "/guides/hero-selection"
      }
    ]
  },
  {
    "title": "성장 · 세팅",
    "category": "growth",
    "cards": [
      {
        "title": "퓨린이 스펙업",
        "desc": "계정 성장 순서와 핵심 스펙업 로드맵.",
        "icon": "↗",
        "route": "/guides/specup"
      },
      {
        "title": "코믹스 카드",
        "desc": "카드 세팅과 프리미엄 카드 세공 공략.",
        "icon": "▱",
        "route": "/guides/comic-card"
      },
      {
        "title": "특수 장비 / C.T.P.",
        "desc": "딜러와 서포터에 맞는 장비 세팅.",
        "icon": "◉",
        "route": "/guides/ctp"
      },
      {
        "title": "아티팩트",
        "desc": "아티팩트 옵션과 PVE·PVP 활용법.",
        "icon": "◇",
        "route": "/guides/artifact"
      }
    ]
  },
  {
    "title": "콘텐츠 공략",
    "category": "content",
    "cards": [
      {
        "title": "레전드 월드 보스",
        "desc": "보스 패턴과 초반 추천 조합 정리.",
        "icon": "☠",
        "route": "/guides/legend-world-boss"
      },
      {
        "title": "섀도우랜드",
        "desc": "35층까지 효율적인 클리어 공략.",
        "icon": "△",
        "route": "/guides/shadowland"
      },
      {
        "title": "아더월드 배틀",
        "desc": "아더월드 시스템과 운영 팁.",
        "icon": "◈",
        "route": "/guides/otherworld",
        "coming": true
      },
      {
        "title": "얼라이언스 배틀",
        "desc": "극레얼 주자·버퍼 및 관련 자료 정리.",
        "icon": "⬡",
        "route": "/guides/alliance-battle"
      }
    ]
  },
  {
    "title": "정보 · 팁",
    "category": "tips",
    "cards": [
      {
        "title": "인벤토리 정리",
        "desc": "아이템 분류와 효율적인 인벤 정리 방법.",
        "icon": "□",
        "route": "/guides/inventory"
      },
      {
        "title": "피해량 증감 버프",
        "desc": "피해량 증가·감소 관련 버프 정리.",
        "icon": "↑",
        "route": "/guides/damage-buff"
      },
      {
        "title": "상태이상제거 버프",
        "desc": "PVP 상태이상 제거와 면역 효과 정리.",
        "icon": "⛨",
        "route": "/guides/status-cleanse"
      },
      {
        "title": "자잘한 팁",
        "desc": "알아두면 편한 전투와 계정 팁 모음.",
        "icon": "✦",
        "route": "/guides/tips"
      }
    ]
  }
];

export const updates: UpdateItem[] = [
  {
    "date": "2026.08.28",
    "tag": "UPDATE",
    "title": "극레얼 주자/버퍼 정리",
    "route": "/guides/alliance-battle"
  },
  {
    "date": "2026.07.31",
    "tag": "UPDATE",
    "title": "신규 유저 4티어 추천리스트",
    "route": "/guides/legend-world-boss"
  },
  {
    "date": "2026.05.13",
    "tag": "NEW",
    "title": "루나 스노우 조합 추천 추가",
    "route": "/guides/legend-world-boss"
  },
  {
    "date": "2026.04.09",
    "tag": "UPDATE",
    "title": "인게임 설정 공략 수정",
    "route": "/guides/account?section=%EC%9D%B8%EA%B2%8C%EC%9E%84-%EC%84%A4%EC%A0%95-%EA%B3%B5%EB%9E%B5-260409"
  },
  {
    "date": "2026.04.01",
    "tag": "UPDATE",
    "title": "신규/복귀 선택권 추천 정리",
    "route": "/guides/hero-selection"
  }
];

export const popular: string[] = [
  "comic-card",
  "ctp",
  "legend-world-boss",
  "specup",
  "promotion-materials"
];

export const links: UsefulLink[] = [
  {
    "label": "공식 카페",
    "url": "https://cafe.naver.com/futurefight"
  },
  {
    "label": "얼배웹",
    "url": "https://mff-guide.vercel.app/"
  },
  {
    "label": "얼배공략",
    "url": "https://m.blog.naver.com/upamsy/224331751771"
  },
  {
    "label": "웹상점보급소",
    "url": "https://mffshop.netmarble.com/ko"
  }
];
