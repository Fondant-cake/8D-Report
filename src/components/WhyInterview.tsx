import React, { useState, useEffect } from "react";
import { WhyItem, DefectInput } from "../types";
import { MessageSquare, HelpCircle, Send, CheckCircle2, User, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WhyInterviewProps {
  currentWhyIndex: number;
  currentQuestion: string;
  whyHistory: WhyItem[];
  isLoading: boolean;
  isCompleted: boolean;
  rootCause: string;
  onAnswerSubmit: (answer: string) => void;
  onReset: () => void;
  defectInput: DefectInput;
}

export default function WhyInterview({
  currentWhyIndex,
  currentQuestion,
  whyHistory,
  isLoading,
  isCompleted,
  rootCause,
  onAnswerSubmit,
  onReset,
  defectInput,
}: WhyInterviewProps) {
  const [answer, setAnswer] = useState("");
  const [smartHints, setSmartHints] = useState<string[]>([]);

  // Generate dynamic, realistic suggestions depending on the current question and defect
  useEffect(() => {
    if (isCompleted || !currentQuestion) {
      setSmartHints([]);
      return;
    }

    const q = currentQuestion.toLowerCase();
    let hints: string[] = [];

    if (currentWhyIndex === 1) {
      if (q.includes("크랙") || q.includes("crack")) {
        hints = [
          "냉각 구간에서의 열팽창 계수 차이 및 과속 냉각 충격 때문입니다.",
          "Reflow 컨베이어 속도가 느려 과도한 열량이 흡수 되었기 때문입니다.",
          "솔더 크림 도포 두께가 불균일하여 접합력 편차가 컸기 때문입니다."
        ];
      } else if (q.includes("사출") || q.includes("치수")) {
        hints = [
          "금형 내부 가스 압력 과다로 사출 충전이 불충분했기 때문입니다.",
          "수지 용융 온도가 기준치보다 낮아 미충전 현상이 발생했기 때문입니다.",
          "금형 코어 냉각수가 누수되어 국부적인 온도 변동이 일어났기 때문입니다."
        ];
      } else {
        hints = [
          "해당 공정 설비의 작동 조건 센서 오동작 및 이상 편차 때문입니다.",
          "작업자가 해당 작업 표준 지침(SOP)을 누락하고 조작했기 때문입니다.",
          "부품 입고 시 자재 수치 스펙 편차가 허용치를 초과했기 때문입니다."
        ];
      }
    } else if (currentWhyIndex === 2) {
      hints = [
        "해당 냉각 설비 팬의 속도를 정밀 제어하는 인버터가 불량이었기 때문입니다.",
        "작업 지침서에 가동 전 파라미터 보정(Calibration) 절차가 없었기 때문입니다.",
        "정기 보전 주기(PM) 초과로 인한 노후화로 압력 밸브가 오작동했기 때문입니다."
      ];
    } else if (currentWhyIndex === 3) {
      hints = [
        "설비 PM 표준 절차서에 공기 압력 필터 클리닝 지침이 명시되지 않았기 때문입니다.",
        "작업 표준서(SOP) 개정이 장기간 지연되어 과거 사양으로 운전했기 때문입니다.",
        "신임 작업자 배치 시 공정 품질 영향 요소에 대한 숙련 교육이 미흡했기 때문입니다."
      ];
    } else if (currentWhyIndex === 4) {
      hints = [
        "품질 부서의 변경점 관리(MOC) 프로세스가 현장에 누락 적용되었기 때문입니다.",
        "사내 엔지니어링 표준 수립 시 환경적 변화 요소 검토 기준이 결여되었기 때문입니다.",
        "주기적인 공정 감사(Audit) 항목에 설비 노화 매개변수 점검 체크리스트가 없었기 때문입니다."
      ];
    } else {
      hints = [
        "조직 내부의 정기 교육 예산 감축 및 부서 간 전파 협의 절차가 부재했기 때문입니다.",
        "ISO9001 품질 경영 매뉴얼에 명시된 공정 제어 문서 감리 시스템이 작동하지 않았기 때문입니다.",
        "설계 이력 데이터 아카이빙 솔루션이 개발 부서 내에서만 한정 관리되었기 때문입니다."
      ];
    }

    setSmartHints(hints);
  }, [currentQuestion, currentWhyIndex, isCompleted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;
    onAnswerSubmit(answer.trim());
    setAnswer("");
  };

  const handleApplyHint = (hint: string) => {
    setAnswer(hint);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md flex flex-col overflow-hidden h-[630px] justify-between">
      {/* 5Why INTERVIEW ENGINE 헤더 */}
      <div className="bg-slate-900 px-5 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-[#114037] rounded-lg flex items-center justify-center text-xs text-white font-bold shadow-md shadow-[#114037]/10">
            5W
          </div>
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase">5Why Interview Engine</h3>
            <p className="text-[10px] text-slate-300 font-bold">계통형 근본 원인 분석 시뮬레이터</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#114037]/10 text-[#2e7d72] border border-[#2e7d72]/20 px-2 py-0.5 rounded font-mono font-bold">
            STEP {currentWhyIndex}/5
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>

      {/* 대화창 영역 */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 shadow-inner">
        <AnimatePresence initial={false}>
          {/* 최초 진입 시스템 메시지 */}
          <motion.div
            key="system-init-msg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1.5 max-w-[90%]"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-4.5 h-4.5 bg-slate-800 rounded flex items-center justify-center text-[9px] text-slate-200 font-bold">AI</div>
              <span className="text-[10px] font-extrabold text-slate-700 tracking-wider">G8D ANALYZER BOT</span>
            </div>
            <div className="bg-white p-3.5 rounded-r-xl rounded-bl-xl border border-slate-200/80 shadow-xs text-xs text-slate-800 leading-relaxed font-semibold">
              품질 분석 세션이 생성되었습니다. 국제 품질 규격 가이드에 맞춰 정확한 핵심 원인을 추적할 수 있도록 5단계 공학적 질문 인터뷰를 제공합니다. 아래 옵션을 참고하거나 자유롭게 기입하여 답해 주세요.
            </div>
          </motion.div>

          {/* 대화 히스토리 */}
          {whyHistory.map((item, idx) => (
            <div key={`step-turn-${item.index}-${idx}`} className="space-y-4">
              {/* 질문 */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-1.5 max-w-[90%]"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-4.5 h-4.5 bg-slate-800 rounded flex items-center justify-center text-[9px] text-slate-200 font-bold">AI</div>
                  <span className="text-[10px] font-extrabold text-slate-700 tracking-wider">QC BOT | STEP {item.index}</span>
                </div>
                <div className="bg-[#114037]/5 p-3.5 rounded-r-xl rounded-bl-xl border border-[#114037]/20 text-xs text-[#114037] leading-relaxed font-bold">
                  Why {item.index}: {item.question}
                </div>
              </motion.div>

              {/* 사용자 답변 */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col items-end gap-1.5 max-w-[90%] ml-auto"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-700 tracking-wider">현장품질 엔지니어</span>
                  <div className="w-4.5 h-4.5 bg-[#2e7d72]/10 rounded flex items-center justify-center text-[9px] text-[#2e7d72] font-bold">ME</div>
                </div>
                <div className="bg-[#2e7d72] text-white p-3.5 rounded-l-xl rounded-br-xl text-xs font-bold leading-relaxed text-left shadow-xs">
                  {item.answer}
                </div>
              </motion.div>
            </div>
          ))}

          {/* 로딩 표시 */}
          {isLoading && (
            <motion.div
              key="interview-loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 max-w-[90%] bg-[#114037]/5 border border-[#114037]/10 p-3 rounded-lg"
            >
              <svg className="animate-spin h-3.5 w-3.5 text-[#2e7d72] shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-[10px] text-[#114037] font-medium">CFT 마스터가 공학적 원인 인과 관계 분석 중...</span>
            </motion.div>
          )}

          {/* 현재 질문 (진행 중) */}
          {!isCompleted && !isLoading && currentQuestion && (
            <motion.div
              key={`current-question-${currentWhyIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-1.5 max-w-[90%]"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-4.5 h-4.5 bg-[#114037] rounded flex items-center justify-center text-[9px] text-white font-bold animate-pulse">AI</div>
                <span className="text-[10.5px] font-extrabold text-[#114037] tracking-wider">CURRENT QUESTION STEP {currentWhyIndex}</span>
              </div>
              <div className="bg-gradient-to-r from-[#114037] to-[#1d5c50] text-white p-4 rounded-r-xl rounded-bl-xl shadow-md shadow-[#114037]/15 text-xs">
                <span className="block text-[9.5px] uppercase font-bold text-[#b4eae0] mb-1 tracking-wider">Why 단계 {currentWhyIndex} 분석 질문</span>
                <strong className="text-sm font-extrabold leading-relaxed block">Why: {currentQuestion}</strong>
              </div>
            </motion.div>
          )}

          {/* 최종 결과 도출 완료 */}
          {isCompleted && (
            <motion.div
              key="interview-completed"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#2e7d72]/10 border border-[#2e7d72]/30 p-5 rounded-2xl text-slate-900 shadow-md space-y-3"
            >
              <div className="flex items-center gap-2 text-[#114037] font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2e7d72]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider">5Why 분석 및 근본 원인 도출 완료</h4>
              </div>
              <div className="bg-white rounded-xl p-3.5 border border-[#2e7d72]/30 text-xs shadow-inner leading-relaxed">
                <p className="font-bold text-slate-700 mb-1.5 font-mono text-[9px] uppercase tracking-wider">최종 근본원인 (D4 Root Cause)</p>
                <p className="text-slate-900 font-extrabold whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">{rootCause}</p>
              </div>
              <p className="text-[11px] text-slate-800 font-bold leading-relaxed">
                도출된 원인 규명 체인이 8D 보고서의 D4 단계에 영구 저장되었으며, D5(영구대책) 및 D7(재발방지) 단계로 자동 연계되었습니다.
              </p>
              <div className="pt-1.5">
                <button
                  onClick={onReset}
                  className="w-full bg-[#114037] hover:bg-[#114037]/90 text-white py-2.5 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer"
                >
                  새로운 불량 분석 개시
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 스마트 제안 칩스 (질문 입력 전 힌트 노출) */}
      {!isCompleted && !isLoading && smartHints.length > 0 && (
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 shrink-0">
          <span className="text-[10px] font-extrabold text-slate-700 block mb-2 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /> CFT 마스터 추천 답변 옵션 (클릭 시 자동 기입)
          </span>
          <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
            {smartHints.map((hint, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyHint(hint)}
                className="w-full text-left text-[11px] bg-white hover:bg-[#2e7d72]/10 text-slate-900 hover:text-[#114037] border border-slate-300 hover:border-[#2e7d72] px-3 py-2 rounded transition-all truncate block cursor-pointer font-bold shadow-xs"
                title={hint}
              >
                <span className="font-mono font-extrabold text-[#2e7d72] mr-1.5">{idx + 1}.</span>
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 사용자 답변 전송 푸터 */}
      {!isCompleted && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              required
              disabled={isLoading || !currentQuestion}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                isLoading
                  ? "분석 작업 중..."
                  : "현장 불량의 직접적 요인 또는 파라미터 수치를 답변해 주세요..."
              }
              className="w-full p-3 pr-16 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#114037]/10 focus:border-[#114037] shadow-xs font-bold text-slate-950 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !answer.trim() || !currentQuestion}
              className={`absolute right-2 top-2 bottom-2 px-3 rounded font-bold text-[10px] uppercase tracking-wider transition ${
                answer.trim() && !isLoading
                  ? "bg-[#114037] hover:bg-[#114037]/90 text-white cursor-pointer"
                  : "bg-slate-300 text-slate-600 cursor-not-allowed"
              }`}
            >
              전송
            </button>
          </form>
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-700 font-bold tracking-tight uppercase">
            <span>프로토콜: G8D 표준 5Why 원인추적</span>
            <span>엔터 또는 전송 단추 클릭</span>
          </div>
        </div>
      )}
    </div>
  );
}
