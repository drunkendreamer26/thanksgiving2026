import HomeClient from "@/components/HomeClient";
import { getTopScores } from "@/app/actions";

// 랭킹은 항상 최신 데이터를 보여줍니다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const top = await getTopScores();

  return (
    <HomeClient
      initialRows={top.ok ? top.rows : []}
      initialError={top.ok ? null : top.error}
    />
  );
}
