# StudyHub v2 — 노션풍 분위기 · 테마 색 · 학점 격자 · 논문/연구 설계

작성 2026-10-30. 이전 스펙 `2026-10-29-redesign-gradtracker-design.md`(페이퍼 디자인)의 위에 얹는 변경. 바뀌지 않는 것은 그 스펙이 그대로 유효하다.

## 1. 의도

페이퍼 디자인은 유지하되, 노션 "My Student Hub" 템플릿의 느낌(세리프 제목, 얇은 커버, 차분한 단색 포인트)을 더한다. 사용자가 포인트 색을 고르면 앱의 모든 색(카테고리·시간표·태그·그래프·커버)이 그 색의 농도 6단계로 바뀐다. 학점 페이지는 graduation-track처럼 학기 × 이수구분 격자로 과목을 한눈에 보게 하고, 논문·연구 탭을 실제 기능으로 채운다. 레벨/XP는 없앤다.

## 2. 목표 / 비목표

**목표**
- 테마 색 프리셋 6개(초록·파랑·보라·갈색·로즈·회색), 전부 채도 낮은 톤. 라이트·다크 둘 다.
- 홈 상단 커버(내장 패턴 5종, 끄기 가능), 페이지 제목만 세리프.
- 학점: 학기 × 이수구분 격자. 이수구분 줄은 사용자가 추가·이름·순서·필요 학점 편집. 학기 접기 목록은 없앰.
- 시간표 종류를 사용자가 관리(추가·수정·삭제·색).
- 논문 데이터베이스(/papers)와 연구 보드(/research).
- 레벨·XP 제거(완료 콘페티는 유지).
- 배포 주소: 사용자가 Vercel 대시보드에서 추가하는 빈 이름(기본 제안 `studying-hub.vercel.app`; `studyhub`·`studyinghub`는 이미 다른 사람이 사용 중).

**비목표**
- 사진 업로드 커버(Storage 안 씀), 자유 색상 피커, 실험 로그·주간 리뷰·미팅 노트(다음 라운드), 앱스토어 출시(별도 논의), 포탈 시간표 파서.

**안티골** — 쨍한 색, 둥근 모서리, 그림자, 캐릭터. 이전 스펙과 같다.

## 3. 디자인 시스템 변경

### 3.1 글꼴
- 제목용 세리프: **Noto Serif KR** 700 (Google Fonts, `display=swap`). 쓰는 곳: `PageHeader`의 h1, 홈 날짜 제목, 사이드바 로고, 로그인 제목. 그 외 전부 Pretendard 그대로.
- 오프라인: 서비스 워커 runtimeCaching에 `fonts.googleapis.com` / `fonts.gstatic.com` 을 CacheFirst로 추가.

### 3.2 테마 색 (`profile.themeHue`)
값: `'green' | 'blue' | 'purple' | 'brown' | 'rose' | 'gray'`, 기본 `'green'`.
각 프리셋은 **농도 6단계** `s1`(가장 연함) … `s6`(가장 진함)을 라이트/다크 각각 가진다. CSS 변수 `--color-s1` … `--color-s6`, 그리고 각 농도 위에 올릴 글자색 `--color-s1-on` … `--color-s6-on`. 라이트: s1–s3 위는 `s6`, s4–s6 위는 `#ffffff`. 다크: s1–s3 위는 `s6`(밝은 색), s4–s6 위는 `#111111`. 농도 위에 글자·체크 표시를 올릴 때는 **항상** `--color-sN-on`을 쓴다(시간표 블록 글자, 완료 체크박스의 체크, 오늘 칸 숫자 포함 — 이전 스펙 §5.3의 "블록은 검정 글자"는 이 규칙으로 대체).

**면과 선의 농도 분리**: `shade`는 면(칩·블록 배경, 완료 체크박스 채움, 커버)에 그대로 쓴다. 글자·테두리·막대처럼 흰 바탕 위에 가늘게 올라가는 곳은 `textShade = max(shade, 4)`를 쓴다(농도 1–3은 흰 바탕에서 안 보이므로). 예: 카테고리 이름 글자, 미완료 체크박스 테두리, 오늘 일정의 3px 막대, 시간표 블록 왼쪽 선.

라이트 값:
| | s1 | s2 | s3 | s4 | s5 | s6 | 커버 바탕 |
|---|---|---|---|---|---|---|---|
| green | #E3ECE2 | #C5D8C4 | #A3C0A4 | #789B7C | #55795B | #3A5A41 | #EEF3EC |
| blue | #E3E9F0 | #C4D2E1 | #9FB5CB | #7591AE | #526F8E | #375069 | #EEF1F5 |
| purple | #E9E5F0 | #D1C9E1 | #B3A7CC | #8E7FB0 | #6C5E8E | #4E4269 | #F2F0F6 |
| brown | #EFE8E0 | #DCCDBC | #C2AC94 | #A2866B | #7E6650 | #5B4837 | #F6F2EC |
| rose | #F1E4E6 | #E1C8CD | #CBA6AE | #AF7F8B | #8D5F6B | #67434D | #F6EEF0 |
| gray | #EAEAEA | #D3D3D3 | #B4B4B4 | #8E8E8E | #6A6A6A | #474747 | #F2F2F2 |

다크 값: 같은 색상환에서 s1↔s6 방향을 뒤집지 않고, 바탕이 어두우므로 s1–s3를 어둡게(채도 유지, 명도 25–45%), s4–s6를 밝게(명도 60–80%) 잡는다. 예(green): s1 #223527, s2 #2E4733, s3 #3F5E45, s4 #7FA486, s5 #A3C3A8, s6 #C9DECB, 커버 #182219. 나머지 프리셋은 같은 규칙으로 구현 시 정한다(빌더 재량, 체크박스 위 흰 체크 4.5:1 이상).

적용 규칙
- 검정 primary 버튼, 검정 글자, 회색 선은 **그대로**. 테마 색이 들어가는 곳: 사이드바/탭바 활성(배경 s1, 글자 s6), 진행 막대 fill(s5), 그래프 누적선(s4) · 학기선(ink 유지), 링크 hover, 커버, 카테고리·시간표 종류·태그 농도, 주간 띠 오늘 칸(s6 바탕 + 흰 글자).
- 기존 파스텔 6색(`sky…peach`) 토큰과 `PaletteColor`는 삭제. 카테고리·종류는 `shade: 1|2|3|4|5|6` 로 색을 가진다. **마이그레이션**: 읽을 때 `color` 문자열이 있으면 `sky→2, mint→3, pink→4, butter→1, lilac→5, peach→6`으로 변환(쓰기 시 `shade`로 저장).
- 주간 띠 오늘 칸: 바탕 `s6`, 글자 `--color-s6-on`.
- `Tag` 톤(ok/warn/bad)은 의미색이라 테마와 무관하게 유지. 대학원 상태 색(`STATUS_COLOR`)은 농도로: interested null, preparing 2, submitted 4, accepted 6, rejected null.

### 3.3 커버 (`profile.cover`)
값: `'leaf' | 'wave' | 'grid' | 'solid' | 'none'`, 기본 `'leaf'`. 홈 맨 위, 높이 데스크톱 96px / 모바일 72px, `main`의 좌우 패딩을 음수 마진(`-mx-4 md:-mx-8`)으로 상쇄해 1100px 컨테이너 안에서 꽉 참(뷰포트 끝까지는 아님). 바탕은 테마 커버색, 패턴은 인라인 SVG(s2/s3 선·면). 커버가 있으면 홈 헤더가 커버에 살짝 겹쳐 올라온다(-6px). 다른 페이지엔 커버 없음.

### 3.4 레벨/XP 제거
- 홈 오른쪽 위 pill, `home.levelUp` 토스트, `lib/xp.ts`, `addXp`, `profile.xp` 사용처 전부 삭제. Firestore의 `xp` 필드는 남아 있어도 무시. 콘페티(오늘 할 일 100%)는 유지.

## 4. 학점 페이지 — 이수 격자

### 4.1 화면
- 위: `PageHeader`(세리프), KPI 4칸, 추이 그래프 — 그대로. **졸업 요건 게이지(`GradGauges`)와 학기 접기 목록(`TermAccordion`) 삭제**, 시뮬레이터는 격자 아래로.
- 격자(`CreditGrid`): 가로 스크롤 컨테이너 안의 CSS grid. 첫 열 168px(이수구분), 학기 열 146px(계절학기 110px). 머리 행: 학기 라벨. 왼쪽 셀: 이름, `취득 / 필요 학점`, 4px 막대(s5, 충족 시 100%), 본전공 표시 태그. 본문 셀: 과목 칩(이름 + 등급, 등급은 s6 굵게) 세로 쌓기 + 점선 `+` 칩. 맨 아래 행: 학기 평점(18px 800) + 학점, 평점 없으면 `N/A` 연회색. 맨 아래 왼쪽: `+ 이수구분 추가`.
- 칩 클릭 → 기존 `CourseForm`(이수구분 선택지는 격자의 줄 이름). `+` 칩 클릭 → 그 학기·그 줄로 과목 추가. 왼쪽 셀 클릭 → 줄 편집 팝오버(이름, 필요 학점, 본전공 체크, ↑↓, 삭제). 삭제 시 그 줄 과목은 "기타" 줄로.
- 학기 라벨: `학년 = 연도 − 첫 학기 연도 + 1`, `n학년 1학기/2학기`, 계절은 `2024 여름/겨울`(영어: `Y1 Spring / Y1 Fall / 2024 Summer`). 휴학 공백이 있으면 학년이 건너뛰는 건 감수. 설정의 "현재 학기"는 관여하지 않음. 기존 `termLabel`은 그대로 두고 격자용 라벨 함수를 따로 둔다.
- **미배정 열**: 학기가 없는 과목(`termCode === null`, 포탈 붙여넣기에서 학점 합이 안 맞을 때 생김)은 격자 맨 오른쪽 "미배정" 열에 보인다. 칩 클릭 → `CourseForm`에서 학기 지정. 기존 "학기 미배정" 카드는 삭제.
- 재수강 대체 과목(`supersededBy != null`)은 칩을 `ink-faint` + 취소선으로 보이되 취득 학점·학기 평점 계산에서 제외(`active` 기준).
- `CourseForm`의 이수구분 Select 선택지 = 격자 줄 이름들 + 현재 과목의 기존 값(목록에 없으면 추가) + "기타(없음)"(`''`). 기타 줄의 `+`로 추가하면 `category: ''`.
- 모바일: 같은 격자를 가로 스크롤(첫 열 `position: sticky; left: 0`).

### 4.2 데이터
- `users/{uid}/creditCats` 컬렉션: `{ id, name, aliases: string[], required: number, isMajor: boolean, order: number }`.
- 과목의 줄 = `course.category` 문자열과 `creditCat.name` 일치. 일치하는 줄이 없으면 "기타"(가상 줄, 항상 마지막, 필요 학점 없음).
- **첫 시드**: `profile.creditCatsSeeded !== true` 이고 컬렉션이 비었을 때, 현재 과목들의 distinct `category`(포탈 순서대로 등장 순)를 줄로 만들고 `required 0`, `isMajor = 이름에 '전공' 포함`. 과목이 하나도 없으면 `전공필수(0, major)·전공선택(0, major)·교양(0)·학문의기초(0)` 기본 4줄(포탈 표기와 똑같이 띄어쓰기 없음 — `KNOWN_CATEGORIES`와 일치해야 매칭됨). 시드는 과목 로딩이 끝난 뒤 `useGrades` 안에서 한 번(`courses.loading === false && !profile.creditCatsSeeded && creditCats.length === 0`). "등장 순" = `(학기 order, course.order)` 정렬 후 distinct. 시드 후 플래그 true.
- 줄에 `aliases: string[]`(옛 이름 누적)을 둔다. 매칭은 `name` 또는 `aliases` 일치. 줄 이름을 바꾸면 옛 이름을 `aliases`에 넣고 그 줄 과목들의 `category`도 새 이름으로 바꾼다(batch). 이렇게 해야 포탈을 다시 붙여넣어 과목이 포탈 원문 이수구분으로 되돌아가도 같은 줄에 들어간다. 줄 삭제 → 과목 `category`는 그대로 두되 매칭 안 되면 기타로 보임(데이터 손실 없음).
- 설정의 졸업 요건: `gradReq.total`만 남긴다(KPI 취득 학점 분모). `major/liberal` 입력칸 삭제(값은 무시). 전공 평점 KPI는 `isMajor` 줄의 과목으로 계산(기존 `gpa.ts`의 전공 판별을 이 규칙으로 교체). `Profile.gradReq` 타입은 `{total, major, liberal}` 그대로 두고 입력칸만 숨긴다.

## 5. 시간표 종류

- `users/{uid}/kinds` 컬렉션: `{ id, name, shade, order }`. 시드(`profile.kindsSeeded`): `seed-class 수업 2`, `seed-research 연구 4`, `seed-work 일 1`, `seed-other 기타 5`.
- `ScheduleItem.kind`는 kind id 문자열. `normalizeScheduleItem`(순수 함수)은 레거시 값 `class|research|work|other` → `seed-*` 변환만 하고, 목록에 없는 id는 렌더 시 `seed-other`로 폴백한다. 종류 삭제 batch는 `seed-class` 등 시드 id를 지울 때 레거시 값(`'class'`)도 함께 조회해 바꾼다. 시드 이름(수업·연구·일·기타)은 한국어로 저장(카테고리 시드와 같은 한계).
- 시드는 `ProfileProvider`의 카테고리 시드와 같은 패턴(`profile.kindsSeeded`, 고정 id, `setDoc`).
- 시간표 페이지 헤더 ⋯ → "종류 관리" 모달(카테고리 관리와 같은 UI: 이름, 농도 6칸, ↑↓, 삭제). 삭제 시 그 종류의 일정은 `seed-other`로(batch). `seed-other`는 삭제 불가.
- 홈 "오늘 일정" 막대 색도 종류 농도.

## 6. 논문 데이터베이스 (`/papers`)

- 컬렉션 `users/{uid}/papers`: `{ id, title, authors: string[], year: number|null, venue: string, doi: string, url: string, arxivId: string, tags: string[], status: 'toread'|'reading'|'read', summary: string(한 줄), quotes: string[](핵심 인용), notes: string, addedAt, readAt: string|null }`.
- 추가: 모달에서 **DOI 또는 arXiv 주소/ID 붙여넣기 → "정보 가져오기"** 버튼. Crossref `https://api.crossref.org/works/{doi}` (CORS 됨), arXiv `https://export.arxiv.org/api/query?id_list={id}` (Atom XML, 브라우저 `DOMParser`). 실패하면 빈 폼에 직접 입력. 둘 다 서버 없이 클라이언트에서 호출.
- 목록: 데스크톱 표(제목/저자·연도 / 학회지 / 태그 / 상태 / 추가일), 모바일 카드. 위에 상태 pill(전체·읽을 것·읽는 중·읽음)과 태그 pill(사용 중인 태그), 검색 input(제목·저자·태그 부분 일치). 행 클릭 → 상세(요약, 핵심 인용 목록, 메모, 링크 열기, 수정·삭제). 상태 바꾸면 `read`일 때 `readAt` 기록.
- 홈에는 넣지 않는다(다음 라운드에 "이번 주 읽은 논문 n편" 고려).
- 상세는 라우트 없이 `Modal`(대학원 `SchoolDetail`과 같은 패턴).
- 1단계 스펙 §6.5(주제 폴더·별점·마크다운 노트+이미지·BibTeX 복사)와 §6.6(칸반·미팅 노트)은 **이 절과 §7로 대체**된다. 별점·BibTeX·칸반·이미지는 만들지 않는다.

## 7. 연구 보드 (`/research`)

- 컬렉션 `users/{uid}/projects`: `{ id, name, goal: string(이번 주 목표 한 줄), status: 'active'|'paused'|'done', note: string, order, createdAt }`.
- 할 일 연결: 기존 `Todo.source = { type: 'project', refId: projectId, label: name }` 사용. 프로젝트 카드 안의 "다음 할 일" = `source.refId === id && !done` 인 할 일(날짜 무관) + 인라인 추가 행(날짜는 오늘, 카테고리는 '연구' 이름의 카테고리가 있으면 그것, 없으면 null).
- 화면: 프로젝트 카드 세로 목록(`Card bordered`): 이름(세리프 아님, 굵게) · 상태 태그 · 이번 주 목표(클릭하면 인라인 편집) · 다음 할 일 체크 목록 · ⋯(수정·일시중지·완료·삭제). 완료/일시중지는 아래 접힌 섹션. 상단 "+ 프로젝트".
- 홈 할 일 행에 `source.label`을 작은 회색 글씨로 표시(이미 있던 `source` 표시를 되살림).
- 수명: 프로젝트 삭제 → 연결된 할 일은 남기고 `source: null`(batch). 이름 변경 → `source.label` batch 갱신. 일시중지/완료 프로젝트의 미완료 할 일도 홈에 그대로 보임. 보드에서 추가한 할 일은 날짜가 오늘이라 다음 날 "지난 할 일" 배너에 포함(기존 규칙).

## 8. 설정 변경
- 추가: 테마 색(6칸 프리셋, 각 칸에 농도 띠), 홈 커버(5칸 미리보기). 둘 다 언어·테마처럼 **즉시 저장**(저장 버튼 없이 바로 반영).
- 삭제: 졸업 요건 전공/교양 칸.
- 그대로: 앱 이름, 언어, 테마(시스템/라이트/다크), 현재 학기, TOEFL, 포탈 누적 평점, 4.0 환산표, 백업, 계정.
- 백업 `COLLECTIONS`에 `creditCats, kinds, papers, projects` 추가. `EXPORT_VERSION` 1 유지. **가져오기 규칙 변경**: 파일에 키가 없는 컬렉션은 건드리지 않는다(삭제도 덮어쓰기도 안 함). 옛 파일을 가져와도 시드된 `kinds`/`creditCats`/`categories`가 사라지지 않게 하기 위함. `validateImport`는 키 없음을 `undefined`로 구분해 돌려준다(빈 배열 = 파일에 있는데 비어 있음).

## 9. 내비
- 사이드바·탭바 구성은 그대로. `/papers`, `/research`가 Placeholder에서 실제 페이지로.

## 10. 배포 주소
- `studying-hub.vercel.app`(또는 사용자가 고른 다른 빈 이름)을 프로젝트 도메인으로 추가(기존 `studyhub-brown-nu` 주소도 당분간 살려둠). `studyinghub.vercel.app`은 이미 사용 중이라 불가. Firebase 승인 도메인에 새 주소 추가(사용자/CLI). README 주소 갱신.

## 11. 내가 정한 것(사용자 확인용)
- 기본 테마 초록, 기본 커버 잎.
- 세리프는 Noto Serif KR 하나, 제목에만.
- 카테고리 색은 농도 번호로 저장(옛 색 이름은 읽을 때 변환).
- 격자 줄은 `course.category` 문자열로 매칭, 줄 이름 변경 시 과목도 같이 변경.
- 전공 평점 = 본전공 체크된 줄의 과목.
- 논문 메타데이터는 Crossref/arXiv 클라이언트 호출, 실패 시 수동 입력.
- 연구 보드의 할 일은 기존 `todo.source`로 연결, 새 필드 없음.
- 레벨/XP 코드는 삭제, Firestore의 `xp` 값은 그냥 둠.
- 앱스토어 출시는 범위 밖(PWA 설치는 지금도 됨).
- 빌더 검토 뒤 추가로 정한 것: 농도 1–3은 글자·선에서 4 이상으로 올려 씀 / 미배정 과목은 격자 맨 오른쪽 열 / 줄 이름 변경은 옛 이름을 별칭으로 남겨 포탈 재붙여넣기와 충돌 없게 / 1단계의 논문 별점·BibTeX·칸반은 폐기 / 옛 백업 가져오기는 파일에 없는 컬렉션을 건드리지 않음 / 테마 색·커버는 즉시 저장.

## 12. 빌더에게 맡기는 것
- 다크 모드 농도 값 5개 프리셋(green 예시 규칙 따라), 커버 SVG 모양, 격자 셀 세부 간격, 논문 표 열 너비, arXiv XML 파싱 세부.
