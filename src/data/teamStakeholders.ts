export interface StakeholderRole {
  id: string;
  title: string;
  audience: string;
  badge: string;
  iconName: string;
  howTheyUseIt: string[];
  connectedSystems: string[];
  keyOutputs: string[];
  actionableWorkflows: {
    stepTitle: string;
    description: string;
  }[];
}

export const TEAM_STAKEHOLDERS: StakeholderRole[] = [
  {
    id: 'eng-managers',
    title: 'Engineering Managers & Tech Leads',
    audience: 'Squad Leads, Staff Engineers, Directors of Engineering',
    badge: 'Governance & Growth',
    iconName: 'Users',
    howTheyUseIt: [
      'Conduct objective 1-on-1 career development check-ins based on clear skill DAGs.',
      'Generate team-wide skill matrix heatmaps to identify critical engineering single-points-of-failure (SPOFs).',
      'Benchmark promotion readiness against transparent, verifiable evaluation rubrics.'
    ],
    connectedSystems: [
      'BambooHR / Lattice (Performance Reviews & Goal Tracking)',
      'Internal Confluence / Notion Engineering Wiki',
      'JIRA / Linear (Assigning sprint tasks matching current learning milestones)'
    ],
    keyOutputs: [
      'Individual Development Plans (IDPs)',
      'Team Competency Gap Radar',
      'Standardized Promotion Portfolios'
    ],
    actionableWorkflows: [
      {
        stepTitle: 'Quarterly Gap Audit',
        description: 'Lead selects their squad members and runs a gap diff against the target Senior/Staff DAG profile to identify team weaknesses.'
      },
      {
        stepTitle: 'Task-to-Milestone Pairing',
        description: 'When planning sprint backlog tickets, the manager tags tickets with roadmap node IDs (e.g. #devops-docker-containers) so junior engineers learn on real work.'
      },
      {
        stepTitle: 'Rubric-Based Milestone Sign-off',
        description: 'Engineer presents the completed assessment project; Lead verifies rubric criteria and marks the DAG node as "Mastered".'
      }
    ]
  },
  {
    id: 'engineers',
    title: 'Engineers & Onboarding Talent',
    audience: 'Junior, Mid-Level, and Lateral-Hire Engineers',
    badge: 'Self-Paced Learning',
    iconName: 'Compass',
    howTheyUseIt: [
      'Follow a crystal-clear, step-by-step roadmap from Day 1 with zero ambiguity about "what to learn next".',
      'Check off prerequisite foundations before tackling complex frameworks (e.g., mastering async before writing high-throughput FastAPI routes).',
      'Build real company-aligned evaluation projects instead of following generic web tutorials.'
    ],
    connectedSystems: [
      'GitHub / GitLab (PRs linked to roadmap milestones)',
      'Internal Developer Portal (Backstage.io / Spotify Backstage)',
      'Team Discord / Slack Learning Channels'
    ],
    keyOutputs: [
      'Personal Progress Dashboard & Certification Badges',
      'Verified Code Artifacts & Demo Repos',
      'Automated Weekly Progress Summaries'
    ],
    actionableWorkflows: [
      {
        stepTitle: 'Interactive Diagnostic Scan',
        description: 'New hire checks existing known skills to prune the DAG and generate a personalized fast-track syllabus.'
      },
      {
        stepTitle: 'Milestone Execution',
        description: 'Engineer reads internal doc links attached to the node, studies the key concepts, and implements the practical rubric challenge.'
      },
      {
        stepTitle: 'Peer Demo & Knowledge Share',
        description: 'Upon finishing a node cluster, engineer gives a 15-minute lightning demo to the engineering guild.'
      }
    ]
  },
  {
    id: 'recruiting-hr',
    title: 'Technical Recruiters & Hiring Panels',
    audience: 'Talent Acquisition, Interview Loop Interviewers, HR Ops',
    badge: 'Standardized Hiring',
    iconName: 'ShieldCheck',
    howTheyUseIt: [
      'Draft standardized Job Descriptions (JDs) mapped directly to foundational and intermediate roadmap nodes.',
      'Provide interviewers with objective coding rubrics and red-flag checklists for each specific skill node.',
      'Eliminate interviewer bias and subjective guesswork during leveling calibration meetings.'
    ],
    connectedSystems: [
      'Greenhouse / Lever (Applicant Tracking System)',
      'CoderPad / HackerRank (Live Technical Pairing Sandboxes)',
      'Workday (Level & Compensation Calibration)'
    ],
    keyOutputs: [
      'Standardized Technical Interview Scorecards',
      'Skill-Grounded Job Requisition Specs',
      'Level Calibration Matrix (L3 vs L4 vs L5)'
    ],
    actionableWorkflows: [
      {
        stepTitle: 'Requisition Profile Export',
        description: 'Recruiter selects required roadmap nodes for a "Mid Frontend Specialist" and automatically exports candidate requirements.'
      },
      {
        stepTitle: 'Live Pairing Rubric Deployment',
        description: 'Interviewer uses the exact node evaluation prompt and scoring rubric during the 60-minute technical screen.'
      },
      {
        stepTitle: 'Post-Interview Debrief',
        description: 'Hiring committee reviews candidate rubric scores node-by-node to determine offer leveling.'
      }
    ]
  },
  {
    id: 'ai-agents-lms',
    title: 'AI Copilots & Enterprise Learning Bot',
    audience: 'Slack / Teams Bots, Internal LLM Copilots, Automated LMS',
    badge: 'Automated Intelligence',
    iconName: 'Cpu',
    howTheyUseIt: [
      'Query the Hybrid OKF+RAG engine to answer engineers\' daily architectural questions with verified company practices.',
      'Generate interactive quizzes and code review exercises matching the engineer\'s next unmastered DAG node.',
      'Proactively suggest learning modules when an engineer is assigned a PR touching unfamiliar technologies.'
    ],
    connectedSystems: [
      'Slack Bot / Microsoft Teams Apps',
      'GitHub Action Bot (PR Reviewer & Skill Nudger)',
      'Enterprise LMS / SCORM / Degreed / Cornerstone'
    ],
    keyOutputs: [
      'Automated Weekly Milestone Reminders in Slack',
      'Adaptive Micro-Quizzes & Code Sandboxes',
      'PR Review Skill Recommendations'
    ],
    actionableWorkflows: [
      {
        stepTitle: 'PR Intelligence Hook',
        description: 'When an engineer opens a PR modifying Terraform files for the first time, the bot suggests the company IaC module.'
      },
      {
        stepTitle: 'Spaced-Repetition Slack Bot',
        description: 'Sends 1 interactive conceptual scenario every Tuesday based on active in-progress nodes.'
      },
      {
        stepTitle: 'AI Study Assistant',
        description: 'Engineer asks "@RoadmapBot why should I use Pydantic v2 over dataclasses?" and gets an answer grounded in internal architecture standards.'
      }
    ]
  }
];
