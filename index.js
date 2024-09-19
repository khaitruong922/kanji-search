const kanjiListInput = document.getElementById("kanji-list-input");
kanjiListInput.addEventListener("input", () => {
  localStorage.setItem("kanjiList", kanjiListInput.value);
});
kanjiListInput.value = localStorage.getItem("kanjiList") ?? "色";

const otherKanjiCountInput = document.getElementById("other-kanji-count-input");
otherKanjiCountInput.addEventListener("input", () => {
  localStorage.setItem("otherKanjiCount", otherKanjiCountInput.value);
});
otherKanjiCountInput.value = localStorage.getItem("otherKanjiCount") ?? "0";

const kanjiOnlyCheckbox = document.getElementById("kanji-only-checkbox");
kanjiOnlyCheckbox.addEventListener("change", () => {
  localStorage.setItem("kanjiOnly", kanjiOnlyCheckbox.checked);
});
kanjiOnlyCheckbox.checked =
  localStorage.getItem("kanjiOnly") === "true" ?? false;

const containsAllCheckbox = document.getElementById("contains-all-checkbox");
containsAllCheckbox.addEventListener("change", () => {
  localStorage.setItem("containsAll", containsAllCheckbox.checked);
});
containsAllCheckbox.checked =
  localStorage.getItem("containsAll") === "true" ?? false;

const resultList = document.getElementById("list");
const stats = document.getElementById("stats");
const statsNote = document.getElementById("stats-note");
const progress = document.getElementById("progress");

let dict;
let inputKanjiSet = new Set();

const loadJSON = async () => {
  const data = await fetch("dict.json");
  dict = await data.json();
  console.log("dict loaded");
};
loadJSON();

const createText = (term, reading, freq) => {
  const div = document.createElement("div");
  const freqSpan = document.createElement("span");
  freqSpan.textContent = `${freq}. `;
  freqSpan.classList.add("freq");
  div.appendChild(freqSpan);
  const termSpan = document.createElement("span");
  termSpan.classList.add("term");
  for (const char in term) {
    const charSpan = document.createElement("span");
    charSpan.textContent = term[char];
    if (inputKanjiSet.has(term[char])) {
      charSpan.classList.add("known");
    }
    termSpan.appendChild(charSpan);
  }
  div.appendChild(termSpan);
  const readingSpan = document.createElement("span");
  readingSpan.textContent = ` (${reading})`;
  readingSpan.classList.add("reading");
  div.appendChild(readingSpan);
  return div;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const items = [];

let inserting = false;
let interrupted = false;

const insertResultInBatch = async () => {
  const chunkSize = 1000;
  inserting = true;
  for (let i = 0; i < items.length; i += chunkSize) {
    progress.value = Math.min(i + chunkSize, items.length);
    if (interrupted) {
      inserting = false;
      interrupted = false;
      return;
    }
    const chunk = items.slice(i, i + chunkSize);
    for (const [term, kanjiList, reading, freq] of chunk) {
      const div = createText(term, reading, freq);
      resultList.appendChild(div);
    }
    await sleep(0);
  }
  inserting = false;
};

const search = async () => {
  console.log("inserting", inserting, "interrupted", interrupted);
  if (inserting) {
    interrupted = true;
    while (true) {
      await sleep(1000);
      if (!inserting) break;
    }
  }
  const inputKanjiList = kanjiListInput.value;
  inputKanjiSet = new Set(inputKanjiList);

  resultList.innerHTML = "";
  stats.innerHTML = "";
  items.length = 0;

  const otherKanjiCountAny = otherKanjiCountInput.value === "-1";
  const containsAll = containsAllCheckbox.checked;
  const kanjiOnly = kanjiOnlyCheckbox.checked;
  const otherKanjiCount = Number(otherKanjiCountInput.value);

  for (const [term, kanjiList, reading, freq] of dict) {
    let termOtherKanjiCount = 0;
    let termHasOnlyKanji = false;
    let termKanjiOverlap = new Set();

    const termWithoutKanjiRepititon = term.replace(/々/g, "");
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

    const containsAnyCondition = inputKanjiSet.size === 0 || hasAnyKanji;
    const containsAllCondition = !containsAll || hasAllKanji;
    const otherKanjiCountCondition =
      otherKanjiCountAny || termOtherKanjiCount === otherKanjiCount;
    const kanjiOnlyCondition = !kanjiOnly || termHasOnlyKanji;

    if (
      containsAnyCondition &&
      containsAllCondition &&
      otherKanjiCountCondition &&
      kanjiOnlyCondition
    ) {
      items.push([term, kanjiList, reading, freq]);
    }
  }

  const percentage = ((items.length / dict.length) * 100).toFixed(4);
  statsNote.hidden = false;
  stats.innerHTML = `${items.length} of ${dict.length} entries* (${percentage}%)`;
  progress.hidden = false;
  progress.max = items.length;

  insertResultInBatch();
};

const btn = document.getElementById("search");
btn.addEventListener("click", search);
