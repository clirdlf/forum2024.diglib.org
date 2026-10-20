// Served only by the local audit preview, never copied into the archive.
window.addEventListener('load', async () => {
  await document.fonts.ready;
  const panel = document.createElement('details');
  panel.id = 'archive-a11y-panel';
  panel.style.cssText =
    'position:fixed;bottom:12px;right:12px;z-index:999999;max-width:min(600px,90vw);max-height:70vh;overflow:auto;padding:12px;background:#fff;color:#111;border:2px solid #111;font:14px/1.5 system-ui';
  const summary = document.createElement('summary');
  summary.textContent = 'Running accessibility audit…';
  const rerun = document.createElement('button');
  rerun.type = 'button';
  rerun.textContent = 'Run audit again';
  const output = document.createElement('pre');
  output.style.cssText = 'white-space:pre-wrap;color:#111;background:#fff';
  panel.append(summary, rerun, output);
  document.body.append(panel);
  const report = document.createElement('script');
  report.type = 'application/json';
  report.id = 'archive-a11y-report';
  async function run() {
    rerun.disabled = true;
    try {
      const result = await axe.run(
        { exclude: [['#archive-a11y-panel']] },
        {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
          },
        },
      );
      const data = {
        violations: result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          helpUrl: v.helpUrl,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
        incomplete: result.incomplete.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
        })),
        passes: result.passes.length,
      };
      summary.textContent = `Accessibility audit: ${data.violations.length} violations; ${data.incomplete.length} rules need manual review`;
      output.textContent = JSON.stringify(data, null, 2);
      report.textContent = JSON.stringify(data);
      if (!report.isConnected) document.body.append(report);
    } catch (error) {
      summary.textContent = 'Accessibility audit failed';
      output.textContent = String(error);
    } finally {
      rerun.disabled = false;
    }
  }
  rerun.addEventListener('click', run);
  await run();
});
