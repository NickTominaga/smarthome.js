function delay(ms = 120) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createAction(name) {
  return async () => {
    await delay();
    console.log(`[DEMO] action: ${name}`);
  };
}

export function getDemoClient() {
  const fetchMe = async () => {
    await delay();
    return "デモユーザー";
  };

  const fetchAppliances = async () => {
    await delay();
    return [
      {
        name: "Living Remo - リビングTV (TV)",
        shortName: "リビングTV",
        type: "TV",
        anchorId: "appliance-demo-tv",
        buttons: [
          { name: "電源", kind: "tv", push: createAction("tv-power") },
          { name: "音量+", kind: "tv", push: createAction("tv-vol-up") },
          { name: "音量-", kind: "tv", push: createAction("tv-vol-down") },
          { name: "入力切替", kind: "tv", push: createAction("tv-input") },
        ],
        aircon: null,
      },
      {
        name: "Living Remo - リビング照明 (LIGHT)",
        shortName: "リビング照明",
        type: "LIGHT",
        anchorId: "appliance-demo-light",
        buttons: [
          { name: "ON", kind: "light", push: createAction("light-on") },
          { name: "OFF", kind: "light", push: createAction("light-off") },
          { name: "常夜灯", kind: "light", push: createAction("light-night") },
        ],
        aircon: null,
      },
      {
        name: "Living Remo - リビングエアコン (AC)",
        shortName: "リビングエアコン",
        type: "AC",
        anchorId: "appliance-demo-ac",
        buttons: [
          { name: "おやすみ", kind: "signal", push: createAction("ac-sleep") },
        ],
        aircon: {
          modes: {
            cool: { temps: ["22", "23", "24", "25"], vols: ["auto", "1", "2"], dirs: ["auto", "swing"] },
            warm: { temps: ["20", "21", "22"], vols: ["auto", "1"], dirs: ["auto"] },
          },
          defaultParams: {
            mode: "cool",
            temp: "25",
            tempUnit: "c",
            vol: "auto",
            dir: "auto",
          },
          update: createAction("ac-update"),
          powerOn: createAction("ac-power-on"),
          powerOff: createAction("ac-power-off"),
        },
      },
    ];
  };

  return { fetchMe, fetchAppliances };
}
