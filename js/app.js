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
  progress: renderProgress
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
      <p>Интерактивная платформа по материалам курсов «Общее дело». Темы, тесты, прогресс и полная информация об олимпиадах, которые дают поступление в ВШЭ.</p>
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
        <p>Олимпиада ВШЭ 1 уровня. Победители и призёры по праву поступают на юриспруденцию без экзаменов.</p>
      </div>
      <div class="card">
        <h3>ВСОШ по праву</h3>
        <p>Диплом заключительного этапа даёт БВИ на «Юриспруденцию». Этапы: школьный → муниципальный → региональный → заключительный.</p>
      </div>
      <div class="card">
        <h3>Поступление по олимпиадам</h3>
        <p>Почти половина бюджетных мест в ВШЭ занимается победителями и призёрами олимпиад. Это главный путь для олимпиадников.</p>
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

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', initRouter);
