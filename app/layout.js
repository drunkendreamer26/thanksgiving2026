import "./globals.css";
import { EVENT_TITLE, GAME_TITLE } from "@/lib/constants";

export const metadata = {
  title: `${EVENT_TITLE} | ${GAME_TITLE}`,
  description: "30초 안에 송편 재료를 모아 최고 점수에 도전하세요! 화재IT그룹 추석맞이 이벤트.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        {/* 모바일 전용 레이아웃: 데스크톱에서도 세로형 프레임으로 중앙 정렬 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-[#0a0a1f] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
          {children}
        </div>
      </body>
    </html>
  );
}
