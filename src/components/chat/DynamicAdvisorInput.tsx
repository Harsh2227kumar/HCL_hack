"use client";

import React, { useState } from 'react';
import { Send, Check, Sparkles } from 'lucide-react';

export interface DynamicInputConfig {
  type: 'single_select_with_text' | 'multi_select_with_text' | 'text' | 'single_select' | 'multi_select';
  options?: string[];
  allow_custom?: boolean;
  placeholder?: string;
}

export interface DynamicAdvisorInputProps {
  config?: DynamicInputConfig;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const DynamicAdvisorInput: React.FC<DynamicAdvisorInputProps> = ({
  config = { type: 'single_select_with_text', options: [], allow_custom: true },
  onSend,
  disabled = false,
}) => {
  const [customText, setCustomText] = useState('');
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  const isMulti = config.type === 'multi_select' || config.type === 'multi_select_with_text';
  const hasOptions = config.options && config.options.length > 0;
  const allowCustom = config.allow_custom !== false;

  const handleSingleSelect = (option: string) => {
    if (disabled) return;
    onSend(option);
  };

  const toggleMultiSelect = (option: string) => {
    if (disabled) return;
    setSelectedMulti((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const handleMultiSubmit = () => {
    if (disabled) return;
    const parts = [...selectedMulti];
    if (customText.trim()) {
      parts.push(customText.trim());
    }
    if (parts.length > 0) {
      onSend(parts.join(', '));
      setSelectedMulti([]);
      setCustomText('');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    const trimmed = customText.trim();
    if (trimmed) {
      if (isMulti && selectedMulti.length > 0) {
        onSend(`${selectedMulti.join(', ')} (Also: ${trimmed})`);
        setSelectedMulti([]);
      } else {
        onSend(trimmed);
      }
      setCustomText('');
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Dynamic Options Section */}
      {hasOptions && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#666] font-semibold">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {isMulti
                ? "Select all that apply or add details below:"
                : "Choose an option or type freely:"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.options!.map((option, idx) => {
              const isSelected = selectedMulti.includes(option);

              if (isMulti) {
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleMultiSelect(option)}
                    className={`px-3.5 py-2 text-xs font-mono rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs scale-[1.02]"
                        : "bg-white text-[#1A1A1A] border-[#1A1A1A]/30 hover:border-[#1A1A1A] hover:bg-[#F8F7F4]"
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-[#1A1A1A]/40 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSingleSelect(option)}
                  className="px-3.5 py-2 text-xs font-mono rounded-lg border border-[#1A1A1A]/30 bg-white text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all shadow-xs active:scale-95 cursor-pointer text-left"
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Confirm Multi-select button */}
          {isMulti && selectedMulti.length > 0 && (
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={handleMultiSubmit}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm ({selectedMulti.length} selected)</span>
              </button>
              <span className="text-[11px] font-mono text-[#777]">
                or add details in the box below before sending
              </span>
            </div>
          )}
        </div>
      )}

      {/* Free-form / Custom Input Bar */}
      {allowCustom && (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={disabled}
            placeholder={
              config.placeholder ||
              (isMulti
                ? "Type any additional skills or context..."
                : "Type your own answer or describe in your own words...")
            }
            className="flex-1 px-4 py-3 text-xs font-mono rounded-xl border border-[#1A1A1A]/30 bg-white text-[#1A1A1A] placeholder:text-[#888] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] disabled:opacity-50 transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={disabled || (!customText.trim() && (!isMulti || selectedMulti.length === 0))}
            className="px-5 py-3 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};

export default DynamicAdvisorInput;
