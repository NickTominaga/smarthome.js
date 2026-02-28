import { getClient } from "./nremo.js";
import { getDemoClient } from "./demoClient.js";

// localStorage キー
const LS_ACCESS_TOKEN = "tool:natureapiaccesstoken";

// 要素参照
const tokenEl = document.getElementById("apiAccessToken");
const clearTokenBtn = document.getElementById("clearTokenBtn");
const scanBtn = document.getElementById("scanBtn");
const spinner = document.getElementById("spinner");
const alertEl = document.getElementById("alert");
const alertMsg = document.getElementById("alertMsg");
const demoBannerEl = document.getElementById("demoBanner");
const appliancesEl = document.getElementById("appliancesList");
const applianceNavListEl = document.getElementById("applianceNavList");
const userInfoEl = document.getElementById("userInfo");

let clientFactory = getClient;
let isDemoMode = false;

scanBtn.addEventListener("click", scanUserInfo);
clearTokenBtn.addEventListener("click", clearToken);

tokenEl.addEventListener("input", () => {
  if (!isDemoMode) {
    displayUserInfo("", []);
  }
  if (tokenEl.value.length > 0) {
    scanBtn.disabled = false;
  } else {
    scanBtn.disabled = true;
    localStorage.removeItem(LS_ACCESS_TOKEN);
  }
});

initialize();

async function initialize() {
  scanBtn.disabled = true;
  setBusy(false);
  hideError();
  hideDemoUi();

  const params = new URLSearchParams(window.location.search);
  const isDemoPath = window.location.pathname === "/demo";
  if (isDemoPath || params.get("demo") === "1") {
    await startDemoMode();
    return;
  }

  const savedToken = localStorage.getItem(LS_ACCESS_TOKEN);
  if (savedToken) {
    tokenEl.value = savedToken;
    await scanUserInfo();
  }
}

function clearToken() {
  tokenEl.value = "";
  localStorage.removeItem(LS_ACCESS_TOKEN);
  scanBtn.disabled = true;
  displayUserInfo("", []);
  hideError();
}

async function startDemoMode() {
  isDemoMode = true;
  clientFactory = getDemoClient;
  tokenEl.value = "DEMO_MODE_TOKEN";
  scanBtn.disabled = false;
  showDemoUi();
  await scanUserInfo();
}

function showDemoUi() {
  demoBannerEl.classList.remove("d-none");
}

function hideDemoUi() {
  demoBannerEl.classList.add("d-none");
}

// UIヘルパ
function setBusy(b) {
  document.querySelectorAll("button, select").forEach((el) => {
    el.disabled = b;
  });
  spinner.classList.toggle("loading", b);
}
function showError(msg) {
  alertMsg.textContent = msg ?? "";
  alertEl.classList.add("show");
}
function hideError() {
  alertEl.classList.remove("show");
}
function withSpinner(asyncFunc) {
  return async () => {
    setBusy(true);
    hideError();

    try {
      await asyncFunc();
    } catch (e) {
      console.error(e);
      showError(e.message);
    } finally {
      setBusy(false);
    }
  };
}

async function scanUserInfo() {
  const scan = async () => {
    const token = tokenEl.value.trim();
    const client = isDemoMode ? clientFactory() : clientFactory(token);
    const nickname = await client.fetchMe();
    const appliances = await client.fetchAppliances();
    displayUserInfo(`${nickname}さん`, appliances);
    if (!isDemoMode) {
      localStorage.setItem(LS_ACCESS_TOKEN, token);
    }
  };
  await withSpinner(scan)();
}

function createApplianceCard(appliance) {
  const card = document.createElement("div");
  card.className = "card appliance-card";
  card.id = appliance.anchorId;

  const header = document.createElement("div");
  header.className = "card-header d-flex align-items-center gap-2";
  header.innerHTML = `<i class="bi ${getApplianceIconClass(appliance.type)}"></i><span>${escapeHtml(appliance.name)}</span>`;

  const body = document.createElement("div");
  body.className = "card-body d-grid gap-3";

  if (appliance.buttons.length > 0) {
    const buttonsGrid = document.createElement("div");
    buttonsGrid.className = "buttons-grid";

    appliance.buttons.forEach((button) => {
      buttonsGrid.appendChild(createButtonElement(button));
    });
    body.appendChild(buttonsGrid);
  }

  if (appliance.aircon) {
    body.appendChild(createAirconControl(appliance.aircon));
  }

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

function createButtonElement(button) {
  const buttonEl = document.createElement("button");
  buttonEl.className = "btn btn-outline-primary d-flex align-items-center justify-content-center gap-1";
  buttonEl.type = "button";
  buttonEl.innerHTML = `<i class="bi ${getButtonIconClass(button)}"></i><span>${escapeHtml(button.name)}</span>`;
  buttonEl.addEventListener("click", withSpinner(button.push));
  return buttonEl;
}

function createAirconControl(aircon) {
  const wrapper = document.createElement("div");
  wrapper.className = "aircon-control border rounded p-3";

  const title = document.createElement("div");
  title.className = "fw-semibold mb-2";
  title.innerHTML = '<i class="bi bi-wind me-1"></i>エアコン操作';
  wrapper.appendChild(title);

  const quickButtons = document.createElement("div");
  quickButtons.className = "d-flex gap-2 mb-3";
  quickButtons.appendChild(createQuickActionButton("電源ON", "bi-power", aircon.powerOn));
  quickButtons.appendChild(createQuickActionButton("電源OFF", "bi-power", aircon.powerOff));
  wrapper.appendChild(quickButtons);

  const formRow = document.createElement("div");
  formRow.className = "row g-2";

  const modeSelect = createSelectControl("運転モード", "bi-sliders", Object.keys(aircon.modes), aircon.defaultParams.mode);
  const tempSelect = createSelectControl("温度", "bi-thermometer-half", [], aircon.defaultParams.temp);
  const volSelect = createSelectControl("風量", "bi-fan", [], aircon.defaultParams.vol);
  const dirSelect = createSelectControl("風向", "bi-arrow-down-up", [], aircon.defaultParams.dir);

  formRow.appendChild(modeSelect.group);
  formRow.appendChild(tempSelect.group);
  formRow.appendChild(volSelect.group);
  formRow.appendChild(dirSelect.group);

  wrapper.appendChild(formRow);

  const refreshOptions = () => {
    const mode = modeSelect.select.value;
    const modeInfo = aircon.modes[mode] ?? {};
    setSelectOptions(tempSelect.select, modeInfo.temps ?? [], aircon.defaultParams.temp);
    setSelectOptions(volSelect.select, modeInfo.vols ?? [], aircon.defaultParams.vol);
    setSelectOptions(dirSelect.select, modeInfo.dirs ?? [], aircon.defaultParams.dir);
  };

  modeSelect.select.addEventListener("change", refreshOptions);
  refreshOptions();

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "btn btn-primary mt-3";
  applyBtn.innerHTML = '<i class="bi bi-send-fill me-1"></i>エアコン設定を送信';
  applyBtn.addEventListener("click", withSpinner(async () => {
    await aircon.update({
      mode: modeSelect.select.value,
      temp: readOptionalValue(tempSelect.select.value),
      vol: readOptionalValue(volSelect.select.value),
      dir: readOptionalValue(dirSelect.select.value),
      tempUnit: aircon.defaultParams.tempUnit,
    });
  }));

  wrapper.appendChild(applyBtn);

  return wrapper;
}

function createQuickActionButton(label, iconClass, action) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-outline-secondary btn-sm";
  btn.innerHTML = `<i class="bi ${iconClass} me-1"></i>${escapeHtml(label)}`;
  btn.addEventListener("click", withSpinner(action));
  return btn;
}

function createSelectControl(label, iconClass, options, selected) {
  const group = document.createElement("div");
  group.className = "col-12 col-md-6 col-lg-3";

  const lbl = document.createElement("label");
  lbl.className = "form-label mb-1";
  lbl.innerHTML = `<i class="bi ${iconClass} me-1"></i>${escapeHtml(label)}`;

  const select = document.createElement("select");
  select.className = "form-select";

  group.appendChild(lbl);
  group.appendChild(select);

  setSelectOptions(select, options, selected);

  return { group, select };
}

function setSelectOptions(select, values, selected) {
  select.innerHTML = "";
  if (!values || values.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "未対応";
    select.appendChild(opt);
    return;
  }

  values.forEach((value) => {
    const stringValue = String(value);
    const opt = document.createElement("option");
    opt.value = stringValue;
    opt.textContent = stringValue;
    if (selected !== undefined && selected !== null && String(selected) === stringValue) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  if (!select.value) {
    select.value = String(values[0]);
  }
}

function readOptionalValue(value) {
  return value === "" ? undefined : value;
}

function displayUserInfo(userName, appliances) {
  userInfoEl.textContent = userName;
  appliancesEl.innerHTML = "";
  appliances.forEach((appliance) => {
    appliancesEl.appendChild(createApplianceCard(appliance));
  });
  renderApplianceSidebar(appliances);
}

function renderApplianceSidebar(appliances) {
  applianceNavListEl.innerHTML = "";
  appliances.forEach((appliance) => {
    const item = document.createElement("li");
    item.className = "nav-item";

    const link = document.createElement("a");
    link.className = "nav-link appliance-link";
    link.href = `#${appliance.anchorId}`;
    link.innerHTML = `<i class="bi ${getApplianceIconClass(appliance.type)} me-1"></i>${escapeHtml(appliance.shortName)}`;

    item.appendChild(link);
    applianceNavListEl.appendChild(item);
  });
}

function getButtonIconClass(button) {
  const name = (button.name ?? "").toLowerCase();

  const nameIncludes = (patterns) => patterns.some((p) => name.includes(p));

  if (nameIncludes(["power", "電源", "オン", "起動"])) {
    return "bi-power";
  }
  if (nameIncludes(["停止", "off", "ストップ"])) {
    return "bi-stop-circle";
  }
  if (nameIncludes(["再生", "play"])) {
    return "bi-play-circle";
  }
  if (nameIncludes(["一時停止", "pause"])) {
    return "bi-pause-circle";
  }
  if (nameIncludes(["録画", "record"])) {
    return "bi-record-circle";
  }
  if (nameIncludes(["早送り", "fast", "ff"])) {
    return "bi-fast-forward-circle";
  }
  if (nameIncludes(["早戻し", "rew", "巻き戻し"])) {
    return "bi-rewind-circle";
  }
  if (nameIncludes(["次", "next"])) {
    return "bi-skip-forward-circle";
  }
  if (nameIncludes(["前", "prev", "previous"])) {
    return "bi-skip-backward-circle";
  }
  if (nameIncludes(["音量を上", "音量+", "vol+", "volume+"])) {
    return "bi-volume-up";
  }
  if (nameIncludes(["音量を下", "音量-", "vol-", "volume-"])) {
    return "bi-volume-down";
  }
  if (nameIncludes(["ミュート", "mute", "消音"])) {
    return "bi-volume-mute";
  }
  if (nameIncludes(["ch", "チャンネル", "番組表", "地上波", "bs", "cs"])) {
    return "bi-broadcast";
  }
  if (nameIncludes(["入力", "source", "入力切替"])) {
    return "bi-box-arrow-in-right";
  }
  if (nameIncludes(["戻る", "back"])) {
    return "bi-arrow-return-left";
  }
  if (nameIncludes(["ホーム", "home"])) {
    return "bi-house";
  }
  if (nameIncludes(["上"])) {
    return "bi-arrow-up-circle";
  }
  if (nameIncludes(["下"])) {
    return "bi-arrow-down-circle";
  }
  if (nameIncludes(["左"])) {
    return "bi-arrow-left-circle";
  }
  if (nameIncludes(["右"])) {
    return "bi-arrow-right-circle";
  }
  if (nameIncludes(["決定", "ok", "enter"])) {
    return "bi-check2-circle";
  }
  if (nameIncludes(["字幕"])) {
    return "bi-badge-cc";
  }
  if (nameIncludes(["オプション", "menu"])) {
    return "bi-list";
  }
  if (nameIncludes(["青"])) {
    return "bi-circle-fill text-primary";
  }
  if (nameIncludes(["赤"])) {
    return "bi-circle-fill text-danger";
  }
  if (nameIncludes(["緑"])) {
    return "bi-circle-fill text-success";
  }
  if (nameIncludes(["黄"])) {
    return "bi-circle-fill text-warning";
  }

  if (button.kind === "tv") {
    return "bi-tv";
  }
  if (button.kind === "light") {
    return "bi-lightbulb";
  }
  return "bi-circle";
}

function getApplianceIconClass(type) {
  if (type === "TV") {
    return "bi-tv";
  }
  if (type === "LIGHT") {
    return "bi-lightbulb";
  }
  if (type === "AC") {
    return "bi-wind";
  }
  return "bi-house-gear";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
