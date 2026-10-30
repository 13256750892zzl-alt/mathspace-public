const learningTopics = ['全部主题','函数与代数','集合基本不等式平面向量复数','立体几何','数列','概率与统计','解析几何'];
const topicIcons = ['powers','venn','solid','sequence','statistics','conics'];
const reviewSeries = ['全部系列','既有内容',...review2027.collections.map(collection=>collection.name)];
let reviewLimit = 24;
const pages = {
  knowledge: {title:'知识复习', label:'01 / KNOWLEDGE', description:'选主题、找章节，直接复习一个具体知识点。', empty:'没有找到匹配的知识点', detail:'试试知识点或方法名称，或重置左侧主题。', note:'选择左侧主题查看各章目录，展开后可点击具体知识点；搜索会直接展示匹配条目，阅读时定位到讲义对应位置。', filters:{}},
  practice: {title:'专题练习', label:'02 / PRACTICE', description:'精选专题与2027复习资料。按系列、主题或关键词选择，打开题套练习。', empty:'没有找到匹配的专题', detail:'试试其他关键词，或重置筛选。部分题型与难度仍待复核。', note:'原有专题按记录筛选；新增2027资料按整份文档展示，题型、难度待逐题复核。学生讲义、作业与教师用书分别标明。', filters:{'知识主题':[...learningTopics,'综合试卷'],'难度':['全部难度','基础','进阶','挑战','待复核'],'题型':['全部题型','单选题','多选题','填空题','解答题','待复核'],'细分专题':['全部专题',...practiceTopics.map(topic => topic.name)],'资料系列':reviewSeries}},
  lab: {title:'数学实验', label:'03 / DISCOVER', description:'按项目类型或教材章节，找到适合当前学习内容的数学工具。', empty:'没有找到匹配的项目', detail:'试试其他关键词，或重置分类筛选。', note:'25个项目已有在线入口；课序与错题系统暂未公开。支持项目类型与人教 B 版章节分类。', filters:{}},
  resources: {title:'学习资料', label:'04 / READ', description:'下载讲义、原卷、解析与2027五个系列资料，保留原文件名。', empty:'没有找到匹配的资料', detail:'试试其他关键词，或重置筛选。', note:'2027五个系列共500份原文件，可逐份下载或按系列下载完整ZIP；学习资料只负责下载。', filters:{'资料类型':['全部类型','知识点讲义','完整资料包','专题题套','2027复习资料','2027系列整包'],'知识主题':[...learningTopics,'综合试卷'],'资料系列':reviewSeries}}
};
const projectGroups = [
  {name:'数学动态交互实验工具', icon:'transform', description:'围绕一个章节，通过图形与操作理解数学关系。', projects:[
    {name:'二次函数三兄弟实验室',url:"tools/quadratic/index.html",icon:'quadratic',description:'观察抛物线、方程根与不等式的联系。'},
    {name:'数轴与集合工具',url:"tools/axis/index.html",icon:'axis',description:'在数轴上理解区间与集合运算。'},
    {name:'单位圆三角函数演示器',url:"tools/unit-circle/index.html",icon:'circle',description:'用单位圆观察角度与三角函数值。'},
    {name:'交并补显示器（韦恩图）',url:"tools/venn/index.html",icon:'venn',description:'通过韦恩图比较集合的交、并与补。'},
    {name:'立体几何动态截面切割器',url:"tools/solid-section/index.html",icon:'section',description:'观察空间几何体与截面的形状。'},
    {name:'三角函数图像变换器',url:"tools/trig/index.html",icon:'trig',description:'对照三角函数图像的平移与伸缩。'},
    {name:'函数图像变换演示器',url:"tools/function-morph/index.html",icon:'transform',description:'观察函数图像变换前后的对应关系。'},
    {name:'指对幂图象变换机',url:"tools/graphforge/index.html",icon:'powers',description:'探索指数、对数与幂函数的图像变化。'},
    {name:'形间立体几何实验室',url:"tools/solid-lab/index.html",icon:'solid',description:'建立立体图形与空间关系的直观认识。'},
    {name:'圆锥曲线动态轨迹器',url:"tools/conics/index.html",icon:'conics',description:'观察圆锥曲线上的动点与轨迹。'},
    {name:'导数切线追踪器',url:"tools/tangent/index.html",icon:'tangent',description:'观察曲线上切线与变化率的关系。'},
    {name:'向量投影操场',url:"tools/vector/index.html",icon:'vector',description:'用图形理解向量与投影。'},
    {name:'计数原理排队实验器',url:"tools/count/index.html",icon:'count',description:'通过排列情境理解计数方法。'},
    {name:'数列递推可视化',url:"tools/sequence/index.html",icon:'sequence',description:'从逐项变化理解数列递推关系。'},
    {name:'概率统计模拟实验台',url:"tools/probability/index.html",icon:'statistics',description:'观察随机试验与统计结果的变化。'},
    {name:'幂函数家族',url:"tools/power-family/index.html",icon:'powerFamily',description:"调节指数，钉住多条幂函数曲线并对比性质。"},
    {name:'奇偶性镜像检验器',url:"tools/parity/index.html",icon:'parity',description:"比较函数值、相反数与定义域，检验奇偶性。"},
    {name:'二分法求零点分步实验台',url:"tools/bisection/index.html",icon:'bisection',description:"逐步取中点、选择区间，观察零点逼近与误差。"},
    {name:'正弦函数的诞生',url:"tools/sine-birth/index.html",icon:'sineBirth',description:"联动三维空间曲线、单位圆与正弦图像。"},
    {name:'余弦函数的诞生',url:"tools/cosine-birth/index.html",icon:'cosineBirth',description:"从三维空间投影观察余弦图像与相位变化。"},
    {name:'圆锥曲线的诞生',url:"tools/conic-birth/index.html",icon:'conicBirth',description:"观察双圆锥截面、焦点和丹德林球的联动。"},
    {name:'正态分布的μ与σ',url:"tools/normal/index.html",icon:'normal',description:"调整均值和标准差，观察正态曲线与区间面积。"},
    {name:'最小二乘回归直线',url:"tools/least-squares/index.html",icon:'regression',description:"拖动或增删散点，观察回归直线与残差平方和。"}
  ]},
  {name:'学情证据与复测',icon:'diagnosis',description:'围绕错题记录、诊断与复测组织学习证据。',projects:[
    {name:'数学错题诊断系统',icon:'diagnosis',description:'整理错题线索，连接诊断与复测。'}
  ]},
  {name:'数学智能教学平台',icon:'geometry',description:'汇集数学构图、画布与学案转课件工具。',projects:[
    {name:'数学构图教学平台',url:"https://geogebra-teaching.onrender.com/",icon:'geometry',description:'用数学构图辅助呈现几何关系。'},
    {name:'形迹数学画布',url:"https://xingji-math-canvas.onrender.com/",icon:'canvas',description:'在数学画布中整理图形与思路。'},
        {name:'课序 · 学案转课件',icon:'slides',description:'将纯文本学案按原文顺序排成课件，支持模板与固定字号。'}
  ]}
];
// 2019 新教材人教 B 版：圆锥曲线属于选择性必修第一册第二章平面解析几何。
const textbookBooks = [
  ['必修第一册',['第一章 集合与常用逻辑用语','第二章 等式与不等式','第三章 函数']],
  ['必修第二册',['第四章 指数函数、对数函数与幂函数','第五章 统计与概率','第六章 平面向量初步']],
  ['必修第三册',['第七章 三角函数','第八章 向量的数量积与三角恒等变换']],
  ['必修第四册',['第九章 解三角形','第十章 复数','第十一章 立体几何初步']],
  ['选择性必修第一册',['第一章 空间向量与立体几何','第二章 平面解析几何']],
  ['选择性必修第二册',['第三章 排列、组合与二项式定理','第四章 概率与统计']],
  ['选择性必修第三册',['第五章 数列','第六章 导数及其应用']]
];
const projectChapters = {
  quadratic:['0-1','0-2'], axis:['0-0','0-1'], venn:['0-0'],
  circle:['2-0'], trig:['2-0'], transform:['0-2'], powers:['0-2','1-0'],
  section:['3-2','4-0'], solid:['3-2','4-0'], conics:['4-1'],
  tangent:['6-1'], vector:['1-2','2-1'], count:['5-0'], sequence:['6-0'], statistics:['1-1','5-1']
};
Object.assign(projectChapters,{"powerFamily": ["1-0"], "parity": ["0-2"], "bisection": ["0-2"], "sineBirth": ["2-0"], "cosineBirth": ["2-0"], "conicBirth": ["4-1"], "normal": ["5-1"], "regression": ["5-1"]});
const allProjects = projectGroups.flatMap(group => group.projects);
const chapterGroups = textbookBooks.flatMap(([book,chapters],bookIndex) => chapters.map((name,chapterIndex) => ({
  name:`${book} · ${name}`, book, chapter:name, icon:'geometry',
  description:'按教材内容关联；同一工具可用于多个章节。',
  projects:allProjects.filter(project => projectChapters[project.icon]?.includes(`${bookIndex}-${chapterIndex}`))
})));
chapterGroups.push({name:'跨章节通用项目',icon:'canvas',description:'错题诊断、构图、画布与课序适用于多个章节，单独列出，避免误认为已覆盖每章内容。',projects:allProjects.filter(project => !projectChapters[project.icon])});
const projectIcons = {
  quadratic:'<path d="M6 35h36M13 8v33M8 15q11 34 23 0M15 11q11 34 24 0"/><path class="icon-secondary" d="M8 25q13-26 31 0"/>',
  axis:'<path d="M5 25h38m-5-4 5 4-5 4M11 21v8m13-8v8m13-8v8"/><path class="icon-secondary" d="M11 15h24"/><circle cx="11" cy="15" r="3"/><circle class="icon-dot" cx="35" cy="15" r="3"/>',
  circle:'<circle cx="24" cy="24" r="17"/><path class="icon-secondary" d="M3 24h42M24 3v42M24 24h13V13"/><path d="m24 24 13-11"/><circle class="icon-dot" cx="37" cy="13" r="3"/>',
  venn:'<rect x="4" y="9" width="40" height="30" rx="7" class="icon-secondary"/><circle cx="18" cy="24" r="11"/><circle cx="30" cy="24" r="11"/><path class="icon-secondary" d="M24 15v18"/>',
  section:'<path d="m9 15 15-8 15 8v20l-15 8-15-8Zm0 0 15 8 15-8M24 23v20"/><path class="icon-secondary" d="m9 27 15-8 15 8-15 8Z"/>',
  trig:'<path class="icon-secondary" d="M4 26h40M9 8v34"/><path d="M4 26c7-22 13-22 20 0s13 22 20 0"/><path class="icon-secondary" d="m28 9 12 0m-4-4 4 4-4 4"/>',
  transform:'<path class="icon-secondary" d="M5 37h38M10 6v35M12 30q8-24 16 0"/><path d="M22 30q8-24 16 0M17 10h17m-4-4 4 4-4 4"/>',
  powers:'<path class="icon-secondary" d="M5 39h38M10 5v38M14 35q12-29 27-30"/><path d="M12 35c18 0 22-7 27-29M14 36c1-17 10-20 27-21"/>',
  solid:'<path d="m24 5 17 10v20L24 45 7 35V15Zm0 20L7 15m17 10 17-10M24 25v20"/><path class="icon-secondary" d="M24 5v20M7 35l17-10 17 10"/>',
  conics:'<ellipse cx="22" cy="24" rx="16" ry="11" transform="rotate(-30 22 24)"/><path class="icon-secondary" d="M28 8q-8 16 0 32M40 8q8 16 0 32"/><circle class="icon-dot" cx="12" cy="25" r="3"/>',
  tangent:'<path class="icon-secondary" d="M5 39h38M10 7v35"/><path d="M8 34c10 4 10-27 31-20M7 38l34-30"/><circle class="icon-dot" cx="25" cy="22" r="3"/>',
  vector:'<path d="M8 38 34 12m-8 0h8v8M8 38h33m-5-5 5 5-5 5"/><path class="icon-secondary" d="M34 12v26m-5 0v-5h5"/>',
  count:'<circle cx="12" cy="13" r="4"/><circle cx="24" cy="13" r="4"/><circle cx="36" cy="13" r="4"/><path d="M7 30v-7q5-7 10 0v7m2 0v-7q5-7 10 0v7m2 0v-7q5-7 10 0v7"/><path class="icon-secondary" d="M6 37h36m-5-4 5 4-5 4"/>',
  sequence:'<circle cx="9" cy="34" r="4"/><circle cx="24" cy="24" r="4"/><circle cx="39" cy="14" r="4"/><path d="m13 31 7-5m-1-3 1 3-4 1m12-6 7-5m-1-3 1 3-4 1"/><path class="icon-secondary" d="M6 42h36"/>',
  statistics:'<path d="M6 41h36M10 41V28h7v13m7 0V20h7v21m6 0V10h7v31"/><rect x="5" y="5" width="15" height="15" rx="4" class="icon-secondary"/><circle class="icon-dot" cx="9" cy="9" r="1"/><circle class="icon-dot" cx="16" cy="16" r="1"/>',
  diagnosis:'<rect x="7" y="5" width="26" height="36" rx="5"/><path class="icon-secondary" d="M14 14h12M14 21h8M14 28h5"/><circle cx="32" cy="31" r="8"/><path d="m38 37 6 6m-16-12 3 3 5-6"/>',
  geometry:'<path d="m7 38 16-29 17 29Zm16-29v29"/><circle cx="7" cy="38" r="3"/><circle cx="23" cy="9" r="3"/><circle cx="40" cy="38" r="3"/><path class="icon-secondary" d="m11 21 12 7 12-7M23 28v10"/>',
  canvas:'<rect x="5" y="7" width="35" height="34" rx="6" class="icon-secondary"/><path class="icon-secondary" d="M12 15h15M12 23h10M12 31h6"/><path d="m22 35 3-9L38 13l6 6-13 13Zm13-19 6 6m-16 4 6 6"/>',
  slides:'<rect x="7" y="6" width="34" height="25" rx="4"/><path class="icon-secondary" d="M14 14h20M14 21h12M24 31v10m-9 0h18"/><path d="m32 20 5 4-5 4"/>'
};
Object.assign(projectIcons,{powerFamily:projectIcons.powers,parity:projectIcons.transform,bisection:projectIcons.axis,sineBirth:projectIcons.trig,cosineBirth:projectIcons.circle,conicBirth:projectIcons.conics,normal:projectIcons.statistics,regression:projectIcons.statistics});
function createProjectIcon(key) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
  icon.setAttribute('viewBox','0 0 48 48'); icon.setAttribute('aria-hidden','true'); icon.setAttribute('focusable','false');
  icon.classList.add('project-icon');
  icon.innerHTML = projectIcons[key];
  return icon;
}
let current = 'home';
let pendingSearch = '';
let projectCategory = '全部类型';
let projectView = 'type';
let knowledgeTopic = '全部主题';
const home = document.querySelector('#home');
const library = document.querySelector('#library');
const libraryForm = document.querySelector('.library-search');
const query = libraryForm.elements.query;
const textbookSelect = document.querySelector('#textbook-book');
for(const [book] of textbookBooks) textbookSelect.add(new Option(book,book));
const status = document.querySelector('#filter-status');
const themeToggle = document.querySelector('#theme-toggle');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeToggle.firstElementChild.textContent = dark ? '☼' : '☾';
  themeToggle.lastElementChild.textContent = dark ? '浅色模式' : '深色模式';
  themeToggle.setAttribute('aria-label', `切换为${dark ? '浅色' : '深色'}模式`);
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0e1624' : '#f5f6fb';
}
applyTheme(document.documentElement.dataset.theme);
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('mathspace-theme', theme); } catch {}
});
function updateStatus() {
  reviewLimit = 24;
  const selected = [...document.querySelectorAll('.field select')].filter(select => select.selectedIndex > 0).map(select => select.value);
  if(current === 'knowledge' && knowledgeTopic !== '全部主题') selected.push(knowledgeTopic);
  if (query.value.trim()) selected.unshift(`搜索“${query.value.trim()}”`);
  status.textContent = selected.length ? `${selected.join(' · ')}：暂无内容，当前栏目尚未添加学习资源。` : '';
  if(current === 'lab' || current === 'knowledge') renderCategories();
  if(current === 'lab') renderProjects();
  if(current === 'practice') renderPractice();
  if(current === 'knowledge') renderKnowledge();
  if(current === 'resources') renderResources();
}
function renderKnowledge() {
  const keyword = query.value.trim().toLocaleLowerCase();
  if(knowledgeTopic === '全部主题' && !keyword) { renderResources(); return; }
  const terms = keyword.split(/\s+/).filter(Boolean);
  const matches = text => terms.every(term=>text.toLocaleLowerCase().includes(term));
  const directory = document.querySelector('#lab-directory'); directory.replaceChildren();
  const list = document.createElement('div'); list.className = 'practice-list knowledge-chapters';
  let chapters = 0, points = 0;
  for(const doc of knowledgeDocs) {
    if(knowledgeTopic !== '全部主题' && doc.name !== knowledgeTopic) continue;
    for(const section of doc.sections) {
      const entries = section.entries.filter(entry=>matches(`${doc.name} ${entry.path} ${entry.title}`));
      if(!entries.length && !matches(`${doc.name} ${section.title}`)) continue;
      chapters++; points += entries.length;
      const card = document.createElement('article'); card.className = 'practice-card resource-card knowledge-chapter';
      card.dataset.topic = learningTopics.indexOf(doc.name)-1;
      const top = document.createElement('div'); top.className = 'suite-top';
      const icon = createProjectIcon(topicIcons[card.dataset.topic]); icon.classList.add('suite-icon');
      const category = document.createElement('p'); category.className = 'eyebrow'; category.textContent = doc.name;
      top.append(icon,category);
      const title = document.createElement('h3');
      const link = document.createElement('a'); link.href = `paper.html?kind=knowledge&id=${doc.id}&point=${section.id}`; link.textContent = section.title;
      title.append(link);
      const copy = document.createElement('p'); copy.className = 'practice-tags'; copy.textContent = `${entries.length} 个${keyword ? '匹配' : ''}目录项 · 第 ${section.page} 页`;
      const details = document.createElement('details'); details.open = Boolean(keyword);
      const summary = document.createElement('summary'); summary.textContent = keyword ? '匹配的知识点与方法' : '展开知识点目录';
      const items = document.createElement('ol'); items.className = 'knowledge-points';
      for(const entry of entries) {
        const li = document.createElement('li'); li.style.setProperty('--level',entry.level-1);
        const point = document.createElement('a'); point.href = `paper.html?kind=knowledge&id=${doc.id}&point=${encodeURIComponent(entry.id)}`;
        point.setAttribute('aria-label',`${doc.name} / ${entry.path} / ${entry.title}，第${entry.page}页`);
        const label = document.createElement('span'); label.textContent = entry.title;
        const page = document.createElement('small'); page.textContent = `第 ${entry.page} 页 ↗`;
        point.append(label,page); li.append(point);
        if(keyword) { const context = document.createElement('p'); context.className = 'knowledge-point-context'; context.textContent = entry.path; li.append(context); }
        items.append(li);
      }
      details.append(summary,items); card.append(top,title,copy,details); list.append(card);
    }
  }
  directory.append(list);
  document.querySelector('.result-count').textContent = `${chapters} 章 · ${points} 个目录项`;
  document.querySelector('.empty-state').hidden = chapters > 0;
  status.textContent = `${knowledgeTopic}${keyword ? ` · 搜索“${query.value.trim()}”` : ''}。${keyword ? '已展开匹配条目，点击可定位阅读。' : '展开章节目录，选择要复习的知识点。'}`;
}
function reviewMatches(item, series, group, keyword) {
  const text = `${item.series} ${item.name} ${item.group} ${item.directory} ${item.files.map(file=>`${file.name} ${file.role}`).join(' ')} ${item.note}`.toLocaleLowerCase();
  return (series==='全部系列'||series===item.series) && (group==='全部主题'||group===item.group) && keyword.split(/\s+/).filter(Boolean).every(term=>text.includes(term));
}
function reviewLinks(item) {
  return item.files.map(file=>[`下载${file.role} ${file.format}`,file.url,file.name]);
}
function appendReviewMore(parent, count, renderAgain) {
  if(count<=reviewLimit) return;
  const button=document.createElement('button'); button.type='button'; button.className='review-more';
  button.textContent=`再显示24份（还有${count-reviewLimit}份）`;
  button.addEventListener('click',()=>{const previous=reviewLimit;reviewLimit+=24;renderAgain();document.querySelectorAll('.review2027-card')[previous]?.querySelector('a')?.focus({preventScroll:true});});
  parent.append(button);
}
function renderReviewPractice(matches, directory) {
  const shown=matches.slice(0,reviewLimit);
  for(const collection of review2027.collections) {
    const items=shown.filter(item=>item.series===collection.name);
    if(!items.length) continue;
    const section=document.createElement('section'); section.className='practice-group review2027-group';
    section.dataset.topic=collection.index;
    const heading=document.createElement('h2'); heading.textContent=collection.name;heading.dataset.number=String(collection.index+1).padStart(2,'0');
    const list=document.createElement('div'); list.className='practice-list';
    for(const item of items) {
      const card=document.createElement('article'); card.className='practice-card review2027-card'; card.dataset.id=item.id; card.dataset.topic=collection.index;
      const top=document.createElement('div'); top.className='suite-top';
      const icon=createProjectIcon(topicIcons[collection.index]); icon.classList.add('suite-icon');
      const category=document.createElement('p'); category.className='eyebrow'; category.textContent=item.group; top.append(icon,category);
      const title=document.createElement('h3'); const reader=document.createElement('a'); reader.href=`paper.html?kind=review2027&id=${item.id}`;reader.textContent=item.name; title.append(reader);
      const description=document.createElement('p'); description.className='review-description'; description.textContent=item.directory;
      const state=document.createElement('p'); state.className='practice-count'; state.textContent=`${item.files.length}份原文件 · 整份文档 · 难度/题型待复核`;
      const links=document.createElement('div');links.className='practice-links';
      for(const [label,url,name] of reviewLinks(item)) {
        const link=document.createElement('a');link.textContent=label;link.href=url;link.download=name;link.dataset.kind=label.includes('解析')||label.includes('答案')||label.includes('教师')?'answers':'original';
        link.setAttribute('aria-label',`${label}：${item.name}`);
        const arrow=document.createElement('span');arrow.className='download-arrow';arrow.textContent='↓';arrow.setAttribute('aria-hidden','true');link.append(arrow);links.append(link);
      }
      card.append(top,title,description,state);
      if(item.note){const note=document.createElement('p');note.className='review-description';note.textContent=item.note;card.append(note);}
      card.append(links);list.append(card);
    }
    section.append(heading,list);directory.append(section);
  }
  appendReviewMore(directory,matches.length,renderPractice);
}
function renderResources() {
  const knowledge = current === 'knowledge';
  const [type,group,series='全部系列'] = knowledge ? ['知识点讲义',knowledgeTopic] : [...document.querySelectorAll('.field select')].map(select=>select.value);
  const keyword = query.value.trim().toLocaleLowerCase();
  const directory = document.querySelector('#lab-directory'); directory.replaceChildren();
  const items = [
    {name:'高考题和模拟题 · 完整资料包',group:'全部主题',type:'完整资料包',description:'58份Word（29个专题的原卷和解析）＋3份索引说明。ZIP约63MB，保留原文件名及文件夹结构。',links:[['下载完整文件夹','题库资料/题目资料完整包.zip','高考题和模拟题-完整资料包.zip']]},
    ...knowledgeDocs.map(doc=>({...doc,reader:knowledge ? `index.html?topic=${doc.id}#knowledge` : null,links:[...(knowledge ? [['浏览章节',`index.html?topic=${doc.id}#knowledge`,null]] : []),['下载 Word',doc.original.url,doc.original.name],['下载 PDF',doc.pdf.url,doc.pdf.name]]})),
    ...practiceTopics.map(topic=>({name:topic.name,group:topic.group,type:'专题题套',description:`专题 ${topic.id} · ${topic.total} 条题目记录 · 原卷与解析配套`,links:[['下载原卷',topic.original.url,topic.original.name],['下载解析',topic.answers.url,topic.answers.name]]}))
  ].filter(item=>(series==='全部系列'||series==='既有内容')&&(type==='全部类型'||item.type===type)&&(group==='全部主题'||item.group===group)&&`${item.name} ${item.group} ${item.type} ${item.description} ${item.sections?.map(section=>`${section.title} ${section.children.join(' ')}`).join(' ') || ''}`.toLocaleLowerCase().includes(keyword));
  const newItems = !knowledge&&(type==='全部类型'||type==='2027复习资料') ? review2027.entries.filter(item=>reviewMatches(item,series,group,keyword)) : [];
  if(!knowledge&&(type==='全部类型'||type==='2027系列整包')&&group==='全部主题') {
    for(const collection of review2027.collections) {
      if((series!=='全部系列'&&series!==collection.name)||!keyword.split(/\s+/).filter(Boolean).every(term=>collection.name.toLocaleLowerCase().includes(term))) continue;
      items.push({name:collection.name,group:'全部主题',type:'2027系列整包',description:`${collection.fileCount}份原文件 · 原文件合计约${(collection.bytes/1048576).toFixed(1)}MB · ZIP保留原目录和文件名`,links:[['下载系列整包',collection.bundle.url,collection.bundle.name]],bundle:true,seriesIndex:collection.index});
    }
  }
  const totalCount=items.length+newItems.length;
  items.push(...newItems.slice(0,reviewLimit).map(item=>({...item,type:'2027复习资料',description:`${item.directory} · ${item.files.length}份原文件${item.note ? ' · '+item.note : ''}`,links:reviewLinks(item)})));
  const list=document.createElement('div'); list.className='practice-list resource-list';
  for(const item of [...items.filter(item=>item.bundle||item.series),...items.filter(item=>!item.bundle&&!item.series)]) {
    const card=document.createElement('article'); card.className='practice-card resource-card';
    if(item.type==='知识点讲义') card.classList.add('knowledge-document');
    card.dataset.topic=item.seriesIndex ?? learningTopics.indexOf(item.group)-1;
    if(item.series) {card.classList.add('review2027-card');card.dataset.id=item.id;}
    if(item.type==='完整资料包'||item.bundle) card.classList.add('resource-bundle');
    const icon=createProjectIcon(topicIcons[card.dataset.topic] || 'canvas'); icon.classList.add('suite-icon');
    const category=document.createElement('p'); category.className='eyebrow'; category.textContent=item.bundle ? '系列整包 / ZIP' : item.type==='完整资料包' ? '完整文件夹 / ZIP' : item.group;
    const top=document.createElement('div'); top.className='suite-top'; top.append(icon,category);
    const title=document.createElement('h3');
    if(item.reader) { const link=document.createElement('a'); link.href=item.reader; link.textContent=item.name; title.append(link); }
    else title.textContent=item.name;
    const copy=document.createElement('p'); copy.className='practice-tags'; copy.textContent=item.description;
    const links=document.createElement('div'); links.className='practice-links';
    for(const [label,url,filename] of item.links) {
      const link=document.createElement('a'); link.textContent=label; link.href=url;
      if(filename) link.download=filename;
      link.dataset.kind=item.type==='完整资料包'||item.bundle ? 'bundle' : label.includes('解析') || label.includes('答案') || label.includes('Word') ? 'answers' : 'original';
      const arrow=document.createElement('span'); arrow.className='download-arrow'; arrow.textContent=filename ? '↓' : '↗'; arrow.setAttribute('aria-hidden','true'); link.append(arrow);
      link.setAttribute('aria-label',`${label}：${item.name}`); links.append(link);
    }
    card.append(top,title,copy);
    if(knowledge && item.sections) {
      const details=document.createElement('details');
      const summary=document.createElement('summary'); summary.textContent=`查看 ${item.sections.length} 章目录`;
      const chapters=document.createElement('ul');
      for(const section of item.sections) { const li=document.createElement('li'); li.textContent=section.title; chapters.append(li); }
      details.append(summary,chapters); card.append(details);
    }
    card.append(links); list.append(card);
  }
  directory.append(list);
  appendReviewMore(directory,newItems.length,renderResources);
  document.querySelector('.result-count').textContent=`${totalCount} ${knowledge ? '份知识讲义' : '项资料'}`;
  document.querySelector('.empty-state').hidden=totalCount>0;
  status.textContent=`${type} · ${group}${keyword ? ` · 搜索“${query.value.trim()}”` : ''}。${knowledge ? '选择左侧主题或浏览章节，查找具体知识点。' : '选择需要的 Word、PDF 或完整资料包下载。'}`;
}
function renderPractice() {
  const [group,level,type,topic,series] = [...document.querySelectorAll('.field select')].map(select => select.value);
  const keyword = query.value.trim().toLocaleLowerCase();
  const directory = document.querySelector('#lab-directory');
  directory.replaceChildren();
  let total = 0, topicCount = 0;
  for(const groupName of learningTopics.slice(1)) {
    if(series!=='全部系列'&&series!=='既有内容') continue;
    if(group !== '全部主题' && group !== groupName) continue;
    const matches = practiceTopics.filter(item => item.group === groupName &&
      (topic === '全部专题' || topic === item.name) &&
      `${item.name} ${item.sections.join(' ')}`.toLocaleLowerCase().includes(keyword))
      .map(item => ({...item, matched:item.counts.filter(count =>
        (level === '全部难度' || count.level === level) &&
        (type === '全部题型' || count.type === type)).reduce((sum,count) => sum + count.count,0)}))
      .filter(item => item.matched > 0);
    if(!matches.length) continue;
    const section = document.createElement('section'); section.className = 'practice-group';
    section.dataset.topic=learningTopics.indexOf(groupName)-1;
    const heading = document.createElement('h2'); heading.textContent = groupName;
    heading.dataset.number=String(learningTopics.indexOf(groupName)).padStart(2,'0');
    const list = document.createElement('div'); list.className = 'practice-list';
    for(const item of matches) {
      total += item.matched; topicCount++;
      const card = document.createElement('article'); card.className = 'practice-card';
      card.dataset.topic=section.dataset.topic;
      const number = document.createElement('p'); number.className = 'eyebrow'; number.textContent = `专题 ${item.id} / WORD 资料`;
      const icon=createProjectIcon(topicIcons[card.dataset.topic]); icon.classList.add('suite-icon');
      const top=document.createElement('div'); top.className='suite-top'; top.append(icon,number);
      const title = document.createElement('h3');
      const titleLink = document.createElement('a'); titleLink.href = `paper.html?id=${item.id}`; titleLink.textContent = item.name;
      title.append(titleLink);
      const count = document.createElement('p'); count.className = 'practice-count'; count.textContent = `${item.matched} 条匹配记录 · 专题共 ${item.total} 条`;
      const tags = document.createElement('p'); tags.className = 'practice-tags';
      for(const type of new Set(item.counts.map(count => count.type))) {
        const tag=document.createElement('span'); tag.className=type==='待复核' ? 'type-tag pending-tag' : 'type-tag'; tag.textContent=type; tags.append(tag);
      }
      const details = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = '查看细分考点与分层';
      const points = document.createElement('ul');
      for(const text of item.sections) { const li = document.createElement('li'); li.textContent = text; points.append(li); }
      details.append(summary,points);
      const links = document.createElement('div'); links.className = 'practice-links';
      for(const [key,label] of [['original','下载原卷'],['answers','下载解析']]) {
        const link = document.createElement('a'); link.href = item[key].url; link.download = item[key].name;
        link.textContent = label; link.dataset.kind=key; link.setAttribute('aria-label',`${label}：${item.name}`);
        const arrow=document.createElement('span'); arrow.className='download-arrow'; arrow.textContent='↗'; arrow.setAttribute('aria-hidden','true'); link.append(arrow); links.append(link);
      }
      card.append(top,title,count,tags,details,links); list.append(card);
    }
    section.append(heading,list); directory.append(section);
  }
  const review = (level==='全部难度'||level==='待复核')&&(type==='全部题型'||type==='待复核')&&topic==='全部专题' ? review2027.entries.filter(item=>reviewMatches(item,series,group,keyword)) : [];
  const newDirectory=document.createDocumentFragment();renderReviewPractice(review,newDirectory);directory.prepend(newDirectory);
  document.querySelector('.result-count').textContent = review.length ? `${topicCount ? `${topicCount} 个专题 · ${total} 条记录 · ` : ''}${review.length} 份2027练习资料` : `${topicCount} 个专题 · ${total} 条记录`;
  document.querySelector('.empty-state').hidden = topicCount > 0 || review.length>0;
  status.textContent = `${series} · ${group} · ${level} · ${type}${topic !== '全部专题' ? ` · ${topic}` : ''}${keyword ? ` · 搜索“${query.value.trim()}”` : ''}。原有记录未去重；2027资料按整份展示，题型和难度待逐题复核。`;
}
function visibleProjectGroups() {
  return projectView === 'chapter' ? chapterGroups.filter(group => textbookSelect.value === '全部教材' || !group.book || group.book === textbookSelect.value) : projectGroups;
}
function renderCategories() {
  const category = current === 'lab' ? projectCategory : knowledgeTopic;
  const groups = current === 'lab' ? visibleProjectGroups() : learningTopics.slice(1).map(name => ({name}));
  const categories = document.querySelector('#sidebar-categories');
  categories.classList.toggle('chapter-categories',current === 'lab' && projectView === 'chapter');
  categories.replaceChildren();
  for(const [index,group] of groups.entries()) {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-pressed', String(category === group.name));
    const number = document.createElement('small'); number.className = 'category-number'; number.textContent = group.book || `${String(index+1).padStart(2,'0')} /`;
    const title = document.createElement('span'); title.textContent = group.chapter || group.name;
    button.append(number,title);
    if(current === 'lab') {
      button.append(createProjectIcon(group.icon));
      const count = document.createElement('small'); count.textContent = `${group.projects.length} 个项目`; button.append(count);
    }
    button.addEventListener('click',() => {
      if(current === 'lab') projectCategory = group.name;
      else knowledgeTopic = group.name;
      updateStatus(); categories.querySelector('button[aria-pressed="true"]').focus();
    });
    categories.append(button);
  }
}
function renderProjects() {
  const category = projectCategory;
  const keyword = query.value.trim().toLocaleLowerCase();
  const directory = document.querySelector('#lab-directory');
  directory.replaceChildren();
  const groups = visibleProjectGroups();
  const uniqueProjects = new Set();
  for(const [index,group] of groups.entries()) {
    if(category !== '全部类型' && category !== group.name) continue;
    const matches = group.projects.filter(project => `${group.name} ${project.name} ${project.description}`.toLocaleLowerCase().includes(keyword));
    if(!matches.length && (projectView === 'type' || keyword)) continue;
    matches.forEach(project => uniqueProjects.add(project.name));
    const section = document.createElement('section'); section.className = 'project-group'; section.dataset.category = index;
    const heading = document.createElement('h2'); heading.textContent = projectView === 'chapter' ? group.name : `${String(index+1).padStart(2,'0')} / ${group.name}`;
    const description = document.createElement('p'); description.textContent = `${group.description} · ${matches.length} 个项目`;
    const list = document.createElement('ul'); list.className = 'project-list';
    for(const project of matches) {
      const item = document.createElement('li');
      const copy = document.createElement('div'); copy.className = 'project-copy';
      const title = document.createElement('h3'); title.textContent = project.name;
      if(project.url) {
        const link=document.createElement('a');link.href=project.url;link.target='_blank';link.rel='noopener';link.textContent=project.name;
        link.setAttribute('aria-label',`${project.name}（在线入口，在新标签页打开）`);title.replaceChildren(link);
      }
      const description = document.createElement('p'); description.className = 'project-description'; description.textContent = project.description;
      const state = document.createElement('span'); state.className = 'project-state'; state.textContent = project.url ? '在线入口 · 新标签页打开' : '暂未部署';
      if(project.url) state.classList.add('available');
      copy.append(title,description,state); item.append(createProjectIcon(project.icon),copy); list.append(item);
    }
    section.append(heading,description,list);
    if(!matches.length) {
      const empty = document.createElement('p'); empty.className = 'chapter-empty'; empty.textContent = '暂无专属项目，可查看末尾的跨章节通用项目。'; section.append(empty);
    }
    directory.append(section);
  }
  const total = uniqueProjects.size;
  document.querySelector('.result-count').textContent = `${total} 个项目 · 目录`;
  document.querySelector('.empty-state').hidden = directory.children.length > 0;
  const linked=[...uniqueProjects].filter(name=>allProjects.some(project=>project.name===name&&project.url)).length;
  status.textContent = `${projectView === 'chapter' ? `人教 B 版（2019） · ${textbookSelect.value} · ` : ''}${projectView === 'chapter' && category === '全部类型' ? '全部章节' : category}${keyword ? ` · 搜索“${query.value.trim()}”` : ''}：${total} 个匹配项目${projectView === 'chapter' ? '（不重复计数），跨章节项目可重复展示' : ''}，其中${linked}个已接通在线入口。`;
}
function render() {
  const requested = location.hash.slice(1);
  current = Object.hasOwn(pages, requested) ? requested : 'home';
  home.hidden = current !== 'home';
  library.hidden = current === 'home';
  library.dataset.page = current;
  library.classList.toggle('sidebar-page', current === 'lab' || current === 'knowledge');
  library.classList.toggle('knowledge-page', current === 'knowledge');
  document.querySelector('#flashcard-entry').hidden = current !== 'knowledge';
  document.querySelector('#project-view').hidden = current !== 'lab';
  document.querySelector('#book-filter').hidden = current !== 'lab' || projectView !== 'chapter';
  for(const button of document.querySelectorAll('#project-view button')) button.setAttribute('aria-pressed',String(button.dataset.view === projectView));
  document.querySelector('#flashcard-description').textContent = '按知识点，用闪卡复习';
  document.querySelector('#sidebar-categories').hidden = current !== 'lab' && current !== 'knowledge';
  document.querySelector('#sidebar-categories').setAttribute('aria-label',current === 'lab' ? (projectView === 'chapter' ? '教材章节' : '项目分类') : '学习主题');
  for (const link of document.querySelectorAll('nav a')) {
    if (link.dataset.page === current) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
  document.title = `${current === 'home' ? '把数学看得更清楚' : pages[current].title} · 数间`;
  if (current !== 'home') {
    document.querySelector('#lab-directory').hidden = false;
    document.querySelector('.empty-state').hidden = false;
    document.querySelector('.result-count').textContent = '0 项内容';
    const page = pages[current];
    for (const [id,value] of Object.entries({'library-title':page.title,'library-eyebrow':page.label,'library-description':page.description,'empty-title':page.empty,'empty-description':page.detail,'bottom-description':page.note})) document.getElementById(id).textContent = value;
    document.querySelector('#sidebar-title').textContent = current === 'practice' ? '筛选题目' : current === 'lab' ? (projectView === 'chapter' ? '教材章节' : '项目分类') : current === 'knowledge' ? '学习主题' : '浏览分类';
    projectCategory = '全部类型';
    textbookSelect.selectedIndex = 0;
    knowledgeTopic = current === 'knowledge' ? knowledgeDocs.find(doc=>doc.id === new URLSearchParams(location.search).get('topic'))?.name || '全部主题' : '全部主题';
    const fields = document.querySelector('#filter-fields');
    fields.replaceChildren();
    for (const [label,options] of Object.entries(page.filters)) {
      const field = document.createElement('label'); field.className = 'field';
      const name = document.createElement('span'); name.textContent = label;
      const select = document.createElement('select');
      for (const text of options) select.add(new Option(text,text));
      select.addEventListener('change',updateStatus);
      field.append(name,select); fields.append(field);
    }
    query.value = pendingSearch; pendingSearch = ''; query.placeholder = current === 'lab' ? (projectView === 'chapter' ? '搜索项目、册次或章节' : '搜索项目名称或类型') : current === 'knowledge' ? '搜索章节、知识点或方法，如“换元法”' : `搜索${page.title}内容`; updateStatus();
  }
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',() => { render(); if(current !== 'home') document.querySelector('#library-title').focus({preventScroll:true}); });
document.querySelector('.home-search').addEventListener('submit',event => {
  event.preventDefault();
  pendingSearch = event.currentTarget.elements.query.value;
  location.hash = 'knowledge';
});
libraryForm.addEventListener('submit',event => { event.preventDefault(); updateStatus(); });
query.addEventListener('input',updateStatus);
textbookSelect.addEventListener('change',() => { projectCategory = '全部类型'; updateStatus(); });
document.querySelector('#project-view').addEventListener('click',event => {
  const button = event.target.closest('button[data-view]');
  if(!button) return;
  projectView = button.dataset.view; projectCategory = '全部类型';
  document.querySelector('#book-filter').hidden = projectView !== 'chapter';
  for(const option of document.querySelectorAll('#project-view button')) option.setAttribute('aria-pressed',String(option === button));
  document.querySelector('#sidebar-title').textContent = projectView === 'chapter' ? '教材章节' : '项目分类';
  document.querySelector('#sidebar-categories').setAttribute('aria-label',projectView === 'chapter' ? '教材章节' : '项目分类');
  query.placeholder = projectView === 'chapter' ? '搜索项目、册次或章节' : '搜索项目名称或类型';
  updateStatus();
});
document.querySelector('#reset').addEventListener('click',() => { libraryForm.reset(); projectCategory = '全部类型'; knowledgeTopic = '全部主题'; textbookSelect.selectedIndex=0; for(const select of document.querySelectorAll('.field select')) select.selectedIndex=0; updateStatus(); });
render();
