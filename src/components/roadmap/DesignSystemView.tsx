"use client";

import React from 'react';
import { Palette, Type, Layout, Hexagon, Component, Maximize, MousePointer2 } from 'lucide-react';

export const DesignSystemView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-12">
      {/* Header */}
      <section className="max-w-6xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">SYSTEM SPECIFICATION</span>
          <span>AESTHETIC &amp; COMPONENT FRAMEWORK</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          "Technical Blueprint" Design Theme
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed max-w-3xl">
          The application utilizes a brutalist-lite, high-information-density aesthetic modeled after 
          mid-century engineering manuals and architectural blueprints. It relies on strict geometric borders, 
          high-contrast typography, and purposeful negative space to present complex DAG data cleanly.
        </p>
      </section>

      {/* Philosophy */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
          <Hexagon className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">Core Philosophy</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
            <h4 className="font-serif font-bold text-lg mb-2">Maximum Signal, Zero Slop</h4>
            <p className="text-xs font-serif text-[#555] leading-relaxed">
              No generic gradients, no soft frosted glassmorphism, no rounded-corner "app-like" fluff. 
              Every line, border, and background color exists to separate data strata mathematically.
            </p>
          </div>
          <div className="p-5 bg-white border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
            <h4 className="font-serif font-bold text-lg mb-2">Structural Typography</h4>
            <p className="text-xs font-serif text-[#555] leading-relaxed">
              Serifs carry narrative and explanation. Monospace dictates interface controls, metadata, and 
              machine-readable schema paths. The tension between the two creates clear hierarchy.
            </p>
          </div>
          <div className="p-5 bg-white border border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A]">
            <h4 className="font-serif font-bold text-lg mb-2">Tactile Interactions</h4>
            <p className="text-xs font-serif text-[#555] leading-relaxed">
              Hover states rely on physical metaphors—inset shadows simulating mechanical button depressions, 
              or borders thickening to denote focus, rejecting modern "floating" elevations.
            </p>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
          <Palette className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">Color Matrix</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Base & Neutrals */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#666] uppercase">Canvas &amp; Ink (Neutrals)</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#FDFCFB] border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">#FDFCFB</div>
                  <div className="text-xs font-serif text-[#555]">App Background / Primary Canvas</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#F8F7F4] border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">#F8F7F4</div>
                  <div className="text-xs font-serif text-[#555]">Surface / Alternate Section Background</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#EAE8E1] border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">#EAE8E1</div>
                  <div className="text-xs font-serif text-[#555]">Subtle Highlights / Disabled Tracks</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#1A1A1A] border border-[#1A1A1A] shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">#1A1A1A</div>
                  <div className="text-xs font-serif text-[#555]">Primary Ink / Text &amp; Hard Borders</div>
                </div>
              </div>
            </div>
          </div>

          {/* Semantic Accents */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#666] uppercase">Semantic Signaling (Accents)</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-600 border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">Emerald (Tailwind -600 to -800)</div>
                  <div className="text-xs font-serif text-[#555]">Mastery / Success / Live Generation / Analytics</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">Blue (Tailwind -600 to -800)</div>
                  <div className="text-xs font-serif text-[#555]">In-Progress / Information / Infrastructure</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-500 border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">Amber (Tailwind -500 to -700)</div>
                  <div className="text-xs font-serif text-[#555]">Warning / Critical Path / Recruiter Flags</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-600 border border-[#1A1A1A]/20 shrink-0"></div>
                <div>
                  <div className="font-mono font-bold text-sm">Purple (Tailwind -600 to -800)</div>
                  <div className="text-xs font-serif text-[#555]">Cross-Functional Integrations / Graph RAG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
          <Type className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">Typographic Hierarchy</h3>
        </div>
        
        <div className="bg-white border-2 border-[#1A1A1A] p-6 lg:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-[#1A1A1A]/10">
            <div className="col-span-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#777] block">Primary Display</span>
              <code className="text-xs">font-serif italic</code>
            </div>
            <div className="col-span-3">
              <h1 className="text-4xl md:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
                Architectural Blueprint
              </h1>
              <p className="mt-2 text-sm font-serif text-[#555]">Used exclusively for page titles, major section headers, and thematic framing.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-[#1A1A1A]/10">
            <div className="col-span-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#777] block">Editorial Body</span>
              <code className="text-xs">font-serif text-[#333]</code>
            </div>
            <div className="col-span-3">
              <p className="text-base leading-relaxed font-serif text-[#333]">
                Used for long-form explanatory text, paradigm descriptions, and strategic playbooks. The serif face 
                encourages reading comprehension for dense technical material. Line heights are set generously to 
                allow the eye to track easily across high-information density paragraphs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#777] block">UI Controls &amp; Data</span>
              <code className="text-xs">font-mono uppercase</code>
            </div>
            <div className="col-span-3 space-y-4">
              <div className="font-mono text-xs tracking-wider uppercase text-[#1A1A1A] font-bold">
                DAG Rendering Matrix Engine
              </div>
              <div className="flex gap-2">
                <span className="bg-[#1A1A1A] text-white px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest">METADATA</span>
                <span className="border border-[#1A1A1A] px-2 py-0.5 text-[10px] font-mono">STATUS: ACTIVE</span>
              </div>
              <p className="text-xs font-serif text-[#555]">
                Monospace handles UI elements, tags, tabs, and technical IDs. Heavily tracked uppercase creates 
                a "machine readable" aesthetic that contrasts sharply with the elegant serif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
          <Component className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">Core Component Anatomy</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Styles */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#666] uppercase border-b border-[#1A1A1A]/10 pb-1">Container Borders &amp; Depth</h4>
            <div className="p-6 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
              <div className="font-mono text-xs uppercase font-bold mb-2">Standard Data Panel</div>
              <p className="font-serif text-sm text-[#444] leading-relaxed">
                Primary modules use a 2px hard `#1A1A1A` border and a solid 4px hard shadow. This completely 
                rejects soft floating elevations in favor of a heavy, stamped-onto-the-page feeling.
              </p>
            </div>
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/30 flex items-start gap-4">
              <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                <Layout className="w-4 h-4" />
              </div>
              <div>
                <div className="font-mono text-xs uppercase font-bold">Sub-Panel / Detail View</div>
                <p className="font-serif text-[11px] text-[#555] mt-1">
                  Inner data segments drop the hard shadow and use a thinner border (frequently colored at 10% opacity 
                  like `border-[#1A1A1A]/10`) or a slightly offset background color (`#F8F7F4`).
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Elements */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-[#666] uppercase border-b border-[#1A1A1A]/10 pb-1">Interactive Triggers</h4>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#333] transition-colors border border-transparent">
                  <MousePointer2 className="w-3.5 h-3.5" />
                  Primary Action
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#1A1A1A] border border-[#1A1A1A] font-mono text-xs font-bold tracking-widest hover:bg-[#F8F7F4] transition-colors shadow-[inset_0_-2px_0_#1A1A1A]">
                  Secondary Active
                </button>
              </div>
              
              <div className="p-4 border border-[#1A1A1A]/10 bg-white">
                <p className="font-serif text-xs text-[#555] mb-3">Tabs rely on bottom borders to show focus.</p>
                <nav className="flex gap-4 border-b border-[#1A1A1A]/10">
                  <div className="pb-2 border-b-2 border-[#1A1A1A] text-[#1A1A1A] font-mono text-[10px] font-bold tracking-widest">
                    ACTIVE TAB
                  </div>
                  <div className="pb-2 border-b-2 border-transparent text-[#888] font-mono text-[10px] tracking-widest hover:text-[#1A1A1A]">
                    INACTIVE TAB
                  </div>
                </nav>
              </div>

              <div className="p-4 border border-[#1A1A1A]/10 bg-white">
                <p className="font-serif text-xs text-[#555] mb-2">Input controls prioritize stark boxes over rounded forms.</p>
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="ENTER QUERY..." 
                    className="flex-1 bg-[#F8F7F4] border border-[#1A1A1A] px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] placeholder:text-[#999]"
                    disabled
                  />
                  <button className="bg-[#1A1A1A] text-white px-4 py-2 text-xs font-mono font-bold" disabled>
                    SUBMIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
