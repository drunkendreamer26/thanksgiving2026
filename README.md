# 🌕 화재IT그룹 추석맞이 이벤트 — 달토끼 타임어택

30초 동안 떨어지는 송편 재료를 터치해 고득점에 도전하는 **모바일 전용** 이벤트 웹게임입니다.

- **Framework**: Next.js (App Router) + React 19
- **Styling**: Tailwind CSS v4
- **DB**: Supabase (Postgres)
- **Deploy**: Vercel

---

## 1. 빠른 시작

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

## 2. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 에 `supabase/schema.sql` 내용을 붙여넣고 실행
3. **Settings → API** 에서 키를 복사해 `.env.local` 작성

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # 서버 전용, 절대 공개 금지
```

> 읽기(랭킹 조회)는 anon 키 + RLS `select` 정책으로,
> 쓰기(점수 등록)는 Server Action 안에서 service_role 키로만 수행합니다.
> 브라우저에서는 DB 를 직접 수정할 수 없습니다.

## 3. Vercel 배포

1. 이 저장소를 Vercel 에 import
2. **Settings → Environment Variables** 에 위 3개 값을 등록
   (`SUPABASE_SERVICE_ROLE_KEY` 는 반드시 서버 전용으로)
3. Deploy

---

## 4. 화면 구성

| 경로 | 설명 |
|---|---|
| `/` | 타이틀 · Top 10 랭킹보드 · 내 순위 · 게임 시작 |
| `/game` | 달토끼 타임어택 플레이 → 종료 시 이름 입력 후 점수 등록 |

### 플레이 흐름

```
첫 화면(랭킹보드) → [게임 시작하기] → 3·2·1 카운트다운
   → 30초 플레이 → 게임 오버 오버레이
   → 이름 입력 후 [점수 등록하기] → 첫 화면으로 자동 이동
```

- 이름은 **공백 없이 한글·영문·숫자 1~12자**이며, **최초 1회만** 입력합니다. 이후 같은 기기에서는 자동으로 그 이름이 채워지고,
  결과 화면의 `변경` 또는 첫 화면의 `이름 변경` 으로 언제든 바꿀 수 있습니다.
- 랭킹은 **이름 기준 최고 점수**로 집계됩니다. 기존 최고점보다 높을 때만 갱신되며,
  갱신 시 달성일자(`created_at`)도 함께 갱신됩니다.
- 내 순위가 Top 10 밖이면 랭킹보드 하단에 `···` 과 함께 내 등수가 별도로 표시됩니다.

---

## 5. 게임 규칙

| 아이템 | 표기 | 점수 |
|---|---|---|
| 송편 반죽 / 쌀가루 / 팥 / 쑥 | 🥟 🍚 🌰 🌿 (금색 링) | **+100** |
| 황금 보름달 (희귀) | 🌕 (밝게 빛나는 링) | **+300** |
| 스페셜 재료 (1%) | 사진 (민트색 링) | **+500** |
| 탄 송편 / 상한 재료 | 🔥 🥀 (붉은 링) | **-150** + 0.6초 경직 |

- **스페셜 재료(1%)** 는 등장할 때 탄 송편·상한 재료를 양옆에 달고 내려옵니다.
  이미지는 `public/special.png` 를 교체하면 바뀝니다.
- 연속으로 좋은 아이템을 모으면 **5개마다 콤보 배수 +1** (최대 ×5)
- 방해 아이템을 터치하면 콤보가 초기화됩니다.
- 점수는 0점 아래로 내려가지 않습니다.
- 아이템은 화면 하단에 닿으면 자동으로 사라집니다.
- 시간이 지날수록 생성 주기가 짧아지고 낙하 속도가 빨라집니다.

밸런스 수치는 모두 `components/gameConfig.js` 와 `lib/constants.js` 에 모여 있습니다.

---

## 6. 프로젝트 구조

```
app/
  layout.js            루트 레이아웃 (모바일 세로 프레임)
  page.js              첫 화면 (서버 컴포넌트, 랭킹 초기 로드)
  actions.js           Server Actions (getTopScores / getMyRank / submitScore)
  game/page.js         게임 플레이 화면
  globals.css          Tailwind v4 + 테마 토큰
components/
  HomeClient.js        첫 화면 클라이언트 로직
  RankingBoard.js      Top 10 + 내 순위(··· 표기)
  GameCanvas.js        캔버스 게임 루프 (생성·낙하·터치 판정·이펙트)
  gameConfig.js        아이템/밸런스 상수
  ResultModal.js       게임 오버 + 이름 입력 + 점수 등록
  NightSky.js          밤하늘 배경
  usePlayerName.js     localStorage 기반 이름 기억
lib/
  supabase.js          공개(anon) 클라이언트 — 읽기 전용
  supabaseAdmin.js     서버 전용(service_role) 클라이언트 — 쓰기
  constants.js         제한 시간·이름 규칙·포맷 헬퍼
supabase/
  schema.sql           테이블 · 인덱스 · RLS 정책
```

## 7. 구현 메모

- 게임 상태는 전부 `useRef` 에 두고 캔버스에 직접 그립니다. React state 는
  HUD(점수·시간)만 0.1초 간격으로 갱신해 모바일에서도 프레임을 유지합니다.
- 탭 판정 반경은 아이템 반지름의 1.45배로 넉넉하게 잡아 손가락 터치를 보정합니다.
- 탭 전환 등으로 프레임이 튀는 것을 막기 위해 `dt` 는 100ms 로 클램프합니다.
- 이모지는 기기별 폰트가 달라서, 좋음/보너스/방해를 **링 색상**으로도 구분합니다.
