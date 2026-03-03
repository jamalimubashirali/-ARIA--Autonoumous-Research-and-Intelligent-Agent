import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import asyncio
import json
import time
import os
from datetime import datetime

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from evals.grader import evaluate_report
from agents.graph import research_graph

async def run_single_eval(entry: dict):
    query = entry["query"]
    domain = entry["domain"]
    expected_facts = entry["expected_facts"]
    eval_id = entry["id"]
    
    print(f"[{eval_id}] Starting eval for domain '{domain}' - Query: {query[:50]}...")
    
    start_time = time.time()
    
    initial_state = {
        "query": query,
        "domain": domain,
        "metadata": {},
        # Provide empty lists to ensure state is initialized correctly
        "sub_tasks": [],
        "search_results": [],
        "scraped_content": [],
        "sources": [],
        "draft_report": "",
        "review_scores": [],
        "review_feedback": "",
        "research_iterations": 0
    }
    
    final_report = ""
    error_msg = ""
    is_cache_hit = False
    
    # We run the graph manually
    try:
        async for output in research_graph.astream(initial_state):
            for node_name, state_update in output.items():
                if "error" in state_update and state_update["error"]:
                    error_msg = state_update["error"]
                    break
                if node_name == "memory" and state_update.get("cache_hit"):
                    is_cache_hit = True
                if node_name in ["memory", "writer"] and state_update.get("final_report"):
                    final_report = state_update["final_report"]
    except Exception as e:
        error_msg = str(e)
        
    latency = time.time() - start_time
    
    if error_msg or not final_report:
        print(f"[{eval_id}] Failed. {error_msg}")
        return {
            "id": eval_id,
            "error": error_msg or "No report generated",
            "latency_s": latency,
            "cache_hit": is_cache_hit,
            "success": False
        }
        
    print(f"[{eval_id}] Finished generation in {latency:.1f}s. Grading...")
    
    # Run the grader
    score = evaluate_report(query, expected_facts, final_report)
    
    return {
        "id": eval_id,
        "success": True,
        "latency_s": latency,
        "cache_hit": is_cache_hit,
        "completeness": score.completeness_score,
        "narrative": score.narrative_flow_score,
        "citation": score.citation_density_score,
        "missing_facts": score.missing_facts,
        "justification": score.justification
    }

async def main():
    with open("evals/dataset.json", "r", encoding="utf-8") as f:
        dataset = json.load(f)
        
    print(f"Starting evaluation of {len(dataset)} queries...")
    
    # Limit concurrency to 2 to avoid aggressive rate limiting
    semaphore = asyncio.Semaphore(2)
    
    async def sem_run(entry):
        async with semaphore:
            return await run_single_eval(entry)
            
    tasks = [sem_run(entry) for entry in dataset]
    results = await asyncio.gather(*tasks)
    
    # Compile report
    successful_runs = [r for r in results if r.get("success")]
    failed_runs = [r for r in results if not r.get("success")]
    
    avg_latency = sum(r["latency_s"] for r in results) / len(results) if results else 0
    avg_completeness = sum(r["completeness"] for r in successful_runs) / len(successful_runs) if successful_runs else 0
    avg_narrative = sum(r["narrative"] for r in successful_runs) / len(successful_runs) if successful_runs else 0
    avg_citation = sum(r["citation"] for r in successful_runs) / len(successful_runs) if successful_runs else 0
    
    total_missing_facts = sum(len(r.get("missing_facts", [])) for r in successful_runs)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = f"evals/runs/run_{timestamp}.md"
    
    os.makedirs("evals/runs", exist_ok=True)
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# Evaluation Run: {timestamp}\n\n")
        f.write(f"**Total Queries:** {len(dataset)}\n")
        f.write(f"**Successful:** {len(successful_runs)}\n")
        f.write(f"**Failed:** {len(failed_runs)}\n\n")
        
        f.write("## Overall Metrics\n")
        f.write(f"- **Avg Latency:** {avg_latency:.2f}s\n")
        f.write(f"- **Avg Completeness (1-5):** {avg_completeness:.2f}\n")
        f.write(f"- **Avg Narrative Flow (1-5):** {avg_narrative:.2f}\n")
        f.write(f"- **Avg Citation Density (1-5):** {avg_citation:.2f}\n")
        f.write(f"- **Total Missing Explicit Facts:** {total_missing_facts}\n\n")
        
        f.write("## Detailed Results\n")
        for res in results:
            f.write(f"### {res['id']}\n")
            if res["success"]:
                f.write(f"- **Status:** {':white_check_mark: Success' if res['completeness'] >= 4 else ':warning: Low Score'}\n")
                f.write(f"- **Cache Hit:** {res['cache_hit']}\n")
                f.write(f"- **Latency:** {res['latency_s']:.1f}s\n")
                f.write(f"- **Scores:** Completeness: {res['completeness']}, Narrative: {res['narrative']}, Citation: {res['citation']}\n")
                if res['missing_facts']:
                    f.write("- **Missing Facts:**\n")
                    for fact in res['missing_facts']:
                        f.write(f"  - {fact}\n")
                f.write(f"- **Justification:** {res['justification']}\n\n")
            else:
                f.write(f"- **Status:** :x: Failed\n")
                f.write(f"- **Error:** {res['error']}\n\n")
                
    print(f"\nEvaluation complete. Report saved to {report_path}")

if __name__ == "__main__":
    asyncio.run(main())
