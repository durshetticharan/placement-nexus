"""
Placement Nexus — Resume-Matcher Engine
Inspired by open-source Resume-Matcher architecture:
- TF-IDF & N-Gram Keyphrase Extraction
- Vector Space Model & Cosine Similarity
- Sectional Semantic Matching
- Categorized Skill Taxonomy Gap Analysis
- Actionable ATS Optimization Suggestions
"""
from __future__ import annotations

import re
import math
from typing import Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Domain Skill Taxonomy ────────────────────────────────────────────────────

SKILL_TAXONOMY: dict[str, list[str]] = {
    "Programming Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "go",
        "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "dart", "sql"
    ],
    "Frameworks & Libraries": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js",
        "express", "express.js", "spring boot", "django", "flask", "fastapi",
        "asp.net", "laravel", "pytorch", "tensorflow", "keras", "pandas",
        "numpy", "scikit-learn", "tailwind", "bootstrap", "graphql", "redux"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker",
        "kubernetes", "terraform", "ansible", "jenkins", "github actions",
        "gitlab ci", "ci/cd", "linux", "nginx", "prometheus", "grafana"
    ],
    "Databases & Storage": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
        "dynamodb", "sqlite", "cassandra", "mariadb", "oracle", "firebase"
    ],
    "Architecture & Methodologies": [
        "microservices", "rest api", "restful api", "restful apis", "grpc",
        "event-driven", "system design", "data structures", "algorithms",
        "oop", "object-oriented", "agile", "scrum", "kanban", "test-driven development", "tdd"
    ],
    "Soft Skills & Leadership": [
        "communication", "leadership", "collaboration", "problem solving",
        "critical thinking", "project management", "time management", "mentoring"
    ],
}

# Reverse lookup for fast classification
KEYWORD_TO_CATEGORY: dict[str, str] = {}
for category, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        KEYWORD_TO_CATEGORY[skill.lower()] = category

# Common English and Resume stopwords to filter out of keyphrase analysis
EXTENDED_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
    "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
    "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
    "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
    "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
    "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves", "experience", "years", "candidate", "role", "work",
    "team", "responsible", "working", "knowledge", "required", "requirements",
    "duties", "responsibilities", "must", "plus", "preferred", "including", "across"
}


def clean_text(text: str) -> str:
    """Preprocess text while preserving key technical terms with punctuation."""
    if not text:
        return ""
    # Normalize unicode and whitespace
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned


def extract_section_text(text: str, section_names: list[str]) -> str:
    """Extract content from specific sections (e.g. experience, projects)."""
    lines = text.split("\n")
    capturing = False
    captured_lines: list[str] = []
    section_pattern = re.compile(
        r"^(experience|education|skills|projects|contact|summary|work history|technologies)",
        re.IGNORECASE,
    )

    for line in lines:
        trimmed = line.strip().lower()
        if not capturing and any(name.lower() in trimmed for name in section_names):
            capturing = True
            colon_idx = line.find(":")
            if colon_idx != -1 and colon_idx < len(line) - 1:
                captured_lines.append(line[colon_idx + 1:].strip())
            continue

        if capturing and trimmed and section_pattern.match(trimmed):
            break

        if capturing and trimmed:
            captured_lines.append(line.strip())

    return " ".join(captured_lines) if captured_lines else text


def compute_vector_similarity(text1: str, text2: str) -> float:
    """
    Compute TF-IDF Vector Cosine Similarity between two text documents (0.0 to 1.0).
    Uses sublinear TF scaling and n-gram range (1, 2) for phrase matching.
    """
    if not text1.strip() or not text2.strip():
        return 0.0

    try:
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            sublinear_tf=True,
            max_features=5000,
        )
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        sim_matrix = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        score = float(sim_matrix[0][0])
        return max(0.0, min(1.0, score))
    except Exception:
        # Fallback to Jaccard similarity if vectorizer fails
        words1 = set(re.findall(r"\w+", text1.lower())) - EXTENDED_STOPWORDS
        words2 = set(re.findall(r"\w+", text2.lower())) - EXTENDED_STOPWORDS
        if not words1 or not words2:
            return 0.0
        return len(words1 & words2) / len(words1 | words2)


def extract_keyphrases_and_skills(text: str, max_phrases: int = 30) -> list[dict[str, Any]]:
    """
    Extract keyphrases and categorized skills using TF-IDF ranking + taxonomy matching.
    """
    lower_text = text.lower()
    extracted: dict[str, dict[str, Any]] = {}

    # 1. Match against known skill taxonomy
    for skill_name, category in KEYWORD_TO_CATEGORY.items():
        pattern = r"\b" + re.escape(skill_name) + r"\b"
        matches = len(re.findall(pattern, lower_text))
        if matches > 0:
            extracted[skill_name] = {
                "name": skill_name.title() if len(skill_name) > 3 else skill_name.upper(),
                "category": category,
                "frequency": matches,
                "importance": "high" if category in ["Programming Languages", "Frameworks & Libraries", "Cloud & DevOps"] else "medium",
            }

    # 2. Extract top n-grams using TF-IDF
    try:
        tfidf = TfidfVectorizer(
            ngram_range=(1, 3),
            stop_words="english",
            max_features=100,
            token_pattern=r"(?u)\b[a-zA-Z0-9#+.]{2,}\b",
        )
        matrix = tfidf.fit_transform([text])
        feature_names = tfidf.get_feature_names_out()
        scores = matrix.toarray()[0]

        ranked_indices = np.argsort(scores)[::-1]
        for idx in ranked_indices[:max_phrases]:
            phrase = feature_names[idx].lower()
            if phrase in EXTENDED_STOPWORDS or len(phrase) < 3 or phrase.isnumeric():
                continue
            if phrase not in extracted:
                extracted[phrase] = {
                    "name": phrase.title(),
                    "category": KEYWORD_TO_CATEGORY.get(phrase, "Domain / General"),
                    "frequency": len(re.findall(r"\b" + re.escape(phrase) + r"\b", lower_text)),
                    "importance": "medium",
                }
    except Exception:
        pass

    return list(extracted.values())


def match_resume_to_jd(resume_text: str, job_description: str) -> dict[str, Any]:
    """
    Complete Resume-Matcher algorithm:
    1. Vector Semantic Similarity (TF-IDF Cosine Similarity)
    2. Sectional Relevancy (Experience & Projects vs JD)
    3. Categorized Keyword & Skill Matching
    4. Missing High-Impact Keywords Detection
    5. Actionable ATS Optimization Suggestions
    """
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(job_description)

    # 1. Compute Semantic Vector Similarity
    overall_vector_sim = compute_vector_similarity(clean_resume, clean_jd)

    # Section-specific vector similarities
    resume_exp = extract_section_text(clean_resume, ["experience", "employment", "work history"])
    resume_proj = extract_section_text(clean_resume, ["projects", "portfolio"])

    exp_similarity = compute_vector_similarity(resume_exp, clean_jd) if resume_exp != clean_resume else overall_vector_sim
    proj_similarity = compute_vector_similarity(resume_proj, clean_jd) if resume_proj != clean_resume else overall_vector_sim

    # 2. Keyphrase & Skill Extraction
    jd_skills = extract_keyphrases_and_skills(clean_jd, max_phrases=40)
    resume_skills = extract_keyphrases_and_skills(clean_resume, max_phrases=50)

    resume_skill_names_lower = {s["name"].lower() for s in resume_skills}
    resume_text_lower = clean_resume.lower()

    matched_keywords: list[dict[str, Any]] = []
    missing_keywords: list[dict[str, Any]] = []

    category_stats: dict[str, dict[str, int]] = {}

    for jd_item in jd_skills:
        name_lower = jd_item["name"].lower()
        category = jd_item["category"]

        if category not in category_stats:
            category_stats[category] = {"total": 0, "matched": 0}
        category_stats[category]["total"] += 1

        is_matched = (
            name_lower in resume_skill_names_lower
            or bool(re.search(r"\b" + re.escape(name_lower) + r"\b", resume_text_lower))
        )

        if is_matched:
            category_stats[category]["matched"] += 1
            matched_keywords.append({
                "name": jd_item["name"],
                "category": category,
                "importance": jd_item["importance"],
            })
        else:
            missing_keywords.append({
                "name": jd_item["name"],
                "category": category,
                "importance": jd_item["importance"],
            })

    # Sort missing keywords by importance
    missing_keywords.sort(
        key=lambda x: (0 if x["importance"] == "high" else 1, x["category"])
    )

    # 3. Category Match Percentage Breakdown
    category_breakdown: list[dict[str, Any]] = []
    for category, stats in category_stats.items():
        total = stats["total"]
        matched = stats["matched"]
        pct = round((matched / total * 100) if total > 0 else 100)
        category_breakdown.append({
            "category": category,
            "matchedCount": matched,
            "totalCount": total,
            "percentage": pct,
        })

    # 4. Hybrid ATS Match Score (Resume-Matcher weighted blend)
    # 40% Keyword Coverage + 35% Vector Semantic Similarity + 15% Experience Relevancy + 10% Project Relevancy
    keyword_ratio = (
        len(matched_keywords) / max(len(jd_skills), 1)
    )
    keyword_score = round(keyword_ratio * 100)
    vector_score = round(overall_vector_sim * 100)
    exp_score = round(exp_similarity * 100)
    proj_score = round(proj_similarity * 100)

    # Blend calculation
    ats_score = round(
        (keyword_score * 0.40) +
        (vector_score * 0.35) +
        (exp_score * 0.15) +
        (proj_score * 0.10)
    )
    ats_score = max(5, min(99, ats_score)) if jd_skills else vector_score

    # 5. Targeted ATS Optimization Suggestions
    suggestions: list[str] = []
    if missing_keywords:
        top_missing = [k["name"] for k in missing_keywords if k["importance"] == "high"][:5]
        if top_missing:
            suggestions.append(
                f"Incorporate high-impact required keywords in your skills/experience: {', '.join(top_missing)}."
            )

    if exp_score < 50:
        suggestions.append(
            "Tailor your work experience bullet points to mirror the action verbs and technical stack stated in the Job Description."
        )

    if proj_score < 50:
        suggestions.append(
            "Highlight projects that directly utilize the target technologies and frameworks specified in the job posting."
        )

    if vector_score < 60:
        suggestions.append(
            "Refine your professional summary and project descriptions to increase semantic alignment with the role's responsibilities."
        )

    if len(suggestions) == 0:
        suggestions.append("Great alignment! Your resume closely reflects the technical stack and requirements.")

    return {
        "matchPercentage": ats_score,
        "vectorSimilarity": vector_score,
        "keywordMatchScore": keyword_score,
        "experienceRelevanceScore": exp_score,
        "projectRelevanceScore": proj_score,
        "matchedKeywordsCount": len(matched_keywords),
        "totalJdKeywordsCount": len(jd_skills),
        "matchedKeywords": [k["name"] for k in matched_keywords],
        "missingKeywords": [k["name"] for k in missing_keywords],
        "missingKeywordsDetails": missing_keywords,
        "categoryBreakdown": category_breakdown,
        "suggestions": suggestions,
        "methodology": "Resume-Matcher Vector Embedding (TF-IDF) + N-Gram Skill Taxonomy Gap Analysis",
    }
