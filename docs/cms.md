# Sanity CMS 운영 안내

이 사이트의 공략 콘텐츠는 Sanity CMS에서 수정합니다. 기존 `content/*.ts` 파일은 삭제하지 않고 백업과 비교 기준으로 보관합니다.

## Studio 접속

1. 사이트 주소 뒤에 `/studio`를 붙여 접속합니다.
2. Sanity 계정으로 로그인합니다.
3. 왼쪽 메뉴에서 `Guides`, `Glossary`, `Site settings`를 선택합니다.

## Guide 수정

`Guides`에서 공략을 선택하면 제목, 설명, 분류, 상태, 검색 키워드, 섹션별 본문을 수정할 수 있습니다.

본문은 한 개의 HTML textarea가 아니라 문단, 제목, 이미지, 영상, 콜아웃, 표, 펼침 블록, 반복 아이템 블록으로 나뉘어 있습니다. 필요한 블록을 직접 고치고 `Publish`를 누르면 방문자 사이트에 반영됩니다.

새 공략을 만들 때는 `slug`를 꼭 입력합니다. 예를 들어 `/guides/example` 주소로 보이게 하려면 slug는 `example`입니다.

## 이미지와 영상

기존 공략의 이미지와 영상은 대부분 `/media/...` 경로를 그대로 사용합니다. 이 파일들은 `public/media`에 있고, Sanity asset으로 다시 업로드하지 않았습니다.

새로 추가하는 이미지는 Studio의 Sanity image 업로드를 사용해도 됩니다. 기존 `/media/...`, 외부 이미지 URL, 새 Sanity 업로드 이미지 모두 방문자 사이트에서 같은 이미지 스타일과 lightbox로 표시됩니다. 영상은 기존 `/media/...` 또는 새 파일 업로드를 사용할 수 있습니다.

## Glossary 수정

`Glossary`에서 용어를 선택해 용어명, 분류, 별칭, 정의를 수정합니다. 기존 용어 URL에 쓰이던 anchor 값은 `Legacy anchor id`로 보존되어 있습니다.

## Site Settings 수정

`Site settings`에서는 홈 화면의 운영 콘텐츠를 수정합니다.

- `Home updates`: 오른쪽 공략 업데이트 목록
- `Popular guides`: 인기 공략 TOP 5
- `Useful links`: 홈 상단 유용한 링크

홈 화면의 레이아웃과 디자인 자체는 CMS가 아니라 코드에서 관리합니다.

## Publish와 반영 시간

Studio에서 내용을 고치면 초안 상태가 됩니다. 방문자 사이트에 보이게 하려면 `Publish`를 눌러야 합니다.

개발 환경에서는 새로고침하면 바로 최신 데이터를 읽습니다. 배포 환경에서는 최대 약 60초 안에 새로 발행한 내용이 반영되도록 설정했습니다.

실수로 수정했다면 Publish 전에는 초안을 버리면 됩니다. 이미 Publish한 경우에는 다시 수정한 뒤 Publish해서 바로잡습니다.
