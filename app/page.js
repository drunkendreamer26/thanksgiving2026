import HomeClient from "@/components/HomeClient";
import { getEventWindow, getTopScores } from "@/app/actions";

// 랭킹을 5초간 캐시합니다. 동시 접속이 몰려도 DB 조회는 5초에 한 번으로 모입니다.
// 점수가 등록되면 submitScore 의 revalidatePath("/") 가 즉시 무효화하므로
// 새 기록이 늦게 반영되지는 않습니다.
export const revalidate = 5;

export default async function HomePage() {
  const [top, eventWindow] = await Promise.all([getTopScores(), getEventWindow()]);

  return (
    <HomeClient
      initialRows={top.ok ? top.rows : []}
      initialError={top.ok ? null : top.error}
      initialEventWindow={{ startAt: eventWindow.startAt, endAt: eventWindow.endAt }}
    />
  );
}
