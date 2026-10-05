(() => {
  const input = document.querySelector('#blog-search');
  if (!input) return;
  const cards = [...document.querySelectorAll('[data-blog-card]')];
  const filters = [...document.querySelectorAll('[data-topic-filter]')];
  const topics = new Set(filters.map(button => button.dataset.topicFilter));
  const count = document.querySelector('#article-count');
  const feature = document.querySelector('.journal-feature');
  let topic = 'all';
  const apply = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matches = (topic === 'all' || card.dataset.topic === topic) && card.textContent.toLocaleLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });
    feature.hidden = feature.querySelector('[data-blog-card]').hidden;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topicFilter === topic)));
    count.textContent = `${visible} ${visible === 1 ? 'article' : 'articles'}`;
    document.querySelector('.journal-empty').hidden = visible > 0;
  };
  const read = () => {
    const state = new URLSearchParams(location.search);
    input.value = state.get('q') || '';
    topic = topics.has(state.get('topic')) ? state.get('topic') : 'all';
    apply();
  };
  const write = (push = false) => {
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
    if (topic !== 'all') url.searchParams.set('topic', topic); else url.searchParams.delete('topic');
    history[push ? 'pushState' : 'replaceState'](null, '', url);
    apply();
  };
  input.addEventListener('input', () => write());
  input.form.addEventListener('submit', event => { event.preventDefault(); write(); });
  filters.forEach(button => button.addEventListener('click', () => { topic = button.dataset.topicFilter; write(true); }));
  document.querySelector('[data-reset-search]').addEventListener('click', () => { input.value = ''; topic = 'all'; write(true); input.focus(); });
  addEventListener('popstate', read);
  read();
  delete document.documentElement.dataset.initialBlogTopic;
})();
