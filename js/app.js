/* ===== State ===== */
const state = {
  currentRoute: 'home',
  progress: loadProgress()
};

const routes = {
  home: renderHome,
  olympiads: renderOlympiads,
  universities: renderUniversities,
  topics: renderTopics,
  topic: renderTopicDetail,
  tests: renderTests,
  test: renderTest,
  progress: renderProgress,
  terms: renderTerms
};

/* ===== Progress helpers ===== */
function loadProgress() {
  try {
    const saved = localStorage.getItem('law-prep-progress');
    return saved ? JSON.parse(saved) : { completedTopics: [], testResults: {} };
  } catch (e) {
    return { completedTopics: [], testResults: {} };
  }
}

function saveProgress() {
  try {
    localStorage.setItem('law-prep-progress', JSON.stringify(state.progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}

function markTopicCompleted(topicId, completed) {
  const set = new Set(state.progress.completedTopics);
  if (completed) set.add(topicId);
  else set.delete(topicId);
  state.progress.completedTopics = Array.from(set);
  saveProgress();
}

function isTopicCompleted(topicId) {
  return state.progress.completedTopics.includes(topicId);
}

function saveTestResult(testId, score, total) {
  state.progress.testResults[testId] = { score, total, date: new Date().toISOString() };
  saveProgress();
}

function getTestResult(testId) {
  return state.progress.testResults[testId] || null;
}

/* ===== Router ===== */
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  initMobileMenu();
}

function parseRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';
  const [route, param] = hash.split('/');
  return { route, param };
}

function handleRoute() {
  const { route, param } = parseRoute();
  state.currentRoute = route;
  const renderer = routes[route] || renderHome;
  const app = document.getElementById('app');
  app.innerHTML = '';
  renderer(app, param);
  updateActiveNav();
  window.scrollTo(0, 0);
}

function navigate(route, param) {
  const hash = param ? `#${route}/${param}` : `#${route}`;
  window.location.hash = hash;
}

function updateActiveNav() {
  document.querySelectorAll('.main-nav a').forEach(link => {
    const linkRoute = link.dataset.route;
    const isActive = linkRoute === state.currentRoute ||
      (linkRoute === 'topics' && state.currentRoute === 'topic') ||
      (linkRoute === 'tests' && state.currentRoute === 'test');
    link.classList.toggle('active', isActive);
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      nav.classList.remove('open');
      const route = e.target.dataset.route;
      if (route) navigate(route);
    }
  });
}

/* ===== Render: Home ===== */
function renderHome(container) {
  const completedCount = state.progress.completedTopics.length;
  const totalTopics = APP_DATA.topics.length;
  const testCount = Object.keys(state.progress.testResults).length;

  container.innerHTML = `
    <section class="hero">
      <h1>Готовься к олимпиадам по праву — без скуки</h1>
      <p>Интерактивная платформа для подготовки к олимпиадам по праву. Темы, тесты, прогресс и полная информация об олимпиадах, которые дают поступление в ВШЭ.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-goto="topics">Начать учить</button>
        <button class="btn btn-secondary" data-goto="olympiads">Олимпиады</button>
      </div>
    </section>

    <h2 class="section-title">Быстрый доступ</h2>
    <div class="card-grid">
      <div class="card" data-goto="topics">
        <h3>Учебные темы</h3>
        <p>${totalTopics} тем в базе. Когда пришлёшь презентации, материал будет добавляться сюда.</p>
        <div class="meta"><span class="badge">${completedCount} изучено</span></div>
      </div>
      <div class="card" data-goto="tests">
        <h3>Тесты</h3>
        <p>Проверяй знания сразу после темы. Мгновенная проверка и объяснения ответов.</p>
        <div class="meta"><span class="badge">${testCount} пройдено</span></div>
      </div>
      <div class="card" data-goto="olympiads">
        <h3>Олимпиады</h3>
        <p>Всё о Высшей пробе, ВСОШ и других олимпиадах, которые принимает ВШЭ на юриспруденцию.</p>
      </div>
      <div class="card" data-goto="universities">
        <h3>ВУЗы</h3>
        <p>Куда поступать на юриспруденцию: ВШЭ, МГУ, СПбГУ, МГЮА, РГУП, УрГЮУ и другие вузы.</p>
      </div>
    </div>

    <h2 class="section-title">Что важно знать</h2>
    <div class="card-grid">
      <div class="card">
        <h3>Высшая проба</h3>
        <p>Олимпиада ВШЭ 1 уровня. Победители и призёры по праву получают <strong>БВИ</strong> (бюджетное внеконкурсное место) на юриспруденцию в ВШЭ — ЕГЭ сдавать всё равно нужно, но конкурса по баллам нет.</p>
      </div>
      <div class="card">
        <h3>ВСОШ по праву</h3>
        <p>Диплом заключительного этапа даёт БВИ на «Юриспруденцию». Этапы: школьный → муниципальный → региональный → заключительный.</p>
      </div>
      <div class="card">
        <h3>Поступление по олимпиадам</h3>
        <p>Значительная часть бюджетных мест в ВШЭ распределяется между победителями и призёрами олимпиад — это реальный путь, если серьёзно готовиться.</p>
      </div>
    </div>
  `;
  bindGoto(container);
}

/* ===== Render: Olympiads ===== */
function renderOlympiads(container) {
  const cards = APP_DATA.olympiads.map(o => `
    <div class="card">
      <h3>${o.name}</h3>
      <p>${o.format}</p>
      <div class="meta">
        <span class="badge">${o.subject}</span>
        <span class="badge badge-accent">${o.level}</span>
        <span class="badge badge-success">${o.grades}</span>
      </div>
      <p style="margin-top:14px;"><strong>Статус:</strong> ${o.status}</p>
      <p style="margin-top:8px;"><strong>Этапы:</strong> ${o.stages}</p>
      <p style="margin-top:8px;"><strong>Льготы:</strong> ${o.benefits}</p>
      <div class="topic-actions" style="margin-top:18px;">
        ${o.links.map(l => `<a class="btn btn-outline" href="${l.url}" target="_blank" rel="noopener">${l.title}</a>`).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <h1 class="page-title">Олимпиады для поступления на юриспруденцию</h1>
    <p class="page-subtitle">Перечневые олимпиады по праву, обществознанию, истории и экономике. Указаны ориентировочные сроки регистрации и проведения; точные даты публикуются на официальных сайтах ближе к началу сезона.</p>
    <div class="card-grid">${cards}</div>
  `;
}

/* ===== Render: Universities ===== */
function renderUniversities(container) {
  const tiers = {};
  APP_DATA.universities.forEach(u => {
    if (!tiers[u.tier]) tiers[u.tier] = [];
    tiers[u.tier].push(u);
  });

  const tierOrder = ['Топовые вузы', 'Сильные юридические вузы', 'Хорошие региональные вузы', 'Другие вузы'];
  const sections = tierOrder.filter(t => tiers[t]).map(tier => {
    const cards = tiers[tier].map(u => `
      <div class="card">
        <h3>${u.name}</h3>
        <p>${u.note}</p>
        <div class="meta">
          <span class="badge">${u.city}</span>
          <span class="badge badge-accent">${u.program}</span>
        </div>
        <p style="margin-top:14px;"><strong>Примерный проходной балл на бюджет (3 предмета):</strong> ${u.budgetEge}</p>
        <p style="margin-top:8px;"><strong>Вступительные испытания:</strong> ${u.exams}</p>
        <p style="margin-top:8px;"><strong>Релевантные олимпиады:</strong> ${u.olympiads}</p>
        <div class="topic-actions" style="margin-top:18px;">
          <a class="btn btn-outline" href="${u.site}" target="_blank" rel="noopener">Сайт вуза</a>
        </div>
      </div>
    `).join('');
    return `
      <h2 class="section-title">${tier}</h2>
      <div class="card-grid">${cards}</div>
    `;
  }).join('');

  container.innerHTML = `
    <h1 class="page-title">ВУЗы для поступления на юриспруденцию</h1>
    <p class="page-subtitle">Куда можно поступить с олимпиадными льготами. Проходные баллы — примерные, ориентировочные для бюджета по прошлым годам; точные цифры публикуются вузами в текущем году.</p>
    ${sections}
  `;
}

/* ===== Render: Topics ===== */
function renderTopics(container) {
  const categories = [...new Set(APP_DATA.topics.map(t => t.category))];
  const topicsByCategory = categories.map(cat => ({
    category: cat,
    topics: APP_DATA.topics.filter(t => t.category === cat)
  }));

  const html = topicsByCategory.map(group => `
    <div class="topic-group">
      <h2 class="section-title">${group.category}</h2>
      <div class="card-grid">
        ${group.topics.map(t => `
          <div class="card" data-goto="topic/${t.id}">
            <h3>${t.title}</h3>
            <p>${t.summary}</p>
            <div class="meta">
              <span class="badge">${t.source}</span>
              ${isTopicCompleted(t.id) ? '<span class="badge badge-success">Изучено</span>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <h1 class="page-title">Учебные темы</h1>
    <p class="page-subtitle">Все темы из презентаций курсов. Используй поиск, чтобы быстро найти нужное.</p>
    <div class="search-bar">
      <input type="text" id="topicSearch" placeholder="Поиск по темам, тегам, источникам...">
      <select id="categoryFilter">
        <option value="">Все категории</option>
        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <div id="topicsList">${html}</div>
  `;

  bindGoto(container);
  bindTopicSearch();
}

function bindTopicSearch() {
  const search = document.getElementById('topicSearch');
  const filter = document.getElementById('categoryFilter');
  const list = document.getElementById('topicsList');

  function filterTopics() {
    const query = search.value.toLowerCase().trim();
    const category = filter.value;
    const filtered = APP_DATA.topics.filter(t => {
      const matchesQuery = !query ||
        t.title.toLowerCase().includes(query) ||
        t.summary.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query)) ||
        t.source.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);
      const matchesCategory = !category || t.category === category;
      return matchesQuery && matchesCategory;
    });

    const categories = [...new Set(filtered.map(t => t.category))];
    list.innerHTML = categories.map(cat => `
      <div class="topic-group">
        <h2 class="section-title">${cat}</h2>
        <div class="card-grid">
          ${filtered.filter(t => t.category === cat).map(t => `
            <div class="card" data-goto="topic/${t.id}">
              <h3>${t.title}</h3>
              <p>${t.summary}</p>
              <div class="meta">
                <span class="badge">${t.source}</span>
                ${isTopicCompleted(t.id) ? '<span class="badge badge-success">Изучено</span>' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('') || `
      <div class="empty-state">
        <h3>Ничего не найдено</h3>
        <p>Попробуй изменить запрос или сбросить фильтр.</p>
      </div>
    `;
    bindGoto(list);
  }

  search.addEventListener('input', filterTopics);
  filter.addEventListener('change', filterTopics);
}

/* ===== Render: Topic Detail ===== */
function renderTopicDetail(container, topicId) {
  const topic = APP_DATA.topics.find(t => t.id === topicId);
  if (!topic) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Тема не найдена</h3>
        <button class="btn btn-outline" data-goto="topics">Ко всем темам</button>
      </div>
    `;
    bindGoto(container);
    return;
  }

  const relatedTests = APP_DATA.tests.filter(t => t.topicId === topicId);
  const completed = isTopicCompleted(topicId);

  container.innerHTML = `
    <div class="topic-detail">
      <div class="meta">
        <span class="badge">${topic.category}</span>
        <span class="badge">${topic.source}</span>
      </div>
      <h2>${topic.title}</h2>
      <p style="color:var(--text-secondary); margin-bottom: 24px;">${topic.summary}</p>
      <div class="topic-content">
        ${topic.content}
      </div>
      <div class="topic-actions">
        <button class="btn ${completed ? 'btn-outline' : 'btn-success'}" id="completeBtn">
          ${completed ? 'Отметить как неизученное' : 'Отметить как изученное'}
        </button>
        ${relatedTests.length ? `<button class="btn btn-primary" data-goto="test/${relatedTests[0].id}">Пройти тест</button>` : ''}
        <button class="btn btn-outline" data-goto="topics">Ко всем темам</button>
      </div>
    </div>
  `;

  document.getElementById('completeBtn').addEventListener('click', () => {
    const newState = !isTopicCompleted(topicId);
    markTopicCompleted(topicId, newState);
    renderTopicDetail(container, topicId);
  });

  bindGoto(container);
}

/* ===== Render: Tests ===== */
function renderTests(container) {
  const cards = APP_DATA.tests.map(t => {
    const topic = APP_DATA.topics.find(topic => topic.id === t.topicId);
    const result = getTestResult(t.id);
    return `
      <div class="card" data-goto="test/${t.id}">
        <h3>${t.title}</h3>
        <p>Тема: ${topic ? topic.title : '—'}</p>
        <div class="meta">
          <span class="badge">${t.questions.length} вопросов</span>
          ${result ? `<span class="badge badge-success">${result.score}/${result.total}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h1 class="page-title">Тесты</h1>
    <p class="page-subtitle">Проверяй знания после каждой темы. Все ответы сохраняются в прогрессе.</p>
    <div class="card-grid">${cards}</div>
  `;
  bindGoto(container);
}

/* ===== Render: Test ===== */
function renderTest(container, testId) {
  const test = APP_DATA.tests.find(t => t.id === testId);
  if (!test) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Тест не найден</h3>
        <button class="btn btn-outline" data-goto="tests">Ко всем тестам</button>
      </div>
    `;
    bindGoto(container);
    return;
  }

  const topic = APP_DATA.topics.find(t => t.id === test.topicId);
  const questionsHtml = test.questions.map((q, idx) => `
    <div class="question" data-qid="${q.id}">
      <div class="question-text">${idx + 1}. ${q.text}</div>
      <div class="options">
        ${q.options.map(opt => `
          <label class="option" data-oid="${opt.id}">
            <input type="${q.type === 'single' ? 'radio' : 'checkbox'}" name="${q.id}" value="${opt.id}">
            <span>${opt.text}</span>
          </label>
        `).join('')}
      </div>
      <div class="explanation" id="exp-${q.id}">${q.explanation}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="test-container">
      <div class="meta">
        <span class="badge">${topic ? topic.category : '—'}</span>
        <span class="badge">${test.questions.length} вопросов</span>
      </div>
      <h2 class="page-title" style="margin-top: 8px;">${test.title}</h2>
      <p class="page-subtitle">Тема: ${topic ? topic.title : '—'}</p>
      <form id="testForm">
        ${questionsHtml}
        <div class="topic-actions">
          <button type="submit" class="btn btn-success">Проверить ответы</button>
          <button type="button" class="btn btn-outline" data-goto="tests">Ко всем тестам</button>
        </div>
      </form>
      <div id="testResult" class="test-result" style="display:none;"></div>
    </div>
  `;

  bindGoto(container);
  bindTestForm(test);
}

function bindTestForm(test) {
  const form = document.getElementById('testForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let score = 0;

    test.questions.forEach(q => {
      const selected = Array.from(document.querySelectorAll(`input[name="${q.id}"]:checked`)).map(i => i.value);
      const correctIds = q.options.filter(o => o.correct).map(o => o.id);
      const isCorrect = q.type === 'single'
        ? selected.length === 1 && correctIds.includes(selected[0])
        : selected.length === correctIds.length && correctIds.every(id => selected.includes(id));

      if (isCorrect) score++;

      const questionEl = document.querySelector(`.question[data-qid="${q.id}"]`);
      questionEl.querySelectorAll('.option').forEach(optionEl => {
        const oid = optionEl.dataset.oid;
        const isSelected = selected.includes(oid);
        const isCorrectOption = correctIds.includes(oid);
        optionEl.classList.remove('correct', 'wrong');
        if (isCorrectOption) optionEl.classList.add('correct');
        else if (isSelected) optionEl.classList.add('wrong');
      });

      document.getElementById(`exp-${q.id}`).classList.add('visible');
    });

    saveTestResult(test.id, score, test.questions.length);
    const resultEl = document.getElementById('testResult');
    resultEl.style.display = 'block';
    resultEl.className = 'test-result';
    resultEl.style.background = score === test.questions.length ? 'var(--success-light)' : 'var(--warning-light)';
    resultEl.style.color = score === test.questions.length ? 'var(--success)' : 'var(--warning)';
    resultEl.textContent = `Результат: ${score} из ${test.questions.length}`;
  });
}

/* ===== Render: Progress ===== */
function renderProgress(container) {
  const completed = state.progress.completedTopics.length;
  const totalTopics = APP_DATA.topics.length;
  const testResults = Object.values(state.progress.testResults);
  const avgScore = testResults.length
    ? Math.round(testResults.reduce((a, r) => a + (r.score / r.total), 0) / testResults.length * 100)
    : 0;

  const topicRows = APP_DATA.topics.map(t => {
    const done = isTopicCompleted(t.id);
    const result = APP_DATA.tests.find(test => test.topicId === t.id);
    const testResult = result ? getTestResult(result.id) : null;
    const percent = done ? 100 : testResult ? Math.round(testResult.score / testResult.total * 100) : 0;
    return `
      <div class="progress-item">
        <div>
          <strong>${t.title}</strong>
          <div style="color:var(--text-secondary); font-size:0.9rem;">${t.category}</div>
        </div>
        <div class="progress-bar"><div style="width:${percent}%"></div></div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h1 class="page-title">Прогресс</h1>
    <p class="page-subtitle">Твоя статистика обучения сохраняется в браузере.</p>
    <div class="progress-stats">
      <div class="stat-card">
        <div class="number">${completed}</div>
        <div class="label">Тем изучено</div>
      </div>
      <div class="stat-card">
        <div class="number">${totalTopics}</div>
        <div class="label">Тем всего</div>
      </div>
      <div class="stat-card">
        <div class="number">${testResults.length}</div>
        <div class="label">Тестов пройдено</div>
      </div>
      <div class="stat-card">
        <div class="number">${avgScore}%</div>
        <div class="label">Средний результат</div>
      </div>
    </div>
    <h2 class="section-title">По темам</h2>
    <div class="progress-list">${topicRows}</div>
    <div class="topic-actions" style="margin-top: 24px;">
      <button class="btn btn-danger" id="resetProgress">Сбросить прогресс</button>
    </div>
  `;

  document.getElementById('resetProgress').addEventListener('click', () => {
    if (confirm('Сбросить весь прогресс?')) {
      state.progress = { completedTopics: [], testResults: {} };
      saveProgress();
      renderProgress(container);
    }
  });
}

/* ===== Helpers ===== */
function bindGoto(container) {
  container.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.goto;
      const [route, param] = target.split('/');
      navigate(route, param);
    });
  });
}

/* ===== Render: Terms ===== */
function renderTerms(container) {
  container.innerHTML = `
    <div class="topic-detail">
      <h1 class="page-title">Пользовательское соглашение</h1>
      <p style="color:var(--text-secondary);">Дата последнего обновления: 18 июня 2026 г.</p>

      <div class="topic-content">
        <h3>1. Общие положения</h3>
        <p>Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует условия использования информационного ресурса «Право olymp», расположенного по адресу <strong>pravolymp.ru</strong> и <strong>realfactchecknews-eng.github.io/hse-law-prep</strong> (далее — «Сайт»). Используя Сайт, Пользователь выражает полное и безоговорочное согласие с условиями настоящего Соглашения.</p>
        <p>Если Пользователь не согласен с условиями Соглашения, он обязан немедленно прекратить использование Сайта.</p>

        <h3>2. Назначение Сайта</h3>
        <p>Сайт является некоммерческим образовательным ресурсом, созданным в целях самостоятельной подготовки к олимпиадам по праву (Высшая проба, ВСОШ, РСОШ и др.) и поступления на юридические специальности в вузы Российской Федерации.</p>
        <p>Вся информация, размещённая на Сайте, носит <strong>исключительно информационный и образовательный характер</strong>.</p>

        <h3>3. Об AI-консультанте</h3>
        <p>На Сайте реализован AI-помощник («AI-юрист»), работающий на основе модели <strong>openai/gpt-4o-mini</strong> через сервис OpenRouter.</p>
        <p><strong>Важно:</strong></p>
        <ul>
          <li>AI-юрист <strong>не является юристом</strong>, не имеет лицензии на оказание юридических услуг и не несёт юридической ответственности за ответы.</li>
          <li>Ответы AI-юриста <strong>не являются официальной юридической консультацией</strong> и не имеют юридической силы.</li>
          <li>AI-юрист может допускать фактические ошибки, неточности и давать устаревшие сведения — нормативные акты могли измениться после даты обучения модели.</li>
          <li>Пользователь самостоятельно несёт ответственность за решения, принятые на основании ответов AI-юриста.</li>
          <li>По вопросам, требующим официального правового заключения, необходимо обращаться к лицензированному юристу или адвокату.</li>
        </ul>

        <h3>4. Интеллектуальная собственность и источники</h3>
        <p>Учебные материалы, тесты и иной контент, размещённый на Сайте, созданы на основе общедоступных учебных пособий по теории государства и права, конституционному праву, а также официально опубликованных нормативных правовых актов Российской Федерации. Основные источники:</p>
        <ul>
          <li>Учебники по теории государства и права: Морозова Л.А., Матузов Н.И., Малько А.В.</li>
          <li>Конституция Российской Федерации и федеральные законы (официальные тексты)</li>
          <li>Официальные сайты олимпиад и приёмных комиссий вузов</li>
        </ul>
        <p>«Высшая проба», «Всероссийская олимпиада школьников» и иные названия олимпиад являются названиями/товарными знаками их организаторов. Сайт использует их исключительно в информационно-справочных целях и не аффилирован с организаторами.</p>
        <p>Пользователь вправе использовать материалы Сайта исключительно в личных некоммерческих образовательных целях. Копирование, распространение и публикация материалов в коммерческих целях без письменного согласия администратора Сайта запрещены.</p>

        <h3>5. Персональные данные и конфиденциальность</h3>
        <p>Сайт <strong>не собирает</strong> персональные данные Пользователей: нет регистрации, нет форм, нет cookies для трекинга, нет серверных логов посещений.</p>
        <p><strong>Локальное хранилище браузера (localStorage).</strong> Сайт хранит на устройстве Пользователя:</p>
        <ul>
          <li><code>law-prep-progress</code> — пройденные темы и результаты тестов (остаётся только на вашем устройстве, на серверы не передаётся);</li>
          <li><code>law-prep-ai-chat</code> — последние 30 сообщений с AI-юристом (хранится локально; удаляется при очистке данных сайта в браузере).</li>
        </ul>
        <p>Вы можете удалить эти данные через настройки браузера: <em>Настройки → Конфиденциальность → Данные сайтов → найти pravolymp.ru → Удалить</em>.</p>
        <p><strong>Передача данных в OpenRouter.</strong> При использовании AI-юриста текст ваших сообщений передаётся на серверы OpenRouter (США) для обработки языковой моделью. Используя AI-юриста, Пользователь соглашается с этим. Пользователь <strong>не должен</strong> вводить в чат персональные данные свои или третьих лиц (ФИО, паспортные данные, адреса и т. п.). Политика конфиденциальности OpenRouter: <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener">openrouter.ai/privacy</a>.</p>

        <h3>6. Ограничение ответственности</h3>
        <p>Сайт предоставляется «как есть» (as is). Администратор Сайта не несёт ответственности за:</p>
        <ul>
          <li>точность, полноту и актуальность размещённых материалов;</li>
          <li>соответствие материалов актуальным требованиям олимпиад и вузов;</li>
          <li>любые убытки, возникшие в результате использования или невозможности использования Сайта;</li>
          <li>действия третьих лиц, включая провайдеров услуг AI.</li>
        </ul>
        <p>Сведения об олимпиадах, проходных баллах и условиях поступления носят ориентировочный характер. Актуальную информацию следует уточнять на официальных сайтах организаторов олимпиад и приёмных комиссий вузов.</p>

        <h3>7. Возрастные ограничения</h3>
        <p>Информационные материалы Сайта (темы, тесты, справочники по олимпиадам и вузам) предназначены для пользователей в возрасте <strong>6 лет и старше</strong> (маркировка «6+» в соответствии с Федеральным законом № 436-ФЗ «О защите детей от информации, причиняющей вред их здоровью и развитию»).</p>
        <p>Функция AI-консультанта («AI-юрист») предназначена для самостоятельного использования лицами в возрасте <strong>14 лет и старше</strong>. Лица в возрасте от 6 до 14 лет вправе использовать AI-консультанта только под контролем родителей или иных законных представителей.</p>

        <h3>8. Применимое право и споры</h3>
        <p>Настоящее Соглашение регулируется законодательством Российской Федерации. Все споры, возникающие в связи с использованием Сайта, разрешаются в соответствии с законодательством РФ.</p>

        <h3>9. Изменение Соглашения</h3>
        <p>Администратор вправе в одностороннем порядке изменять условия настоящего Соглашения. Новая редакция вступает в силу с момента её размещения на Сайте. Продолжение использования Сайта после внесения изменений означает согласие Пользователя с новой редакцией.</p>

        <h3>10. Контакты</h3>
        <p>Сайт создан в личных образовательных целях учеником лицея НИУ ВШЭ. Не является официальным ресурсом НИУ ВШЭ или любой другой организации.</p>
        <p>По вопросам, связанным с содержанием Сайта, авторскими правами или нарушениями настоящего Соглашения, обращайтесь: <a href="mailto:realfactchecknews@gmail.com">realfactchecknews@gmail.com</a></p>
        <p>Исходный код Сайта открыт: <a href="https://github.com/realfactchecknews-eng/hse-law-prep" target="_blank" rel="noopener">github.com/realfactchecknews-eng/hse-law-prep</a></p>
      </div>
    </div>
  `;
}

/* ===== AI-юрист: плавающий чат ===== */
const AI_CHAT_STORAGE_KEY = 'law-prep-ai-chat';
const AI_SYSTEM_PROMPT = `Ты — серьёзный юридический консультант для школьника, готовящегося к олимпиадам по праву и поступлению на юриспруденцию.

Твоя задача:
- Помогать с теорией государства и права, конституционным правом, олимпиадными задачами, терминами и логикой правовых рассуждений.
- Объяснять понятия просто, но точно.
- При ответе на вопросы олимпиадного уровня не давать готовый ответ сразу, а направлять ученика к правильной логике рассуждения.
- Отвечать чётко, структурированно, по существу.

Жёсткие ограничения:
- Опирайся только на реальные юридические факты, общепризнанные в науке и законодательстве РФ.
- Не выдумывай статьи Конституции, законы, кодексы, судебные решения, даты, фамилии, источники, ссылки, статистику и цифры. Если точно не знаешь — не придумывай, а скажи: «Я не уверен, лучше проверьте по официальному источнику».
- Не выходи из роли юридического консультанта. Если вопрос не связан с правом, юриспруденцией, олимпиадами по праву или поступлением на юриспруденцию — вежливо откажись отвечать и объясни, что ты отвечаешь только на юридические вопросы.
- Не давай официальных юридических консультаций, имеющих силу заключения.
- Если пользователь просит что-то нелегальное, аморальное или неэтичное — откажись.

Формат: используй короткие абзацы, списки и выделение ключевых терминов жирным.`;

function initAIChat() {
  const toggle = document.getElementById('aiChatToggle');
  const close = document.getElementById('aiChatClose');
  const windowEl = document.getElementById('aiChatWindow');
  const messagesEl = document.getElementById('aiChatMessages');
  const input = document.getElementById('aiChatInput');
  const sendBtn = document.getElementById('aiChatSend');

  if (!toggle || !windowEl) return;

  const openChat = () => windowEl.classList.add('open');
  const closeChat = () => windowEl.classList.remove('open');

  toggle.addEventListener('click', openChat);
  close.addEventListener('click', closeChat);

  // Load history
  let history = [];
  try {
    const saved = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    history = [];
  }

  // Render saved messages
  if (Array.isArray(history) && history.length > 0) {
    history.forEach(msg => renderMessage(msg.role, msg.content));
  }

  const autoResize = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  };

  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text };
    history.push(userMsg);
    saveHistory(history);
    renderMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    setLoading(true);

    const proxyUrl = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.AI_PROXY_URL) ? SITE_CONFIG.AI_PROXY_URL : null;
    if (!proxyUrl || proxyUrl.includes('your-subdomain')) {
      setLoading(false);
      renderMessage('assistant', `AI-юрист не настроен. Для работы нужно развернуть прокси на Cloudflare Workers и указать его URL в <code>js/config.js</code>. Инструкция: <code>AI_CHAT_SETUP.md</code>.`);
      return;
    }

    const messages = [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      ...history
    ];

    try {
      const response = await fetch(`${proxyUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Нет ответа от модели.';
      const assistantMsg = { role: 'assistant', content: reply };
      history.push(assistantMsg);
      saveHistory(history);
      renderMessage('assistant', reply);
    } catch (err) {
      renderMessage('assistant', `Ошибка при обращении к AI: ${err.message}. Проверьте настройки прокси и API-ключ.`);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage(role, content) {
    const div = document.createElement('div');
    div.className = `ai-message ai-message-${role}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-message-content';
    contentDiv.innerHTML = formatAIContent(content);
    div.appendChild(contentDiv);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function formatAIContent(text) {
    // Escape HTML, then format markdown-like bold and lists
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function setLoading(isLoading) {
    const existing = document.querySelector('.ai-chat-typing');
    if (existing) existing.remove();

    if (isLoading) {
      const typing = document.createElement('div');
      typing.className = 'ai-message ai-message-assistant ai-chat-typing';
      typing.innerHTML = `<div class="ai-message-content"><span></span><span></span><span></span></div>`;
      messagesEl.appendChild(typing);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      sendBtn.disabled = true;
    } else {
      const typing = document.querySelector('.ai-chat-typing');
      if (typing) typing.remove();
      sendBtn.disabled = false;
    }
  }

  function saveHistory(history) {
    try {
      // Keep last 30 messages to avoid localStorage overflow
      const trimmed = history.slice(-30);
      localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save AI chat history', e);
    }
  }
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initAIChat();
  document.querySelector('footer').addEventListener('click', (e) => {
    const a = e.target.closest('a[data-route]');
    if (a) {
      e.preventDefault();
      navigate(a.dataset.route);
    }
  });
});
