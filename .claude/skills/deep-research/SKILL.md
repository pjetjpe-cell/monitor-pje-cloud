---
name: deep-research
description: Multi-source research with adversarial verification and cited synthesis. Use when investigating a complex technical question, comparing technologies, or gathering evidence-based answers. Fans out searches, verifies claims, and produces a cited report.
trigger: explicit
---

# Deep Research Skill

Source: 199-biotechnologies/claude-deep-research-skill + community patterns

Systematic research that goes beyond a single search. Cross-validates sources, flags contradictions, and delivers a structured report with citations.

## Research Process

### Phase 1 — Question Decomposition

Break the research question into sub-questions:
```
Main question: "Should we use Redis or Memcached for session storage?"

Sub-questions:
1. What are the performance characteristics of each?
2. What persistence options does each offer?
3. What is the operational complexity?
4. What does the community recommend in 2026?
5. Are there relevant benchmarks?
```

### Phase 2 — Fan-Out Search

Search multiple angles simultaneously:
- Official documentation
- Performance benchmarks (look for dates — prefer recent)
- Community discussions (HN, Reddit, Stack Overflow)
- Academic or technical papers
- Case studies from companies at relevant scale

### Phase 3 — Adversarial Verification

For each claim found, ask:
- Is this source authoritative or just popular?
- Is this information current (when was it published)?
- Does another source contradict this?
- Is this sponsored/biased content?
- Does this apply at our scale and context?

Flag contradictions explicitly in the report.

### Phase 4 — Synthesis

Produce a structured report:

```markdown
## Research Report: <Question>

**Date:** <today>
**Confidence:** High / Medium / Low

### Summary (TL;DR)
2-3 sentence answer to the main question.

### Findings

#### Finding 1: <Key insight>
<Evidence and explanation>
Source: [Title](URL) — Published: <date>

#### Finding 2: <Key insight>
...

### Contradictions & Uncertainties
- Source A claims X, but Source B from <date> claims Y.
  Resolution: Y is more recent and from a primary source.

### Recommendation
Based on the above, for our context:
**<Specific recommendation>**

Caveats:
- This applies when <condition>
- Revisit if <circumstances change>

### Sources
1. [Source Name](URL) — <brief description of relevance>
2. ...
```

## Research Guidelines

**Prefer primary sources:**
- Official documentation > blog posts
- Peer-reviewed papers > opinion pieces
- Official benchmarks > anecdotal claims
- Recent > old (check dates — prefer ≤ 2 years)

**Healthy skepticism:**
- Vendor comparisons favor the vendor
- "Best practice" without context is often outdated
- Benchmarks are optimized for the benchmark, not real workloads
- Popular ≠ correct

**Scope discipline:**
- Stay on the research question
- Note tangential findings but don't chase them
- If the question is unanswerable with available data, say so

## Use Cases for monitor-pje-cloud

This skill is particularly useful for:
- Evaluating monitoring solutions (Datadog vs Grafana vs custom)
- Researching PJe API capabilities and limitations
- Investigating Brazilian legal system technical requirements
- Comparing cloud providers for this specific use case
- Understanding regulatory requirements (LGPD, CNJ standards)
