const button = document.querySelector('#theme-toggle');
function setPaperTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  button.firstElementChild.textContent = dark ? '☼' : '☾';
  button.lastElementChild.textContent = dark ? '浅色模式' : '深色模式';
  button.setAttribute('aria-label',`切换为${dark ? '浅色' : '深色'}模式`);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0e1624' : '#f5f6fb';
}
setPaperTheme(document.documentElement.dataset.theme);
button.addEventListener('click',() => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setPaperTheme(theme);
  try { localStorage.setItem('mathspace-theme',theme); } catch {}
});
const params = new URLSearchParams(location.search);
const knowledge = params.get('kind') === 'knowledge';
const review = params.get('kind') === 'review2027';
const topic = (review ? review2027.entries : knowledge ? knowledgeDocs : practiceTopics).find(topic => topic.id === params.get('id'));
const point = knowledge && topic ? topic.sections.flatMap(section=>[section,...section.entries]).find(entry=>entry.id === params.get('point')) : null;
if(knowledge) {
  const back = document.querySelector('.paper-back'); back.href = topic ? `index.html?topic=${topic.id}#knowledge` : 'index.html#knowledge'; back.textContent = '← 返回知识复习';
  document.querySelector('.skip').textContent = '跳到知识讲义';
  document.querySelector('nav [aria-current]').removeAttribute('aria-current');
  document.querySelector('nav a[href="index.html#knowledge"]').setAttribute('aria-current','page');
  document.querySelector('#paper-help').textContent = '下方为完整知识点讲义，可翻页、缩放或点击文档内目录跳转。未显示时，点击“单独打开讲义”。';
  document.querySelector('.paper-fallback').textContent = '当前浏览器不支持内嵌阅读，请使用上方“单独打开讲义”，或下载 PDF。';
  document.querySelector('footer span').textContent = '回看概念，梳理方法，再用练习巩固';
}
if(topic) {
  document.title = `${point ? point.title+' · ' : ''}${topic.name} · 数间`;
  document.querySelector('#paper-title').textContent = point ? point.title : topic.name;
  document.querySelector('#paper-description').textContent = review ? `${topic.series} · ${topic.directory}。${topic.note || '保留原资料内容，按整份文档练习。'}` : point ? `${topic.name}${point.path ? ' / '+point.path : ''} · 第 ${point.page} 页` : knowledge ? topic.description : `${topic.group} · 专题 ${topic.id} · ${topic.total} 条题目记录。按原资料顺序展示整套题。`;
  const pdf = review ? topic.pdf : knowledge ? topic.pdf.url : topic.original.url.replace(/\.docx$/,'.pdf');
  const viewer = document.querySelector('#paper-viewer');
  const fragment = point ? `#page=${point.page}&view=FitH,${point.top}` : '#view=FitH';
  if(pdf) viewer.data = pdf + fragment;
  viewer.hidden = !pdf;
  viewer.setAttribute('aria-label',`${topic.name}${review ? '资料' : knowledge ? '知识讲义' : '原卷'}PDF阅读器`);
  document.querySelector('#paper-help').hidden = false;
  if(review) document.querySelector('#paper-help').textContent=pdf ? '下方展示本份资料的PDF阅读版；原始Word和配套版本可在上方下载。' : '本份资料已完整收录为Word文件，请下载后使用Word或WPS阅读练习。当前没有PDF阅读版。';
  if(point) document.querySelector('#paper-help').textContent = '已定位到所选知识点。可继续阅读上下文，或使用“返回知识复习”选择其他条目。';
  else if(knowledge && params.has('point')) document.querySelector('#paper-help').textContent = '所选知识点不存在，已打开完整讲义。请返回知识复习重新选择。';
  const actions = review ? [...(pdf ? [['单独打开阅读版',pdf,null]] : []),...topic.files.map(file=>[`下载${file.role} ${file.format}`,file.url,file.name])] : knowledge ? [['单独打开讲义',pdf+fragment,null],['下载 Word',topic.original.url,topic.original.name],['下载 PDF',pdf,topic.pdf.name]] : [['单独打开题套',pdf,null],['下载原卷',topic.original.url,topic.original.name],['下载解析',topic.answers.url,topic.answers.name]];
  for(const [label,url,filename] of actions) {
    const link = document.createElement('a'); link.textContent = label; link.href = url;
    if(filename) link.download = filename;
    else { link.target = '_blank'; link.rel = 'noopener'; }
    document.querySelector('#paper-actions').append(link);
  }
} else {
  document.querySelector('#paper-title').textContent = knowledge ? '未找到这份讲义' : '未找到这套题';
  document.querySelector('#paper-description').textContent = knowledge ? '请返回知识复习，选择要阅读的讲义。' : '请返回专题目录，选择要练习的题套。';
}
