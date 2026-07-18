# Observability Shorts: Complete beginner-to-on-call course

Goal: turn shorts into a coherent course that takes a beginner from “why monitor?” to confident incident response — metrics, logs, traces, alerts, SLOs, and on-call habits — without dashboard cargo cult.
Recommended length per video: **45–75 seconds** (target ~65–75 when the topic needs texture).

Shared CTA (end of every short — English publishing voice-over):
`Master observability faster. Theory, hands-on labs, and interview questions - link in bio.`

Brand footer on video (series standard):
`exallenge.tech` — small, persistent, phone-safe. No QR code.

Module order = study order: why observe → pillars → metrics model → Prometheus/PromQL → Grafana → golden signals → alerting → logs → traces/OTel → cardinality & cost → Kubernetes signals → SLOs → on-call/runbooks → culture → career.

**Stack focus:** Prometheus, Grafana, Alertmanager, Loki (logs), OpenTelemetry/Jaeger (traces) — matches `courses/observability-basic` → `intermediate` → `advanced`, `deploy/observability`, plus SRE (`courses/sre`) and OpenSearch for log search depth.

Pipeline guide (when ready): `observability-shorts-pipeline-prompt.md` — until then follow channel standards in `golang-shorts-pipeline-prompt.md` / `kubernetes-shorts-pipeline-prompt.md` (TopicBanner, ~70s scripts, large on-screen queries/panels, shared Remotion).

---

## Module 0. Why observability and how to think (1–12)

Format for every item in this and the following modules:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** shared line above (do not invent a different CTA).

1. What is observability in 30 seconds  
   - **Hook:** "Is observability just fancy monitoring?"
   - **Core:** Observability is the ability to ask new questions about a running system from its telemetry — not only watch pre-drawn graphs.
2. Monitoring vs observability  
   - **Hook:** "Aren’t they the same word?"
   - **Core:** Monitoring checks known conditions; observability helps debug unknown failure modes.
3. Why “SSH and guess” fails at scale  
   - **Hook:** "Can’t I just log into the box?"
   - **Core:** Ephemeral containers and dozens of services need correlated signals, not manual hunting.
4. Telemetry: metrics, logs, traces  
   - **Hook:** "What do we actually collect?"
   - **Core:** Three complementary pillars — use the right one for the question.
5. Known unknowns vs unknown unknowns  
   - **Hook:** "Why do dashboards miss outages?"
   - **Core:** Alerts cover known risks; exploratory queries catch surprises.
6. Customer symptoms first  
   - **Hook:** "CPU is fine — users still scream."
   - **Core:** Start from user-visible SLIs (errors, latency), then drill into causes.
7. Observability is a product  
   - **Hook:** "Isn’t this just ops tooling?"
   - **Core:** Instrumentation, cardinality budgets, and alert quality need owners and roadmaps.
8. Cost is part of the design  
   - **Hook:** "Can we scrape everything forever?"
   - **Core:** High cardinality and noisy logs burn money and attention — budget deliberately.
9. Platforms: Prometheus, Datadog, CloudWatch  
   - **Hook:** "Which vendor should I learn?"
   - **Core:** Learn open models (PromQL, OTel); vendors wrap the same ideas.
10. Myth: more dashboards = more reliable  
   - **Hook:** "We have 200 dashboards!"
   - **Core:** Reliability comes from actionable signals and practiced response — not panel count.
11. Myth: green dashboards mean healthy  
   - **Hook:** "All panels look fine."
   - **Core:** Wrong SLIs and silent gaps lie — validate alerts with drills.
12. Roadmap: junior observability skills  
   - **Hook:** "What should I explain in an interview?"
   - **Core:** Pillars, RED/USE, PromQL basics, alert hygiene, log/trace correlation, and one SLO story.

---

## Module 1. The three pillars in practice (13–24)

13. Metrics: numbers over time  
   - **Hook:** "What is a metric?"
   - **Core:** Aggregatable time series — great for trends, SLOs, and cheap alerts.
14. Logs: discrete events  
   - **Hook:** "When do I need logs?"
   - **Core:** Detailed context for a single request or error — expensive if unbounded.
15. Traces: the request journey  
   - **Hook:** "Why traces when I have logs?"
   - **Core:** Traces show timing across services for one request — latency root cause gold.
16. When metrics beat logs  
   - **Hook:** "Should every debug use grep?"
   - **Core:** “Is error rate up?” → metrics first; “which user?” → logs/traces.
17. When logs beat metrics  
   - **Hook:** "Metrics say 500s — why?"
   - **Core:** Exception text, payload clues, and audit trails live in logs.
18. When traces beat both  
   - **Hook:** "Which hop is slow?"
   - **Core:** Trace waterfalls pinpoint the slow dependency in a mesh of services.
19. Correlation: the real superpower  
   - **Hook:** "How do the pillars connect?"
   - **Core:** Exemplars, trace IDs in logs, and consistent labels glue investigations.
20. Sampling vs full fidelity  
   - **Hook:** "Do we keep 100% of traces?"
   - **Core:** Head/tail sampling balances cost and debug power.
21. Structured vs unstructured logs  
   - **Hook:** "Plain text forever?"
   - **Core:** JSON fields query cheaper and power better alerts.
22. High-cardinality danger preview  
   - **Hook:** "Label user_id on every metric?"
   - **Core:** Explodes series count — put unique IDs in logs/traces, not metric labels.
23. Golden path investigation order  
   - **Hook:** "Alert fired — first three moves?"
   - **Core:** Symptom SLI → recent deploy → dependency health → then deep dive.
24. Mini checklist: pick the right pillar  
   - **Hook:** "Which tool for this question?"
   - **Core:** Rate/trend → metrics; content → logs; cross-service latency → traces.

---

## Module 2. Metrics model and Prometheus mental model (25–44)

25. Time series basics  
   - **Hook:** "What is a time series?"
   - **Core:** Metric name + labels + samples over time.
26. Metric names and conventions  
   - **Hook:** "http_requests_total — why that shape?"
   - **Core:** Clear names with units/suffixes (`_total`, `_seconds`) aid everyone.
27. Labels are dimensions  
   - **Hook:** "What are labels for?"
   - **Core:** Filter and group by `method`, `status`, `instance` — keep them bounded.
28. Counters vs gauges  
   - **Hook:** "When is a counter wrong?"
   - **Core:** Counters only go up (resets aside); gauges go up and down.
29. Rates need counters  
   - **Hook:** "Why not graph raw counters?"
   - **Core:** Use `rate()`/`increase()` for request rates — raw counters look like stairs.
30. Histograms and summaries  
   - **Hook:** "How do I measure latency percentiles?"
   - **Core:** Histograms enable server-side aggregations; summaries are trickier to aggregate.
31. Buckets matter  
   - **Hook:** "p99 looks weird."
   - **Core:** Bad bucket boundaries distort percentiles — design for your SLOs.
32. Prometheus pull model  
   - **Hook:** "Why doesn’t the app push metrics?"
   - **Core:** Prometheus scrapes `/metrics` — service discovery finds targets.
33. Exposition format  
   - **Hook:** "What does /metrics look like?"
   - **Core:** Text exposition with HELP/TYPE — easy to curl-debug.
34. Scrape interval tradeoffs  
   - **Hook:** "Scrape every second?"
   - **Core:** Faster = more cost and noise; match to alert needs.
35. Up metric and target health  
   - **Hook:** "Is the scrape even working?"
   - **Core:** `up == 0` means scrape failed — first check when graphs empty.
36. Service discovery overview  
   - **Hook:** "How does Prometheus find pods?"
   - **Core:** File SD, Kubernetes SD, Consul — dynamic targets beat static lists.
37. Relabeling (intuition)  
   - **Hook:** "Why rewrite labels?"
   - **Core:** Keep useful labels, drop junk, control cardinality at ingest.
38. Recording rules  
   - **Hook:** "Dashboards run heavy queries?"
   - **Core:** Precompute expensive expressions for speed and stable alerts.
39. TSDB retention  
   - **Hook:** "How long do we keep metrics?"
   - **Core:** Local retention + remote write for long-term — plan storage.
40. Federation and remote write (concept)  
   - **Hook:** "One Prometheus isn’t enough."
   - **Core:** Scale-out patterns exist — complexity rises quickly.
41. Exporters: node, blackbox  
   - **Hook:** "App has no /metrics yet."
   - **Core:** Exporters bridge system and probe checks into Prometheus.
42. Instrumentation libraries  
   - **Hook:** "How does my Go/Python app expose metrics?"
   - **Core:** Client libs register counters/histograms — keep labels sane.
43. Avoid metrics for unique events  
   - **Hook:** "Counter per email address?"
   - **Core:** That’s a log/trace — metrics must aggregate.
44. Mini checklist: healthy metric design  
   - **Hook:** "Before we add a metric?"
   - **Core:** Clear name, bounded labels, right type, documented owner, alert/dashboard use-case.

---

## Module 3. PromQL you will actually use (45–60)

45. Instant vs range vectors  
   - **Hook:** "Why does rate need a range?"
   - **Core:** Instant = now; range = window of samples — `rate` needs a range vector.
46. Selectors and matchers  
   - **Hook:** "How do I filter a series?"
   - **Core:** `{job="api",status=~"5.."}` — exact, regex, not-equals.
47. rate and irate  
   - **Hook:** "Which rate for alerts?"
   - **Core:** `rate` for smoother windows; `irate` for volatile short views — know the difference.
48. sum by / without  
   - **Hook:** "How do I aggregate?"
   - **Core:** `sum by (status)` collapses series — essential for dashboards.
49. avg, max, min, count  
   - **Hook:** "When is avg misleading?"
   - **Core:** Averages hide tails — pair with percentiles/histograms for latency.
50. histogram_quantile  
   - **Hook:** "How do I get p99 from buckets?"
   - **Core:** `histogram_quantile(0.99, sum by (le) (rate(...)))` — classic pattern.
51. increase over a window  
   - **Hook:** "Errors in the last hour?"
   - **Core:** `increase()` on counters for event counts across a window.
52. bool comparisons and alerting expressions  
   - **Hook:** "How do alerts decide true?"
   - **Core:** Expressions evaluate to firing series — keep them simple and labeled.
53. offset and historical compare  
   - **Hook:** "Is this worse than yesterday?"
   - **Core:** `offset 1d` for rough comparisons — careful with DST/seasonality.
54. absent and missing data  
   - **Hook:** "Metric disappeared — silent failure."
   - **Core:** Alert on `absent()` / `up` — missing data is a signal.
55. Binary operators and matching  
   - **Hook:** "Why did my join return empty?"
   - **Core:** Label matching rules on arithmetic joins — common PromQL footgun.
56. Subqueries (brief)  
   - **Hook:** "Need max of rate?"
   - **Core:** Subqueries exist but are heavy — prefer recording rules.
57. Errors: timeouts and cardinality explosions  
   - **Hook:** "Query dies in Grafana."
   - **Core:** Too many series — aggregate earlier or fix labels.
58. PromQL style for alerts vs explore  
   - **Hook:** "Same query everywhere?"
   - **Core:** Alerts want stable, cheap expressions; explore can be heavier.
59. Unit tests for recording/alert rules (concept)  
   - **Hook:** "Can we test PromQL?"
   - **Core:** `promtool test rules` catches broken alerts before prod.
60. Mini checklist: readable PromQL  
   - **Hook:** "Will the next on-call understand this?"
   - **Core:** Named recording rules, bounded aggregations, comments in rule files, no mystery regex.

---

## Module 4. Grafana and dashboards that don’t suck (61–76)

61. Datasource mental model  
   - **Hook:** "Where does Grafana get data?"
   - **Core:** Datasources point at Prometheus/Loki/etc. — wrong UID = empty panels.
62. Dashboard vs explore  
   - **Hook:** "Should every question be a dashboard?"
   - **Core:** Explore for incidents; dashboards for known golden views.
63. Panel types: time series, stat, table  
   - **Hook:** "Which panel for error rate?"
   - **Core:** Time series for trends; stats for current SLI; tables for top-N.
64. Variables and templating  
   - **Hook:** "One dashboard per service?"
   - **Core:** Variables for `job`/`namespace` make reusable boards.
65. Units and axes  
   - **Hook:** "Graph looks dramatic but meaningless."
   - **Core:** Set correct units (req/s, seconds) — avoid dual-axis lies.
66. Consistent time ranges  
   - **Hook:** "Why don’t panels align?"
   - **Core:** Shared time picker; beware relative ranges during postmortems.
67. Annotations for deploys  
   - **Hook:** "Did the spike start at the release?"
   - **Core:** Deploy annotations correlate changes with symptoms.
68. RED dashboard pattern  
   - **Hook:** "What should every service board show?"
   - **Core:** Rate, Errors, Duration — top row, always.
69. USE for resources  
   - **Hook:** "Node board essentials?"
   - **Core:** Utilization, Saturation, Errors for CPU/mem/disk/net.
70. Drill-down links  
   - **Hook:** "How do I jump to logs?"
   - **Core:** Panel links with trace/log query templates save minutes.
71. Folder and naming hygiene  
   - **Hook:** "Can’t find the right board."
   - **Core:** Owner tags, service names, deprecate zombie dashboards.
72. Provisioning as code  
   - **Hook:** "UI-only dashboards drift."
   - **Core:** JSON/code provisioning keeps environments consistent.
73. Sharing and permissions  
   - **Hook:** "Interns edited prod boards."
   - **Core:** Lock editors; view-only for most; review changes.
74. Mobile / TV views  
   - **Hook:** "NOC screen is unreadable."
   - **Core:** High-contrast, few panels, large fonts — same rule as shorts.
75. Dashboard review checklist  
   - **Hook:** "Is this board useful in a fire?"
   - **Core:** Symptom first, cause second, links out, owner, tested alert pairing.
76. Mini checklist: service starter board  
   - **Hook:** "New service — minimum viable dashboard?"
   - **Core:** RED + saturation + dependency health + deploy annotations + log/trace links.

---

## Module 5. Golden signals and service health (77–92)

77. Google’s four golden signals  
   - **Hook:** "What must we watch?"
   - **Core:** Latency, traffic, errors, saturation — classic baseline.
78. RED method  
   - **Hook:** "RED vs golden signals?"
   - **Core:** Rate, Errors, Duration — request-centric services.
79. USE method  
   - **Hook:** "USE for what?"
   - **Core:** Resources (CPU, disk, queues) — Utilization, Saturation, Errors.
80. Latency: average is a liar  
   - **Hook:** "Average latency looks fine."
   - **Core:** Watch p95/p99 — users live in the tail.
81. Apdex / quality thresholds (brief)  
   - **Hook:** "How do product folks talk latency?"
   - **Core:** Satisfied/tolerating thresholds map latency to user happiness.
82. Error budgets preview  
   - **Hook:** "Can we ship if we’re reliable enough?"
   - **Core:** SLO burn allows risk — deeper in SLO module.
83. Saturation: queues and thread pools  
   - **Hook:** "CPU low but requests stall."
   - **Core:** Queue depth and pool exhaustion are saturation signals.
84. Dependency health  
   - **Hook:** "Our service is fine — DB isn’t."
   - **Core:** Track downstream error/latency as first-class panels.
85. Multi-tenant noisy neighbor  
   - **Hook:** "Only some customers slow?"
   - **Core:** Bounded tenant labels or log-based breakdowns — careful cardinality.
86. Cold start and cron spikes  
   - **Hook:** "Spikes every hour on the hour."
   - **Core:** Batch jobs distort traffic — annotate schedules.
87. Synthetic checks vs in-app metrics  
   - **Hook:** "Blackbox vs RED?"
   - **Core:** Synthetics catch “is it reachable?”; in-app catches “is it correct?”
88. Business metrics vs infra metrics  
   - **Hook:** "Orders dropped — CPU fine."
   - **Core:** Instrument domain events (checkouts) near user value.
89. Health endpoints are not SLOs  
   - **Hook:** "/health is 200."
   - **Core:** Liveness ≠ user success — separate probes from SLIs.
90. Regional / AZ views  
   - **Hook:** "Only eu-west failing?"
   - **Core:** Break SLIs by region before blaming the whole fleet.
91. User journey monitoring  
   - **Hook:** "Single endpoint green, checkout broken."
   - **Core:** Multi-step synthetics for critical paths.
92. Mini checklist: service is “healthy”  
   - **Hook:** "Define healthy in one glance."
   - **Core:** Error rate OK, latency within SLO, saturation headroom, deps OK, no active pages.

---

## Module 6. Alerting that people don’t hate (93–112)

93. Alert on symptoms, not causes  
   - **Hook:** "Disk alert vs checkout errors?"
   - **Core:** Page on user pain; ticket on underlying capacity when possible.
94. Alertmanager role  
   - **Hook:** "Where do Prometheus alerts go?"
   - **Core:** Alertmanager routes, groups, mutes, and notifies.
95. Severity: page vs ticket  
   - **Hook:** "Everything is P1."
   - **Core:** Reserve pages for urgent user impact — protect sleep and attention.
96. For duration (pending)  
   - **Hook:** "Alert flapped for 30 seconds."
   - **Core:** `for:` waits out blips — tune per signal.
97. Grouping and aggregation  
   - **Hook:** "50 Slack messages for one outage."
   - **Core:** Group by alertname/service — one thread per incident.
98. Inhibition rules  
   - **Hook:** "Datacenter down — spam from every instance."
   - **Core:** Inhibit children when parent fires.
99. Silences carefully  
   - **Hook:** "Silence forever?"
   - **Core:** Time-boxed silences with owners — never permanent without a ticket.
100. Routes to the right team  
   - **Hook:** "DB alert woke the frontend on-call."
   - **Core:** Route by labels (`team=`, `service=`) — ownership clarity.
101. Runbook links in annotations  
   - **Hook:** "Alert says nothing useful."
   - **Core:** Every page links a runbook and a dashboard.
102. Deadman’s switch / Watchdog  
   - **Hook:** "How do we know alerting works?"
   - **Core:** Always-firing watchdog detects broken notification path.
103. No-data alerting  
   - **Hook:** "Metrics stopped — no page."
   - **Core:** Alert on missing scrape/`absent` for critical jobs.
104. Flapping and alert storms  
   - **Hook:** "Pager melted at 3am."
   - **Core:** Fix thresholds, group, and inhibit — then fix the system.
105. Chat vs Pager vs ticket  
   - **Hook:** "Slack is our pager."
   - **Core:** Chat is noisy; pages need acknowledgment and escalation.
106. Escalation policies  
   - **Hook:** "Primary didn’t ack."
   - **Core:** Secondary/manager escalation with clear timeouts.
107. Maintenance windows  
   - **Hook:** "Deploy caused expected errors."
   - **Core:** Planned silences or burn-aware policies — communicate.
108. Alert review meetings  
   - **Hook:** "We ignore half our alerts."
   - **Core:** Weekly prune: delete, downgrade, or fix — toil metric.
109. Testing alerts before prod  
   - **Hook:** "First real fire was the first test."
   - **Core:** Fire test alerts in staging; verify routing and runbooks.
110. SLO burn alerts preview  
   - **Hook:** "Error budget burning fast."
   - **Core:** Multi-window burn-rate alerts — deeper in SLO module.
111. On-call friendly wording  
   - **Hook:** "Cryptic alertname_42."
   - **Core:** Human summary: what’s broken, impact, first link to click.
112. Mini checklist: good page  
   - **Hook:** "Should this wake someone?"
   - **Core:** User impact, actionable, runbook, correct team, not a duplicate storm.

---

## Module 7. Logs that scale (113–132)

113. Why logs still matter  
   - **Hook:** "Aren’t metrics enough?"
   - **Core:** Logs carry the story and rare edge cases metrics discard.
114. stdout vs files in containers  
   - **Hook:** "Where did the logfile go?"
   - **Core:** Containers prefer stdout; agents ship to a backend.
115. Structured logging  
   - **Hook:** "Regex on free text forever?"
   - **Core:** JSON fields (`level`, `trace_id`, `user`) make queries cheap.
116. Log levels discipline  
   - **Hook:** "Everything is ERROR."
   - **Core:** Reserve error for actionable failures; info/debug carefully in prod.
117. Cardinality in logs too  
   - **Hook:** "Unique URLs as labels in Loki?"
   - **Core:** High-cardinality labels explode index cost — use parsed fields carefully.
118. Loki mental model  
   - **Hook:** "Prometheus for logs?"
   - **Core:** Labels for streams + LogQL for content — cheap storage tradeoffs.
119. Promtail / agents  
   - **Hook:** "How do logs leave the node?"
   - **Core:** Agents tail and push — watch agent health like any dependency.
120. LogQL basics  
   - **Hook:** "Find 500s for service X."
   - **Core:** Selector + line filter + parsers — keep selectors selective.
121. OpenSearch / ELK awareness  
   - **Hook:** "When Loki isn’t enough?"
   - **Core:** Full-text search and complex aggregations — different cost model.
122. Retention and legal holds  
   - **Hook:** "Keep logs forever?"
   - **Core:** Hot/warm/cold retention; compliance may force longer windows.
123. PII in logs  
   - **Hook:** "We logged credit cards."
   - **Core:** Redact at source; treat leaks as incidents.
124. Sampling debug logs  
   - **Hook:** "Debug flooded Loki."
   - **Core:** Dynamic level or sampled debug — not permanent DEBUG in prod.
125. Correlate logs with trace_id  
   - **Hook:** "One request across services?"
   - **Core:** Inject and index trace IDs — jump from trace to logs.
126. Multiline exceptions  
   - **Hook:** "Stack traces split into many lines."
   - **Core:** Multiline aggregation in agents — configure explicitly.
127. Audit logs vs app logs  
   - **Hook:** "Who changed the IAM role?"
   - **Core:** Separate streams and access controls for security audit trails.
128. Live tail vs historical search  
   - **Hook:** "Incident happening now."
   - **Core:** Tail for live; indexed search for past windows.
129. Cost controls for logs  
   - **Hook:** "Log bill exceeded compute."
   - **Core:** Drop noisy paths, sample, shorter retention, better structure.
130. Logging anti-patterns  
   - **Hook:** "What should we stop doing?"
   - **Core:** Logging secrets, per-request huge payloads, unbounded labels.
131. Investigation pattern with logs  
   - **Hook:** "Alert → logs, what next?"
   - **Core:** Timebox → filter service/level → group messages → pick one request → follow trace.
132. Mini checklist: production logging  
   - **Hook:** "Definition of done?"
   - **Core:** Structured, levels sane, trace_id, no PII/secrets, retention set, agent monitored.

---

## Module 8. Traces and OpenTelemetry (133–152)

133. What is a distributed trace?  
   - **Hook:** "One request, many services."
   - **Core:** A trace is a tree of spans showing where time went.
134. Spans and attributes  
   - **Hook:** "What is a span?"
   - **Core:** Named operation with timing and key/value attributes.
135. Trace context propagation  
   - **Hook:** "Why did the trace break at the HTTP client?"
   - **Core:** W3C baggage/headers must pass through every hop.
136. OpenTelemetry role  
   - **Hook:** "Vendor lock-in on agents?"
   - **Core:** OTel is the portable instrumentation standard — export to many backends.
137. Traces vs profiles (brief)  
   - **Hook:** "Is tracing CPU profiling?"
   - **Core:** Traces = request path; profiles = code hotspots — complementary.
138. Automatic vs manual instrumentation  
   - **Hook:** "Do libraries auto-trace?"
   - **Core:** Auto gets you far; manual spans mark business boundaries.
139. Critical path reading  
   - **Hook:** "How do I read a waterfall?"
   - **Core:** Find the longest span on the path to the user — start there.
140. N+1 and chatty services  
   - **Hook:** "Trace shows 200 tiny DB spans."
   - **Core:** Classic ORM/chatty patterns — fix with batching.
141. Error marks on spans  
   - **Hook:** "Where did it fail?"
   - **Core:** Status/error attributes highlight failing spans quickly.
142. Tail-based sampling  
   - **Hook:** "Keep only interesting traces?"
   - **Core:** Prefer errors/slow traces when you can’t keep 100%.
143. Exemplars linking metrics→traces  
   - **Hook:** "Click from p99 spike into a trace?"
   - **Core:** Exemplars bridge Prometheus histograms to trace examples.
144. Jaeger / Tempo / vendor UIs  
   - **Hook:** "Which UI should I learn?"
   - **Core:** Concepts transfer — search by service, latency, tags.
145. Frontend / RUM traces (brief)  
   - **Hook:** "Browser to backend?"
   - **Core:** Real user monitoring connects UX to APIs — privacy careful.
146. Messaging spans  
   - **Hook:** "Async queues break traces?"
   - **Core:** Propagate context in message headers — or accept broken graphs.
147. Database span usefulness  
   - **Hook:** "Should every query be a span?"
   - **Core:** Yes for slow-query hunting — sanitize statements (no PII).
148. Overhead awareness  
   - **Hook:** "Tracing slowed us down."
   - **Core:** Batch exporters, sampling, and attribute limits control overhead.
149. Broken traces debugging  
   - **Hook:** "Only the edge service shows up."
   - **Core:** Missing propagator, proxy stripping headers, or wrong sampler.
150. Trace-based alerts (careful)  
   - **Hook:** "Alert on every slow trace?"
   - **Core:** Prefer metric SLOs; traces for diagnosis — alert volume explodes otherwise.
151. OTel collector role  
   - **Hook:** "Apps push where?"
   - **Core:** Collector centralizes processing, sampling, and export.
152. Mini checklist: tracing MVP  
   - **Hook:** "Minimum useful tracing?"
   - **Core:** Context propagation, auto HTTP/DB, service names consistent, sampling policy, link from dashboards.

---

## Module 9. Cardinality, cost, and platform limits (153–166)

153. What is cardinality?  
   - **Hook:** "Why did Prometheus OOM?"
   - **Core:** Unique label combinations create series — unbounded labels kill TSDB.
154. Dangerous labels  
   - **Hook:** "user_id, email, url path…?"
   - **Core:** High-churn identifiers belong in logs/traces, not metric labels.
155. Metric budget per team  
   - **Hook:** "Who can add metrics?"
   - **Core:** Budgets and review stop silent cost growth.
156. Histogram bucket explosion  
   - **Hook:** "Custom buckets × instances × paths."
   - **Core:** Multiply carefully — shared bucket schemas help.
157. Scrape volume math  
   - **Hook:** "Rough cost intuition?"
   - **Core:** Series × scrape frequency × retention ≈ storage/CPU load.
158. Remote write costs  
   - **Hook:** "Vendor bill shocked finance."
   - **Core:** Samples ingested and queried both cost — optimize both.
159. Log volume drivers  
   - **Hook:** "Which endpoints flood logs?"
   - **Core:** Health checks and debug spam — drop or sample at agent.
160. Trace storage costs  
   - **Hook:** "100% sampling bankrupted us."
   - **Core:** Tail sample errors/latency; keep low baseline rate.
161. Retention tiers  
   - **Hook:** "Need 13 months of raw metrics?"
   - **Core:** Downsample/long-term store vs raw high-res short retention.
162. Quotas and limits in the platform  
   - **Hook:** "One tenant starved Prometheus."
   - **Core:** Per-tenant limits protect the shared observability plane.
163. Delete vs relabel  
   - **Hook:** "Bad metric already ingested."
   - **Core:** Drop at scrape/relabel; deletion is rare and painful.
164. Observability FinOps  
   - **Hook:** "Showback for telemetry?"
   - **Core:** Attribute cost by team/service — incentives follow.
165. Capacity alerts for the observability stack  
   - **Hook:** "Who watches Prometheus?"
   - **Core:** Monitor the monitors — disk, lag, rule evaluation duration.
166. Mini checklist: before adding telemetry  
   - **Hook:** "New metric/log field/span attr?"
   - **Core:** Use-case, cardinality estimate, owner, retention, and alert/dashboard plan.

---

## Module 10. Kubernetes and cloud signals (167–184)

167. Cluster vs app telemetry  
   - **Hook:** "Node CPU high — is my app bad?"
   - **Core:** Separate node/kube-system signals from application RED.
168. kube-prometheus-stack overview  
   - **Hook:** "How do people monitor K8s?"
   - **Core:** Prometheus operator + Grafana + node/kube metrics — common default.
169. ServiceMonitor / PodMonitor  
   - **Hook:** "How does Prometheus find my pods?"
   - **Core:** CRDs declare scrape targets — labels must match.
170. Cadvisor and container metrics  
   - **Hook:** "CPU throttling?"
   - **Core:** Container usage vs limits — throttling explains latency.
171. Kube-state-metrics  
   - **Hook:** "Deployment desired vs ready?"
   - **Core:** Object counts/conditions as metrics — great for deploy health.
172. Control plane monitoring awareness  
   - **Hook:** "API server slow?"
   - **Core:** Managed vs self-managed differs — know who owns which signals.
173. Network policies and DNS latency  
   - **Hook:** "Intermittent timeouts."
   - **Core:** CoreDNS and CNI metrics join app traces for network mysteries.
174. HPA and custom metrics (brief)  
   - **Hook:** "Scale on queue depth?"
   - **Core:** Custom/external metrics bridge Prom to autoscaling — cardinality careful.
175. Persistent volume signals  
   - **Hook:** "Pod Pending — disk?"
   - **Core:** Volume attachment/capacity metrics and events — pair with kubectl.
176. CrashLoop and restart metrics  
   - **Hook:** "Restarts climbing."
   - **Core:** `kube_pod_container_status_restarts_total` style signals + logs.
177. Events vs metrics vs logs in K8s  
   - **Hook:** "Where do SchedulingFailed messages live?"
   - **Core:** Events are short-lived; ship important ones to logs if needed.
178. Multi-cluster views  
   - **Hook:** "Which cluster pages?"
   - **Core:** Consistent `cluster` label and separate routing per env.
179. Cloud provider metrics  
   - **Hook:** "ALB 5xx vs app 5xx."
   - **Core:** Edge/load balancer metrics catch issues before the pod.
180. Serverless / managed tradeoffs  
   - **Hook:** "Less access to the OS."
   - **Core:** Rely on platform metrics + app RED + traces — host USE fades.
181. Cost metrics for K8s (brief)  
   - **Hook:** "Which namespace burns money?"
   - **Core:** Request/usage vs limits — FinOps meets observability.
182. Security signals overlap  
   - **Hook:** "Auth failures spiking."
   - **Core:** Security telemetry joins SRE views — don’t silo completely.
183. Local kind/minikube limits  
   - **Hook:** "Lab metrics look empty."
   - **Core:** Full stacks need RAM; start with app metrics before full kube-prom.
184. Mini checklist: app on Kubernetes  
   - **Hook:** "Telemetry definition of done?"
   - **Core:** ServiceMonitor, RED dashboards, pod restart alerts, log shipping, optional traces with propagation.

---

## Module 11. SLIs, SLOs, and error budgets (185–204)

185. SLI: what you measure  
   - **Hook:** "What is an SLI?"
   - **Core:** A quantitative measure of user happiness — e.g. successful requests ratio.
186. SLO: the target  
   - **Hook:** "What is an SLO?"
   - **Core:** A goal for an SLI over a window — e.g. 99.9% success over 30 days.
187. SLA vs SLO  
   - **Hook:** "Legal contract or engineering target?"
   - **Core:** SLA is external/contractual; SLO is internal engineering policy.
188. Choosing good SLIs  
   - **Hook:** "CPU as SLI?"
   - **Core:** Prefer user-facing availability/latency — not low-level resource gauges alone.
189. Windowed vs rolling objectives  
   - **Hook:** "Calendar month vs 28-day rolling?"
   - **Core:** Rolling windows smooth month boundaries — pick explicitly.
190. Multi-window burn rates  
   - **Hook:** "How do burn alerts work?"
   - **Core:** Fast and slow windows catch both spikes and slow leaks.
191. Error budget policy  
   - **Hook:** "Budget empty — freeze features?"
   - **Core:** Pre-agreed policy (slow releases, reliability focus) beats arguments in the moment.
192. Latency SLOs need histograms  
   - **Hook:** "Can I SLO on average latency?"
   - **Core:** Percentile SLOs need histogram-quality data.
193. Availability math intuition  
   - **Hook:** "What’s 99.9% in downtime?"
   - **Core:** Rough minutes/month — communicate impact clearly to stakeholders.
194. Too many SLOs  
   - **Hook:** "We defined 40 SLOs."
   - **Core:** Few critical user journeys — rest are diagnostics.
195. Alerting from SLOs vs raw infra  
   - **Hook:** "Page on disk or on burn?"
   - **Core:** Burn-rate pages for user impact; capacity tickets for disks.
196. Recording SLI ratios  
   - **Hook:** "How do we compute success ratio?"
   - **Core:** `good / total` recording rules — document exclusions (health checks).
197. Excluding synthetic traffic carefully  
   - **Hook:** "Health checks inflated success."
   - **Core:** Filter probes from SLIs or track separately.
198. Dependency SLO vs yours  
   - **Hook:** "Payment provider outage burned our budget."
   - **Core:** Separate accountability; multi-dependent SLIs need design.
199. Communicating budgets to product  
   - **Hook:** "PM wants to ship."
   - **Core:** Shared dashboard of budget remaining — joint decisions.
200. Revisiting SLO targets  
   - **Hook:** "We always burn or never burn."
   - **Core:** Adjust targets with data — too tight or too loose both fail.
201. Cold start for new services  
   - **Hook:** "No history yet."
   - **Core:** Provisional SLOs + faster iteration — tighten later.
202. Documenting SLOs  
   - **Hook:** "Where do SLOs live?"
   - **Core:** Short service doc: SLI formula, window, owner, alert links.
203. Interview: explain error budget  
   - **Hook:** "Classic SRE question."
   - **Core:** Allowed unreliability that funds velocity — when empty, prioritize reliability.
204. Mini checklist: first SLO  
   - **Hook:** "Ship one SLO this month?"
   - **Core:** One journey, clear SLI, 30-day target, burn alert, dashboard, owner, policy when empty.

---

## Module 12. On-call, incidents, and runbooks (205–224)

205. On-call is a skill  
   - **Hook:** "Is on-call just answering pages?"
   - **Core:** Detection, mitigation, communication, and follow-up — practiced deliberately.
206. First five minutes playbook  
   - **Hook:** "Page received — panic?"
   - **Core:** Ack → impact → recent changes → mitigate → communicate.
207. Incident commander role  
   - **Hook:** "Everyone debugging at once."
   - **Core:** One IC coordinates; others investigate — reduces chaos.
208. Severity levels  
   - **Hook:** "Is this SEV1?"
   - **Core:** Clear definitions by user impact — shared language.
209. Status updates cadence  
   - **Hook:** "Stakeholders spam for news."
   - **Core:** Timed updates even if “still investigating.”
210. Mitigate before root-cause perfection  
   - **Hook:** "Still digging while users burn."
   - **Core:** Rollback/scale/feature-flag first — deep RCA after impact drops.
211. Runbooks: what good looks like  
   - **Hook:** "Wiki novel nobody reads."
   - **Core:** Short steps, commands, dashboards, escalation — tested quarterly.
212. Linking alerts to runbooks  
   - **Hook:** "Alert has no next step."
   - **Core:** Annotation URL required for every page-level alert.
213. Game days / failure drills  
   - **Hook:** "We only learn in real outages."
   - **Core:** Practice dependency failure and dashboard use in daylight.
214. Blameless postmortems  
   - **Hook:** "Who messed up?"
   - **Core:** Systems and signals failed — fix those, not people.
215. Action items that close  
   - **Hook:** "Postmortem actions rot."
   - **Core:** Owners + due dates + tracked tickets — or don’t bother writing them.
216. Timeline construction  
   - **Hook:** "When did it start?"
   - **Core:** Metrics + deploys + logs build a factual timeline.
217. Customer communication templates  
   - **Hook:** "What do we say externally?"
   - **Core:** Honest impact, no speculation, next update time.
218. Handoffs between shifts  
   - **Hook:** "Night left a mess for morning."
   - **Core:** Written state, open hypotheses, next actions.
219. Shadow on-call  
   - **Hook:** "New engineer thrown in alone?"
   - **Core:** Shadow rotations before primary — psychological safety.
220. Toil from noisy alerts  
   - **Hook:** "On-call is unlivable."
   - **Core:** Alert debt is reliability debt — burn it down.
221. Using traces under pressure  
   - **Hook:** "Too many spans, no time."
   - **Core:** Filter errors/slow; one example request; follow critical path.
222. When to escalate to vendor/cloud  
   - **Hook:** "Is it us or AWS?"
   - **Core:** Check status pages + boundary metrics before deep rabbit holes.
223. Personal on-call hygiene  
   - **Hook:** "Laptop not ready at 2am."
   - **Core:** VPN, creds, bookmarks, runbook pack — prepare before the week.
224. Mini checklist: after every page  
   - **Hook:** "What before you sleep again?"
   - **Core:** Mitigated, documented, alert tuned if noisy, follow-up ticket filed.

---

## Module 13. Culture, ownership, and interviews (225–236)

225. You build it, you observe it  
   - **Hook:** "Platform owns all dashboards?"
   - **Core:** Service teams own SLIs; platform provides the rails.
226. Instrumentation reviews in MR  
   - **Hook:** "Metrics added without review."
   - **Core:** Treat telemetry changes like API changes — cardinality and naming.
227. Observability definition of done  
   - **Hook:** "Feature shipped blind."
   - **Core:** DoD includes RED, logs fields, alerts, and a dashboard link.
228. Shared schemas and naming  
   - **Hook:** "Every team invents label names."
   - **Core:** Org conventions beat chaos — document them.
229. Platform vs embedded SRE  
   - **Hook:** "Central team or per product?"
   - **Core:** Hybrid common — platform for stack, embedded for domain SLOs.
230. Interview: pillars and when to use each  
   - **Hook:** "Classic screening question."
   - **Core:** Metrics for aggregates, logs for details, traces for distributed latency.
231. Interview: design monitoring for X  
   - **Hook:** "Design observability for a payments API."
   - **Core:** SLIs, RED, deps, alerts, runbooks, cardinality plan.
232. Interview: alert fatigue  
   - **Hook:** "How do you fix noisy paging?"
   - **Core:** Symptom-based, severity, grouping, review loop, ownership.
233. Portfolio: show a dashboard + postmortem  
   - **Hook:** "How do I prove skill?"
   - **Core:** Public demo board and a blameless write-up beat buzzwords.
234. Myth: observability tools replace engineers  
   - **Hook:** "AI will on-call for us."
   - **Core:** Tools amplify judgment — they don’t own risk.
235. What’s next after this course  
   - **Hook:** "Where do I go deeper?"
   - **Core:** Repo: `observability-basic` → `intermediate` → `advanced`, `sre`, `opensearch-basic`, K8s monitoring chapters.
236. Closing rule: measure what users feel  
   - **Hook:** "One sentence to remember?"
   - **Core:** Instrument user journeys, alert on pain, explore with the right pillar, and keep cardinality honest.

---

## Extra: template for every short

- Hook (3–5 sec): one pain/question  
- Core (~45–55 sec): 1 concept + failure mode + practical check  
- Lock-in (5–10 sec): query/checklist / memorable rule  
- CTA: `Master observability faster. Theory, hands-on labs, and interview questions - link in bio.`

On-screen query/panel rule:
- One short PromQL/LogQL line or ≤6-line snippet max  
- Huge font, high contrast — readable on a phone  
- No dense dashboard screenshots as the only visual

Scene 1: large TopicBanner with the lesson topic title.

---

## How to publish for watch-through

- Ship by modules (series), not randomly  
- End each video by teasing the next lesson  
- Keep one visual style and module rubric  
- Show key queries large on screen  
- Make 1–2 diagnostic shorts for every 5 theory shorts (empty graphs, alert storms, cardinality blowups, broken traces)  
- Don’t skip modules: why observe → pillars → metrics → PromQL → Grafana → golden signals → alerts → logs → traces → cost → K8s → SLOs → on-call → culture  

Suggested pairing on the channel: **Linux** + **CI/CD** + **Kubernetes** shorts feed this series; this series feeds **SRE** depth and interview prep.

Aligned courses in-repo: `courses/observability-basic`, `observability-intermediate`, `observability-advanced`, `sre`, `opensearch-basic`, `kuber-advanced/14-observability.md`, stand `deploy/observability`.

Pipeline guide: `observability-shorts-pipeline-prompt.md` (create from Go/K8s/Linux pipeline templates when you start rendering).
