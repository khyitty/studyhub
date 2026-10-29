# StudyHub 리디자인("페이퍼") + 대학원 지원요건 트래커 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 앱의 모든 화면을 흰 바탕·검정 글자·각진 모서리의 "페이퍼" 스타일로 다시 입히고, 홈을 투두메이트 구조(주간 띠 + 카테고리별 할 일)로 재배치하며, `/grad` 에 대학원 지원요건 트래커(표/카드)를 추가한다.

**Architecture:** 기능 변경 없이 토큰(`@theme`)과 UI 프리미티브부터 바꾸고(Task 1–2), 그 위에 홈·학점·시간표를 재구성한다(Task 3–7). 트래커는 순수 로직(`src/lib/schools.ts`)을 먼저 테스트하고 훅·페이지를 올린다(Task 8–9). 마지막에 홈 D-day·설정·백업을 연결하고 잔여 구식 클래스를 걷어낸 뒤 배포한다(Task 10–11).

**Tech Stack:** 기존 그대로 — Vite 8, React 19, TS, Tailwind v4, react-router 8, Firebase JS SDK 13, Recharts 3, vitest 5 + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-29-redesign-gradtracker-design.md` (이하 "스펙"). 1단계 스펙 `2026-10-29-studyhub-design.md`의 §9는 이 스펙으로 대체됨.

## Global Constraints

- 모서리 반경: 카드/버튼/입력 `4px`, pill/태그 `3px`. `rounded-full`, `rounded-xl`, `rounded-[24px]` 등 새로 쓰지 않는다. 진행 막대 반경 0.
- 그림자: 모달·드롭다운 외에는 쓰지 않는다 (`shadow-soft` 토큰은 남기되 Modal에서만 사용).
- 색 토큰(라이트): `bg #ffffff`, `surface #ffffff`, `surface-2 #f5f5f5`, `ink #111111`, `ink-muted #8a8a8a`, `ink-faint #b5b5b5`, `line #ececec`, `line-strong #e3e3e3`, `primary #111111`, `on-primary #ffffff`, `danger #d86a8b`, `success #3da874`, `warn #c28a1b`.
- 파스텔 6색 (`fill` / `text`): `sky #a9c6f0/#7fa6e8`, `mint #a3dcc0/#6fbf9a`, `pink #f3b8cb/#e08ba8`, `butter #f6dc9a/#d1a93c`, `lilac #cdbff2/#a08bdc`, `peach #f7c6a9/#e39a6a`. Tailwind 클래스 이름: `bg-sky` / `text-sky-text` 식(토큰 `--color-sky`, `--color-sky-text`).
- 다크: `bg #111111`, `surface #161616`, `surface-2 #222222`, `ink #f2f2f2`, `ink-muted #9a9a9a`, `ink-faint #5a5a5a`, `line #262626`, `line-strong #333333`, `primary #f2f2f2`, `on-primary #111111`. 파스텔은 라이트와 동일.
- 글꼴 크기: 본문 14px(`text-sm`), 보조 12–13px, 페이지 제목 22px 700, 큰 숫자 30px 800 `tracking-[-1px]`. 숫자는 `tabular-nums`(body에 이미 `tnum`).
- 터치 타깃 ≥ 44px(모바일), 데스크톱 버튼 높이 40px. `<input>` 폰트 16px(`text-base`) 유지.
- 모든 사용자 노출 문자열은 `ko.json`/`en.json` 키. 이모지를 아이콘으로 쓰지 않는다. 캐릭터/일러스트 없음.
- 모바일 탭바 5개: 홈 · 학점 · 시간표 · 대학원 · 더보기. 사이드바: 홈 · 학점 · 시간표 · 논문 · 연구 · 대학원, 맨 아래 설정.
- 기본 카테고리: `공부(sky)`, `연구(mint)`, `대학원(pink)` — `profile.categoriesSeeded !== true` 이고 `categories`가 비었을 때 한 번만 생성.
- Firestore 경로: `users/{uid}/categories`, `users/{uid}/schools`. 규칙은 기존 와일드카드로 충분(변경 없음).
- `EXPORT_VERSION`은 1 유지. 예전 백업(두 컬렉션 없음)은 빈 배열로 읽힌다.
- 커밋은 태스크마다, 영어 conventional commits.
- 테스트 명령: `npm test` (vitest run). 모든 태스크 끝에 전체 스위트 녹색.

## Review Focus

1. **삭제된 카테고리를 가리키는 할 일**(`categoryId`가 존재하지 않는 id) — "기타" 묶음에 보여야 하고 앱이 죽으면 안 된다. → Task 3 `groupTodos` 테스트.
2. **마감이 오늘인 학교** — "D-day"로 표시되고 "지남"으로 분류되지 않는다; 어제 마감은 "지남"이고 정렬 맨 아래. → Task 8 `dday`/`sortSchools` 테스트.
3. **TOEFL 최소 점수는 있는데 내 점수가 없을 때** — "부족"이 아니라 "—". → Task 8 `toeflStatus` 테스트.
4. **다른 주의 날짜를 선택한 뒤 할 일 추가** — 오늘이 아니라 선택한 날짜로 저장. → Task 4 `newTodoDoc` 테스트.
5. **예전 백업 파일 가져오기**(`categories`/`schools` 키 없음) — 오류 없이 빈 배열. → Task 10 `validateImport` 테스트.

---

### Task 1: 토큰 + UI 프리미티브 교체

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx`, `Gauge.tsx`, `EmptyState.tsx`, `index.ts`
- Create: `src/components/ui/Tag.tsx`, `src/components/ui/Segmented.tsx`, `src/components/ui/PageHeader.tsx`
- Test: `src/components/ui/Tag.test.tsx`, `src/components/ui/Segmented.test.tsx`
- Modify: `src/features/settings/SettingsPage.tsx` (로컬 `Segmented` 제거 → ui에서 import)

**Interfaces:**
- Produces: `Tag({ tone: 'ok'|'warn'|'bad'|'none', children })`; `Segmented<T>({ value, options: {value:T,label:string}[], onChange, label, className? })`; `PageHeader({ title: string, subtitle?: string, action?: ReactNode })`; `Card` (이제 `tone` 없음, `bordered?: boolean` — 기본 false = 선 없는 섹션, true = 1px `line-strong` 테두리 4px); `Gauge` bar variant 반경 0 높이 4px(`size:'sm'`), ring variant 삭제(사용처 Task 5에서 제거).
- Tailwind 클래스: `bg-sky bg-mint bg-pink bg-butter bg-lilac bg-peach`, `text-sky-text …`, `border-sky …`, `text-ink-faint`, `border-line-strong`, `text-warn`, `bg-warn/12` 등.

- [ ] **Step 1: 실패하는 테스트 작성 — Tag**

```tsx
// src/components/ui/Tag.test.tsx
import { render, screen } from '@testing-library/react'
import { Tag } from './Tag'

test('Tag renders text with tone class', () => {
  render(<Tag tone="bad">필수</Tag>)
  const el = screen.getByText('필수')
  expect(el.className).toMatch(/text-danger/)
  expect(el.className).toMatch(/rounded-pill/)
})
test('Tag none tone is muted', () => {
  render(<Tag tone="none">—</Tag>)
  expect(screen.getByText('—').className).toMatch(/text-ink-muted/)
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/ui/Tag.test.tsx`
Expected: FAIL — `Cannot find module './Tag'`

- [ ] **Step 3: `Tag` 구현** (`src/components/ui/Tag.tsx`)

`<span className="inline-block rounded-pill px-2 py-0.5 text-[11px] font-semibold ...">`. tone → `ok: 'bg-success/12 text-success'`, `warn: 'bg-warn/12 text-warn'`, `bad: 'bg-danger/12 text-danger'`, `none: 'bg-surface-2 text-ink-muted'`.

- [ ] **Step 4: 실패하는 테스트 작성 — Segmented**

```tsx
// src/components/ui/Segmented.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { Segmented } from './Segmented'

test('Segmented marks selected option and calls onChange', () => {
  const onChange = vi.fn()
  render(<Segmented label="view" value="table" onChange={onChange} options={[{ value: 'table', label: '표' }, { value: 'cards', label: '카드' }]} />)
  expect(screen.getByRole('radio', { name: '표' })).toHaveAttribute('aria-checked', 'true')
  fireEvent.click(screen.getByRole('radio', { name: '카드' }))
  expect(onChange).toHaveBeenCalledWith('cards')
})
```

- [ ] **Step 5: 실패 확인**

Run: `npx vitest run src/components/ui/Segmented.test.tsx`
Expected: FAIL — `Cannot find module './Segmented'`

- [ ] **Step 6: `Segmented` 구현** — `SettingsPage.tsx`의 로컬 함수를 옮기고 스타일만 교체: 바깥 `inline-flex rounded-pill border border-line-strong p-[3px]`, 항목 `min-h-9 px-3 rounded-pill text-sm font-semibold`, 선택 `bg-primary text-on-primary`, 비선택 `text-ink-muted`. `SettingsPage.tsx`에서 로컬 정의 삭제하고 `import { Segmented } from '../../components/ui'`. `index.ts`에 `Tag`, `Segmented`, `PageHeader` export 추가.

- [ ] **Step 7: 테스트 통과 확인**

Run: `npx vitest run src/components/ui`
Expected: PASS (Tag 2, Segmented 1, Gauge 기존)

- [ ] **Step 8: `index.css` `@theme` 교체**

Global Constraints의 토큰으로 `@theme` 블록을 다시 쓴다. 기존 `*-deep`, `accent` 토큰은 Task 11에서 삭제하므로 그때까지 **임시 별칭**으로 둔다: `--color-peach-deep: #e39a6a`, `--color-lilac-deep: #a08bdc`, `--color-mint-deep: #6fbf9a`, `--color-butter-deep: #d1a93c`, `--color-accent: #111111` (`peach/lilac/mint/butter` 이름은 새 파스텔 `fill`과 같아서 그대로 새 값이 된다). 이렇게 해야 Task 2–7 사이에도 화면이 깨지지 않는다. 파스텔 6색은 `--color-<name>` 과 `--color-<name>-text` 두 토큰씩. `--radius-card: 4px`, `--radius-pill: 3px`. `.dark` 블록도 Global Constraints 값으로. `:focus-visible` outline 색은 `var(--color-ink)`.

- [ ] **Step 9: 프리미티브 스타일 교체**

- `Button`: `rounded-card`, variants → `primary: 'bg-primary text-on-primary hover:opacity-90'`, `secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-2'`, `ghost: 'text-ink-muted hover:bg-surface-2'`, `danger: 'text-danger hover:bg-danger/8'`; sizes `sm: 'min-h-9 px-3 text-sm'`, `md: 'min-h-10 md:min-h-10 min-h-11 px-4 text-sm'` (모바일 44px, 데스크톱 40px → `min-h-11 md:min-h-10`).
- `Input` base: `rounded-card border border-line-strong bg-surface px-3 text-base focus:border-ink focus:outline-none`.
- `Card`: `tone` prop 삭제, `bordered?: boolean`. 기본 `<section className="py-4">`(선 없음), bordered 시 `rounded-card border border-line-strong p-4`. 제목 `text-sm font-bold`.
- `Modal`: 패널 `rounded-card bg-surface shadow-soft` (모바일 하단 시트도 `rounded-t-card`), 닫기 버튼 `rounded-card`. `shadow-soft` 값은 `0 2px 8px rgba(0,0,0,.08)`.
- `Gauge`: `ring` variant 코드 삭제; bar는 트랙 `h-1 bg-surface-2`(size lg는 `h-1.5`) 반경 없음, fill 반경 없음. `Gauge.test.tsx`가 ring을 참조하면 그 케이스 삭제.
- `EmptyState`: `rounded-card border border-dashed border-line-strong bg-transparent`.
- `PageHeader`: `<header className="mb-5 flex items-end justify-between gap-3"><div><h1 className="text-[22px] font-bold tracking-[-0.4px]">{title}</h1>{subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}</div>{action}</header>`.

- [ ] **Step 10: 타입체크 + 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: tsc 오류 0 (Card `tone` 사용처 — `TermAccordion.tsx`의 `tone="butter"` — 는 여기서 prop만 제거), 테스트 전부 PASS.

- [ ] **Step 11: Commit**

```bash
git add src/index.css src/components/ui src/features/settings/SettingsPage.tsx src/features/grades/TermAccordion.tsx
git commit -m "feat(ui): paper design tokens and primitives (Tag, Segmented, PageHeader)"
```

---

### Task 2: 레이아웃·내비·로그인·더보기

**Files:**
- Modify: `src/components/layout/nav.ts`, `Sidebar.tsx`, `TabBar.tsx`, `Layout.tsx`, `Placeholder.tsx`
- Modify: `src/components/icons.tsx` (`IconGrad` 추가: 학사모 — `<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c0 1 2 3 5 3s5-2 5-3v-5"/>`; `Svg` 기본 `strokeWidth` 2 → 1.8)
- Modify: `src/features/more/MorePage.tsx`, `src/features/auth/LoginPage.tsx`
- Modify: `src/data/ProfileProvider.tsx` (theme-color `#ffffff` / `#111111`), `index.html`, `vite.config.ts` (manifest `theme_color`/`background_color` `#ffffff`)
- Modify: `src/i18n/ko.json`, `en.json` — `nav.grad: "대학원" / "Grad school"`, `nav.settings: "설정" / "Settings"`, `auth.title: "StudyHub"`, `auth.tagline: "학점 · 할 일 · 시간표 · 대학원 지원을 한 곳에서" / "Grades, to-dos, schedule and grad apps in one place"`, `auth.google: "Google로 계속하기" / "Continue with Google"`, `auth.busy: "로그인 중…" / "Signing in…"`; `more.deadlines`, `more.gradSchool` 키 삭제.
- Test: `src/components/layout/nav.test.ts`

**Interfaces:**
- Produces: `SIDEBAR_NAV: NavItem[]` (홈·학점·시간표·논문·연구·대학원), `SETTINGS_NAV: NavItem` (`/settings`), `TAB_NAV: NavItem[]` (홈·학점·시간표·대학원·더보기). `NAV` export 삭제.
- `/grad` 라우트는 Task 9에서 추가. 그 전까지는 `App.tsx`에 `<Route path="grad" element={<Placeholder titleKey="nav.grad" />} />` 를 이 태스크에서 넣어 둔다.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/components/layout/nav.test.ts
import { SIDEBAR_NAV, TAB_NAV, SETTINGS_NAV } from './nav'

test('tab bar has exactly 5 items: home, grades, timetable, grad, more', () => {
  expect(TAB_NAV.map((n) => n.to)).toEqual(['/', '/grades', '/timetable', '/grad', '/more'])
})
test('sidebar order and settings at the bottom', () => {
  expect(SIDEBAR_NAV.map((n) => n.to)).toEqual(['/', '/grades', '/timetable', '/papers', '/research', '/grad'])
  expect(SETTINGS_NAV.to).toBe('/settings')
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/components/layout/nav.test.ts`
Expected: FAIL — `SIDEBAR_NAV` is not exported

- [ ] **Step 3: `nav.ts` 구현** — 세 export, `nav.grad` 키는 `IconGrad`, 더보기는 `IconMore`, 설정은 `IconSettings`.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/components/layout/nav.test.ts`
Expected: PASS

- [ ] **Step 5: 레이아웃 재스타일**

- `Sidebar`: `w-[190px] border-r border-line bg-surface px-3.5 py-6`, 로고 `px-2.5 pb-4 text-[17px] font-extrabold tracking-[-0.3px]`, 링크 `flex min-h-10 items-center gap-2.5 rounded-card px-2.5 text-sm font-medium`, active `bg-surface-2 text-ink`, 비활성 `text-ink-muted hover:bg-surface-2/60`. 아이콘 `size={17}`. 맨 아래 `mt-auto`로 `SETTINGS_NAV`.
- `TabBar`: `TAB_NAV`, 높이 56px, active `text-ink`, 비활성 `text-ink-muted`, 활성 배경 pill 제거(아이콘 위 2px 검정 선 `border-t-2 border-ink` 대신 **아이콘 굵기만**: active면 `strokeWidth={2.2}`).
- `Layout`: `<main className="w-full max-w-[1100px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-24 md:px-8 md:pt-7 md:pb-8">` (`mx-auto` 제거 — 사이드바 옆 왼쪽 정렬).
- `Placeholder`: `PageTitle` 삭제하고 `PageHeader` 사용. 다른 파일의 `PageTitle` import는 각 태스크에서 교체(Task 2에서는 `MorePage`, `SettingsPage`, `GradesPage`, `TimetablePage`의 import를 `PageHeader`로 바꾸되 스타일 재작업은 각자 태스크).
- `MorePage`: 행 3개 — 논문(`/papers`, IconPaper) · 연구(`/research`, IconFlask) · 설정(`/settings`, IconSettings). 목록은 `divide-y divide-line` 선 구분, 카드/그림자 없음, 행 `min-h-14 text-sm font-medium`, 오른쪽 chevron `text-ink-faint`.
- `LoginPage`: 아이콘 박스 삭제. `bg-bg`, 제목 `text-[22px] font-bold`, 설명 `text-sm text-ink-muted`, 버튼 `Button`(primary, `w-full max-w-xs`), 모든 문자열 `t('auth.*')` (`useT`는 `LangContext` 기본 'ko'라 Provider 밖에서도 동작).
- theme-color: `ProfileProvider.applyTheme` → `dark ? '#111111' : '#ffffff'`; `index.html` meta와 `vite.config.ts` manifest도 `#ffffff`.

- [ ] **Step 6: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 그 다음 `npm run dev`로 띄워 데스크톱(사이드바 190px, 설정 맨 아래)과 375px(탭 5개, 더보기에 3줄)을 눈으로 확인.

- [ ] **Step 7: Commit**

```bash
git add -A src index.html vite.config.ts
git commit -m "feat(layout): paper sidebar/tab bar, grad tab, login and more pages"
```

---

### Task 3: 카테고리 데이터 (타입·순수 함수·훅·시드)

**Files:**
- Modify: `src/lib/types.ts` (`PaletteColor`, `Category`, `Todo.categoryId`)
- Create: `src/lib/categories.ts`, `src/lib/categories.test.ts`
- Modify: `src/data/profile.ts` (+`categoriesSeeded: boolean` 기본 false, +`toeflScore: number | null` 기본 null), `src/data/profile.test.ts`
- Create: `src/features/todos/useCategories.ts`
- Modify: `src/data/ProfileProvider.tsx` (시드 effect)

**Interfaces:**
- Produces (`src/lib/types.ts`):
  ```ts
  export type PaletteColor = 'sky' | 'mint' | 'pink' | 'butter' | 'lilac' | 'peach'
  export interface Category { id: string; name: string; color: PaletteColor; order: number }
  // Todo gets: categoryId: string | null
  ```
- Produces (`src/lib/categories.ts`):
  ```ts
  export const PALETTE: PaletteColor[]                       // 6, 위 순서
  export const PALETTE_CLASS: Record<PaletteColor, { fill: string; text: string; border: string }>  // 'bg-sky', 'text-sky-text', 'border-sky'
  export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[]   // 공부 sky 0, 연구 mint 1, 대학원 pink 2
  export const OTHER_GROUP_ID = '__other__'
  export interface TodoGroup { id: string; category: Category | null; todos: Todo[] }
  export function groupTodos(todos: Todo[], categories: Category[]): TodoGroup[]
  export function shouldSeedCategories(profile: Pick<Profile,'categoriesSeeded'>, categories: Category[], categoriesLoading: boolean, profileLoading: boolean): boolean
  export function normalizeCategory(raw: DocumentData, id: string): Category
  ```
  `groupTodos`: 카테고리 `order` 순으로 그룹(빈 그룹도 포함), 마지막에 `OTHER_GROUP_ID` 그룹(`categoryId`가 null이거나 존재하지 않는 id). 그룹 안 정렬은 입력 순서 유지. "기타" 그룹은 **할 일이 없어도 항상 포함**(추가 행을 보여야 하므로).
- Produces (`useCategories()`): `{ categories: Category[] (order 정렬), add(name, color): Promise<string>, update(id, patch), remove(id): Promise<void>, move(id, dir: -1|1): Promise<void>, loading }`. `remove`는 `users/{uid}/todos` 중 `categoryId === id` 인 문서를 `categoryId: null`로 batch 업데이트한 뒤 카테고리 삭제(`writeBatch`, 450 단위 — `useUserCollection.setMany`는 안 맞으므로 훅 안에서 직접 `writeBatch`).

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/categories.test.ts
import { groupTodos, shouldSeedCategories, OTHER_GROUP_ID, DEFAULT_CATEGORIES } from './categories'
import type { Category, Todo } from './types'

const cat = (id: string, order: number): Category => ({ id, name: id, color: 'sky', order })
const todo = (id: string, categoryId: string | null): Todo => ({ id, title: id, date: '2026-10-29', done: false, doneAt: null, source: null, createdAt: id, categoryId })

describe('groupTodos', () => {
  test('groups by category order, other group last and always present', () => {
    const g = groupTodos([todo('a', 'c2'), todo('b', 'c1'), todo('c', null)], [cat('c1', 0), cat('c2', 1)])
    expect(g.map((x) => x.id)).toEqual(['c1', 'c2', OTHER_GROUP_ID])
    expect(g[0].todos.map((t) => t.id)).toEqual(['b'])
    expect(g[2].todos.map((t) => t.id)).toEqual(['c'])
  })
  test('todo pointing at a deleted category falls into other', () => {
    const g = groupTodos([todo('a', 'gone')], [cat('c1', 0)])
    expect(g.at(-1)!.todos.map((t) => t.id)).toEqual(['a'])
  })
  test('empty categories → only the other group', () => {
    expect(groupTodos([], []).map((x) => x.id)).toEqual([OTHER_GROUP_ID])
  })
})

describe('shouldSeedCategories', () => {
  test('seeds only when loaded, not yet seeded, and empty', () => {
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], false, false)).toBe(true)
    expect(shouldSeedCategories({ categoriesSeeded: true }, [], false, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [cat('x', 0)], false, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], true, false)).toBe(false)
    expect(shouldSeedCategories({ categoriesSeeded: false }, [], false, true)).toBe(false)
  })
  test('default categories are 공부/연구/대학원', () => {
    expect(DEFAULT_CATEGORIES.map((c) => [c.name, c.color])).toEqual([['공부', 'sky'], ['연구', 'mint'], ['대학원', 'pink']])
  })
})
```

`src/data/profile.test.ts`에 추가:
```ts
test('new fields default: categoriesSeeded false, toeflScore null', () => {
  const p = normalizeProfile({})
  expect(p.categoriesSeeded).toBe(false)
  expect(p.toeflScore).toBeNull()
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/categories.test.ts src/data/profile.test.ts`
Expected: FAIL — module not found / `categoriesSeeded` undefined

- [ ] **Step 3: 구현** — `types.ts`, `categories.ts`, `profile.ts`(DEFAULT_PROFILE + normalize), `useCategories.ts`. `useTodos.normalizeTodo`에 `categoryId: raw.categoryId ? String(raw.categoryId) : null` 추가(이 줄만; 나머지 useTodos 변경은 Task 4).

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/categories.test.ts src/data/profile.test.ts`
Expected: PASS

- [ ] **Step 5: 시드 effect** — `ProfileProvider` 안에 `useCategories()`를 호출하고 `useEffect`: `shouldSeedCategories(profile, categories, loading, ctx.loading)`가 true면 `Promise.all(DEFAULT_CATEGORIES.map(add))` 후 `update({ categoriesSeeded: true })`. 중복 실행 방지용 `useRef(false)` 가드.

- [ ] **Step 6: 타입체크 + 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저에서 로그인 → Firestore 콘솔(또는 설정 내보내기)로 `categories` 3개 생성됐는지 확인, 새로고침해도 3개 그대로.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/categories.ts src/lib/categories.test.ts src/data src/features/todos
git commit -m "feat(todos): categories model, grouping, default seed"
```

---

### Task 4: `useTodos` 날짜 선택 + 카테고리 지원

**Files:**
- Modify: `src/features/todos/useTodos.ts`
- Create: `src/features/todos/todos.ts` (순수 함수), `src/features/todos/todos.test.ts`

**Interfaces:**
- Produces (`todos.ts`):
  ```ts
  export function todosOn(todos: Todo[], iso: string): Todo[]           // date === iso, createdAt 순
  export function completion(list: Todo[]): { done: number; total: number; ratio: number }  // total 0 → ratio 0
  export function newTodoDoc(title: string, selectedDate: string, opts?: { categoryId?: string | null; date?: string }): Omit<Todo, 'id'> | null
    // title trim 후 빈 문자열 → null; date 기본 selectedDate; categoryId 기본 null; done false; createdAt now ISO
  ```
- Produces (`useTodos(selectedDate: string = todayISO())`): 기존 필드 유지 + `selected: Todo[]` (선택 날짜), `selectedStats: {done,total,ratio}`, `today`/`completionRatio`는 **오늘 기준 그대로**(confetti용). `add(title, opts?: { categoryId?: string | null; date?: string })` — `date` 기본값은 **`selectedDate`**. 새 `update(id, patch: Partial<Pick<Todo,'title'|'categoryId'|'date'>>)`.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/features/todos/todos.test.ts
import { completion, todosOn } from './todos'
import type { Todo } from '../../lib/types'
const t = (id: string, date: string, done = false): Todo => ({ id, title: id, date, done, doneAt: null, source: null, createdAt: id, categoryId: null })

test('todosOn filters by date keeping createdAt order', () => {
  expect(todosOn([t('b', '2026-10-30'), t('a', '2026-10-30'), t('c', '2026-10-29')], '2026-10-30').map((x) => x.id)).toEqual(['a', 'b'])
})
test('completion counts done over total; empty is 0', () => {
  expect(completion([t('a', 'd', true), t('b', 'd')])).toEqual({ done: 1, total: 2, ratio: 0.5 })
  expect(completion([])).toEqual({ done: 0, total: 0, ratio: 0 })
})
test('newTodoDoc defaults date to the selected date and category to null', () => {
  expect(newTodoDoc(' 과제 ', '2026-11-03')).toMatchObject({ title: '과제', date: '2026-11-03', categoryId: null, done: false, doneAt: null, source: null })
  expect(newTodoDoc('x', '2026-11-03', { categoryId: 'c1', date: '2026-11-05' })).toMatchObject({ categoryId: 'c1', date: '2026-11-05' })
  expect(newTodoDoc('   ', '2026-11-03')).toBeNull()
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/todos/todos.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: `todos.ts` 구현, `useTodos` 수정** — `todayList`/`overdue`는 기존, `selected = todosOn(todos, selectedDate)`, `add`는 `newTodoDoc(title, selectedDate, opts)`가 null이면 무시, 아니면 `col.add`. `update` 추가. 기존 `useTodos()` 호출(HomePage)은 인자 없이도 동작.

- [ ] **Step 4: 통과 확인 + 전체**

Run: `npx vitest run src/features/todos && npx tsc -b && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/todos
git commit -m "feat(todos): selected-date list, category-aware add, update"
```

---

### Task 5: 홈 재구성 (투두메이트 구조)

**Files:**
- Modify: `src/lib/dates.ts` (+`weekDays(weekStart): string[]` 7개, +`formatDateHeading(iso, lang): string` → ko `"10월 29일 수요일"`, en `"Wednesday, October 29"`, +`formatShortDate(iso): string` → `"10/30"`), `src/lib/dates.test.ts`
- Create: `src/features/home/WeekStrip.tsx`, `src/features/home/CategoryTodos.tsx`, `src/features/home/CompletionStat.tsx`, `src/features/home/CategoryManager.tsx`, `src/features/todos/TodoRow.tsx`
- Modify: `src/features/home/HomePage.tsx`, `src/features/home/TodaySchedule.tsx`
- Delete: `src/features/home/TodayGauge.tsx`, `src/features/home/TodayTodos.tsx`, `src/features/todos/TodoList.tsx`
- Modify: `src/i18n/ko.json`, `en.json` — `home` 키 추가/변경:
  `summary: "안녕, {name}. {date} 할 일 {total}개 중 {done}개 끝냈어요." / "Hi {name}. {done} of {total} done for {date}."` (date 자리에는 오늘이면 `common.today` 값, 아니면 `formatShortDate`), `completion: "오늘 완료율" / "Today's progress"`, `completionOn: "{date} 완료율" / "Progress on {date}"`, `deadlines: "마감 D-day" / "Deadlines"`, `noSchools: "대학원 지원에서 학교를 추가해 보세요" / "Add schools under Grad school"`, `addTodoHere: "할 일 추가" / "Add to-do"`, `other: "기타" / "Other"`, `manageCategories: "카테고리 관리" / "Manage categories"`, `categoryName: "이름" / "Name"`, `categoryColor: "색" / "Color"`, `addCategory: "카테고리 추가" / "Add category"`, `deleteCategoryConfirm: "삭제하면 이 카테고리의 할 일은 '기타'로 옮겨져요. 삭제할까요?" / "To-dos in this category move to Other. Delete?"`, `moveDate: "날짜 옮기기" / "Move to date"`, `changeCategory: "카테고리 바꾸기" / "Change category"`, `prevWeek/nextWeek: "이전 주"/"다음 주"`, `backToToday: "오늘" / "Today"`. 기존 `progress`, `todayTodos`, `todoPlaceholder`, `addTodo` 유지.

**Interfaces:**
- Consumes: `useTodos(selectedDate)` (Task 4), `useCategories()`, `groupTodos`, `PALETTE_CLASS` (Task 3), `Segmented/Modal/Button/Input/Tag` (Task 1).
- Produces:
  - `WeekStrip({ selected: string, onSelect(iso) })` — 내부 state `weekStart`(초기 `startOfWeek(selected)`), ‹ › 버튼(`aria-label` prevWeek/nextWeek), 오늘 칸 `bg-primary text-on-primary rounded-card`, 주말 `text-ink-faint`, 선택(오늘 아님) 칸 `border border-ink`. 오늘이 보이지 않는 주면 오른쪽에 `backToToday` 작은 버튼.
  - `TodoRow({ todo, color: PaletteColor | null, onToggle, onUpdate(patch), onRemove, categories })` — 17px 네모 체크박스(`rounded-[3px]`, 미완료 `border-[1.5px] ${border}`, 완료 `${fill}` + 흰 `IconCheck size 11 strokeWidth 3`; color null이면 `border-line-strong`/`bg-ink-faint`), 제목 `text-sm`, 완료 `line-through text-ink-faint`. 오른쪽 ⋯ 버튼(호버/포커스 시 표시, 모바일은 항상 `opacity-60`) → 작은 메뉴(`absolute`, `shadow-soft`, 항목: 수정(인라인 input으로 제목 편집) · 카테고리 바꾸기(카테고리 목록 서브메뉴) · 날짜 옮기기(`<input type="date">`) · 삭제).
  - `CategoryTodos({ groups: TodoGroup[], onToggle, onAdd(title, categoryId), onUpdate, onRemove, categories, onManage })` — 제목 행 "오늘 할 일 3 / 7"(선택 날짜가 오늘 아니면 `home.todayTodos` 대신 `formatShortDate` + " 할 일"), 오른쪽 ⋯ → `onManage`. 각 그룹: 라벨 `text-xs font-bold ${PALETTE_CLASS[color].text}`(기타는 `text-ink-muted`), 행들, 마지막에 점선 체크박스 "할 일 추가" 행 → 클릭 시 같은 자리에서 `<input>`(16px) Enter 저장 / Esc·blur 취소.
  - `CompletionStat({ stats, dateLabel })` — 제목 + `text-[30px] font-extrabold tracking-[-1px]` 숫자 + `%` + 4px 검정 막대(`Gauge size="sm"`).
  - `CategoryManager({ open, onClose })` — 모달: 목록 행(이름 input, 색 네모 6개 `h-6 w-6 rounded-[3px] ${fill}` 선택 시 `ring-2 ring-ink`, ↑↓ 버튼, 삭제), 아래 "카테고리 추가" 행. 삭제는 `window.confirm(t('home.deleteCategoryConfirm'))`.
- `HomePage` 구조: `Confetti` → 헤더(왼쪽 `formatDateHeading(selected)` 22px + `home.summary`; 오른쪽 pill `Lv.{level} · {current} / {needed} XP` 1px 테두리) → overdue 배너(1px `border-line-strong` 상자, `text-sm`, 버튼 secondary sm) → `WeekStrip` → `grid gap-6 md:grid-cols-[1.25fr_0.75fr]`: 왼쪽 `CategoryTodos`, 오른쪽 `CompletionStat` / `TodaySchedule`(오늘 고정) / D-day 섹션(**Task 10에서 추가** — 지금은 자리 비움) 를 `divide-y divide-line` 로 구분. `selected` state 초기값 `todayISO()`. confetti는 `todos.completionRatio`(오늘) 기준 그대로.
- `TodaySchedule` 재스타일: Card 제거, 제목 `text-sm font-bold` + 오른쪽 링크 `text-xs text-ink-muted`; 행 `flex items-center gap-3 py-1.5 text-[13px]`, 시간 `w-11 text-xs text-ink-muted tabular-nums`(시작만), 막대 `w-[3px] h-[26px] ${PALETTE_CLASS[kindColor].fill}`(kind→색 매핑은 Task 7의 `KIND_COLOR`; 이 태스크에서 `schedule.ts`에 `KIND_COLOR: Record<ScheduleKind, PaletteColor> = { class:'sky', research:'mint', work:'butter', other:'lilac' }` 를 먼저 추가), 진행 중 행은 제목 `font-bold`, 지난 행 `text-ink-faint`.

- [ ] **Step 1: 실패하는 테스트 작성 (dates)**

```ts
// src/lib/dates.test.ts 에 추가
import { formatDateHeading, formatShortDate, weekDays } from './dates'
test('weekDays returns Mon..Sun from a Monday', () => {
  expect(weekDays('2026-10-26')).toEqual(['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01'])
})
test('formatDateHeading ko/en', () => {
  expect(formatDateHeading('2026-10-29', 'ko')).toBe('10월 29일 목요일')
  expect(formatDateHeading('2026-10-29', 'en')).toBe('Thursday, October 29')
})
test('formatShortDate drops leading zeros', () => {
  expect(formatShortDate('2026-10-05')).toBe('10/5')
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: FAIL — not exported

- [ ] **Step 3: `dates.ts` 구현** — `formatDateHeading`은 `fromISO(iso).toLocaleDateString(lang==='ko'?'ko-KR':'en-US', { month:'long', day:'numeric', weekday:'long' })`.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/dates.test.ts`
Expected: PASS

- [ ] **Step 5: 컴포넌트 구현 + HomePage 조립** (위 Interfaces대로). `TodoList.tsx`, `TodayGauge.tsx`, `TodayTodos.tsx` 삭제. `Gauge.test.tsx`가 ring을 검사하면 Task 1에서 이미 제거됨.

- [ ] **Step 6: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저: (a) 카테고리 3개 묶음 + 기타 묶음 보임, (b) 공부 묶음의 "할 일 추가"로 추가하면 `categoryId`가 공부, (c) 내일 칸 클릭 → 헤더 날짜·완료율 제목 바뀜, 오늘 일정은 그대로, (d) 내일에 추가한 할 일은 내일에만 보임, (e) ⋯ → 카테고리 바꾸기 동작, (f) 카테고리 관리에서 삭제 → 해당 할 일 기타로 이동, (g) 375px에서 세로 배치, 가로 스크롤 없음.

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "feat(home): todo-mate layout with week strip, category groups, completion stat"
```

---

### Task 6: 학점 페이지 재스타일

**Files:**
- Create: `src/features/grades/KpiRow.tsx`, `src/features/grades/gradesSubtitle.ts`, `src/features/grades/gradesSubtitle.test.ts`
- Modify: `src/features/grades/GradesPage.tsx`, `GpaChart.tsx`, `GradGauges.tsx`, `TermAccordion.tsx`, `Simulator.tsx`, `CourseForm.tsx`, `ImportModal.tsx`
- Delete: `src/features/grades/SummaryCards.tsx`
- Modify: `ko.json`/`en.json` — `grades.subtitle: "{from} ~ {to} · {n}개 학기" / "{from} – {to} · {n} terms"`, `grades.portalMatch: "포탈과 일치" / "Matches portal"`, `grades.portalDiff: "포탈과 {diff} 차이" / "{diff} off portal"`, `grades.targetPresets` 불필요(숫자 그대로).

**Interfaces:**
- Produces: `gradesSubtitle(terms: Term[], cumulative: number | null, portal: number | null, t): string` — terms 비면 `''`; `"2024-1 ~ 2026-1 · 6개 학기"` + (portal 있으면 ` · 포탈과 일치` 또는 ` · 포탈과 0.02 차이`, 차이 > 0.01 기준).
- `KpiRow({ g })` — `grid grid-cols-2 md:grid-cols-4 rounded-card border border-line-strong divide-x divide-line` 4칸: 누적 평점 `/ 4.5`, 전공 평점 `/ 4.5`, 취득 학점 `/ {required}`(required 0이면 분모 생략), 4.0 환산 `/ 4.0`. 라벨 `text-[11px] text-ink-muted`, 값 `text-[22px] font-extrabold tracking-[-0.5px]`, 분모 `text-[11px] text-ink-muted ml-1`. 포탈 불일치 시 누적 칸 아래 `Tag tone="warn"` 로 `grades.portalDiff`.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/features/grades/gradesSubtitle.test.ts
import { gradesSubtitle } from './gradesSubtitle'
import { translate } from '../../i18n/useT'
const t = (k: string, v?: Record<string, string | number>) => translate('ko', k, v)
const term = (code: string) => ({ code, label: code, order: 0, requested: null, earned: null, totalPoints: null, gpaCert: null, gpa: null, gpa100: null })

test('range, count and portal match', () => {
  expect(gradesSubtitle([term('2024-1'), term('2026-1')], 4.21, 4.21, t)).toBe('2024-1 ~ 2026-1 · 2개 학기 · 포탈과 일치')
})
test('portal difference shown to 2 decimals', () => {
  expect(gradesSubtitle([term('2024-1')], 4.21, 4.25, t)).toBe('2024-1 ~ 2024-1 · 1개 학기 · 포탈과 0.04 차이')
})
test('no portal → no suffix; no terms → empty', () => {
  expect(gradesSubtitle([term('2024-1')], 4.2, null, t)).toBe('2024-1 ~ 2024-1 · 1개 학기')
  expect(gradesSubtitle([], null, null, t)).toBe('')
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/grades/gradesSubtitle.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: `gradesSubtitle.ts` 구현** (terms는 `order` 오름차순 가정; 첫/마지막 `code`).

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/features/grades/gradesSubtitle.test.ts`
Expected: PASS

- [ ] **Step 5: 페이지 재스타일**

- `GradesPage`: `PageHeader title subtitle={gradesSubtitle(...)} action={<Button onClick=…>포탈 붙여넣기</Button>}`; 본문 `space-y-6`: `KpiRow` → `grid gap-6 md:grid-cols-[1.3fr_0.7fr]`: 왼쪽 `GpaChart` + `TermAccordion`, 오른쪽 `GradGauges` + `Simulator` (`divide-y divide-line`).
- `GpaChart`: Card 제거, 제목 `text-sm font-bold` + 오른쪽 `text-xs text-ink-muted` "학기 · 누적". `CartesianGrid stroke="var(--color-line)"`, 축 tick `fill: var(--color-ink-muted)`, `Legend` 제거, term 선 `stroke="var(--color-ink)" strokeWidth={2.2} dot={{ r: 3.5, fill: 'var(--color-ink)', strokeWidth: 0 }}`, cum 선 `stroke="var(--color-line-strong)" strokeWidth={2} dot={false}`, 툴팁 `contentStyle` 반경 4 테두리 `line-strong` 그림자 없음. 높이 `h-40`.
- `TermAccordion`: `details` 카드/그림자 제거 → `border-t border-line` 행, summary `min-h-11 text-[13px]`: 학기 `font-bold`, 가운데 `text-xs text-ink-muted` "{n}과목 · {m}학점", 평점 `font-bold tabular-nums`. 과목 행 `grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3.5 py-1.5 text-[13px]` (과목명 / 이수구분 `text-xs text-ink-muted` / 학점 `text-xs text-ink-muted` / 등급 `font-bold`), 재수강 대체 행 `text-ink-faint` + 과목명 옆 `text-[11px] text-danger` "재수강 대체". `manual` 표시는 `Tag tone="none"`. 미배정 섹션은 `Card bordered`.
- `GradGauges`: Card 제거, 제목 `text-sm font-bold`; 행 `flex justify-between text-[13px] py-1.5`, 라벨 / `font-bold` "89 / 130", 아래 `Gauge size="sm"` 색: total `var(--color-ink)`, major `var(--color-sky)`, liberal `var(--color-mint)`.
- `Simulator`: `details` 유지하되 테두리/그림자 없음, 제목 `text-sm font-bold`; 목표 평점은 pill 3개(4.2·4.3·4.4, `Segmented`처럼 보이되 `aria-pressed` 버튼, 선택 `bg-primary text-on-primary`) + 오른쪽 직접 입력 `Input`(w-20). 결과 문장 `text-[13px]` (불가능 시 `text-danger`), 배경색 상자 제거.
- `CourseForm`, `ImportModal`: 프리미티브가 바뀌어 대부분 자동. 남은 `rounded-xl/rounded-full/bg-butter/bg-mint/text-*-deep` 류를 `Tag`/`text-warn`/`border` 로 교체.

- [ ] **Step 6: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저: KPI 4칸 한 상자, 선 그래프 검정/회색, 학기 펼치기, 375px에서 KPI 2×2.

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "feat(grades): paper restyle with KPI row, flat chart and term list"
```

---

### Task 7: 시간표 재스타일

**Files:**
- Modify: `src/features/timetable/schedule.ts` (`KIND_STYLE` 교체), `schedule.test.ts`, `WeekView.tsx`, `MonthView.tsx`, `TimetablePage.tsx`, `ScheduleForm.tsx`

**Interfaces:**
- Produces: `KIND_COLOR` (Task 5에서 추가됨) 기준으로 `KIND_STYLE: Record<ScheduleKind, { bg: string; text: string; border: string }>` = `PALETTE_CLASS[KIND_COLOR[kind]]` 의 `{ fill→bg, text, border }`. `dot` 필드 삭제(사용처는 `bg`로).

- [ ] **Step 1: 실패하는 테스트 작성** (`schedule.test.ts`에 추가)

```ts
import { KIND_COLOR, KIND_STYLE } from './schedule'
test('schedule kinds map to pastel palette classes', () => {
  expect(KIND_COLOR).toEqual({ class: 'sky', research: 'mint', work: 'butter', other: 'lilac' })
  expect(KIND_STYLE.class).toEqual({ bg: 'bg-sky', text: 'text-sky-text', border: 'border-sky' })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/timetable/schedule.test.ts`
Expected: FAIL — `KIND_STYLE.class` has `dot` / old classes

- [ ] **Step 3: `schedule.ts` 구현**, 사용처 수정:
- `WeekView`: 헤더 버튼들 `rounded-card`, 이번 주 버튼 `border border-line-strong bg-surface text-sm`, 주말 토글 `aria-pressed` 선택 `bg-primary text-on-primary`. 그리드 상자 `rounded-card border border-line-strong` 그림자 없음. 오늘 열 `bg-surface-2/60`, 오늘 날짜 숫자 `bg-primary text-on-primary rounded-card`. 블록: `rounded-card border-l-[3px] ${st.border} ${st.bg} text-ink` (흰 글자 금지), `shadow-sm` 제거, 장소 `text-ink/70`.
- `MonthView`: 셀 `rounded-none border-t border-l border-line` 1px 격자(`grid-cols-7` 상자에 `border-r border-b`), 선택 셀 `bg-surface-2`, 오늘 숫자 `bg-primary text-on-primary rounded-card h-6 w-6`. 점은 `h-1.5 w-1.5 rounded-[1px] ${st.bg}`. 아래 날짜별 목록 행 카드 제거 → `divide-y divide-line`, 종류 표시는 `Tag`처럼 `${st.bg} text-ink` 작은 pill.
- `TimetablePage`: `PageHeader title action={포탈 붙여넣기 secondary}`; 주간/월간은 `Segmented`. FAB `rounded-card bg-primary text-on-primary shadow-soft`(모바일만 `md:hidden`; 데스크톱은 헤더 action에 "+ 일정 추가" primary 버튼 추가).
- `ScheduleForm`: 종류 칩 `${KIND_STYLE[k].bg} text-ink` 선택 시 `ring-2 ring-ink`; 요일/반복 `Chip`은 `rounded-pill border border-line-strong`, 선택 `bg-primary text-on-primary`.

- [ ] **Step 4: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저: 주간 블록 파스텔 + 왼쪽 선 + 검정 글자, 월간 1px 격자.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat(timetable): paper restyle, pastel kind colors"
```

---

### Task 8: 대학원 지원 — 모델·순수 로직·훅

**Files:**
- Modify: `src/lib/types.ts` (`School`, `GreReq`, `SopState`, `SchoolStatus`)
- Create: `src/lib/schools.ts`, `src/lib/schools.test.ts`, `src/features/grad/useSchools.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type GreReq = 'required' | 'optional' | 'none'
  export type SopState = 'none' | 'todo' | 'draft' | 'done'
  export type SchoolStatus = 'interested' | 'preparing' | 'submitted' | 'accepted' | 'rejected'
  export interface School {
    id: string; name: string; program: string; deadline: string; gre: GreReq; toeflMin: number | null
    recsRequired: number; recsDone: number; sop: SopState; fee: string; status: SchoolStatus
    notes: string; links: { title: string; url: string }[]; professors: { name: string; note: string }[]; createdAt: string
  }
  ```
- Produces (`schools.ts`):
  ```ts
  export const SCHOOL_STATUSES: SchoolStatus[]            // interested, preparing, submitted, accepted, rejected
  export const STATUS_COLOR: Record<SchoolStatus, PaletteColor | null>  // interested null, preparing 'butter', submitted 'mint', accepted 'sky', rejected null
  export function normalizeSchool(raw: DocumentData, id: string): School   // 결측 → 기본값(gre 'none', sop 'todo', recsRequired 3, recsDone 0, status 'interested', links/professors [])
  export function dday(deadline: string, today: string): number            // deadline - today (days); 음수 = 지남
  export function ddayLabel(n: number): string                             // 0 → 'D-day', 5 → 'D-5', -2 → 'D+2'
  export function toeflStatus(min: number | null, mine: number | null): 'ok' | 'short' | 'unknown'   // min null 또는 mine null → unknown; mine >= min → ok
  export function recsStatus(done: number, required: number): 'ok' | 'warn'  // done >= required → ok
  export type SortKey = 'deadline' | 'name' | 'status'
  export function sortSchools(list: School[], key: SortKey, today: string): School[]
    // deadline: 지나지 않은 것 D-day 오름차순, 그 뒤 지난 것(가장 최근 지난 것 먼저). name: localeCompare. status: SCHOOL_STATUSES 순, 동률은 deadline 규칙.
  export type StatusFilter = 'all' | SchoolStatus | 'result'              // 'result' = accepted + rejected
  export function filterSchools(list: School[], f: StatusFilter): School[]
  export function nearestDeadlines(list: School[], today: string, n = 3): School[]
    // status ∈ {interested, preparing} 이고 dday >= 0 인 것만, D-day 오름차순 n개
  ```
- Produces (`useSchools()`): `{ schools: School[], add(s: Omit<School,'id'|'createdAt'>): Promise<string>, update(id, patch), remove(id), loading }`.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// src/lib/schools.test.ts
import { dday, ddayLabel, filterSchools, nearestDeadlines, normalizeSchool, recsStatus, sortSchools, toeflStatus } from './schools'
import type { School } from './types'
const s = (id: string, deadline: string, status: School['status'] = 'preparing'): School =>
  ({ ...normalizeSchool({ name: id, program: 'Stat PhD', deadline, status }, id) })

test('dday and label', () => {
  expect(dday('2026-12-01', '2026-10-29')).toBe(33)
  expect(dday('2026-10-29', '2026-10-29')).toBe(0)
  expect(dday('2026-10-27', '2026-10-29')).toBe(-2)
  expect(ddayLabel(0)).toBe('D-day'); expect(ddayLabel(5)).toBe('D-5'); expect(ddayLabel(-2)).toBe('D+2')
})
test('toeflStatus: unknown when either side missing', () => {
  expect(toeflStatus(100, null)).toBe('unknown'); expect(toeflStatus(null, 90)).toBe('unknown')
  expect(toeflStatus(84, 82)).toBe('short'); expect(toeflStatus(84, 84)).toBe('ok')
})
test('recsStatus', () => { expect(recsStatus(3, 3)).toBe('ok'); expect(recsStatus(2, 3)).toBe('warn') })
test('sortSchools by deadline puts past ones last, today counts as upcoming', () => {
  const out = sortSchools([s('late', '2026-12-15'), s('past', '2026-10-01'), s('today', '2026-10-29'), s('soon', '2026-12-01')], 'deadline', '2026-10-29')
  expect(out.map((x) => x.id)).toEqual(['today', 'soon', 'late', 'past'])
})
test('filterSchools result = accepted + rejected', () => {
  const list = [s('a', '2026-12-01', 'accepted'), s('b', '2026-12-01', 'rejected'), s('c', '2026-12-01', 'submitted')]
  expect(filterSchools(list, 'result').map((x) => x.id)).toEqual(['a', 'b'])
  expect(filterSchools(list, 'all')).toHaveLength(3)
})
test('nearestDeadlines: only interested/preparing and not past, max n', () => {
  const list = [s('a', '2026-12-01'), s('b', '2026-11-15', 'submitted'), s('c', '2026-10-01'), s('d', '2026-11-20', 'interested'), s('e', '2026-12-10')]
  expect(nearestDeadlines(list, '2026-10-29', 2).map((x) => x.id)).toEqual(['d', 'a'])
})
test('normalizeSchool fills defaults', () => {
  const x = normalizeSchool({ name: 'X' }, 'x')
  expect(x).toMatchObject({ gre: 'none', sop: 'todo', recsRequired: 3, recsDone: 0, status: 'interested', links: [], professors: [], toeflMin: null, fee: '' })
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/schools.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: `types.ts`, `schools.ts`, `useSchools.ts` 구현** (`dday`는 `fromISO` 차이를 `Math.round(ms / 86400000)`).

- [ ] **Step 4: 통과 확인 + 전체**

Run: `npx vitest run src/lib/schools.test.ts && npx tsc -b && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/schools.ts src/lib/schools.test.ts src/features/grad
git commit -m "feat(grad): school model, d-day/requirement logic, hook"
```

---

### Task 9: 대학원 지원 페이지 (표 · 카드 · 폼)

**Files:**
- Create: `src/features/grad/GradPage.tsx`, `SchoolTable.tsx`, `SchoolCards.tsx`, `SchoolDetail.tsx`, `SchoolForm.tsx`, `SchoolCells.tsx`
- Modify: `src/App.tsx` (`/grad` → `GradPage`, Placeholder 제거)
- Modify: `ko.json`/`en.json` — 새 `grad` 섹션:
  `title: "대학원 지원" / "Grad school apps"`, `subtitle: "{n}개 학교" / "{n} schools"`, `subtitleNearest: "{n}개 학교 · 가장 가까운 마감 {dday} ({name})" / "{n} schools · nearest deadline {dday} ({name})"`, `add: "학교 추가" / "Add school"`, `edit: "학교 수정" / "Edit school"`, `view: "보기" / "View"`, `table: "표" / "Table"`, `cards: "카드" / "Cards"`, `all: "전체" / "All"`, `status: "상태" / "Status"`, `s_interested: "관심" / "Interested"`, `s_preparing: "준비 중" / "Preparing"`, `s_submitted: "제출" / "Submitted"`, `s_accepted: "합격" / "Accepted"`, `s_rejected: "불합격" / "Rejected"`, `result: "결과" / "Results"`, `school: "학교 · 프로그램" / "School · Program"`, `name: "학교명" / "School"`, `program: "프로그램" / "Program"`, `programHint: "학위까지 한 줄로, 예: Statistics PhD" / "Include the degree, e.g. Statistics PhD"`, `deadline: "마감" / "Deadline"`, `past: "지남" / "Past"`, `gre: "GRE"`, `gre_required: "필수" / "Required"`, `gre_optional: "선택" / "Optional"`, `gre_none: "불요" / "Not needed"`, `toefl: "TOEFL"`, `toeflMin: "TOEFL 최소" / "TOEFL minimum"`, `toeflOk: "충족" / "Met"`, `toeflShort: "부족 (내 점수 {score})" / "Short (mine {score})"`, `recs: "추천서" / "Letters"`, `recsRequired: "추천서 필요 수" / "Letters needed"`, `recsDone: "추천서 확보 수" / "Letters secured"`, `sop: "SOP"`, `sop_none: "—"`, `sop_todo: "미작성" / "Not started"`, `sop_draft: "초안" / "Draft"`, `sop_done: "완료" / "Done"`, `fee: "지원비" / "Fee"`, `notes: "메모" / "Notes"`, `links: "링크" / "Links"`, `linkTitle: "제목" / "Title"`, `linkUrl: "URL"`, `addLink: "링크 추가" / "Add link"`, `professors: "관심 교수" / "Professors"`, `profName: "이름" / "Name"`, `profNote: "한 줄 메모" / "Note"`, `addProf: "교수 추가" / "Add professor"`, `deleteConfirm: "이 학교를 삭제할까요?" / "Delete this school?"`, `empty: "지원할 학교를 추가해 보세요" / "Add a school to apply to"`, `errName: "학교명을 입력해주세요" / "Enter the school"`, `errProgram: "프로그램을 입력해주세요" / "Enter the program"`, `errDeadline: "마감일을 골라주세요" / "Pick a deadline"`, `sortHint: "열 머리글을 누르면 정렬돼요" / "Click a header to sort"`.

**Interfaces:**
- Consumes: Task 8 전부, `Segmented/Tag/Modal/Button/Input/Select/Textarea/PageHeader`.
- Produces:
  - `SchoolCells.tsx`: `DeadlineCell({ school, today })` (날짜 `M/D` + `ddayLabel` 굵게; `dday <= 7` → `text-danger`; 지남 → `text-ink-faint` + `grad.past`), `GreTag`, `ToeflCell({ school, mine })`, `RecsTag`, `SopTag`, `StatusCell` (`h-2 w-2 rounded-[1px]` 색 네모 + 글자; 색 null이면 `bg-ink-faint`). 셀들은 표와 카드가 공유.
  - `SchoolTable({ schools, today, mine, sortKey, onSort, expandedId, onToggle, onEdit, onDelete })` — `overflow-x-auto` 래퍼, `<table className="w-full text-[13px]">`, `th` `text-[11px] font-semibold text-ink-muted text-left px-2.5 py-2 border-b border-line whitespace-nowrap` (정렬 가능 열은 버튼, 현재 키에 `▾`), `td` `px-2.5 py-2.5 border-b border-line/70 whitespace-nowrap`, 학교 셀 `font-bold` + 아래 `text-[11px] text-ink-muted font-normal` 프로그램. 행 클릭 → `onToggle(id)`; 펼친 행 아래 `<tr>` colSpan 전체에 `SchoolDetail`.
  - `SchoolCards({ schools, today, mine, onOpen })` — `space-y-2.5`; 카드 `rounded-card border border-line-strong p-3.5 text-[13px]`; 머리 학교명 `font-bold` + 오른쪽 `DeadlineCell`; 프로그램 · 마감 `text-[11px] text-ink-muted`; 행 `flex justify-between py-1 border-t border-line/70` (GRE · TOEFL · 추천서 · SOP · 지원비 · 상태). 클릭 → `onOpen(school)` (모달에 `SchoolDetail`).
  - `SchoolDetail({ school, onEdit, onDelete })` — 메모(`whitespace-pre-wrap`), 링크(`<a target="_blank" rel="noopener">`), 교수 목록, 버튼 수정(secondary) · 삭제(danger, `window.confirm`).
  - `SchoolForm({ open, onClose, school: School | null, onSave(data) })` — 필드 순서: 학교명, 프로그램(hint), 마감일(date), GRE(Select), TOEFL 최소(number), 추천서 필요/확보(number 2칸), SOP(Select), 지원비(text), 상태(Select), 메모(Textarea), 링크(반복 행 제목+URL+삭제, "링크 추가"), 관심 교수(반복 행 이름+메모+삭제, "교수 추가"). 검증: `validateSchool(d): string[]` (i18n 키 — `grad.errName`, `grad.errProgram`, `grad.errDeadline`) — `schools.ts`에 두고 테스트 1개 추가(Step 1).
  - `GradPage`: `useSchools`, `useProfile`(`toeflScore`), state `view: 'table'|'cards'`(기본 table; `md` 미만에서는 항상 cards — `window.matchMedia('(min-width: 768px)')` 훅 `useIsDesktop()`을 `src/lib/useIsDesktop.ts`에 작성), `filter`, `sortKey`(기본 deadline), `expandedId`, `editing`, `adding`. 헤더 `PageHeader title subtitle={gradSubtitle(...)} action={<>{desktop && <Segmented …표/카드 />}<Button>+ 학교 추가</Button></>}`. 필터 pill 행(`flex flex-wrap gap-1.5`, `aria-pressed`, 선택 `bg-primary text-on-primary`, 개수 포함 "준비 중 3"). 빈 상태 `EmptyState`. 표 아래 `text-xs text-ink-muted` `grad.sortHint`.

- [ ] **Step 1: 실패하는 테스트 작성** (`schools.test.ts`에 추가; `gradSubtitle(list, today, t)`도 `schools.ts`에 — `''`(0개) | `grad.subtitle` | `grad.subtitleNearest`, `nearestDeadlines` 첫 항목 기준)

```ts
import { gradSubtitle, validateSchool } from './schools'
import { translate } from '../i18n/useT'
const t = (k: string, v?: Record<string, string | number>) => translate('ko', k, v)
test('validateSchool requires name, program, deadline', () => {
  expect(validateSchool({ name: ' ', program: '', deadline: '' })).toEqual(['grad.errName', 'grad.errProgram', 'grad.errDeadline'])
  expect(validateSchool({ name: 'X', program: 'Stat PhD', deadline: '2026-12-01' })).toEqual([])
})
test('gradSubtitle', () => {
  expect(gradSubtitle([], '2026-10-29', t)).toBe('')
  expect(gradSubtitle([s('a', '2026-10-01')], '2026-10-29', t)).toBe('1개 학교')
  expect(gradSubtitle([s('Stanford', '2026-12-01'), s('b', '2026-12-10')], '2026-10-29', t)).toBe('2개 학교 · 가장 가까운 마감 D-33 (Stanford)')
})
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/schools.test.ts`
Expected: FAIL — `validateSchool` not exported

- [ ] **Step 3: `validateSchool`, `gradSubtitle` 구현 (i18n 키는 Step 4에서 추가하므로 여기서 `grad.subtitle`/`grad.subtitleNearest`/`grad.err*` 키를 먼저 넣는다), 통과 확인**

Run: `npx vitest run src/lib/schools.test.ts`
Expected: PASS

- [ ] **Step 4: 컴포넌트·페이지·라우트·i18n 구현** (Interfaces대로)

- [ ] **Step 5: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저: 학교 3개 추가(마감 과거/오늘/미래 하나씩) → 표 정렬(과거 맨 아래, 오늘 D-day), 헤더 클릭 정렬 전환, 행 펼침, 카드 전환, 375px에서 카드만·전환 버튼 없음, 수정/삭제, 설정에 TOEFL 미입력 시 TOEFL 태그 "—".

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat(grad): requirements tracker page with table, cards and form"
```

---

### Task 10: 홈 D-day · 설정 TOEFL · 백업 호환 · 설정 재스타일

**Files:**
- Create: `src/features/home/DeadlineList.tsx`
- Modify: `src/features/home/HomePage.tsx` (오른쪽 세 번째 섹션)
- Modify: `src/features/settings/SettingsPage.tsx` (TOEFL 필드 + 재스타일), `exportImport.ts`, `exportImport.test.ts`
- Modify: `ko.json`/`en.json` — `settings.grad: "대학원" / "Grad school"`, `settings.toefl: "내 TOEFL 점수 (선택)" / "My TOEFL score (optional)"`, `settings.toeflHint: "대학원 지원 표에서 최소 점수와 비교해요" / "Compared with each school's minimum"`.

**Interfaces:**
- Consumes: `nearestDeadlines`, `ddayLabel`, `dday` (Task 8), `useSchools`.
- Produces: `DeadlineList({ schools, today })` — 제목 `home.deadlines`; 행 `flex justify-between py-2 text-[13px]`: 왼쪽 "{name} · {M/D}", 오른쪽 `ddayLabel` `font-bold` (`dday <= 7` → `text-danger`, 3번째 이후 없음); 전체가 `<Link to="/grad">`. 학교 0개 → `home.noSchools` `text-ink-muted`.
- `exportImport.ts`: `COLLECTIONS = ['terms','courses','todos','schedule','categories','schools']`, `ExportData.collections`에 `categories: Category[]`, `schools: School[]`. `validateImport`는 누락 키를 `[]`로.
- `SettingsPage`: `Card`(선 없는 섹션) + 섹션 제목 `text-sm font-bold`, 섹션 사이 `divide-y divide-line`; "현재 학기" 아래 "대학원" 섹션에 `Input type=number` TOEFL (`Draft`에 `toeflScore` 추가, 빈 값 → null). 계정 섹션 아바타 `rounded-card`.

- [ ] **Step 1: 실패하는 테스트 작성** (`exportImport.test.ts`에 추가/수정)

```ts
test('serialize includes categories and schools', () => {
  const parsed = JSON.parse(serialize({ ...sample, collections: { ...sample.collections, categories: [{ id: 'c', name: '공부' }], schools: [] } } as never))
  expect(Object.keys(parsed.collections).sort()).toEqual(['categories', 'courses', 'schedule', 'schools', 'terms', 'todos'])
})
test('old backup without categories/schools still imports with empty arrays', () => {
  const data = validateImport(JSON.stringify({ version: EXPORT_VERSION, collections: { terms: [], courses: [], todos: [], schedule: [] } }))
  expect(data.collections.categories).toEqual([])
  expect(data.collections.schools).toEqual([])
})
```
기존 `serialize` 테스트의 키 목록 기대값도 6개로 갱신.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/features/settings/exportImport.test.ts`
Expected: FAIL — `categories` undefined

- [ ] **Step 3: `exportImport.ts` 구현, 통과 확인**

Run: `npx vitest run src/features/settings/exportImport.test.ts`
Expected: PASS

- [ ] **Step 4: `DeadlineList` + HomePage 연결 + Settings 변경**

- [ ] **Step 5: 타입체크 + 테스트 + 브라우저 확인**

Run: `npx tsc -b && npm test`
Expected: PASS. 브라우저: 홈 오른쪽에 D-day 3개(제출/합격/지남 제외), 설정에서 TOEFL 82 저장 → 대학원 표에서 최소 84 학교가 "부족 (내 점수 82)". 내보내기 JSON에 `categories`·`schools` 포함.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat: home deadlines, toefl score setting, backup includes categories and schools"
```

---

### Task 11: 잔여 정리 · 다크 모드 · 빌드 · 배포

**Files:**
- Modify: 잔여 사용처 전부 (grep 결과에 따라), `README.md` (대학원 지원 트래커 한 단락, 디자인 문구 갱신)

- [ ] **Step 1: 구식 클래스/토큰 잔여 검사**

Run:
```bash
grep -rnE "peach-deep|lilac-deep|mint-deep|butter-deep|bg-peach|bg-lilac|bg-butter|text-accent|ring-accent|rounded-full|rounded-xl|rounded-\[2|rounded-lg|shadow-sm|PageTitle|TodoList|TodayGauge|SummaryCards" src --include=*.tsx --include=*.ts
```
Expected: 출력 없음. 그 다음 `index.css`에서 Task 1의 임시 별칭(`*-deep`, `accent`)을 삭제하고 `npx tsc -b && npm run build`가 통과하는지 확인. `shadow-soft`는 `Modal.tsx`, 드롭다운 메뉴(`TodoRow`), FAB(`TimetablePage`)에만.

- [ ] **Step 2: 다크 모드 확인** — 설정에서 테마 다크 → 홈·학점·시간표·대학원·설정 다섯 화면을 보고 글자가 안 보이는 곳(특히 파스텔 체크박스 위 흰 체크, 표 테두리) 수정.

- [ ] **Step 3: 빌드 + 전체 테스트**

Run: `npm run build && npm test`
Expected: 빌드 성공(tsc 0 오류), 테스트 전부 PASS. PWA 프리캐시 경고 없음.

- [ ] **Step 4: README 갱신 + Commit**

```bash
git add -A
git commit -m "chore: remove legacy tokens, dark mode pass, readme"
```

- [ ] **Step 5: 배포**

Run: `vercel --prod --yes`
Expected: `https://studyhub-brown-nu.vercel.app` 로 Production 배포 완료 출력. 브라우저 탭을 닫았다 다시 열어(서비스 워커 갱신) 새 디자인 확인.

- [ ] **Step 6: Push**

```bash
git push origin main
```
