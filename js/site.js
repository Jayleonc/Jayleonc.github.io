const siteHeader = document.querySelector('[data-site-header]');
const themeToggle = document.querySelector('[data-theme-toggle]');
const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('[data-site-nav]');
const runtimeNodes = document.querySelectorAll('[data-runtime]');
const root = document.documentElement;
const homeSections = document.querySelectorAll('.home-section');

root.classList.add('js-enabled');

const getHeaderOffset = () => {
  if (!siteHeader) {
    return 20;
  }

  return Math.ceil(siteHeader.getBoundingClientRect().height + 12);
};

const getHashTarget = (hash) => {
  if (!hash || hash === '#') {
    return null;
  }

  const id = decodeURIComponent(hash.slice(1));
  return document.getElementById(id);
};

const syncAnchorOffset = () => {
  root.style.setProperty('--anchor-offset', `${getHeaderOffset()}px`);
};

const scrollToHashTarget = (hash, smooth = true) => {
  const target = getHashTarget(hash);
  if (!target) {
    return false;
  }

  const top = window.scrollY + target.getBoundingClientRect().top - getHeaderOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior: smooth ? 'smooth' : 'auto'
  });
  return true;
};

syncAnchorOffset();

const syncTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  }
};

const storedTheme = window.localStorage.getItem('atelier-theme');
syncTheme(storedTheme === 'light' ? 'light' : 'dark');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    window.localStorage.setItem('atelier-theme', nextTheme);
    syncTheme(nextTheme);
  });
}

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

if (siteHeader) {
  let ticking = false;
  const syncHeader = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
    syncAnchorOffset();
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(syncHeader);
      ticking = true;
    }
  }, { passive: true });
  syncHeader();
}

window.addEventListener('resize', syncAnchorOffset, { passive: true });

document.querySelectorAll('a[href*="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) {
      return;
    }

    if (!getHashTarget(url.hash)) {
      return;
    }

    event.preventDefault();
    history.pushState(null, '', url.hash);
    scrollToHashTarget(url.hash, true);
  });
});

if (window.location.hash) {
  window.requestAnimationFrame(() => {
    scrollToHashTarget(window.location.hash, false);
  });
}

window.addEventListener('hashchange', () => {
  scrollToHashTarget(window.location.hash, false);
});

const revealNodes = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealNodes.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12
  });

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

if ('IntersectionObserver' in window && homeSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-active', entry.isIntersecting);
    });
  }, {
    threshold: 0.35,
    rootMargin: '-8% 0px -12% 0px'
  });

  homeSections.forEach((section, index) => {
    if (index === 0) {
      section.classList.add('is-active');
    }
    sectionObserver.observe(section);
  });
} else {
  homeSections.forEach((section) => section.classList.add('is-active'));
}

const getCodeLanguage = (block) => {
  if (block.matches('figure.highlight')) {
    return Array.from(block.classList).find((item) => item !== 'highlight') || 'text';
  }

  if (block.matches('pre')) {
    const code = block.querySelector('code');
    const classes = [
      ...Array.from(block.classList),
      ...Array.from(code ? code.classList : [])
    ];
    const languageClass = classes.find((item) => item.startsWith('language-'));
    return languageClass ? languageClass.replace('language-', '') : 'text';
  }

  return 'text';
};

const getCodeContent = (block) => {
  if (block.matches('figure.highlight')) {
    const codeNode = block.querySelector('.code pre');
    return codeNode ? codeNode.innerText : block.innerText;
  }

  if (block.matches('pre')) {
    const codeNode = block.querySelector('code');
    return codeNode ? codeNode.innerText : block.innerText;
  }

  return '';
};

const decorateCodeBlock = (block) => {
  if (block.dataset.enhanced === 'true') {
    return;
  }

  block.dataset.enhanced = 'true';
  block.setAttribute('data-language', getCodeLanguage(block));

  const copyButton = document.createElement('button');
  copyButton.className = 'code-copy-button';
  copyButton.type = 'button';
  copyButton.textContent = '复制';
  copyButton.setAttribute('aria-label', '复制代码');

  copyButton.addEventListener('click', async () => {
    const content = getCodeContent(block).trimEnd();
    if (!content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      copyButton.textContent = '已复制';
      window.setTimeout(() => {
        copyButton.textContent = '复制';
      }, 1600);
    } catch (error) {
      copyButton.textContent = '失败';
      window.setTimeout(() => {
        copyButton.textContent = '复制';
      }, 1600);
    }
  });

  block.appendChild(copyButton);
};

document.querySelectorAll('figure.highlight, .prose pre').forEach((block) => {
  if (block.matches('pre') && block.closest('figure.highlight')) {
    return;
  }

  if (block.querySelector('code') || block.matches('figure.highlight')) {
    decorateCodeBlock(block);
  }
});

const formatRuntime = (sinceValue) => {
  const since = new Date(sinceValue);
  const now = new Date();

  if (Number.isNaN(since.getTime()) || now <= since) {
    return '0 年 0 天 00:00:00';
  }

  let years = now.getFullYear() - since.getFullYear();
  const anchor = new Date(since);
  anchor.setFullYear(since.getFullYear() + years);

  if (anchor > now) {
    years -= 1;
    anchor.setFullYear(since.getFullYear() + years);
  }

  const diff = now.getTime() - anchor.getTime();
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${years} 年 ${days} 天 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

if (runtimeNodes.length) {
  const syncRuntime = () => {
    runtimeNodes.forEach((node) => {
      const sinceValue = node.getAttribute('data-since');
      if (sinceValue) {
        node.textContent = formatRuntime(sinceValue);
      }
    });
  };

  syncRuntime();
  window.setInterval(syncRuntime, 1000);
}
