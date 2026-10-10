(() => {
  const language = document.getElementById('language');
  const translated = [...document.querySelectorAll('[data-en]')];
  translated.forEach(el => el.dataset.zh = el.innerHTML);
  let english = false;
  const header = document.getElementById('header');
  const progress = document.getElementById('progress');
  let scrollQueued = false;
  const updateScroll = () => {
    const point = document.elementFromPoint(window.innerWidth / 2, 96);
    const dark = point?.closest('[data-nav-tone]')?.dataset.navTone === 'dark';
    header.classList.toggle('light', !dark);
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${distance > 0 ? window.scrollY / distance * 100 : 0}%`;
    scrollQueued = false;
  };
  const queueScroll = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  };
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  updateScroll();
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04 });
    const groups = ['.strength-heading', '.strength-grid article', '.section-heading', '.timeline-entry', '.research-title', '.skill-list article', '.publication-meta', '.publication-body', '.contact-grid > div', '.recognition-band article', '.future-grid article', '.role-grid article', '.honors-grid article', '.about-grid > div'];
    document.querySelectorAll(groups.join(',')).forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
    document.documentElement.classList.add('js-ready');
  }

  language.addEventListener('click', () => {
    english = !english;
    document.documentElement.lang = english ? 'en' : 'zh-CN';
    translated.forEach(el => el.innerHTML = english ? el.dataset.en : el.dataset.zh);
    language.textContent = english ? '中文' : 'EN';
    language.setAttribute('aria-label', english ? '切换到中文' : 'Switch to English');
    document.title = english ? 'Tian-Yu Ma · Neuroscience × AI · Brain–Machine Interfaces' : '马天宇 Tian-Yu Ma · Neuroscience × AI · 脑机接口';
    document.getElementById('copy-message').textContent = '';
    queueScroll();
  });
  document.getElementById('copy').addEventListener('click', async () => {
    const status = document.getElementById('copy-message');
    try {
      await navigator.clipboard.writeText('maty2022@ion.ac.cn');
      status.textContent = english ? 'Email copied.' : '邮箱已复制。';
    } catch {
      status.textContent = english ? 'Please copy: maty2022@ion.ac.cn' : '请手动复制：maty2022@ion.ac.cn';
    }
  });
})();
