if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('Service Worker Registered'))
      .catch((err) => console.log('Service Worker Registration Failed', err));
  });
}

const searchBtn = document.getElementById('search');

const kanjiListInput = document.getElementById('kanji-list-input');
kanjiListInput.addEventListener('input', (e) => {
  localStorage.setItem('kanjiList', e.target.value);
  searchBtn.disabled = false;
});
kanjiListInput.value = localStorage.getItem('kanjiList') ?? '恋色';

const otherKanjiCountInput = document.getElementById('other-kanji-count-input');
otherKanjiCountInput.addEventListener('input', (e) => {
  localStorage.setItem('otherKanjiCount', e.target.value);
  searchBtn.disabled = false;
});
otherKanjiCountInput.value = localStorage.getItem('otherKanjiCount') ?? '-1';

const readingSearchInput = document.getElementById('reading-search-input');
readingSearchInput.addEventListener('input', (e) => {
  localStorage.setItem('readingSearch', e.target.value);
  searchBtn.disabled = false;
});
readingSearchInput.value = localStorage.getItem('readingSearch') ?? '';

const readingMatchSelect = document.getElementById('reading-match-select');
readingMatchSelect.addEventListener('change', (e) => {
  localStorage.setItem('readingMatch', e.target.value);
  searchBtn.disabled = false;
});
readingMatchSelect.value = localStorage.getItem('readingMatch') ?? 'include';

const kanjiOnlyCheckbox = document.getElementById('kanji-only-checkbox');
kanjiOnlyCheckbox.addEventListener('change', (e) => {
  localStorage.setItem('kanjiOnly', e.target.checked);
  searchBtn.disabled = false;
});
kanjiOnlyCheckbox.checked = localStorage.getItem('kanjiOnly') === 'true' ?? false;

const searchModeSelect = document.getElementById('search-mode-select');
searchModeSelect.addEventListener('change', (e) => {
  localStorage.setItem('searchMode', e.target.value);
  searchBtn.disabled = false;
});
searchModeSelect.value = localStorage.getItem('searchMode') ?? 'any';

const resultList = document.getElementById('list');
const stats = document.getElementById('stats');
const statsNote = document.getElementById('stats-note');
const progress = document.getElementById('progress');
const exportTxtBtn = document.getElementById('export-txt');

let dict;
let inputKanjiSet = new Set();
let readingHighlightRegex = undefined;

const loadDict = async () => {
  const data = await fetch('dict.json');
  dict = await data.json();
  searchBtn.hidden = false;
};
loadDict();

const createText = (term, reading, freq) => {
  const div = document.createElement('div');
  const freqSpan = document.createElement('span');
  freqSpan.textContent = `${freq}. `;
  freqSpan.classList.add('freq');
  div.appendChild(freqSpan);
  const termSpan = document.createElement('span');
  termSpan.classList.add('term');
  for (const char in term) {
    const charSpan = document.createElement('span');
    charSpan.textContent = term[char];
    if (inputKanjiSet.has(term[char])) {
      charSpan.classList.add('known');
    }
    termSpan.appendChild(charSpan);
  }
  div.appendChild(termSpan);

  const readingSpan = document.createElement('span');
  readingSpan.textContent = ` (${reading})`;
  readingSpan.classList.add('reading');

  if (readingHighlightRegex) {
    readingSpan.innerHTML = ` (${reading.replace(
      readingHighlightRegex,
      `<span class="reading-highlight">$1</span>`,
    )})`;
  }

  div.appendChild(readingSpan);
  return div;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const items = [];

let inserting = false;
let interrupted = false;
const BATCH_SIZE = 500;

const insertResultInBatch = async () => {
  inserting = true;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    if (interrupted) {
      inserting = false;
      interrupted = false;
      return;
    }
    progress.value = Math.min(i + BATCH_SIZE, items.length);
    const chunk = items.slice(i, i + BATCH_SIZE);
    for (const [term, kanjiList, reading, freq] of chunk) {
      const div = createText(term, reading, freq);
      resultList.appendChild(div);
    }
    await sleep(0);
  }
  inserting = false;
};

const search = async () => {
  if (!dict) return;
  if (searchBtn.disabled) return;
  searchBtn.disabled = true;
  if (inserting) {
    interrupted = true;
    while (true) {
      await sleep(1000);
      if (!inserting) break;
    }
  }
  const inputKanjiList = kanjiListInput.value;
  inputKanjiSet = new Set(inputKanjiList);

  resultList.innerHTML = '';
  stats.innerHTML = '';
  items.length = 0;

  const otherKanjiCountAny = otherKanjiCountInput.value === '-1';
  const otherKanjiCount = Number(otherKanjiCountInput.value);
  const readingSearch = readingSearchInput.value.trim();
  const readingMatch = readingMatchSelect.value;
  const searchMode = searchModeSelect.value;
  const kanjiOnly = kanjiOnlyCheckbox.checked;

  readingHighlightRegex = readingSearch ? new RegExp(`(${readingSearch})`, 'g') : undefined;

  for (const [term, kanjiList, reading, freq] of dict) {
    let termOtherKanjiCount = 0;
    let termHasOnlyKanji = false;
    let termKanjiOverlap = new Set();

    const termWithoutKanjiRepititon = term.replace(/々/g, '');
    if (termWithoutKanjiRepititon === kanjiList) {
      termHasOnlyKanji = true;
    }

    for (const kanji of kanjiList) {
      if (!inputKanjiSet.has(kanji)) {
        termOtherKanjiCount++;
      } else {
        termKanjiOverlap.add(kanji);
      }
    }

    const hasAllKanji = termKanjiOverlap.size === inputKanjiSet.size;
    const hasAnyKanji = termKanjiOverlap.size > 0;

    const searchModeAnyCondition = searchMode === 'any' && hasAnyKanji;
    const searchModeAllCondition = searchMode === 'all' && hasAllKanji;
    const searchModeNoneCondition = searchMode === 'none' && !hasAnyKanji;

    const searchModeCondition =
      searchModeAnyCondition || searchModeAllCondition || searchModeNoneCondition;

    const otherKanjiCountCondition = otherKanjiCountAny || termOtherKanjiCount === otherKanjiCount;
    const kanjiOnlyCondition = !kanjiOnly || termHasOnlyKanji;

    const conditionMatch = searchModeCondition && otherKanjiCountCondition && kanjiOnlyCondition;

    if (conditionMatch) {
      if (readingSearch) {
        // optimize .includes() calls
        const include = reading.includes(readingSearch);
        const readingIncludeCondition = readingMatch === 'include' && include;
        const readingExactCondition = readingMatch === 'exact' && reading === readingSearch;
        const readingNotIncludeCondition = readingMatch === 'not-include' && !include;
        const readingConditionMatch =
          readingIncludeCondition || readingExactCondition || readingNotIncludeCondition;
        if (readingConditionMatch) {
          items.push([term, kanjiList, reading, freq]);
        }
      } else {
        items.push([term, kanjiList, reading, freq]);
      }
    }
  }

  const percentage = ((items.length / dict.length) * 100).toFixed(4);
  statsNote.hidden = false;
  stats.innerHTML = `${items.length} of ${dict.length} entries* (${percentage}%)`;
  progress.hidden = items.length <= BATCH_SIZE;
  progress.max = items.length;
  exportTxtBtn.hidden = items.length === 0;

  insertResultInBatch();
};

const exportTxt = () => {
  const text = items.map(([term, kanjiList, reading, freq]) => {
    return `${term}`;
  });
  const blob = new Blob([text.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `terms-${new Date().toISOString()}.txt`;
  a.click();
};

const searchOnEnter = (e) => {
  if (e.isComposing) {
    return;
  }
  const { code, key } = e;
  if (!(code === 'Enter' || key === 'Enter' || code === 'NumpadEnter')) {
    return;
  }
  search();
};

kanjiListInput.addEventListener('keydown', searchOnEnter);
searchBtn.addEventListener('click', search);
exportTxtBtn.addEventListener('click', exportTxt);
