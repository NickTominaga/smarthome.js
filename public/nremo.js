import { createApiClient } from "./nremoapi.js";

export function getClient(token) {
  const api = createApiClient(token);
  const fetchMe = () => getMe(api);
  const fetchAppliances = () => getAppliances(api);

  return { fetchMe, fetchAppliances };
}

async function getMe(api) {
  const data = await api.get("1/users/me");
  return data.nickname;
}

async function getAppliances(api) {
  const data = await api.get("1/appliances");
  return data.map((payload) => createAppliance(api, payload));
}

function createAppliance(api, payload) {
  const name = payload.device
    ? `${payload.device.name} - ${payload.nickname} (${payload.type})`
    : `${payload.nickname} (${payload.type})`;

  const applianceId = payload.id;
  const signals = payload.signals.map((s) => createSignalButton(api, s));
  const lightButtons = payload.light ? payload.light.buttons.map((b) => createLightButton(api, applianceId, b)) : [];
  const tvButtons = payload.tv ? payload.tv.buttons.map((b) => createTvButton(api, applianceId, b)) : [];
  const buttons = [...signals, ...lightButtons, ...tvButtons];

  const aircon = payload.aircon ? createAirconControl(api, applianceId, payload.aircon) : null;

  return { name, buttons, aircon };
}

function createSignalButton(api, signal) {
  const name = signal.name;
  const push = () => api.post(`1/signals/${signal.id}/send`, {});
  return { name, push };
}

function createLightButton(api, applianceId, button) {
  const name = button.label;
  const push = () => api.post(`1/appliances/${applianceId}/light`, `button=${button.name}`);
  return { name, push };
}

function createTvButton(api, applianceId, button) {
  const name = button.label;
  const push = () => api.post(`1/appliances/${applianceId}/tv`, `button=${button.name}`);
  return { name, push };
}

function createAirconControl(api, applianceId, aircon) {
  const settings = aircon.settings ?? {};
  const modes = aircon.range?.modes ?? {};
  const modeNames = Object.keys(modes);
  const currentMode = settings.mode && modes[settings.mode] ? settings.mode : modeNames[0] ?? "cool";

  const defaultParams = {
    mode: currentMode,
    temp: settings.temp,
    tempUnit: settings.tempUnit,
    vol: settings.vol,
    dir: settings.dir,
  };

  const update = (params) => postAirconSettings(api, applianceId, params);
  const powerOn = () => update({ button: "power-on" });
  const powerOff = () => update({ button: "power-off" });

  return {
    modes,
    defaultParams,
    update,
    powerOn,
    powerOff,
  };
}

function postAirconSettings(api, applianceId, params) {
  const body = new URLSearchParams();

  if (params.button) {
    body.set("button", params.button);
  }
  if (params.mode) {
    body.set("operation_mode", params.mode);
  }
  if (params.temp !== undefined && params.temp !== null && params.temp !== "") {
    body.set("temperature", String(params.temp));
  }
  if (params.tempUnit) {
    body.set("temperature_unit", params.tempUnit);
  }
  if (params.vol) {
    body.set("air_volume", params.vol);
  }
  if (params.dir) {
    body.set("air_direction", params.dir);
  }

  return api.post(`1/appliances/${applianceId}/aircon_settings`, body.toString());
}
