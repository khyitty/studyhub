# StudyHub

학점 · 논문 · 시간표 · 할 일을 한 곳에서 관리하는 개인 학업 앱. 노트북 브라우저와 아이폰·아이패드 홈 화면에서 같은 데이터를 봅니다.

## 이게 뭔가

- **홈**: 오늘 할 일과 완료율 게이지, 레벨/XP, 오늘 일정
- **학점**: 포탈 성적을 붙여넣으면 누적 평점·전공 평점·4.0 환산·졸업 요건 게이지·학기별 추이·목표 시뮬레이터
- **시간표**: 주간 시간표 + 월간 캘린더, 수업/연구/일/기타 색 구분
- **더보기 → 설정**: 앱 이름, 언어(한/영), 테마, 현재 학기, 졸업 요건, 4.0 환산표, JSON 백업
- 논문 · 연구 보드 · 마감 D-day · 대학원 지원 트래커는 다음 단계에서 추가

데이터는 본인 Google 계정으로 로그인한 Firebase에 저장되고, 기기마다 자동으로 동기화됩니다. 오프라인에서도 마지막으로 본 내용은 열립니다.

## 노트북에서 쓰기

1. 배포 주소(`https://<프로젝트>.vercel.app`)를 Chrome에서 연다.
2. **Google로 계속하기** → 본인 계정 선택.
3. 주소창 오른쪽 "앱 설치" 아이콘을 누르면 독립 창으로도 쓸 수 있다. (선택)

## 아이폰 · 아이패드 홈 화면에 추가

1. Safari로 배포 주소를 연다. (Chrome 말고 Safari)
2. 아래(아이패드는 위) **공유** 버튼 → **홈 화면에 추가** → **추가**.
3. 홈 화면의 StudyHub 아이콘으로 열고 Google 로그인을 한 번 한다.
4. 이후에는 아이콘만 누르면 바로 열린다. 로그인은 유지된다.

## 포탈 성적 붙여넣기

1. 포탈 → 성적조회 화면에서 **학기별 성적 표**를 드래그해 전체 선택 → 복사.
2. 앱 → 학점 → **포탈 붙여넣기** → 첫 번째 칸에 붙여넣기.
3. 같은 화면의 **과목별 성적 표**를 전체 선택 → 복사 → 두 번째 칸에 붙여넣기.
4. **미리보기**에서 학기별 과목 수·학점 합이 맞는지 보고 **저장**.
5. 다시 붙여넣으면 포탈 과목은 새 내용으로 바뀌고, 직접 추가한 과목은 그대로 남는다.

학기 표에 "신청학점" 합계와 과목 학점 합이 안 맞으면 경고가 뜨고, 남는 과목은 "학기 미배정"에 모여서 학기를 직접 고를 수 있다.

## 기능 추가 요청 흐름

1. Claude에게 원하는 기능을 말한다. (예: "논문 탭에 DOI로 추가하는 기능 넣어줘")
2. Claude가 코드를 고치고 `git push` 한다.
3. Vercel이 자동으로 다시 배포한다. 1~2분 뒤 노트북·아이폰에서 앱을 다시 열면 새 버전이 적용된다. (홈 화면 앱은 완전히 닫았다가 다시 열기)

데이터 구조는 필드 추가만으로 확장되게 짜여 있어서, 기능이 늘어나도 기존 데이터를 옮길 필요가 없다. 혹시 모를 때를 위해 설정의 **JSON 내보내기**로 백업할 수 있다.

## 개발자용

```bash
npm install
cp .env.example .env.local   # Firebase 웹 앱 키 5개 입력
npm run dev                  # http://localhost:5173
npm test                     # 파서·학점 계산·날짜·XP 단위 테스트
npm run build                # dist/ (PWA manifest + service worker 포함)
npm run icons                # public/icons/icon.svg → PNG 아이콘 재생성
```

- 스택: Vite + React + TypeScript + Tailwind v4, Firebase Auth(Google) + Firestore, react-router, recharts, vite-plugin-pwa
- 구조: `src/features/<기능>/` 폴더 하나가 기능 하나. 새 기능 = 새 폴더 + `App.tsx` 라우트 한 줄 + `components/layout/nav.ts` 메뉴 한 줄
- 포탈 파서: `src/lib/parsers/` (순수 함수 + 실제 포탈 텍스트 픽스처로 테스트). 시간표 파서는 `parseTimetable.ts` 스텁 — 포탈 시간표 형식을 받으면 채운다
- Firestore 규칙: `users/{uid}/**` 본인만 읽기/쓰기 (`firestore.rules`, `firebase deploy --only firestore:rules`)
- 설계 문서: `docs/superpowers/specs/`, 구현 계획: `docs/superpowers/plans/`
