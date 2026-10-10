/** Independent DOM checks. Split-number children are measured separately; ticks
 * and labels are siblings. Deliberate overlapping-label injection tests this
 * detector before the rendering matrix. A passing result is not an image review.
 */
() => {
  const result = { labels: 0, ticks: 0, rows: 0, collisions: [], tickCrossings: [], clipped: [], smallLabels: [], emptyRows: [] };
  const overlap = (a,b) => [Math.min(a.right,b.right)-Math.max(a.left,b.left), Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)];
  for (const row of document.querySelectorAll('.scale-row')) {
    result.rows++;
    const id = row.dataset.scale;
    const labels = [];
    for (const el of row.querySelectorAll('.tick-label,.syncro-number')) {
      if (getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') continue;
      const parts = el.classList.contains('compact-split') ? [...el.children] : [el];
      for (const part of parts) {
        const r = part.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        labels.push({ el, r, text: el.dataset.labelText || el.textContent });
        const pane = el.closest('.tick-pane').getBoundingClientRect(), rr = row.getBoundingClientRect();
        if(r.left<pane.left-.8 || r.right>pane.right+.8 || r.top<rr.top-.8 || r.bottom>rr.bottom+.8) result.clipped.push({id,text:el.textContent});
        if(parseFloat(getComputedStyle(part).fontSize)<10) result.smallLabels.push({id,text:el.textContent});
      }
    }
    const ticks = [...row.querySelectorAll('.tick,.syncro-tick')].map(el=>({el,r:el.getBoundingClientRect()}));
    result.labels += labels.length; result.ticks += ticks.length;
    if (!ticks.length) result.emptyRows.push(id);
    for(let i=0;i<labels.length;i++) {
      for(let j=i+1;j<labels.length;j++) {
        if(labels[i].el===labels[j].el) continue;
        const [x,y]=overlap(labels[i].r,labels[j].r);
        if(x>.5 && y>1) result.collisions.push({id,a:labels[i].text,b:labels[j].text,x,y});
      }
      for(const tick of ticks) {
        const [x,y]=overlap(labels[i].r,tick.r);
        if(x>.2 && y>1) result.tickCrossings.push({id,label:labels[i].text,pos:tick.el.dataset.pos,x,y});
      }
    }
  }
  result.bodyOverflow=Math.max(0,document.documentElement.scrollWidth-innerWidth);
  return result;
}
