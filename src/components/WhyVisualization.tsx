import React from "react";
import { WhyItem } from "../types";
import { ArrowDown, Network, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface WhyVisualizationProps {
  whyHistory: WhyItem[];
  currentWhyIndex: number;
  currentQuestion: string;
  isCompleted: boolean;
}

export default function WhyVisualization({
  whyHistory,
  currentWhyIndex,
  currentQuestion,
  isCompleted,
}: WhyVisualizationProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#114037] text-white rounded-xl shadow-md shadow-[#114037]/10">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">5Why 인과관계 계통 분석 (Causal Chain Map)</h3>
            <p className="text-[11px] text-slate-700 font-semibold mt-0.5">현상(Symptom)부터 최상위 시스템(System) 원인까지 단계별 정밀 인과 관계 맵</p>
          </div>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#114037] bg-[#114037]/10 px-3 py-1 rounded-full border border-[#114037]/20">
            <CheckCircle className="w-3.5 h-3.5 text-[#2e7d72]" /> 분석 완료
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 relative">
        {/* Why 1~5 흐름도 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
          {[1, 2, 3, 4, 5].map((idx) => {
            const historyItem = whyHistory.find((item) => item.index === idx);
            const isCurrent = idx === currentWhyIndex && !isCompleted;
            const isFuture = idx > currentWhyIndex && !isCompleted;
            const isPassed = idx < currentWhyIndex || isCompleted;

            let bgColor = "bg-slate-100 border border-slate-300 text-slate-600 shadow-xs";
            let badgeColor = "bg-slate-300 text-slate-800 font-extrabold";
            if (isCurrent) {
              bgColor = "bg-[#114037]/5 border-2 border-[#114037] text-slate-900 shadow-sm ring-4 ring-[#114037]/15";
              badgeColor = "bg-[#114037] text-white font-extrabold";
            } else if (isPassed) {
              bgColor = "bg-emerald-50 border border-emerald-300 text-slate-900 font-semibold shadow-sm";
              badgeColor = "bg-[#2e7d72] text-white font-extrabold";
            }

            return (
              <div key={idx} className="relative flex flex-col items-center w-full">
                <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className={`w-full rounded-xl p-3.5 text-center flex flex-col justify-between h-[155px] ${bgColor} relative z-10 transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider ${badgeColor}`}>
                      Why {idx}
                    </span>
                    {isPassed && (
                      <span className="text-[9px] text-[#2e7d72] font-bold bg-[#2e7d72]/10 border border-[#2e7d72]/20 px-1 py-0.2 rounded">
                        확정
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] text-[#114037] font-bold bg-[#114037]/10 border border-[#114037]/20 px-1 py-0.2 rounded animate-pulse">
                        분석중
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-h-0">
                    {/* 질문 및 대답 */}
                    {isPassed && historyItem ? (
                      <div className="space-y-1">
                        <p className="text-[10.5px] font-bold text-slate-700 line-clamp-1">Q: {historyItem.question}</p>
                        <p className="text-[11px] font-bold text-slate-900 line-clamp-3 leading-snug">{historyItem.answer}</p>
                      </div>
                    ) : isCurrent ? (
                      <div className="space-y-1">
                        <p className="text-[11px] font-extrabold text-[#114037] leading-snug line-clamp-3">Q: {currentQuestion}</p>
                        <p className="text-[9.5px] text-[#2e7d72] italic font-bold animate-pulse">답변 입력 대기</p>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-600 font-semibold italic">대기 중</p>
                    )}
                  </div>
                </motion.div>

                {/* 화살표 가이드라인 (모바일/웹 반응형) */}
                {idx < 5 && (
                  <>
                    <div className="hidden md:block absolute top-[75px] -right-2.5 z-20 text-slate-500">
                      <ArrowRight className={`w-4 h-4 ${isPassed ? "text-[#2e7d72]" : "text-slate-400"}`} />
                    </div>
                    <div className="block md:hidden my-2 text-slate-500">
                      <ArrowDown className={`w-4 h-4 ${isPassed ? "text-[#2e7d72]" : "text-slate-400"}`} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 인과 관계 단계 요약 가이드 */}
        <div className="bg-slate-100 rounded-xl p-3 border border-slate-300 text-[10.5px] text-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-3 text-center font-bold mt-2">
          <div className="flex items-center justify-center gap-1"><span className="text-[#2e7d72] font-extrabold">①</span> 직접적 요인</div>
          <div className="hidden sm:flex items-center justify-center gap-1"><span className="text-[#2e7d72] font-extrabold">②</span> 기계/물리적 요인</div>
          <div className="hidden sm:flex items-center justify-center gap-1"><span className="text-[#2e7d72] font-extrabold">③</span> 공정 제어 요인</div>
          <div className="hidden sm:flex items-center justify-center gap-1"><span className="text-[#2e7d72] font-extrabold">④</span> 작업 표준 요인</div>
          <div className="flex items-center justify-center gap-1"><span className="text-[#2e7d72] font-extrabold">⑤</span> 조직적 시스템 원인</div>
        </div>
      </div>
    </div>
  );
}
