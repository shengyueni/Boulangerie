const STATE_IMAGES = {
  smooth: "/assets/characters/croissant-state-smooth-bust.png",
  ruffled: "/assets/characters/croissant-state-frizzy-bust.png",
  ball: "/assets/characters/croissant-state-furball-bust.png",
  protect: "/assets/characters/croissant-state-protect-bust.png"
};

function statusKeyFromWear(wear) {
  const value = Number(wear || 0);
  if (value >= 21) return "protect";
  if (value >= 13) return "ball";
  if (value >= 6) return "ruffled";
  return "smooth";
}

Component({
  options: {
    styleIsolation: "apply-shared"
  },

  properties: {
    status: { type: String, value: "毛很顺" },
    statusKey: { type: String, value: "" },
    statusClass: { type: String, value: "" },
    wear: { type: Number, value: 0 },
    text: { type: String, value: "" },
    hint: { type: String, value: "" },
    image: { type: String, value: "" },
    buttons: { type: Array, value: [] }
  },

  data: {
    computedImage: STATE_IMAGES.smooth
  },

  observers: {
    "statusKey, wear, image": function(statusKey, wear, image) {
      const key = statusKey || statusKeyFromWear(wear);
      this.setData({
        computedImage: image || STATE_IMAGES[key] || STATE_IMAGES.smooth
      });
    }
  },

  lifetimes: {
    attached() {
      const key = this.data.statusKey || statusKeyFromWear(this.data.wear);
      this.setData({
        computedImage: this.data.image || STATE_IMAGES[key] || STATE_IMAGES.smooth
      });
    }
  },

  methods: {
    handleFigureTap() {
      this.triggerEvent("figuretap");
    },

    handleActionTap(event) {
      this.triggerEvent("actiontap", {
        action: event.currentTarget.dataset.action
      });
    }
  }
});
