let freqDict;
let knownKanjiSet = new Set();
const loadJSON = async () => {
  const data = await fetch("freq.json");
  freqDict = await data.json();
  console.log("data loaded");
};
loadJSON();

const kanjisInput = document.getElementById("kanjis-input");
kanjisInput.addEventListener("input", () => {
  localStorage.setItem("kanjis", kanjisInput.value);
});
kanjisInput.value = localStorage.getItem("kanjis") || "色";

const unknownKanjiCountInput = document.getElementById(
  "unknown-kanji-count-input"
);
unknownKanjiCountInput.addEventListener("input", () => {
  localStorage.setItem("unknownKanjiCount", unknownKanjiCountInput.value);
});
unknownKanjiCountInput.value = localStorage.getItem("unknownKanjiCount") || "0";

const kanjiOnlyCheckbox = document.getElementById("kanji-only-checkbox");
kanjiOnlyCheckbox.addEventListener("change", () => {
  localStorage.setItem("kanjiOnly", kanjiOnlyCheckbox.checked);
});
kanjiOnlyCheckbox.checked = localStorage.getItem("kanjiOnly") === "true";

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
    if (knownKanjiSet.has(term[char])) {
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
  const knownKanjis = kanjisInput.value;
  knownKanjiSet = new Set(knownKanjis);

  resultList.innerHTML = "";
  stats.innerHTML = "";

  const items = [];
  for (const [term, kanjis, reading, freq] of freqDict) {
    let unknownKanjiCount = 0;
    let hasKnownKanji = false;
    let termHasOnlyKanji = false;

    const termWithoutKanjiRepititon = term.replace(/々/g, "");
    if (termWithoutKanjiRepititon === kanjis) {
      termHasOnlyKanji = true;
    }

    for (const kanji of kanjis) {
      if (!knownKanjiSet.has(kanji)) {
        unknownKanjiCount++;
      } else {
        hasKnownKanji = true;
      }
    }

    if (
      hasKnownKanji &&
      unknownKanjiCount === Number(unknownKanjiCountInput.value) &&
      (!kanjiOnlyCheckbox.checked || termHasOnlyKanji)
    ) {
      items.push([term, kanjis, reading, freq]);
    }
  }

  const percentage = ((items.length / freqDict.length) * 100).toFixed(2);
  stats.innerHTML = `${items.length}/${freqDict.length} entries (${percentage}%)`;

  for (const [term, kanjis, reading, freq] of items) {
    const div = createText(term, reading, freq);
    resultList.appendChild(div);
  }
};

const btn = document.getElementById("search");
btn.addEventListener("click", search);
