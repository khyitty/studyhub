# StudyHub v2 — 테마 색 · 커버 · 이수 격자 · 시간표 종류 · 논문 · 연구 보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 페이퍼 디자인 위에 노션풍 분위기(세리프 제목·커버·단색 농도 6단계 테마)를 얹고, 학점 페이지를 학기 × 이수구분 격자로, 시간표 종류를 사용자 컬렉션으로, `/papers`·`/research`를 실제 기능으로 바꾸며 레벨/XP를 없앤다.

**Architecture:** 색은 CSS 변수 `--color-s1…s6`(+`-on`, 커버)로만 들어가고, 프리셋은 `html[data-hue]`가 고른다(Task 1). 파스텔 색 이름을 `shade: 1–6`으로 바꾼 뒤(Task 2) XP를 지우고(Task 3) 노션 분위기와 설정을 올린다(Task 4–5). 시간표 종류(Task 6), 이수 격자(Task 7–9), 논문(Task 10), 연구 보드(Task 11)는 각각 순수 로직(`src/lib/*.ts`, 테스트) → 훅 → 화면 순서. 마지막에 백업·라우트·README를 정리한다(Task 12).

**Tech Stack:** 기존 그대로 — Vite 8, React 19, TS, Tailwind v4 (`@theme` 토큰), react-router 8, Firebase JS SDK 13, Recharts 3, vitest 5 + @testing-library/react (jsdom). 새 의존성 없음(Crossref/arXiv는 `fetch` + `DOMParser`).

**Spec:** `docs/superpowers/specs/2026-10-30-v2-theme-grid-research-design.md` (이하 "스펙"). 바뀌지 않는 부분은 `2026-10-29-redesign-gradtracker-design.md`가 유효.

## Global Constraints

- 모서리·그림자·글꼴 크기·터치 타깃 규칙은 1단계 플랜(`2026-10-29-redesign-gradtracker.md`) Global Constraints 그대로. 쨍한 색·둥근 모서리·그림자·캐릭터 금지.
- 테마 색은 **오직** `--color-s1…--color-s6`, `--color-s1-on…--color-s6-on`, `--color-cover-bg` 변수(Tailwind 클래스 `bg-s3`, `text-s6`, `border-s4`, `text-s3-on`, `bg-cover-bg`)로 쓴다. 컴포넌트에 hex 직접 쓰지 않는다(설정의 프리셋 미리보기 띠만 `HUE_RAMP` 값 inline style 허용).
- 프리셋 6개 `green | blue | purple | brown | rose | gray`, 기본 `green`. 라이트 값은 스펙 §3.2 표 그대로. `-on`: 라이트 s1–s3 위 `var(--color-s6)`, s4–s6 위 `#ffffff`; 다크 s1–s3 위 `var(--color-s6)`, s4–s6 위 `#111111`.
- **면/선 농도 분리**: 면(칩·블록 배경, 완료 체크박스 채움, 커버)은 `shade` 그대로, 글자·테두리·3px 막대는 `textShade(shade) = max(shade, 4)`.
- 검정 primary 버튼·검정 글자·회색 선은 그대로. `Tag` 톤(ok/warn/bad)은 의미색 유지.
- `shade`는 `1|2|3|4|5|6`. 옛 색 이름 변환: `butter→1, sky→2, mint→3, pink→4, lilac→5, peach→6`, 그 외/누락 → `2`.
- 세리프: `Noto Serif KR` 700, 클래스 `font-serif`. 쓰는 곳 네 군데만: `PageHeader` h1, 홈 날짜 제목, 사이드바 로고, 로그인 제목.
- 새 Firestore 컬렉션: `users/{uid}/kinds`, `creditCats`, `papers`, `projects`. 규칙은 기존 와일드카드(변경 없음). 시드 문서는 고정 id + `setDoc`.
- `profile`에 추가: `themeHue`, `cover`, `kindsSeeded`, `creditCatsSeeded`. `xp`는 타입에서 삭제(문서에 남아도 무시).
- `EXPORT_VERSION` 1 유지. 가져오기: 파일에 **키가 없는** 컬렉션은 건드리지 않는다(`validateImport`가 `undefined`로 돌려줌).
- 모든 사용자 노출 문자열은 `ko.json`/`en.json` 키. 지운 기능의 키(`home.level`, `home.xp`, `home.levelUp`, `timetable.class|research|work|other`, `settings.reqMajor|reqLiberal`, `grades.reqMajor|reqLiberal|gradReq|setReqHint|terms`)는 함께 삭제.
- 커밋은 태스크마다, 영어 conventional commits. 테스트 명령 `npm test`; 태스크 끝마다 전체 스위트 녹색, Task 12 끝에 `npm run build` 성공.

## Review Focus

1. **옛 카테고리 문서**(`color: 'sky'`, `shade` 없음)와 **쓰레기 값**(`color: 'red'`, `shade: 9`) — 각각 농도 2·2로 읽히고 앱이 죽지 않는다. → Task 2 `toShade`/`normalizeCategory` 테스트.
2. **옛 일정 문서**(`kind: 'class'`)와 **삭제된 종류 id** — 전자는 `seed-class`로, 후자는 렌더 시 `seed-other`로 보인다. → Task 6 `normalizeScheduleItem`/`kindOf` 테스트.
3. **이수구분 줄 이름 변경 후 포탈 재붙여넣기** — 과목 `category`가 옛 이름으로 돌아와도 별칭으로 같은 줄에 들어간다. → Task 7 `catFor` 별칭 테스트.
4. **학기 없는 과목·재수강 대체 과목** — 전자는 "미배정" 열에, 후자는 취소선으로 보이고 둘 다 학기 평점·취득 학점에 안 들어간다. → Task 7 `gridRows` + Task 9 `CreditGrid` 테스트.
5. **옛 백업 파일 가져오기**(`kinds`/`creditCats` 키 없음) — 시드된 종류·이수구분이 지워지지 않는다. → Task 12 `validateImport` 테스트.

---

### Task 1: 테마 기반 — 농도 변수·프리셋·세리프·프로필 필드

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`
- Modify: `src/index.css`, `index.html`, `vite.config.ts`, `src/data/profile.ts`, `src/data/profile.test.ts`, `src/data/ProfileProvider.tsx`, `src/lib/types.ts`

**Interfaces:**
- Produces: `Shade = 1|2|3|4|5|6` (types.ts); `HUES`, `Hue`, `COVERS`, `Cover`, `SHADES`, `SHADE_CLASS`, `textShade`, `toShade`, `HUE_RAMP` (theme.ts); `Profile.themeHue/cover/kindsSeeded/creditCatsSeeded`; CSS 클래스 `bg-sN text-sN border-sN text-sN-on bg-cover-bg font-serif`.

- [ ] **Step 1: 테스트 작성** `src/lib/theme.test.ts`

```ts
import { HUES, HUE_RAMP, SHADES, SHADE_CLASS, textShade, toShade } from './theme'

test('six hues, six shades, classes spelled out for Tailwind', () => {
  expect(HUES).toEqual(['green', 'blue', 'purple', 'brown', 'rose', 'gray'])
  expect(SHADES).toEqual([1, 2, 3, 4, 5, 6])
  expect(SHADE_CLASS[3]).toEqual({ fill: 'bg-s3', text: 'text-s3', border: 'border-s3', on: 'text-s3-on' })
})
test('textShade lifts light shades to 4', () => {
  expect([1, 2, 3, 4, 5, 6].map(textShade)).toEqual([4, 4, 4, 4, 5, 6])
})
test('toShade: numbers pass, legacy names map, junk falls back to 2', () => {
  expect(toShade(5)).toBe(5)
  expect(['butter', 'sky', 'mint', 'pink', 'lilac', 'peach'].map((c) => toShade(c))).toEqual([1, 2, 3, 4, 5, 6])
  expect(toShade('red')).toBe(2); expect(toShade(9)).toBe(2); expect(toShade(undefined)).toBe(2); expect(toShade(0, 5)).toBe(5)
})
test('every hue has 6 light + 6 dark shades and a cover color', () => {
  for (const h of HUES) {
    expect(HUE_RAMP[h].light).toHaveLength(6); expect(HUE_RAMP[h].dark).toHaveLength(6)
    expect(HUE_RAMP[h].cover).toMatch(/^#[0-9A-F]{6}$/i); expect(HUE_RAMP[h].coverDark).toMatch(/^#[0-9A-F]{6}$/i)
  }
  expect(HUE_RAMP.green.light).toEqual(['#E3ECE2', '#C5D8C4', '#A3C0A4', '#789B7C', '#55795B', '#3A5A41'])
})
```

- [ ] **Step 2: 실패 확인** — `npm test -- theme` → FAIL: cannot find module './theme'.

- [ ] **Step 3: `src/lib/types.ts`에 `export type Shade = 1 | 2 | 3 | 4 | 5 | 6` 추가; `src/lib/theme.ts` 구현**

시그니처: `HUES as const`, `type Hue`, `COVERS = ['leaf','wave','grid','solid','none'] as const`, `type Cover`, `SHADES: Shade[]`, `SHADE_CLASS: Record<Shade, {fill; text; border; on}>`, `textShade(s: Shade): Shade`, `LEGACY_COLOR_SHADE: Record<string, Shade>`, `toShade(raw: unknown, fallback: Shade = 2): Shade`, `HUE_RAMP: Record<Hue, { light: string[]; dark: string[]; cover: string; coverDark: string }>`.

라이트 값 = 스펙 §3.2 표. 다크 값(이 플랜이 정함, 스펙 §12 빌더 재량):
| | s1 | s2 | s3 | s4 | s5 | s6 | coverDark |
|---|---|---|---|---|---|---|---|
| green | #223527 | #2E4733 | #3F5E45 | #7FA486 | #A3C3A8 | #C9DECB | #182219 |
| blue | #1F2A36 | #2A3A4B | #3B5168 | #7E9AB8 | #A4BBD2 | #C8D6E4 | #161D25 |
| purple | #2A2537 | #3A334C | #4F4668 | #9387B8 | #B3A9CF | #D0C9E2 | #1D1926 |
| brown | #332A22 | #46392D | #5E4D3D | #B09377 | #CBB49C | #E0D2C2 | #221C16 |
| rose | #352529 | #493239 | #62434C | #B88A96 | #D0ACB5 | #E3CCD2 | #241A1D |
| gray | #2A2A2A | #383838 | #4A4A4A | #9A9A9A | #B8B8B8 | #D4D4D4 | #1C1C1C |

- [ ] **Step 4: `src/index.css`**
  - `@theme`에 추가: `--font-serif: "Noto Serif KR", "Pretendard Variable", serif;` `--color-s1…--color-s6`(green 라이트 값), `--color-s1-on…--color-s3-on: var(--color-s6)`, `--color-s4-on…--color-s6-on: #ffffff`, `--color-cover-bg: #EEF3EC`. 파스텔 토큰은 **아직 남긴다**(Task 2에서 삭제).
  - `@layer base`에 추가: `:root[data-hue="blue"] {…}` 등 5개(라이트), `.dark { --color-s1…s6, --color-cover-bg: green 다크 }`, `.dark { --color-s4-on, s5-on, s6-on: #111111 }`, `.dark[data-hue="blue"] {…}` 등 5개(다크). 값은 `HUE_RAMP`와 글자 하나까지 같아야 한다.
- [ ] **Step 5: `index.html`** — `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&display=swap" rel="stylesheet">` 를 Pretendard link 아래에 추가.
- [ ] **Step 6: `vite.config.ts` runtimeCaching** — `fonts.googleapis.com` → `StaleWhileRevalidate` cacheName `google-fonts-css`; `fonts.gstatic.com` → `CacheFirst` cacheName `google-fonts-files`, maxEntries 20, 1년.
- [ ] **Step 7: 프로필 테스트 추가** `src/data/profile.test.ts`

```ts
test('v2 fields default: themeHue green, cover leaf, seeds false', () => {
  const p = normalizeProfile({})
  expect(p.themeHue).toBe('green'); expect(p.cover).toBe('leaf'); expect(p.kindsSeeded).toBe(false); expect(p.creditCatsSeeded).toBe(false)
})
test('unknown themeHue/cover fall back to defaults', () => {
  expect(normalizeProfile({ themeHue: 'neon', cover: 'photo' } as never)).toMatchObject({ themeHue: 'green', cover: 'leaf' })
})
```

- [ ] **Step 8: 실패 확인** — `npm test -- profile` → FAIL (themeHue undefined).
- [ ] **Step 9: `src/data/profile.ts`** — `Profile`에 `themeHue: Hue`, `cover: Cover`, `kindsSeeded: boolean`, `creditCatsSeeded: boolean` 추가(기본 `'green' | 'leaf' | false | false`); `normalizeProfile`에서 `HUES.includes` / `COVERS.includes` 검사 후 기본값.
- [ ] **Step 10: `src/data/ProfileProvider.tsx`** — `applyTheme(theme, hue)`가 `document.documentElement.dataset.hue = hue`도 설정; effect deps에 `themeHue` 추가.
- [ ] **Step 11: 통과 확인** — `npm test` → 전체 PASS. `npx tsc -b` 오류 없음.
- [ ] **Step 12: Commit** — `feat(theme): hue presets, shade variables, serif font, profile fields`

---

### Task 2: 파스텔 색 → 농도(shade) 마이그레이션

**Files:**
- Create: `src/components/ui/ShadePick.tsx`, `src/components/ui/ShadePick.test.tsx`
- Modify: `src/lib/types.ts`, `src/lib/categories.ts`, `src/lib/categories.test.ts`, `src/lib/schools.ts`, `src/lib/schools.test.ts`, `src/features/todos/useCategories.ts`, `src/features/todos/TodoRow.tsx`, `src/features/home/CategoryTodos.tsx`, `src/features/home/CategoryManager.tsx`, `src/features/home/TodaySchedule.tsx`, `src/features/grad/SchoolCells.tsx`, `src/features/timetable/schedule.ts`, `src/features/timetable/schedule.test.ts`, `src/features/timetable/WeekView.tsx`, `src/features/timetable/MonthView.tsx`, `src/features/timetable/ScheduleForm.tsx`, `src/components/ui/index.ts`, `src/index.css`

**Interfaces:**
- Consumes: `Shade`, `SHADE_CLASS`, `textShade`, `toShade` (Task 1).
- Produces: `Category.shade: Shade` (color 삭제); `ShadePick({ value, onChange, label })`; `STATUS_COLOR: Record<SchoolStatus, Shade | null>`; `KIND_SHADE: Record<ScheduleKind, Shade>`, `KIND_STYLE: Record<ScheduleKind, { bg; text; border }>` (Task 6에서 kinds 컬렉션으로 대체됨); `useCategories().add(name: string, shade: Shade, order?)`, `update(id, patch: Partial<Pick<Category,'name'|'shade'>>)`.

- [ ] **Step 1: 테스트** — `src/lib/categories.test.ts`에서 `color: 'sky'` → `shade: 2`로 바꾸고 추가:

```ts
import { normalizeCategory } from './categories'
test('normalizeCategory: legacy color → shade, numeric shade kept, junk → 2', () => {
  expect(normalizeCategory({ name: 'a', color: 'mint', order: 0 }, 'x').shade).toBe(3)
  expect(normalizeCategory({ name: 'a', shade: 6, order: 0 }, 'x').shade).toBe(6)
  expect(normalizeCategory({ name: 'a', color: 'red', order: 0 }, 'x').shade).toBe(2)
  expect(normalizeCategory({ name: 'a', shade: 9, order: 0 }, 'x').shade).toBe(2)
})
test('default categories: 공부 2, 연구 3, 대학원 4', () => {
  expect(DEFAULT_CATEGORIES.map((c) => [c.name, c.shade])).toEqual([['공부', 2], ['연구', 3], ['대학원', 4]])
})
```
  `src/lib/schools.test.ts`에 추가: `expect(STATUS_COLOR).toEqual({ interested: null, preparing: 2, submitted: 4, accepted: 6, rejected: null })`.
  `src/features/timetable/schedule.test.ts` 마지막 파스텔 테스트를 교체: `expect(KIND_SHADE).toEqual({ class: 2, research: 4, work: 1, other: 5 }); expect(KIND_STYLE.work).toEqual({ bg: 'bg-s1', text: 'text-s1-on', border: 'border-s4' })`.
  `src/components/ui/ShadePick.test.tsx`: 렌더 후 `getAllByRole('radio')` 길이 6, `aria-checked` true인 것이 `value`, 클릭 시 `onChange(4)` 호출.

- [ ] **Step 2: 실패 확인** — `npm test` → categories/schools/schedule/ShadePick FAIL(타입·모듈 없음).
- [ ] **Step 3: 구현**
  - `types.ts`: `PaletteColor` 삭제, `Category.color` → `shade: Shade`.
  - `categories.ts`: `PALETTE`, `PALETTE_CLASS` 삭제; `normalizeCategory`는 `shade: toShade(raw.shade ?? raw.color)`; `DEFAULT_CATEGORIES` shade 2/3/4.
  - `ShadePick.tsx`: `role="radiogroup"`, 6개 `button role="radio" aria-checked aria-label={String(s)}`, 클래스 `h-6 w-6 rounded-[3px] ${SHADE_CLASS[s].fill}` + 선택 시 `ring-2 ring-ink ring-offset-1 ring-offset-surface`. `index.ts`에 export.
  - `useCategories.ts`: `add(name, shade: Shade, order?)`, `update` 패치 타입 `'name'|'shade'`.
  - `CategoryManager.tsx`: `ColorPick` 삭제 → `ShadePick`; 새 카테고리 기본 shade `2`.
  - `TodoRow.tsx`: prop `shade: Shade | null`. 완료 박스 `${SHADE_CLASS[shade].fill} ${SHADE_CLASS[shade].on}`(없으면 `bg-ink-faint text-white`), 미완료 테두리 `${SHADE_CLASS[textShade(shade)].border}`, 메뉴 스와치 `SHADE_CLASS[c.shade].fill`.
  - `CategoryTodos.tsx`: 그룹 제목 `SHADE_CLASS[textShade(shade)].text`; `TodoRow`에 `shade` 전달.
  - `schools.ts`: `STATUS_COLOR: Record<SchoolStatus, Shade | null>` 값 위와 같음. `SchoolCells.tsx` 스와치 `SHADE_CLASS[color].fill`.
  - `schedule.ts`: `KIND_COLOR` → `KIND_SHADE`; `KIND_STYLE[k] = { bg: SHADE_CLASS[s].fill, text: SHADE_CLASS[s].on, border: SHADE_CLASS[textShade(s)].border }`. `WeekView`(블록 글자 `st.text`, 왼쪽 선 `st.border`, 둘째 줄 `opacity-70`), `MonthView`(점·막대 `st.bg`, 태그 `st.bg st.text`), `ScheduleForm`(칩 `st.bg st.text`), `TodaySchedule`(3px 막대는 배경색이므로 `SHADE_CLASS[textShade(KIND_SHADE[it.kind])].fill`) 갱신. `PALETTE_CLASS` import 전부 제거.
  - `index.css`: 파스텔 토큰 12개 삭제.
- [ ] **Step 4: 통과 확인** — `npm test` 전체 PASS; `grep -rn "PaletteColor\|PALETTE\|bg-sky\|mint\|lilac\|peach\|butter" src` → 결과 없음(테스트 fixture 제외).
- [ ] **Step 5: Commit** — `refactor(color): replace pastel palette with theme shades`

---

### Task 3: 레벨/XP 제거

**Files:**
- Delete: `src/lib/xp.ts`, `src/lib/xp.test.ts`
- Modify: `src/data/profile.ts`, `src/data/profile.test.ts`, `src/data/useProfile.ts`, `src/features/todos/useTodos.ts`, `src/features/home/HomePage.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Produces: `ProfileCtx` without `addXp`; `useTodos().toggle(id)` 단순 토글(토스트 없음).

- [ ] **Step 1: 테스트** — `profile.test.ts`의 'clamps negative xp' 삭제, 추가: `test('profile has no xp field', () => { expect(DEFAULT_PROFILE).not.toHaveProperty('xp') })`. `xp.test.ts` 삭제.
- [ ] **Step 2: 실패 확인** — `npm test -- profile` → FAIL.
- [ ] **Step 3: 구현** — `profile.ts`에서 `xp` 제거(normalizeProfile의 xp 클램프 삭제). `useProfile.ts`에서 `addXp`, `increment` 제거. `useTodos.ts`: `toggle`은 `col.update(id, { done, doneAt })`만; `useProfile/useToast/useT/xp` import 삭제. `HomePage.tsx`: pill `<span>`과 `levelProgress` 삭제, header는 제목 블록만. `lib/xp.ts` 삭제. i18n `home.level`, `home.xp`, `home.levelUp` 삭제(ko/en).
- [ ] **Step 4: 통과 확인** — `npm test` PASS; `grep -rn "xp\b\|levelUp\|addXp" src` → 없음.
- [ ] **Step 5: Commit** — `feat(home): remove level/XP`

---

### Task 4: 노션 분위기 — 세리프 제목·커버·테마 적용 지점

**Files:**
- Create: `src/features/home/Cover.tsx`, `src/features/home/Cover.test.tsx`
- Modify: `src/components/ui/PageHeader.tsx`, `src/components/ui/Gauge.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TabBar.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/home/HomePage.tsx`, `src/features/home/WeekStrip.tsx`, `src/features/home/TodaySchedule.tsx`, `src/features/home/DeadlineList.tsx`, `src/features/grades/GpaChart.tsx`

**Interfaces:**
- Consumes: `Cover` 타입, `profile.cover` (Task 1).
- Produces: `Cover({ kind: Cover, compact?: boolean })` — `kind === 'none'`이면 `null`; `compact`면 설정 미리보기용 `h-8 mx-0`(음수 마진·큰 높이 대신).

- [ ] **Step 1: 테스트** `src/features/home/Cover.test.tsx`

```tsx
import { render } from '@testing-library/react'
import { Cover } from './Cover'
test('none renders nothing', () => { expect(render(<Cover kind="none" />).container).toBeEmptyDOMElement() })
test.each(['leaf', 'wave', 'grid'] as const)('%s renders an svg pattern tagged with data-cover', (k) => {
  const { container } = render(<Cover kind={k} />)
  expect(container.querySelector(`[data-cover="${k}"] svg`)).not.toBeNull()
})
test('solid renders the band without an svg', () => {
  const { container } = render(<Cover kind="solid" />)
  expect(container.querySelector('[data-cover="solid"]')).not.toBeNull(); expect(container.querySelector('svg')).toBeNull()
})
```
- [ ] **Step 2: 실패 확인** — `npm test -- Cover` → FAIL.
- [ ] **Step 3: `Cover.tsx`** — `<div data-cover={kind} aria-hidden className="relative -mx-4 h-[72px] overflow-hidden bg-cover-bg md:-mx-8 md:h-[96px]">` + 패턴 SVG(`width="100%" height="100%"`, `preserveAspectRatio="none"` 아님 — `<pattern>` 타일로 반복): leaf = 잎 모양 path 타일 `fill="var(--color-s2)"` + 일부 `var(--color-s3)`; wave = 가로 물결 `stroke="var(--color-s2)"` 1.5px; grid = 24px 격자 `stroke="var(--color-s2)"` 1px. 모양 세부는 빌더 재량.
- [ ] **Step 4: 적용**
  - `PageHeader` h1: `font-serif text-[24px] font-bold tracking-[-0.3px]`.
  - `Sidebar` 로고 div: `font-serif` 추가; `Item` 활성 클래스 `bg-s1 text-s6` (비활성 hover 유지).
  - `TabBar` 활성 `text-s6`.
  - `LoginPage` h1 `font-serif text-[24px]`.
  - `HomePage`: 최상위를 `<>`로 감싸 `<Cover kind={profile.cover} />`를 `space-y-5` div **바깥 위**에; 커버가 `none`이 아니면 header에 `-mt-1.5`. 날짜 h1 `font-serif text-[24px]`.
  - `WeekStrip` 오늘 칸 `bg-s6 text-s6-on`(요일 글자 `opacity-80` 유지).
  - `Gauge` 기본 `color = 'var(--color-s5)'`.
  - `GpaChart` 누적선 `stroke="var(--color-s4)"`.
  - `TodaySchedule`/`DeadlineList` 헤더 링크 `hover:text-s6`.
- [ ] **Step 5: 통과 확인** — `npm test` PASS. `npm run dev`로 홈을 열어 커버·세리프·오늘 칸 색 눈으로 확인(스크린샷 불필요, 콘솔 에러 없음).
- [ ] **Step 6: Commit** — `feat(ui): serif titles, home cover, theme accents`

---

### Task 5: 설정 — 테마 색·커버 선택, 졸업 요건 정리

**Files:**
- Create: `src/features/settings/HuePicker.tsx`, `src/features/settings/HuePicker.test.tsx`, `src/features/settings/CoverPicker.tsx`
- Modify: `src/features/settings/SettingsPage.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Consumes: `HUES`, `HUE_RAMP`, `COVERS`, `Cover` 컴포넌트.
- Produces: `HuePicker({ value: Hue, onChange, label })`, `CoverPicker({ value: Cover, onChange, label })`.

- [ ] **Step 1: 테스트** `HuePicker.test.tsx` — 6개 `radio`, `value="rose"`일 때 그 라디오 `aria-checked="true"`, 'blue' 클릭 → `onChange('blue')`; 각 라디오 안에 농도 띠 `span` 6개(`[data-shade]`).
- [ ] **Step 2: 실패 확인** — `npm test -- HuePicker` → FAIL.
- [ ] **Step 3: 구현** — `HuePicker`: radiogroup, 각 버튼 `aria-label={t('settings.hue_'+h)}` 안에 6개 `span data-shade style={{ background: HUE_RAMP[h].light[i] }}` 가로 띠(h-6) + 아래 이름 11px; 선택 테두리 `border-ink`, 비선택 `border-line-strong`. `CoverPicker`: 5개 radio, 각각 `<Cover kind={k} compact />` 축소 미리보기 + 이름(`none`은 점선 빈 칸).
  `SettingsPage`: 첫 Card 안 테마 Segmented 아래에 "테마 색"(HuePicker, `onChange={(themeHue) => void update({ themeHue })}`)과 "홈 커버"(CoverPicker, `update({ cover })`) 추가 — 즉시 저장. 졸업 요건 Card: `total` 입력 하나만(`sm:w-40`), `major/liberal` 입력 삭제(`Draft.gradReq`는 유지, `set('gradReq', { ...draft.gradReq, total })`).
  i18n 추가: `settings.themeHue`("테마 색"/"Accent"), `settings.cover`("홈 커버"/"Home cover"), `settings.hue_green…gray`(초록·파랑·보라·갈색·로즈·회색 / Green…Gray), `settings.cover_leaf|wave|grid|solid|none`(잎·물결·격자·단색·없음 / Leaf·Wave·Grid·Solid·None). 삭제: `settings.reqMajor`, `settings.reqLiberal`.
- [ ] **Step 4: 통과 확인** — `npm test` PASS. dev 서버에서 색 바꾸면 사이드바·체크박스 색이 즉시 바뀌고 새로고침 후 유지.
- [ ] **Step 5: Commit** — `feat(settings): theme hue and cover pickers, total-only grad requirement`

---

### Task 6: 시간표 종류 컬렉션

**Files:**
- Create: `src/lib/kinds.ts`, `src/lib/kinds.test.ts`, `src/features/timetable/useKinds.ts`, `src/features/timetable/KindManager.tsx`
- Modify: `src/lib/types.ts`, `src/features/timetable/schedule.ts`, `src/features/timetable/schedule.test.ts`, `src/features/timetable/useSchedule.ts`, `src/features/timetable/WeekView.tsx`, `src/features/timetable/MonthView.tsx`, `src/features/timetable/ScheduleForm.tsx`, `src/features/timetable/TimetablePage.tsx`, `src/features/home/TodaySchedule.tsx`, `src/features/home/HomePage.tsx`, `src/data/ProfileProvider.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Consumes: `Shade`, `SHADE_CLASS`, `textShade`, `ShadePick`, `profile.kindsSeeded`.
- Produces: `Kind { id; name; shade: Shade; order }`, `DEFAULT_KINDS`, `OTHER_KIND_ID = 'seed-other'`, `LEGACY_KIND: Record<string,string>`, `normalizeKind(raw, id)`, `kindOf(kinds: Kind[], id: string): Kind`, `kindStyle(k: Kind): { bg; text; border; bar }`, `shouldSeedKinds(profile, kinds, kindsLoading, profileLoading)`; `ScheduleItem.kind: string`; `useKinds(): { kinds, add(name, shade), put, update, remove, move, loading }`; `WeekView/MonthView/TodaySchedule/ScheduleForm`에 `kinds: Kind[]` prop.

- [ ] **Step 1: 테스트** `src/lib/kinds.test.ts`

```ts
import { DEFAULT_KINDS, LEGACY_KIND, OTHER_KIND_ID, kindOf, kindStyle, normalizeKind, shouldSeedKinds } from './kinds'
test('default kinds: 수업 2, 연구 4, 일 1, 기타 5 with fixed ids', () => {
  expect(DEFAULT_KINDS.map((k) => [k.id, k.name, k.shade])).toEqual([['seed-class', '수업', 2], ['seed-research', '연구', 4], ['seed-work', '일', 1], ['seed-other', '기타', 5]])
})
test('legacy values map to seed ids', () => { expect(LEGACY_KIND).toEqual({ class: 'seed-class', research: 'seed-research', work: 'seed-work', other: 'seed-other' }) })
test('kindOf falls back to seed-other, then to the built-in other', () => {
  expect(kindOf(DEFAULT_KINDS, 'gone').id).toBe(OTHER_KIND_ID)
  expect(kindOf([], 'gone')).toEqual(DEFAULT_KINDS[3])
  expect(kindOf(DEFAULT_KINDS, 'seed-work').name).toBe('일')
})
test('kindStyle: surface uses shade, border/bar use textShade', () => {
  expect(kindStyle(DEFAULT_KINDS[2])).toEqual({ bg: 'bg-s1', text: 'text-s1-on', border: 'border-s4', bar: 'bg-s4' })
})
test('normalizeKind coerces shade and order', () => { expect(normalizeKind({ name: 'x', shade: 'sky' }, 'k')).toEqual({ id: 'k', name: 'x', shade: 2, order: 0 }) })
test('shouldSeedKinds', () => {
  expect(shouldSeedKinds({ kindsSeeded: false }, [], false, false)).toBe(true)
  expect(shouldSeedKinds({ kindsSeeded: true }, [], false, false)).toBe(false)
  expect(shouldSeedKinds({ kindsSeeded: false }, DEFAULT_KINDS, false, false)).toBe(false)
  expect(shouldSeedKinds({ kindsSeeded: false }, [], true, false)).toBe(false)
})
```
  `schedule.test.ts`: `KIND_SHADE/KIND_STYLE` 테스트 삭제, 추가:
```ts
import { normalizeScheduleItem } from './schedule'
test('normalizeScheduleItem maps legacy kinds and keeps unknown ids', () => {
  expect(normalizeScheduleItem({ kind: 'class' }, 'a').kind).toBe('seed-class')
  expect(normalizeScheduleItem({ kind: 'k9' }, 'b').kind).toBe('k9')
  expect(normalizeScheduleItem({}, 'c').kind).toBe('seed-other')
})
```
  기존 fixture의 `kind: 'class'` → `'seed-class'`, `'research'` → `'seed-research'`.
- [ ] **Step 2: 실패 확인** — `npm test -- kinds schedule` → FAIL.
- [ ] **Step 3: 구현**
  - `kinds.ts` 위 시그니처대로. `kindStyle(k) = { bg: SHADE_CLASS[k.shade].fill, text: SHADE_CLASS[k.shade].on, border: SHADE_CLASS[textShade(k.shade)].border, bar: SHADE_CLASS[textShade(k.shade)].fill }`.
  - `types.ts`: `ScheduleKind` 삭제, `ScheduleItem.kind: string`. `schedule.ts`: `KINDS/KIND_SHADE/KIND_STYLE` 삭제; `normalizeScheduleItem`은 `LEGACY_KIND[raw.kind] ?? String(raw.kind ?? OTHER_KIND_ID)`. `useSchedule.ts`의 `ScheduleKind` export 삭제.
  - `useKinds.ts`: `useCategories`와 같은 구조(`useUserCollection<Kind>('kinds', normalizeKind)`). `remove(id)`: `id === OTHER_KIND_ID`면 throw; `schedule where kind == id`와, `id`가 시드면 레거시 값(`Object.entries(LEGACY_KIND).find(([,v]) => v === id)?.[0]`)으로도 한 번 더 조회 → 450 batch로 `kind: OTHER_KIND_ID`, 그다음 삭제.
  - `ProfileProvider.tsx`: `useSeedKinds` — `useSeedCategories`와 동일 패턴(`shouldSeedKinds`, `put`, `update({ kindsSeeded: true })`).
  - 화면: `WeekView/MonthView/TodaySchedule`은 `kinds` prop을 받아 `kindStyle(kindOf(kinds, item.kind))`; MonthView 태그 글자 = `kind.name`. `ScheduleForm`: `kinds` prop, 칩은 `kinds` 순회(`kindStyle(k).bg/text`), 새 항목 기본 `kind = kinds[0]?.id ?? 'seed-class'`. `TimetablePage`: `useKinds()`; 헤더 action에 `⋯` 버튼(`aria-label={t('timetable.manageKinds')}`) → `KindManager` 모달. `HomePage`: `useKinds()` → `TodaySchedule kinds`.
  - `KindManager.tsx`: `CategoryManager`와 같은 구조(이름 input, ShadePick, ↑↓, 삭제); `OTHER_KIND_ID` 줄은 삭제 버튼 없음. 새 종류 기본 shade 3.
  - i18n: 추가 `timetable.manageKinds`("종류 관리"/"Manage kinds"), `timetable.kindName`("이름"/"Name"), `timetable.addKind`("종류 추가"/"Add kind"), `timetable.deleteKindConfirm`("삭제하면 이 종류의 일정은 '기타'로 바뀌어요. 삭제할까요?"/"Schedule items of this kind become 'Other'. Delete?"). 삭제 `timetable.class|research|work|other`.
- [ ] **Step 4: 통과 확인** — `npm test` PASS. dev에서 기존 일정이 같은 색으로 보이고, 종류 추가 후 폼 칩에 나타남.
- [ ] **Step 5: Commit** — `feat(timetable): user-managed schedule kinds`

---

### Task 7: 이수 격자 로직

**Files:**
- Create: `src/lib/creditCats.ts`, `src/lib/creditCats.test.ts`
- Modify: `src/lib/gpa.ts`, `src/lib/gpa.test.ts`

**Interfaces:**
- Consumes: `Course`, `Term`, `TermCode`, `earnedCredits`, `gpaOf`, `activeCourses`.
- Produces:
  - `CreditCat { id; name; aliases: string[]; required: number; isMajor: boolean; order: number }`, `NewCreditCat = Omit<CreditCat, 'id'>`
  - `DEFAULT_CREDIT_CATS: CreditCat[]` (ids `seed-major-req 전공필수 major`, `seed-major-elec 전공선택 major`, `seed-liberal 교양`, `seed-basic 학문의기초`, required 0, order 0–3)
  - `OTHER_CAT_ID = '__other__'`, `normalizeCreditCat(raw, id)`, `matchesCat(cat, category: string): boolean`, `catFor(cats, category): CreditCat | null`
  - `seedCatsFromCourses(courses: Course[], terms: Term[]): CreditCat[]`
  - `shouldSeedCreditCats(profile: Pick<Profile,'creditCatsSeeded'>, cats, catsLoading, coursesLoading, profileLoading): boolean`
  - `renamePlan(cat, newName, courses): { catPatch: { name: string; aliases: string[] }; courseIds: string[] }`
  - `majorNames(cats): string[]` (isMajor 줄의 name + aliases)
  - `GridRow { id: string; cat: CreditCat | null; courses: Course[]; earned: number }`, `gridRows(cats, courses): GridRow[]` (cat order, 기타 줄 항상 마지막; `courses`는 supersededBy 포함 전부, `earned`는 active + EARNED_EXCLUDED 제외)
  - `cellCourses(row: GridRow, termCode: TermCode | null): Course[]` (order 정렬)
  - `gridTermLabel(code: TermCode, firstYear: number, lang): string` — `'2024-1'`,2024,ko → `'1학년 1학기'`; `'2025-2'` → `'2학년 2학기'`; `'2024-S'` → `'2024 여름'`; en → `'Y1 Spring'`, `'Y2 Fall'`, `'2024 Summer'`
  - `gpa.ts`: `majorGpa(courses, majorNames: string[])`, `gradProgress(courses, req: { total: number })` → `{ total: { earned; required } }`; `MAJOR_CATEGORIES`, `LIBERAL_CATEGORIES` 삭제.

- [ ] **Step 1: 테스트** `src/lib/creditCats.test.ts` — fixture `c(id, category, termCode, credits=3, grade='A', order)` + `DEFAULT_CREDIT_CATS` 사용.

```ts
test('catFor matches by name or alias; unknown → null', () => {
  const cats = [{ ...DEFAULT_CREDIT_CATS[0], aliases: ['전필'] }]
  expect(catFor(cats, '전공필수')?.id).toBe('seed-major-req'); expect(catFor(cats, '전필')?.id).toBe('seed-major-req'); expect(catFor(cats, '교직')).toBeNull()
})
test('seedCatsFromCourses: distinct categories in (term, order) order, 전공 → major; no courses → defaults', () => {
  const terms = [{ code: '2024-1', order: 1 }, { code: '2024-2', order: 2 }] as never
  const courses = [c('a', '교양', '2024-2', 3, 'A', 1), c('b', '전공선택', '2024-1', 3, 'A', 2), c('c', '학문의기초', '2024-1', 3, 'A', 1), c('d', '교양', '2024-1', 3, 'A', 3)]
  expect(seedCatsFromCourses(courses, terms).map((x) => [x.name, x.isMajor, x.order])).toEqual([['학문의기초', false, 0], ['전공선택', true, 1], ['교양', false, 2]])
  expect(seedCatsFromCourses([], terms)).toEqual(DEFAULT_CREDIT_CATS)
})
test('seeded ids are deterministic (seed-0, seed-1, …) so a second seeder overwrites', () => {
  expect(seedCatsFromCourses([c('a', '교양', '2024-1')], []).map((x) => x.id)).toEqual(['seed-0'])
})
test('renamePlan keeps the old name as alias and lists courses to rewrite', () => {
  const cat = { ...DEFAULT_CREDIT_CATS[2], aliases: ['교양과목'] }
  const plan = renamePlan(cat, '교양·일반', [c('a', '교양', null), c('b', '교양과목', null), c('x', '전공선택', null)])
  expect(plan).toEqual({ catPatch: { name: '교양·일반', aliases: ['교양과목', '교양'] }, courseIds: ['a', 'b'] })
})
test('gridRows: rows in cat order, other row last and always present, earned excludes superseded and F', () => {
  const courses = [c('a', '전공필수', '2024-1'), { ...c('b', '전공필수', '2023-1'), supersededBy: 'a' }, c('f', '교양', '2024-1', 3, 'F'), c('z', '교직', null)]
  const rows = gridRows(DEFAULT_CREDIT_CATS, courses)
  expect(rows.map((r) => r.id)).toEqual(['seed-major-req', 'seed-major-elec', 'seed-liberal', 'seed-basic', OTHER_CAT_ID])
  expect(rows[0].earned).toBe(3); expect(rows[0].courses).toHaveLength(2); expect(rows[2].earned).toBe(0); expect(rows[4].courses.map((x) => x.id)).toEqual(['z'])
})
test('cellCourses picks a term (or null = unassigned) sorted by order', () => {
  const row = gridRows(DEFAULT_CREDIT_CATS, [c('b', '교양', '2024-1', 3, 'A', 2), c('a', '교양', '2024-1', 3, 'A', 1), c('u', '교양', null)])[2]
  expect(cellCourses(row, '2024-1').map((x) => x.id)).toEqual(['a', 'b']); expect(cellCourses(row, null).map((x) => x.id)).toEqual(['u'])
})
test('gridTermLabel', () => {
  expect(gridTermLabel('2024-1', 2024, 'ko')).toBe('1학년 1학기'); expect(gridTermLabel('2025-2', 2024, 'ko')).toBe('2학년 2학기')
  expect(gridTermLabel('2024-S', 2024, 'ko')).toBe('2024 여름'); expect(gridTermLabel('2025-2', 2024, 'en')).toBe('Y2 Fall'); expect(gridTermLabel('2024-W', 2024, 'en')).toBe('2024 Winter')
})
test('majorNames includes aliases of major rows only', () => {
  expect(majorNames([{ ...DEFAULT_CREDIT_CATS[0], aliases: ['전필'] }, DEFAULT_CREDIT_CATS[2]])).toEqual(['전공필수', '전필'])
})
test('shouldSeedCreditCats waits for courses and cats to load', () => {
  expect(shouldSeedCreditCats({ creditCatsSeeded: false }, [], false, false, false)).toBe(true)
  expect(shouldSeedCreditCats({ creditCatsSeeded: false }, [], false, true, false)).toBe(false)
  expect(shouldSeedCreditCats({ creditCatsSeeded: true }, [], false, false, false)).toBe(false)
})
```
  `gpa.test.ts`: `majorGpa(all)` → `majorGpa(all, ['전공필수', '전공선택'])`; `gradProgress(all, { total: 130, major: 60, liberal: 30 })` 기대값을 `{ total: { earned: …, required: 130 } }`로 축소.
- [ ] **Step 2: 실패 확인** — `npm test -- creditCats gpa` → FAIL.
- [ ] **Step 3: 구현** — `creditCats.ts` 시그니처대로. `seedCatsFromCourses`: `termOrder = Map(code → order)`, 과목을 `(termOrder(termCode) ?? Infinity, order)`로 정렬 후 `category` distinct(빈 문자열 제외), `isMajor = name.includes('전공')`, id `seed-${i}`. `gridTermLabel`: 연도·계절 파싱은 `termCode.ts` 패턴 재사용(`split('-')`), 학년 = `year - firstYear + 1`. `gpa.ts` 변경.
- [ ] **Step 4: 통과 확인** — `npm test -- creditCats gpa` PASS. (`useGrades`의 호출부는 Task 8에서 고치므로 `tsc`는 여기서 실패해도 됨 — 전체 `npm test`는 vitest만 돌아 PASS.)
- [ ] **Step 5: Commit** — `feat(grades): credit category model and grid helpers`

---

### Task 8: `useCreditCats` + `useGrades` 통합

**Files:**
- Create: `src/features/grades/useCreditCats.ts`
- Modify: `src/features/grades/useGrades.ts`, `src/features/grades/KpiRow.tsx`, `src/features/grades/Simulator.tsx`

**Interfaces:**
- Consumes: Task 7 전부, `useUserCollection`, `useProfile`, `profile.creditCatsSeeded`.
- Produces: `useCreditCats(): { cats: CreditCat[] (order 정렬); add(c: NewCreditCat): Promise<string>; put(c: CreditCat); rename(cat, newName, courses: Course[]): Promise<void>; update(id, patch: Partial<Pick<CreditCat,'required'|'isMajor'>>); remove(id); move(id, dir: -1|1); loading }`; `useGrades()`에 추가 `cats, rows, firstYear: number | null, addCat, renameCat, updateCat, removeCat, moveCat`; `g.major`는 `majorGpa(active, majorNames(cats))`; `g.progress = { total }`.

- [ ] **Step 1: `useCreditCats.ts`** — `useUserCollection<CreditCat>('creditCats', normalizeCreditCat)`; `rename`은 `renamePlan` 결과로 `writeBatch`: cat 문서 `update(catPatch)` + 각 `courseIds` 문서 `update({ category: newName })`(450 단위). `move`는 `useCategories.move`와 동일. `remove`는 문서 삭제만(과목은 그대로 — 스펙 §4.2).
- [ ] **Step 2: `useGrades.ts`** — `useCreditCats()` 호출; 시드 effect: `shouldSeedCreditCats(profile, cats, catsLoading, coursesCol.loading, profileLoading)`가 true면 `useRef` 가드 후 `Promise.all(seedCatsFromCourses(coursesCol.items, terms).map(put)).then(() => update({ creditCatsSeeded: true }))`. `rows = gridRows(cats, courses)`, `firstYear = terms[0] ? Number(terms[0].code.slice(0,4)) : null`, `major = majorGpa(active, majorNames(cats))`, `progress = gradProgress(active, { total: profile.gradReq.total })`.
- [ ] **Step 3: `KpiRow`/`Simulator`** — `g.progress.total` 사용은 그대로(타입만 맞음). 컴파일 확인 `npx tsc -b` → `TermAccordion`/`GradGauges`의 오류만 남아야 하고(Task 9에서 삭제) 그 외 0개.
- [ ] **Step 4: 전체 테스트** — `npm test` PASS.
- [ ] **Step 5: Commit** — `feat(grades): creditCats collection hook, seed, major GPA from rows`

---

### Task 9: `CreditGrid` 화면

**Files:**
- Create: `src/features/grades/CreditGrid.tsx`, `src/features/grades/CreditGrid.test.tsx`, `src/features/grades/RowEditor.tsx`
- Delete: `src/features/grades/TermAccordion.tsx`, `src/features/grades/GradGauges.tsx`
- Modify: `src/features/grades/GradesPage.tsx`, `src/features/grades/CourseForm.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Consumes: `GridRow`, `cellCourses`, `gridTermLabel`, `termStats`, `OTHER_CAT_ID`, `Grades`(Task 8).
- Produces:
  - `CreditGrid({ rows: GridRow[]; terms: TermDoc[]; active: Course[]; firstYear: number | null; onPickCourse(c: Course); onAddCourse(termCode: TermCode | null, category: string); onEditRow(cat: CreditCat); onAddRow() })` — 순수 props, Firebase 없음.
  - `RowEditor({ open; onClose; cat: CreditCat | null; first; last; onSave(patch: { name; required; isMajor }); onMove(dir); onDelete() })`
  - `CourseForm` prop 추가 `categories: string[]`(격자 줄 이름들).

- [ ] **Step 1: 테스트** `CreditGrid.test.tsx` — `terms = [{code:'2024-1',order:1,…},{code:'2024-2',order:2,…}]`, rows from `gridRows(DEFAULT_CREDIT_CATS, courses)` with `courses = [c('a','전공필수','2024-1',3,'A+'), {…c('b','전공필수','2023-1'), supersededBy:'a'}, c('u','교양',null)]`, `active = activeCourses(courses)`.

```tsx
test('renders term headers with grade-year labels and an unassigned column', () => {
  render(<CreditGrid … />)
  expect(screen.getByText('1학년 1학기')).toBeInTheDocument(); expect(screen.getByText('1학년 2학기')).toBeInTheDocument()
  expect(screen.getByText('미배정')).toBeInTheDocument()
})
test('course chip shows name + grade and opens on click; superseded chip is struck through', () => {
  const onPick = vi.fn(); render(<CreditGrid … onPickCourse={onPick} />)
  fireEvent.click(screen.getByRole('button', { name: /a A\+/ })); expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
  expect(screen.getByRole('button', { name: /b A/ })).toHaveClass('line-through')
})
test('+ chip adds into that term and row; unassigned course sits in the last column', () => {
  const onAdd = vi.fn(); render(<CreditGrid … onAddCourse={onAdd} />)
  fireEvent.click(screen.getAllByRole('button', { name: '과목 추가 · 전공선택 · 1학년 2학기' })[0]); expect(onAdd).toHaveBeenCalledWith('2024-2', '전공선택')
  expect(screen.getByRole('button', { name: /u A/ })).toBeInTheDocument()
})
test('footer shows term GPA or N/A', () => {
  render(<CreditGrid … />); expect(screen.getByText('4.50')).toBeInTheDocument(); expect(screen.getByText('N/A')).toBeInTheDocument()
})
```
  (`+` 칩 `aria-label` 형식: `${t('grades.addCourse')} · ${rowName} · ${termLabel}`; 기타 줄은 `t('grades.otherCat')`, 미배정 열은 `t('grades.unassigned')`.)
- [ ] **Step 2: 실패 확인** — `npm test -- CreditGrid` → FAIL.
- [ ] **Step 3: `CreditGrid.tsx`** — `<div className="overflow-x-auto">` 안 `display: grid`, `gridTemplateColumns: 168px repeat(n, 146px|110px) 146px`(계절학기 `-S|-W` 110px, 마지막 = 미배정 열, 미배정 과목이 없으면 열 생략). 첫 열 `sticky left-0 bg-surface z-10`. 머리 행: `gridTermLabel`. 왼쪽 셀 `<button>`: 이름(13px 700), `취득 / 필요`(필요 0이면 취득만), 4px 막대(`bg-s5`, `Math.min(1, earned/required)`), `isMajor`면 `Tag tone="none"` "본전공". 본문 셀: 칩 `<button aria-label={`${c.name} ${c.grade}`} className="w-full rounded-card border border-line px-2 py-1 text-left text-[12px] …">` 이름 + `<b className="text-s6">{grade}</b>`; superseded → `text-ink-faint line-through`; 셀 끝 `+` 칩(점선, `text-ink-faint`). 맨 아래 행: `termStats(active, code)` → `gpa.toFixed(2)`(18px 800) 또는 `N/A`(`text-ink-faint`), 학점 합. 맨 아래 왼쪽 `+ 이수구분 추가`(`onAddRow`). 미배정 열 머리 `t('grades.unassigned')`, 바닥 빈칸.
- [ ] **Step 4: `RowEditor.tsx`** — `Modal`: 이름 Input, 필요 학점 Input(number), 본전공 checkbox(`<label><input type="checkbox"/></label>`), ↑↓ 버튼, 삭제(confirm `grades.deleteCatConfirm`), 저장.
- [ ] **Step 5: `CourseForm.tsx`** — `categories` prop; 선택지 = `[...categories, (d.category && !categories.includes(d.category) ? d.category : null), '']`(빈 값 라벨 `t('grades.otherCat')`); `blank()`의 기본 category = `categories[0] ?? ''`.
- [ ] **Step 6: `GradesPage.tsx`** — 레이아웃: `KpiRow` → `GpaChart` → `CreditGrid` → `Simulator`(`details`, 격자 아래). 상태: `editing: Course | null`, `adding: { termCode: TermCode | null; category: string } | null`, `editingCat: CreditCat | null | 'new'`. `onEditRow` → `RowEditor`(저장 시 이름이 바뀌면 `g.renameCat(cat, name, g.courses)` + `g.updateCat(id, { required, isMajor })`, 새 줄이면 `g.addCat({ name, aliases: [], required, isMajor, order: cats.length })`). `TermAccordion.tsx`, `GradGauges.tsx` 삭제.
- [ ] **Step 7: i18n** — 추가 `grades.creditCats`("이수구분"/"Categories"), `grades.addCreditCat`("이수구분 추가"/"Add category"), `grades.editCreditCat`("이수구분 편집"/"Edit category"), `grades.catName`("이름"/"Name"), `grades.catRequired`("필요 학점"/"Required credits"), `grades.catMajor`("본전공"/"Major"), `grades.deleteCatConfirm`("줄을 지워도 과목은 남아 '기타'에 보여요. 지울까요?"/"Courses stay and show under Other. Delete?"), `grades.otherCat`("기타"/"Other"), `grades.na`("N/A"). `grades.unassigned`는 "미배정"/"Unassigned"로 값 변경. 삭제 `grades.terms`, `grades.gradReq`, `grades.reqMajor`, `grades.reqLiberal`, `grades.setReqHint`, `grades.assignTerm`.
- [ ] **Step 8: 통과 확인** — `npm test` PASS; `npx tsc -b` 오류 0. dev에서 사용자 실제 과목이 줄별로 보이고 가로 스크롤 시 첫 열 고정.
- [ ] **Step 9: Commit** — `feat(grades): semester × category credit grid replaces term list`

---

### Task 10: 논문 데이터베이스 `/papers`

**Files:**
- Create: `src/lib/papers.ts`, `src/lib/papers.test.ts`, `src/features/papers/usePapers.ts`, `src/features/papers/PapersPage.tsx`, `src/features/papers/PaperList.tsx`, `src/features/papers/PaperForm.tsx`, `src/features/papers/PaperDetail.tsx`
- Modify: `src/lib/types.ts`, `src/App.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Produces:
  - `types.ts`: `PaperStatus = 'toread'|'reading'|'read'`, `Paper { id; title; authors: string[]; year: number|null; venue; doi; url; arxivId; tags: string[]; status: PaperStatus; summary; quotes: string[]; notes; addedAt; readAt: string|null }`
  - `papers.ts`: `PAPER_STATUSES`, `normalizePaper(raw, id)`, `PaperRef = { kind: 'doi'; id: string } | { kind: 'arxiv'; id: string }`, `parsePaperRef(input: string): PaperRef | null`, `PaperMeta = Pick<Paper,'title'|'authors'|'year'|'venue'|'doi'|'url'|'arxivId'>`, `fromCrossref(json: unknown): PaperMeta`, `fromArxiv(xml: string): PaperMeta | null`, `fetchPaperMeta(ref: PaperRef, fetchImpl = fetch): Promise<PaperMeta | null>`, `filterPapers(papers, f: { status: PaperStatus | 'all'; tag: string | null; q: string }): Paper[]`(addedAt 내림차순), `allTags(papers): string[]`
  - `usePapers(): { papers; add(p: NewPaper); update(id, patch); remove(id); setStatus(id, status) (read면 readAt 기록, 아니면 null); loading }`

- [ ] **Step 1: 테스트** `src/lib/papers.test.ts`

```ts
test('parsePaperRef: DOI forms', () => {
  expect(parsePaperRef('10.1000/xyz123')).toEqual({ kind: 'doi', id: '10.1000/xyz123' })
  expect(parsePaperRef('https://doi.org/10.1000/XYZ.1')).toEqual({ kind: 'doi', id: '10.1000/XYZ.1' })
  expect(parsePaperRef(' doi:10.1000/a.b ')).toEqual({ kind: 'doi', id: '10.1000/a.b' })
})
test('parsePaperRef: arXiv forms strip version', () => {
  expect(parsePaperRef('arXiv:2101.00001')).toEqual({ kind: 'arxiv', id: '2101.00001' })
  expect(parsePaperRef('https://arxiv.org/abs/2101.00001v2')).toEqual({ kind: 'arxiv', id: '2101.00001' })
  expect(parsePaperRef('https://arxiv.org/pdf/2101.00001v1.pdf')).toEqual({ kind: 'arxiv', id: '2101.00001' })
})
test('parsePaperRef: plain text → null', () => { expect(parsePaperRef('attention is all you need')).toBeNull(); expect(parsePaperRef('')).toBeNull() })
test('fromCrossref maps message fields', () => {
  const json = { message: { title: ['Deep Learning'], author: [{ given: 'Yann', family: 'LeCun' }, { name: 'DeepMind' }], issued: { 'date-parts': [[2015, 5]] }, 'container-title': ['Nature'], DOI: '10.1038/nature14539', URL: 'https://doi.org/10.1038/nature14539' } }
  expect(fromCrossref(json)).toEqual({ title: 'Deep Learning', authors: ['Yann LeCun', 'DeepMind'], year: 2015, venue: 'Nature', doi: '10.1038/nature14539', url: 'https://doi.org/10.1038/nature14539', arxivId: '' })
})
test('fromArxiv parses the first Atom entry; no entry → null', () => {
  const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/1706.03762v7</id><published>2017-06-12T17:57:34Z</published><title>Attention Is All You Need</title><author><name>Ashish Vaswani</name></author><author><name>Noam Shazeer</name></author></entry></feed>`
  expect(fromArxiv(xml)).toEqual({ title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer'], year: 2017, venue: 'arXiv', doi: '', url: 'https://arxiv.org/abs/1706.03762', arxivId: '1706.03762' })
  expect(fromArxiv('<feed xmlns="http://www.w3.org/2005/Atom"></feed>')).toBeNull()
})
test('fetchPaperMeta returns null on network/HTTP failure', async () => {
  const bad = (async () => ({ ok: false, status: 404 })) as unknown as typeof fetch
  expect(await fetchPaperMeta({ kind: 'doi', id: '10.1/x' }, bad)).toBeNull()
  const boom = (async () => { throw new Error('offline') }) as unknown as typeof fetch
  expect(await fetchPaperMeta({ kind: 'arxiv', id: '1' }, boom)).toBeNull()
})
test('filterPapers: status, tag, query over title/authors/tags, newest first', () => {
  const p = (id: string, title: string, status: PaperStatus, tags: string[], addedAt: string, authors: string[] = []) => normalizePaper({ title, status, tags, addedAt, authors }, id)
  const list = [p('a', 'Causal Forests', 'read', ['causal'], '2026-01-01', ['Athey']), p('b', 'Double ML', 'toread', ['causal', 'ml'], '2026-02-01'), p('c', 'Transformers', 'reading', ['dl'], '2026-03-01')]
  expect(filterPapers(list, { status: 'all', tag: null, q: '' }).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  expect(filterPapers(list, { status: 'toread', tag: null, q: '' }).map((x) => x.id)).toEqual(['b'])
  expect(filterPapers(list, { status: 'all', tag: 'causal', q: '' }).map((x) => x.id)).toEqual(['b', 'a'])
  expect(filterPapers(list, { status: 'all', tag: null, q: 'athey' }).map((x) => x.id)).toEqual(['a'])
  expect(allTags(list)).toEqual(['causal', 'dl', 'ml'])
})
test('normalizePaper defaults', () => {
  expect(normalizePaper({}, 'x')).toMatchObject({ id: 'x', title: '', authors: [], year: null, status: 'toread', tags: [], quotes: [], readAt: null })
})
```
- [ ] **Step 2: 실패 확인** — `npm test -- papers` → FAIL.
- [ ] **Step 3: `papers.ts`** — `parsePaperRef`: trim → `/10\.\d{4,9}\/\S+/` 매치(doi.org/ 또는 `doi:` 접두 제거), arXiv `/(\d{4}\.\d{4,5})(v\d+)?/` (앞에 `arxiv` 문자열 또는 arxiv.org URL이 있을 때만). `fetchPaperMeta`: doi → `https://api.crossref.org/works/${encodeURIComponent(id)}` JSON → `fromCrossref`; arxiv → `https://export.arxiv.org/api/query?id_list=${id}` text → `fromArxiv`; `!res.ok`·예외·null → `null`. `fromArxiv`는 `new DOMParser().parseFromString(xml, 'application/xml')`(jsdom 지원), 첫 `entry`.
- [ ] **Step 4: `usePapers.ts`** — `useUserCollection<Paper>('papers', normalizePaper)`; `NewPaper = Omit<Paper,'id'|'addedAt'|'readAt'>`; `setStatus`.
- [ ] **Step 5: 화면** — `PapersPage`: `PageHeader`(제목 + "+ 논문"), 상태 pill(전체·읽을 것·읽는 중·읽음, `GradPage` FILTERS 스타일) + 태그 pill(`allTags`) + 검색 `Input`(`aria-label=t('common.search')`); `PaperList`(데스크톱 `<table>`: 제목/저자·연도/학회지/태그/상태/추가일; 모바일 카드 — `useIsDesktop`), 행 클릭 → `PaperDetail` Modal(요약, 핵심 인용 `ul`, 메모 `whitespace-pre-wrap`, 링크 `a target=_blank`, 상태 `Segmented`, 수정·삭제). `PaperForm` Modal: 맨 위 `Input`(DOI/arXiv) + `Button variant="secondary"` "정보 가져오기"(`fetchPaperMeta`; 성공 → 필드 채움 + 토스트 없음, 실패 → `text-danger` 한 줄 `papers.fetchFailed`), 제목·저자(쉼표 구분 input)·연도·학회지·DOI·URL·태그(쉼표)·상태·요약·핵심 인용(`Textarea`, 줄 단위)·메모. `EmptyState` 비었을 때. `App.tsx` `/papers` → `PapersPage`.
- [ ] **Step 6: i18n `papers.*`** — `title`(논문/Papers), `add`(논문 추가/Add paper), `edit`, `ref`(DOI 또는 arXiv 주소/DOI or arXiv link), `fetch`(정보 가져오기/Fetch info), `fetching`, `fetchFailed`(정보를 못 가져왔어요. 직접 입력해 주세요./Couldn't fetch — fill in by hand.), `paperTitle`, `authors`, `authorsHint`(쉼표로 구분/Comma-separated), `year`, `venue`, `doi`, `url`, `tags`, `status`, `s_toread`(읽을 것/To read), `s_reading`(읽는 중/Reading), `s_read`(읽음/Read), `all`, `summary`(한 줄 요약/One-line summary), `quotes`(핵심 인용/Key quotes), `quotesHint`(한 줄에 하나/One per line), `notes`, `addedAt`(추가일/Added), `readAt`(읽은 날/Read on), `open`(링크 열기/Open link), `empty`(아직 논문이 없어요/No papers yet), `deleteConfirm`, `errTitle`(제목을 입력해 주세요/Title is required).
- [ ] **Step 7: 통과 확인** — `npm test` PASS; dev에서 `10.1038/nature14539` 붙여넣고 가져오기 → 제목 채워짐.
- [ ] **Step 8: Commit** — `feat(papers): paper database with Crossref/arXiv lookup`

---

### Task 11: 연구 보드 `/research`

**Files:**
- Create: `src/lib/projects.ts`, `src/lib/projects.test.ts`, `src/features/research/useProjects.ts`, `src/features/research/ResearchPage.tsx`, `src/features/research/ProjectCard.tsx`, `src/features/research/ProjectForm.tsx`
- Modify: `src/lib/types.ts`, `src/features/todos/todos.ts`, `src/features/todos/todos.test.ts`, `src/features/todos/useTodos.ts`, `src/features/todos/TodoRow.tsx`, `src/App.tsx`, `src/i18n/ko.json`, `src/i18n/en.json`

**Interfaces:**
- Consumes: `Todo.source`, `useTodos`, `useCategories`, `Card bordered`, `Tag`, `TodoRow`.
- Produces:
  - `types.ts`: `ProjectStatus = 'active'|'paused'|'done'`, `Project { id; name; goal; status; note; order; createdAt }`
  - `projects.ts`: `PROJECT_STATUSES`, `normalizeProject(raw, id)`, `projectTodos(todos, projectId): Todo[]`(source.type 'project' && refId && !done, createdAt 순), `researchCategoryId(categories): string | null`(이름이 `연구` 또는 `research`(대소문자 무시)인 첫 카테고리), `splitProjects(projects): { active: Project[]; rest: Project[] }`(order 정렬), `STATUS_TONE: Record<ProjectStatus, TagTone>` = active ok, paused warn, done none
  - `todos.ts`: `newTodoDoc(title, selectedDate, opts?: { categoryId?; date?; source?: Todo['source'] })`
  - `useTodos().add(title, opts)`에 `source` 통과
  - `useProjects(): { projects; add(p: NewProject); update(id, patch) (name 변경 시 연결 할 일 `source.label` batch); remove(id) (연결 할 일 `source: null` batch); move(id, dir); loading }`

- [ ] **Step 1: 테스트** `src/lib/projects.test.ts`

```ts
test('projectTodos: only open todos linked to this project, oldest first', () => {
  const td = (id: string, refId: string | null, done = false, createdAt = id) => ({ id, title: id, date: '2026-10-31', done, doneAt: null, createdAt, categoryId: null, source: refId ? { type: 'project' as const, refId, label: 'P' } : null })
  expect(projectTodos([td('b', 'p1'), td('a', 'p1'), td('c', 'p2'), td('d', 'p1', true), td('e', null)], 'p1').map((x) => x.id)).toEqual(['a', 'b'])
})
test('researchCategoryId finds 연구/Research, else null', () => {
  const cat = (id: string, name: string) => ({ id, name, shade: 3 as const, order: 0 })
  expect(researchCategoryId([cat('a', '공부'), cat('b', '연구')])).toBe('b'); expect(researchCategoryId([cat('a', 'Research')])).toBe('a'); expect(researchCategoryId([cat('a', '공부')])).toBeNull()
})
test('splitProjects: active first list, paused/done in rest, both by order', () => {
  const p = (id: string, status: ProjectStatus, order: number) => normalizeProject({ name: id, status, order }, id)
  const { active, rest } = splitProjects([p('x', 'done', 0), p('b', 'active', 2), p('a', 'active', 1), p('y', 'paused', 1)])
  expect(active.map((q) => q.id)).toEqual(['a', 'b']); expect(rest.map((q) => q.id)).toEqual(['x', 'y'])
})
test('normalizeProject defaults', () => { expect(normalizeProject({}, 'p')).toMatchObject({ id: 'p', name: '', goal: '', status: 'active', note: '', order: 0 }) })
```
  `todos.test.ts`에 추가: `expect(newTodoDoc('x', '2026-10-31', { source: { type: 'project', refId: 'p1', label: 'P' } })?.source).toEqual({ type: 'project', refId: 'p1', label: 'P' })`.
- [ ] **Step 2: 실패 확인** — `npm test -- projects todos` → FAIL.
- [ ] **Step 3: 구현** — `projects.ts`, `todos.ts`(`source: opts?.source ?? null`), `useTodos.add` 타입에 `source` 추가. `useProjects.ts`: `update`에서 `patch.name`이 있고 바뀌면 `getDocs(query(todos, where('source.refId','==',id)))` → batch `source.label`; `remove`는 같은 조회로 `source: null` 후 삭제.
- [ ] **Step 4: 화면** — `ResearchPage`: `PageHeader`(제목 + "+ 프로젝트"), `useProjects`, `useTodos()`(오늘), `useCategories`; `splitProjects` → 활성 카드 목록, 아래 `details` "일시중지·완료 n개"에 나머지. `ProjectCard({ project, todos, onAddTodo(title), onToggle, onUpdateTodo, onRemoveTodo, onEdit, onSetStatus, onDelete })`: `Card bordered`; 이름(15px 700) + `Tag tone={STATUS_TONE[status]}`; 이번 주 목표 — 클릭 시 인라인 `input`(blur/Enter 저장, Escape 취소), 비어 있으면 `text-ink-faint` 플레이스홀더; 다음 할 일 `ul`(`TodoRow` 재사용, `shade` = 연구 카테고리 농도 또는 null) + 인라인 추가 행(`CategoryTodos.AddRow`를 `src/features/todos/AddTodoRow.tsx`로 추출해 공유; `onAdd(title)` → `todos.add(title, { categoryId: researchCategoryId(categories), source: { type: 'project', refId: id, label: name } })`); ⋯ 메뉴(수정 / 일시중지↔재개 / 완료 / 삭제 — `TodoRow` 메뉴 스타일). `ProjectForm` Modal: 이름(필수)·이번 주 목표·상태 Segmented·메모 Textarea. `TodoRow`: 제목 옆 `source?.label`을 `<span className="ml-1.5 text-[11px] text-ink-muted">`로 표시. `App.tsx` `/research` → `ResearchPage`.
- [ ] **Step 5: i18n `research.*`** — `title`(연구/Research), `add`(프로젝트 추가/Add project), `edit`, `name`(프로젝트 이름/Project name), `goal`(이번 주 목표/This week's goal), `goalPlaceholder`(이번 주에 끝낼 한 가지/One thing to finish this week), `nextTodos`(다음 할 일/Next steps), `addTodo`(할 일 추가/Add a step), `note`(메모/Notes), `status`, `s_active`(진행 중/Active), `s_paused`(일시중지/Paused), `s_done`(완료/Done), `pause`(일시중지/Pause), `resume`(재개/Resume), `finish`(완료로/Mark done), `inactive`(일시중지·완료 {n}개/Paused · done ({n})), `empty`(진행 중인 프로젝트가 없어요/No projects yet), `deleteConfirm`(삭제해도 연결된 할 일은 남아요. 삭제할까요?/Linked todos stay. Delete?), `errName`.
- [ ] **Step 6: 통과 확인** — `npm test` PASS; dev에서 보드에서 추가한 할 일이 홈 "연구" 묶음에 프로젝트 이름과 함께 보임.
- [ ] **Step 7: Commit** — `feat(research): project board linked to todos`

---

### Task 12: 백업·라우트·README 마무리

**Files:**
- Delete: `src/components/layout/Placeholder.tsx`
- Modify: `src/features/settings/exportImport.ts`, `src/features/settings/exportImport.test.ts`, `src/App.tsx`, `README.md`, `src/i18n/ko.json`, `src/i18n/en.json`, `docs/superpowers/specs/2026-10-30-v2-theme-grid-research-design.md`(§10 주소만)

**Interfaces:**
- Consumes: `CreditCat`, `Kind`, `Paper`, `Project` 타입.
- Produces: `COLLECTIONS = ['terms','courses','todos','schedule','categories','schools','creditCats','kinds','papers','projects']`; `validateImport(json): ExportData`에서 `collections`는 `Partial<…>`(키 없음 = `undefined`); `importAll`은 `undefined` 컬렉션을 건드리지 않음.

- [ ] **Step 1: 테스트** `exportImport.test.ts` — 'fills missing collections with empty arrays'와 'old backup … empty arrays' 두 테스트를 교체:

```ts
test('serialize writes all ten collections', () => {
  expect(Object.keys(JSON.parse(serialize(sample as never)).collections).sort()).toEqual(['categories', 'courses', 'creditCats', 'kinds', 'papers', 'projects', 'schedule', 'schools', 'terms', 'todos'])
})
test('validateImport leaves absent collections undefined and keeps present-but-empty arrays', () => {
  const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [], kinds: [] } }))
  expect(data.collections.terms).toEqual([]); expect(data.collections.kinds).toEqual([])
  expect(data.collections.creditCats).toBeUndefined(); expect(data.collections.categories).toBeUndefined()
})
```
  기존 'serialize produces versioned JSON' 테스트의 키 목록도 10개로 갱신.
- [ ] **Step 2: 실패 확인** — `npm test -- exportImport` → FAIL.
- [ ] **Step 3: 구현** — `ExportData.collections` 타입에 네 컬렉션 추가, `validateImport`는 `Array.isArray(c[name]) ? c[name] : undefined`를 `COLLECTIONS` 순회로; `serialize`는 `?? []`; `importAll`은 `if (!data.collections[name]) continue`. 가져오기 확인 문구 `settings.importConfirm`을 "파일에 있는 항목은 모두 바뀌고, 파일에 없는 항목은 그대로 둬요. 계속할까요?"/"Everything in the file replaces your data; collections missing from the file are left alone. Continue?"로 갱신.
- [ ] **Step 4: 라우트·잔재** — `App.tsx`에서 `Placeholder` import 삭제(파일 삭제), `common.comingSoon` 키 삭제. `grep -rn "Placeholder\|comingSoon" src` → 없음. ko/en의 키 집합이 같은지 확인: `node -e "const k=o=>Object.entries(o).flatMap(([a,b])=>typeof b==='string'?[a]:Object.keys(b).map(x=>a+'.'+x));const ko=k(require('./src/i18n/ko.json')),en=k(require('./src/i18n/en.json'));console.log(ko.filter(x=>!en.includes(x)),en.filter(x=>!ko.includes(x)))"` → `[] []`.
- [ ] **Step 5: README·스펙 §10** — 기능 목록에 테마 색·커버·이수 격자·시간표 종류·논문·연구 보드 추가; 배포 주소를 사용자가 Vercel 대시보드에 추가한 도메인으로(기본 제안 `studying-hub.vercel.app`; 사용자가 다른 이름을 골랐다면 그 이름) — 스펙 §10의 `studyinghub.vercel.app`도 같은 이름으로 수정. 홈 화면 설치 안내는 그대로.
- [ ] **Step 6: 최종 확인** — `npm test` PASS, `npm run build` 성공, `npm run preview`로 홈·학점·시간표·논문·연구·대학원·설정 7개 라우트 콘솔 에러 없음. 다크 모드로 바꿔 체크박스 체크·시간표 블록 글자가 읽히는지 확인.
- [ ] **Step 7: Commit** — `feat(backup): new collections, non-destructive import; wire papers/research routes; readme`

---

## 플랜 자체 점검 메모

- 스펙 §3.1 → T1(폰트·SW), T4(적용 지점). §3.2 → T1(변수), T2(농도 마이그레이션·STATUS_COLOR), T4(활성·오늘 칸·막대·그래프), T5(설정). §3.3 → T4·T5. §3.4 → T3. §4 → T7–T9. §5 → T6. §6 → T10. §7 → T11. §8 → T5(테마·커버·졸업 요건), T12(백업). §9 → T10·T11·T12. §10 → T12(README) + 사용자 대시보드 작업(코드 밖).
- 시그니처 일치 확인: `SHADE_CLASS[s].on`(T1) ← T2/T6; `kindStyle().bar`(T6)는 T2의 임시 `KIND_STYLE`에는 없음(T6에서 TodaySchedule을 함께 고침); `gridRows`/`cellCourses`(T7) ← T9; `renamePlan`(T7) ← T8 `rename`; `newTodoDoc` `source`(T11) ← `useTodos.add`.
- 배포는 플랜 밖: 사용자가 `vercel --prod --yes`, 도메인·Firebase 승인 도메인 추가.
