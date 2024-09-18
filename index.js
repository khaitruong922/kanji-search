let freqDict;
let knownkanjiSet = new Set();
const loadJSON = async () => {
  const data = await fetch("freq.json");
  freqDict = await data.json();
  console.log("data loaded");
};
loadJSON();

const kanjiListInput = document.getElementById("kanji-list-input");
kanjiListInput.addEventListener("input", () => {
  localStorage.setItem("kanjiList", kanjiListInput.value);
});
kanjiListInput.value = localStorage.getItem("kanjiList") || "色";

const otherKanjiCountInput = document.getElementById("other-kanji-count-input");
otherKanjiCountInput.addEventListener("input", () => {
  localStorage.setItem("otherKanjiCount", otherKanjiCountInput.value);
});
otherKanjiCountInput.value = localStorage.getItem("otherKanjiCount") || "0";

const kanjiOnlyCheckbox = document.getElementById("kanji-only-checkbox");
kanjiOnlyCheckbox.addEventListener("change", () => {
  localStorage.setItem("kanjiOnly", kanjiOnlyCheckbox.checked);
});
kanjiOnlyCheckbox.checked =
  localStorage.getItem("kanjiOnly") === "true" || false;

const containsAllCheckbox = document.getElementById("contains-all-checkbox");
containsAllCheckbox.addEventListener("change", () => {
  localStorage.setItem("containsAll", containsAllCheckbox.checked);
});
containsAllCheckbox.checked =
  localStorage.getItem("containsAll") === "true" || false;

const resultList = document.getElementById("list");
const stats = document.getElementById("stats");

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
    if (knownkanjiSet.has(term[char])) {
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

const search = () => {
  const knownKanjiList = kanjiListInput.value;
  knownkanjiSet = new Set(knownKanjiList);

  resultList.innerHTML = "";
  stats.innerHTML = "";

  const items = [];
  const otherKanjiCountAny = otherKanjiCountInput.value === "-1";
  for (const [term, kanjiList, reading, freq] of freqDict) {
    let otherKanjiCount = 0;
    let termHasOnlyKanji = false;
    let termkanjiSet = new Set();

    const termWithoutKanjiRepititon = term.replace(/々/g, "");
    if (termWithoutKanjiRepititon === kanjiList) {
      termHasOnlyKanji = true;
    }

    for (const kanji of kanjiList) {
      if (!knownkanjiSet.has(kanji)) {
        otherKanjiCount++;
      } else {
        termkanjiSet.add(kanji);
      }
    }

    const hasAllKanji = termkanjiSet.size === knownkanjiSet.size;
    const hasAnyKanji = termkanjiSet.size > 0;

    const hasAnyCondition = hasAnyKanji;
    const hasAllCondition = !containsAllCheckbox.checked || hasAllKanji;
    const otherKanjiCountCondition =
      otherKanjiCountAny ||
      otherKanjiCount === Number(otherKanjiCountInput.value);
    const kanjiOnlyCondition = !kanjiOnlyCheckbox.checked || termHasOnlyKanji;

    if (
      hasAnyCondition &&
      hasAllCondition &&
      otherKanjiCountCondition &&
      kanjiOnlyCondition
    ) {
      items.push([term, kanjiList, reading, freq]);
    }
  }

  const percentage = ((items.length / freqDict.length) * 100).toFixed(4);
  stats.innerHTML = `${items.length}/${freqDict.length} entries (${percentage}%)`;

  for (const [term, kanjiList, reading, freq] of items) {
    const div = createText(term, reading, freq);
    resultList.appendChild(div);
  }
};

const btn = document.getElementById("search");
btn.addEventListener("click", search);
