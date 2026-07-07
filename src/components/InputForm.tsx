import React, { useState } from "react";
import { DefectInput } from "../types";
import { AlertCircle, ArrowRight, ClipboardCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface InputFormProps {
  onSubmit: (input: DefectInput) => void;
  isLoading: boolean;
}

const TEMPLATES = [
  {
    name: "PCB 솔더 조인트 크랙 (전형적 예시)",
    defect: "PCB 기판 솔더 조인트 크랙 발생",
    process: "Reflow 공정",
    defectRate: "2.5%",
    containmentAction: "해당 로트 전량 격리조치 및 수동 X-Ray 전수 검사 진행",
  },
  {
    name: "정밀 사출 성형 치수 미달",
    defect: "스마트폰 하우징 측면 두께 치수 공차 오버 (사출 치수 미달)",
    process: "사출 성형 공정",
    defectRate: "1.8%",
    containmentAction: "사출 금형 1호기 가동 정지, 최근 24시간 생산 제품 전량 보류 및 마이크로미터 전수 검사",
  },
  {
    name: "모터 구동 이음 발생",
    defect: "구동 모터 회전 시 고주파 마찰 소음(이음) 발생",
    process: "최종 조립 공정 (EOL 검사)",
    defectRate: "3.2%",
    containmentAction: "EOL 불량 모터 전량 분해 대기 격리, 소음 분석기 장착 검사 강화",
  }
];

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [defect, setDefect] = useState("");
  const [processName, setProcessName] = useState("");
  const [defectRate, setDefectRate] = useState("");
  const [containmentAction, setContainmentAction] = useState("");

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setDefect(tpl.defect);
    setProcessName(tpl.process);
    setDefectRate(tpl.defectRate);
    setContainmentAction(tpl.containmentAction);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defect.trim() || !processName.trim() || !defectRate.trim() || !containmentAction.trim()) {
      return;
    }
    onSubmit({
      defect: defect.trim(),
      process: processName.trim(),
      defectRate: defectRate.trim(),
      containmentAction: containmentAction.trim(),
    });
  };

  const isFormValid = defect.trim() && processName.trim() && defectRate.trim() && containmentAction.trim();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 md:p-8 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-[#114037] text-white rounded-xl shadow-md shadow-[#114037]/20">
            <ClipboardCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">신규 G8D 품질 분석 세션</h2>
            <p className="text-xs text-slate-700 font-semibold mt-0.5">불량 정보를 기반으로 전문적인 8D 보고서 수립 및 5Why 프로세스를 진행합니다.</p>
          </div>
        </div>

        {/* 템플릿 추천 퀵버튼 */}
        <div className="mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-700 block mb-2.5 uppercase tracking-wider">
            실무용 불량 분석 템플릿 불러오기
          </span>
          <div className="flex flex-col gap-2">
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                disabled={isLoading}
                className="w-full text-left text-xs bg-white hover:bg-[#2e7d72]/5 text-slate-700 hover:text-[#2e7d72] border border-slate-200 hover:border-slate-200 px-3.5 py-2.5 rounded-lg transition-all font-medium cursor-pointer disabled:opacity-50 flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-[#2e7d72] shrink-0" />
                  <span className="truncate text-[11px] font-semibold text-slate-800">{tpl.name}</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              불량현상 (D2) <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={defect}
              onChange={(e) => setDefect(e.target.value)}
              placeholder="예: PCB 기판 솔더 조인트 크랙 발생"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#114037]/10 focus:border-[#114037] transition-all text-xs font-semibold shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                발생공정 <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isLoading}
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="예: Reflow 공정"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#114037]/10 focus:border-[#114037] transition-all text-xs font-semibold shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                불량률 <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isLoading}
                value={defectRate}
                onChange={(e) => setDefectRate(e.target.value)}
                placeholder="예: 2.5% 또는 250 PPM"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#114037]/10 focus:border-[#114037] transition-all text-xs font-semibold shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              임시 유출 방지 조치 (D3) <span className="text-red-500 font-bold">*</span>
            </label>
            <textarea
              required
              disabled={isLoading}
              rows={3}
              value={containmentAction}
              onChange={(e) => setContainmentAction(e.target.value)}
              placeholder="예: 해당 로트 전량 격리조치 및 비상 대응 조 구성"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#114037]/10 focus:border-[#114037] transition-all text-xs font-semibold resize-none shadow-xs leading-relaxed"
            />
          </div>
        </form>
      </div>

      <div className="pt-6 space-y-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          className={`w-full py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider ${
            isFormValid && !isLoading
              ? "bg-[#114037] hover:bg-[#114037]/95 shadow-[#114037]/10"
              : "bg-slate-400 cursor-not-allowed shadow-none"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>품질 분석 엔진 초기 셋업 중...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5" />
              <span>G8D 분석 개시 및 5Why 세션 시작</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </motion.button>

        <div className="flex items-start gap-2.5 p-3.5 bg-slate-100 rounded-xl border border-slate-200">
          <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
            본 도구는 글로벌 최고 수준의 품질 보증 방법론인 G8D(Global 8 Disciplines) 가이드를 완전 준수합니다. 정보를 기입하시면 전용 AI 코칭 인터뷰가 활성화됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
