const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dashboard.json', 'utf-8'));

const getSkillGapsHTML = () => data.skillGaps.map(g => `
  <div>
    <div class="flex justify-between text-sm mb-1">
      <span class="font-medium ${g.priority === 'critical' ? 'text-red-500' : 'text-yellow-500'}">${g.skillName}</span>
      <span class="text-[var(--muted-foreground)]">${g.currentLevel} / ${g.targetLevel}</span>
    </div>
    <div class="w-full bg-[var(--border)] rounded-full h-2">
      <div class="h-2 rounded-full ${g.priority === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}" style="width: ${(g.currentLevel/5)*100}%"></div>
    </div>
  </div>
`).join('');

const getTimelineHTML = () => data.currentPath.items.map((item, idx) => `
  <div class="relative flex items-start gap-4">
    <div class="z-10 w-8 h-8 shrink-0 rounded-full bg-[var(--background)] border-2 ${item.status === 'pending' ? 'border-[var(--muted-foreground)]' : 'border-green-500 bg-green-50'} flex items-center justify-center text-sm font-bold ${item.status === 'pending' ? 'text-[var(--muted-foreground)]' : 'text-green-600'}">
      ${idx + 1}
    </div>
    <div class="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 shadow-sm hover:border-[var(--primary)] transition-colors">
      <div class="flex justify-between items-start mb-2">
        <div>
          <span class="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">${item.phaseName}</span>
          <h3 class="font-medium text-lg mt-1 text-[var(--foreground)]">${item.resourceId.replace('res-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
        </div>
        <span class="px-2 py-1 bg-[var(--border)] text-xs rounded font-medium capitalize">${item.status}</span>
      </div>
      <p class="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">${item.reason}</p>
      <button class="text-xs text-[var(--primary)] font-medium underline">Why this?</button>
    </div>
  </div>
`).join('');

const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-[var(--background)] text-[var(--foreground)] antialiased p-6 h-screen flex flex-col overflow-hidden">
  
  <header class="mb-6 flex justify-between items-center shrink-0">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-[var(--foreground)]">Learning Dashboard</h1>
      <p class="text-[var(--muted-foreground)]">Your personalized path to ${data.profile.goal}</p>
    </div>
    <div class="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full font-medium shadow-sm">
      Goal: ${data.profile.goal}
    </div>
  </header>

  <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
    <!-- Left Column: Insights & Gaps -->
    <div class="col-span-1 space-y-6 overflow-y-auto pr-2 pb-6">
      
      <!-- Readiness Gauge -->
      <div class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
        <h2 class="font-semibold text-lg mb-4 text-[var(--foreground)]">Overall Readiness</h2>
        <div class="relative w-32 h-32 flex items-center justify-center rounded-full border-[12px] border-green-500">
           <span class="text-3xl font-bold text-green-500">${Math.round(data.readinessScore * 100)}%</span>
        </div>
      </div>

      <!-- Metrics -->
      <div class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
        <h2 class="font-semibold text-lg mb-3 text-[var(--foreground)]">Pathway Metrics</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-[var(--muted-foreground)]">Est. Time:</span>
            <span class="font-medium">${data.metrics.estimatedWeeks} weeks</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--muted-foreground)]">Total Hours:</span>
            <span class="font-medium">${data.metrics.totalHours} hrs</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--muted-foreground)]">Modules:</span>
            <span class="font-medium">${data.metrics.modulesCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--muted-foreground)]">Improvement:</span>
            <span class="font-medium text-green-500">+${data.metrics.readinessImprovement}%</span>
          </div>
        </div>
      </div>

      <!-- Skill Gaps -->
      <div class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
        <h2 class="font-semibold text-lg mb-4 text-[var(--foreground)]">Top Skill Gaps</h2>
        <div class="space-y-4">
          ${getSkillGapsHTML()}
        </div>
      </div>

    </div>

    <!-- Right Column: Timeline -->
    <div class="col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col shadow-sm overflow-hidden">
      <div class="p-5 border-b border-[var(--border)] bg-[var(--card)] z-10 shrink-0">
        <h2 class="font-semibold text-lg text-[var(--foreground)]">Your Adaptive Pathway</h2>
        <p class="text-sm text-[var(--muted-foreground)]">Version ${data.currentPath.version} (Generated ${new Date(data.currentPath.generatedAt).toLocaleDateString()})</p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-5 relative">
        <div class="absolute left-9 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>
        <div class="space-y-6">
          ${getTimelineHTML()}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('C:\\Users\\ACER\\.gemini\\antigravity\\brain\\1b59c2c2-fc86-49fd-90f9-97fc2086f384\\dashboard.html', html);
console.log('Artifact created!');
