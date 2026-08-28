import json
import os
import re

print("Starting unified dataset builder...")

# 1. Goal Templates
goal_templates = [
    {
        "id": "goal_full_stack",
        "goal_name": "Full Stack Web Development",
        "required_skills": [
            {"skill": "HTML & CSS", "min_level": 4},
            {"skill": "JavaScript", "min_level": 4},
            {"skill": "TypeScript", "min_level": 4},
            {"skill": "React", "min_level": 4},
            {"skill": "Next.js", "min_level": 4},
            {"skill": "Node.js", "min_level": 4},
            {"skill": "PostgreSQL & SQL", "min_level": 3},
            {"skill": "REST & GraphQL APIs", "min_level": 4},
            {"skill": "Authentication & Security", "min_level": 3},
            {"skill": "Docker & Deployment", "min_level": 3}
        ]
    },
    {
        "id": "goal_frontend",
        "goal_name": "Frontend Development",
        "required_skills": [
            {"skill": "HTML & CSS", "min_level": 5},
            {"skill": "JavaScript", "min_level": 5},
            {"skill": "TypeScript", "min_level": 4},
            {"skill": "React", "min_level": 5},
            {"skill": "Next.js", "min_level": 4},
            {"skill": "State Management", "min_level": 4},
            {"skill": "Web Performance & Core Web Vitals", "min_level": 4},
            {"skill": "Testing & QA (Jest/Cypress)", "min_level": 3}
        ]
    },
    {
        "id": "goal_backend",
        "goal_name": "Backend Systems & Architecture",
        "required_skills": [
            {"skill": "Node.js", "min_level": 4},
            {"skill": "Python", "min_level": 4},
            {"skill": "PostgreSQL & SQL", "min_level": 5},
            {"skill": "REST & GraphQL APIs", "min_level": 4},
            {"skill": "Redis & Caching", "min_level": 4},
            {"skill": "Message Queues & Kafka", "min_level": 3},
            {"skill": "Distributed Systems & Scalability", "min_level": 4},
            {"skill": "Docker & Deployment", "min_level": 3}
        ]
    },
    {
        "id": "goal_ml_engineer",
        "goal_name": "AI Engineering & Machine Learning",
        "required_skills": [
            {"skill": "Python", "min_level": 5},
            {"skill": "Linear Algebra", "min_level": 4},
            {"skill": "Calculus & Optimization", "min_level": 3},
            {"skill": "Statistics & Probability", "min_level": 4},
            {"skill": "Pandas & Data Processing", "min_level": 4},
            {"skill": "Machine Learning (Scikit-Learn)", "min_level": 5},
            {"skill": "Deep Learning & PyTorch", "min_level": 4},
            {"skill": "RAG & Vector Embeddings", "min_level": 4},
            {"skill": "LLM Agents & Tool Calling", "min_level": 4}
        ]
    },
    {
        "id": "goal_devops",
        "goal_name": "DevOps & Cloud Engineering",
        "required_skills": [
            {"skill": "Linux & Shell Scripting", "min_level": 4},
            {"skill": "Networking & Protocols", "min_level": 4},
            {"skill": "Docker & Containers", "min_level": 5},
            {"skill": "CI/CD (GitHub Actions)", "min_level": 4},
            {"skill": "Terraform & IaC", "min_level": 4},
            {"skill": "Kubernetes & Orchestration", "min_level": 4},
            {"skill": "Monitoring & Observability", "min_level": 3}
        ]
    },
    {
        "id": "goal_data_analyst",
        "goal_name": "Data Analytics & Engineering",
        "required_skills": [
            {"skill": "SQL", "min_level": 5},
            {"skill": "Python", "min_level": 4},
            {"skill": "Pandas & Data Processing", "min_level": 5},
            {"skill": "Data Visualization & Dashboards", "min_level": 4},
            {"skill": "Data Cleaning & Transformation", "min_level": 4},
            {"skill": "dbt & Data Modeling", "min_level": 3},
            {"skill": "Data Warehousing (Snowflake/BigQuery)", "min_level": 3}
        ]
    }
]

# 2. Skill Dependencies (Strict DAG with NO cycles)
skill_dependencies = [
    # Fullstack & Web
    {"id": "dep_js_html", "skill_name": "JavaScript", "depends_on_skill_name": "HTML & CSS"},
    {"id": "dep_ts_js", "skill_name": "TypeScript", "depends_on_skill_name": "JavaScript"},
    {"id": "dep_react_js", "skill_name": "React", "depends_on_skill_name": "JavaScript"},
    {"id": "dep_react_ts", "skill_name": "React", "depends_on_skill_name": "TypeScript"},
    {"id": "dep_next_react", "skill_name": "Next.js", "depends_on_skill_name": "React"},
    {"id": "dep_node_js", "skill_name": "Node.js", "depends_on_skill_name": "JavaScript"},
    {"id": "dep_api_node", "skill_name": "REST & GraphQL APIs", "depends_on_skill_name": "Node.js"},
    {"id": "dep_auth_api", "skill_name": "Authentication & Security", "depends_on_skill_name": "REST & GraphQL APIs"},
    {"id": "dep_fs_next", "skill_name": "Full Stack Architecture", "depends_on_skill_name": "Next.js"},
    {"id": "dep_fs_sql", "skill_name": "Full Stack Architecture", "depends_on_skill_name": "PostgreSQL & SQL"},
    
    # Backend & Architecture
    {"id": "dep_redis_node", "skill_name": "Redis & Caching", "depends_on_skill_name": "Node.js"},
    {"id": "dep_kafka_node", "skill_name": "Message Queues & Kafka", "depends_on_skill_name": "Node.js"},
    {"id": "dep_dist_redis", "skill_name": "Distributed Systems & Scalability", "depends_on_skill_name": "Redis & Caching"},
    {"id": "dep_dist_kafka", "skill_name": "Distributed Systems & Scalability", "depends_on_skill_name": "Message Queues & Kafka"},
    
    # AI & Machine Learning
    {"id": "dep_pandas_py", "skill_name": "Pandas & Data Processing", "depends_on_skill_name": "Python"},
    {"id": "dep_ml_la", "skill_name": "Machine Learning (Scikit-Learn)", "depends_on_skill_name": "Linear Algebra"},
    {"id": "dep_ml_calc", "skill_name": "Machine Learning (Scikit-Learn)", "depends_on_skill_name": "Calculus & Optimization"},
    {"id": "dep_ml_stats", "skill_name": "Machine Learning (Scikit-Learn)", "depends_on_skill_name": "Statistics & Probability"},
    {"id": "dep_ml_pandas", "skill_name": "Machine Learning (Scikit-Learn)", "depends_on_skill_name": "Pandas & Data Processing"},
    {"id": "dep_dl_ml", "skill_name": "Deep Learning & PyTorch", "depends_on_skill_name": "Machine Learning (Scikit-Learn)"},
    {"id": "dep_rag_dl", "skill_name": "RAG & Vector Embeddings", "depends_on_skill_name": "Deep Learning & PyTorch"},
    {"id": "dep_agents_rag", "skill_name": "LLM Agents & Tool Calling", "depends_on_skill_name": "RAG & Vector Embeddings"},
    
    # DevOps & Infrastructure
    {"id": "dep_docker_linux", "skill_name": "Docker & Containers", "depends_on_skill_name": "Linux & Shell Scripting"},
    {"id": "dep_cicd_docker", "skill_name": "CI/CD (GitHub Actions)", "depends_on_skill_name": "Docker & Containers"},
    {"id": "dep_tf_cloud", "skill_name": "Terraform & IaC", "depends_on_skill_name": "Linux & Shell Scripting"},
    {"id": "dep_k8s_docker", "skill_name": "Kubernetes & Orchestration", "depends_on_skill_name": "Docker & Containers"},
    {"id": "dep_k8s_tf", "skill_name": "Kubernetes & Orchestration", "depends_on_skill_name": "Terraform & IaC"},
    {"id": "dep_obs_k8s", "skill_name": "Monitoring & Observability", "depends_on_skill_name": "Kubernetes & Orchestration"}
]

# 3. Learning Resources (Comprehensive list across Web, Frontend, Backend, AI, DevOps)
resources = [
    # Fullstack & Frontend
    {
        "id": "res_fs_01",
        "title": "Full Stack Open: Deep Dive into Modern Web Development",
        "type": "course",
        "provider": "University of Helsinki",
        "description": "Learn React, Redux, Node.js, Express, MongoDB, PostgreSQL, TypeScript, and CI/CD with real-world project submissions.",
        "url": "https://fullstackopen.com/en/",
        "skills_taught": ["HTML & CSS", "JavaScript", "TypeScript", "React", "Node.js", "REST & GraphQL APIs"],
        "prerequisite_skills": [],
        "difficulty": "intermediate",
        "duration_hours": 60.0,
        "format": "interactive"
    },
    {
        "id": "res_fs_02",
        "title": "The Modern JavaScript Bootcamp (ES6+)",
        "type": "course",
        "provider": "Frontend Masters / MDN",
        "description": "Master core JavaScript, lexical scoping, closures, promises, async/await, and event loops.",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        "skills_taught": ["JavaScript"],
        "prerequisite_skills": ["HTML & CSS"],
        "difficulty": "beginner",
        "duration_hours": 20.0,
        "format": "video"
    },
    {
        "id": "res_fs_03",
        "title": "TypeScript Handbook & Practical Design Patterns",
        "type": "article",
        "provider": "TypeScript Official Docs",
        "description": "Comprehensive guide to generics, union types, narrowing, utility types, and strict type safety.",
        "url": "https://www.typescriptlang.org/docs/handbook/intro.html",
        "skills_taught": ["TypeScript"],
        "prerequisite_skills": ["JavaScript"],
        "difficulty": "intermediate",
        "duration_hours": 8.0,
        "format": "text"
    },
    {
        "id": "res_fs_04",
        "title": "React 19 & Next.js 15 App Router Masterclass",
        "type": "course",
        "provider": "Vercel Academy",
        "description": "Server Components, Server Actions, streaming SSR, parallel routes, intercepting routes, and caching layers.",
        "url": "https://nextjs.org/learn",
        "skills_taught": ["React", "Next.js"],
        "prerequisite_skills": ["JavaScript", "TypeScript"],
        "difficulty": "intermediate",
        "duration_hours": 24.0,
        "format": "interactive"
    },
    {
        "id": "res_fs_05",
        "title": "Full Stack SaaS Application with Stripe, Auth & Prisma",
        "type": "project",
        "provider": "GitHub Labs",
        "description": "Build an end-to-end multi-tenant SaaS application with OAuth2 sessions, subscription billing, and PostgreSQL.",
        "url": "https://github.com/topics/nextjs-saas-starter",
        "skills_taught": ["Next.js", "PostgreSQL & SQL", "Authentication & Security", "REST & GraphQL APIs"],
        "prerequisite_skills": ["React", "TypeScript", "Node.js"],
        "difficulty": "advanced",
        "duration_hours": 35.0,
        "format": "project"
    },
    {
        "id": "res_fs_06",
        "title": "Node.js Microservices with Express and Prisma ORM",
        "type": "course",
        "provider": "Prisma Data",
        "description": "Designing RESTful APIs, relational schema migrations, connection pooling, and database indexes in Postgres.",
        "url": "https://www.prisma.io/docs/getting-started",
        "skills_taught": ["Node.js", "PostgreSQL & SQL", "REST & GraphQL APIs"],
        "prerequisite_skills": ["JavaScript", "TypeScript"],
        "difficulty": "intermediate",
        "duration_hours": 15.0,
        "format": "interactive"
    },
    {
        "id": "res_fs_07",
        "title": "Web Application Security: OWASP Top 10 & JWT Authentication",
        "type": "article",
        "provider": "OWASP Foundation",
        "description": "Preventing XSS, CSRF, SQL Injection, broken access control, and secure session management.",
        "url": "https://owasp.org/www-project-top-ten/",
        "skills_taught": ["Authentication & Security"],
        "prerequisite_skills": ["Node.js", "REST & GraphQL APIs"],
        "difficulty": "advanced",
        "duration_hours": 6.0,
        "format": "text"
    },
    {
        "id": "res_fs_08",
        "title": "Docker for Full Stack Developers",
        "type": "course",
        "provider": "Docker Official Guide",
        "description": "Containerizing frontend, backend, and PostgreSQL databases with Docker Compose and multi-stage builds.",
        "url": "https://docs.docker.com/get-started/",
        "skills_taught": ["Docker & Deployment"],
        "prerequisite_skills": ["Node.js"],
        "difficulty": "beginner",
        "duration_hours": 10.0,
        "format": "video"
    },

    # AI & ML Track
    {
        "id": "res_ai_01",
        "title": "Linear Algebra for Machine Learning - MIT 18.06",
        "type": "course",
        "provider": "MIT OpenCourseWare (Prof. Gilbert Strang)",
        "description": "Vector spaces, dot products, eigenvalues, eigenvectors, matrix decompositions, and SVD.",
        "url": "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/",
        "skills_taught": ["Linear Algebra"],
        "prerequisite_skills": [],
        "difficulty": "intermediate",
        "duration_hours": 35.0,
        "format": "video"
    },
    {
        "id": "res_ai_02",
        "title": "Multivariable Calculus and Vector Fields - MIT 18.02",
        "type": "course",
        "provider": "MIT OpenCourseWare",
        "description": "Partial derivatives, gradient vectors, directional derivatives, Lagrange multipliers, and optimization.",
        "url": "https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/",
        "skills_taught": ["Calculus & Optimization"],
        "prerequisite_skills": [],
        "difficulty": "intermediate",
        "duration_hours": 30.0,
        "format": "video"
    },
    {
        "id": "res_ai_03",
        "title": "Statistical Inference, Probability & Hypothesis Testing",
        "type": "course",
        "provider": "Stanford Online",
        "description": "Random variables, probability distributions, Bayes theorem, p-values, confidence intervals, and regression analysis.",
        "url": "https://online.stanford.edu/courses/stats-110-introduction-probability",
        "skills_taught": ["Statistics & Probability"],
        "prerequisite_skills": [],
        "difficulty": "intermediate",
        "duration_hours": 25.0,
        "format": "interactive"
    },
    {
        "id": "res_ai_04",
        "title": "Python for Data Science & Pandas High-Performance Processing",
        "type": "course",
        "provider": "Coursera / DeepLearning.AI",
        "description": "Vectorized operations, data wrangling, missing data imputation, joins, aggregations, and NumPy arrays.",
        "url": "https://www.deeplearning.ai/courses/",
        "skills_taught": ["Python", "Pandas & Data Processing"],
        "prerequisite_skills": [],
        "difficulty": "beginner",
        "duration_hours": 20.0,
        "format": "interactive"
    },
    {
        "id": "res_ai_05",
        "title": "Machine Learning Specialization with Scikit-Learn",
        "type": "course",
        "provider": "DeepLearning.AI / Andrew Ng",
        "description": "Supervised learning, linear regression, logistic regression, decision trees, random forests, boosting, and clustering.",
        "url": "https://www.deeplearning.ai/courses/machine-learning-specialization/",
        "skills_taught": ["Machine Learning (Scikit-Learn)"],
        "prerequisite_skills": ["Python", "Linear Algebra", "Calculus & Optimization", "Statistics & Probability"],
        "difficulty": "intermediate",
        "duration_hours": 40.0,
        "format": "video"
    },
    {
        "id": "res_ai_06",
        "title": "Deep Learning with PyTorch & Neural Networks from Scratch",
        "type": "course",
        "provider": "PyTorch Official / fast.ai",
        "description": "Backpropagation, automatic differentiation, CNNs, RNNs, attention mechanisms, and GPU acceleration with CUDA.",
        "url": "https://course.fast.ai/",
        "skills_taught": ["Deep Learning & PyTorch"],
        "prerequisite_skills": ["Machine Learning (Scikit-Learn)", "Linear Algebra"],
        "difficulty": "advanced",
        "duration_hours": 45.0,
        "format": "interactive"
    },
    {
        "id": "res_ai_07",
        "title": "Building Production RAG Systems with Vector Databases",
        "type": "project",
        "provider": "Pinecone / LangChain / pgvector",
        "description": "Semantic search, chunking strategies, cross-encoders, reciprocal rank fusion (RRF), and hybrid sparse-dense retrieval.",
        "url": "https://www.pinecone.io/learn/series/rag/",
        "skills_taught": ["RAG & Vector Embeddings"],
        "prerequisite_skills": ["Deep Learning & PyTorch", "Python"],
        "difficulty": "advanced",
        "duration_hours": 18.0,
        "format": "project"
    },
    {
        "id": "res_ai_08",
        "title": "Autonomous AI Agents with Tool Calling and Function Execution",
        "type": "project",
        "provider": "Google DeepMind / Anthropic",
        "description": "ReAct pattern, agentic memory systems, tool execution pipelines, error self-correction, and evaluation benchmarks.",
        "url": "https://ai.google.dev/gemini-api/docs/function-calling",
        "skills_taught": ["LLM Agents & Tool Calling"],
        "prerequisite_skills": ["RAG & Vector Embeddings"],
        "difficulty": "advanced",
        "duration_hours": 20.0,
        "format": "project"
    },

    # DevOps & Cloud Track
    {
        "id": "res_devops_01",
        "title": "Linux Systems Engineering and Bash Automation",
        "type": "course",
        "provider": "The Linux Foundation",
        "description": "Process management, memory profiling, permissions, systemd services, SSH tunneling, and shell scripts.",
        "url": "https://training.linuxfoundation.org/",
        "skills_taught": ["Linux & Shell Scripting"],
        "prerequisite_skills": [],
        "difficulty": "beginner",
        "duration_hours": 20.0,
        "format": "interactive"
    },
    {
        "id": "res_devops_02",
        "title": "Computer Networking, DNS, TCP/IP, and TLS/HTTPS Internals",
        "type": "article",
        "provider": "Cloudflare Learning Center",
        "description": "Deep dive into OSI layers, handshake protocols, reverse proxies, HTTP/2 & HTTP/3, and load balancers.",
        "url": "https://www.cloudflare.com/learning/",
        "skills_taught": ["Networking & Protocols"],
        "prerequisite_skills": [],
        "difficulty": "intermediate",
        "duration_hours": 12.0,
        "format": "text"
    },
    {
        "id": "res_devops_03",
        "title": "Kubernetes in Production (CKA Curriculum)",
        "type": "course",
        "provider": "CNCF / KodeKloud",
        "description": "Pods, Deployments, Services, Ingress Controllers, StatefulSets, ConfigMaps, Secrets, and Helm charts.",
        "url": "https://kodekloud.com/courses/certified-kubernetes-administrator-cka/",
        "skills_taught": ["Kubernetes & Orchestration"],
        "prerequisite_skills": ["Docker & Containers", "Linux & Shell Scripting"],
        "difficulty": "advanced",
        "duration_hours": 40.0,
        "format": "interactive"
    },
    {
        "id": "res_devops_04",
        "title": "Terraform Infrastructure as Code (AWS & GCP)",
        "type": "course",
        "provider": "HashiCorp Learn",
        "description": "Declarative cloud provisioning, remote state locking in S3, modules, count & for_each, and drift detection.",
        "url": "https://developer.hashicorp.com/terraform/tutorials",
        "skills_taught": ["Terraform & IaC"],
        "prerequisite_skills": ["Linux & Shell Scripting"],
        "difficulty": "intermediate",
        "duration_hours": 18.0,
        "format": "interactive"
    },
    {
        "id": "res_devops_05",
        "title": "Production CI/CD Pipelines with GitHub Actions and GitOps",
        "type": "project",
        "provider": "GitHub Skills",
        "description": "Automated linting, matrix testing, Docker image caching, vulnerability scanning with Trivy, and deployment to K8s via ArgoCD.",
        "url": "https://skills.github.com/",
        "skills_taught": ["CI/CD (GitHub Actions)"],
        "prerequisite_skills": ["Docker & Containers"],
        "difficulty": "intermediate",
        "duration_hours": 15.0,
        "format": "project"
    }
]

# Write to data directory
os.makedirs("data", exist_ok=True)

with open("data/goal_templates.json", "w") as f:
    json.dump(goal_templates, f, indent=2)
print(f"Updated data/goal_templates.json ({len(goal_templates)} templates)")

with open("data/skill_dependencies.json", "w") as f:
    json.dump(skill_dependencies, f, indent=2)
print(f"Updated data/skill_dependencies.json ({len(skill_dependencies)} dependencies)")

with open("data/learning_resources.json", "w") as f:
    json.dump(resources, f, indent=2)
print(f"Updated data/learning_resources.json ({len(resources)} curated resources)")

