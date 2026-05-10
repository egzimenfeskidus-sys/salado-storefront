    (() => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const slowConnection = Boolean(
        connection && (connection.saveData || ["slow-2g", "2g"].includes(connection.effectiveType || ""))
      );

      function revealNativeVideoFallback(video) {
        const shell = video.closest(".video-shell");
        if (!shell) return;
        const details = shell.querySelector(".fallback-details");
        if (details) {
          details.open = true;
        }
        video.classList.add("video-failed");
      }

      function monitorNativeVideo(video) {
        let playable = false;
        const markPlayable = () => {
          playable = true;
          video.classList.remove("video-failed");
        };
        video.addEventListener("loadedmetadata", markPlayable, { once: true });
        video.addEventListener("canplay", markPlayable, { once: true });
        video.addEventListener("playing", markPlayable, { once: true });
        video.addEventListener("error", () => {
          if (!playable) {
            revealNativeVideoFallback(video);
          }
        }, { once: true });
        window.setTimeout(() => {
          if (!playable && (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) {
            revealNativeVideoFallback(video);
          }
        }, slowConnection ? 6000 : 2500);
      }

function attachVideo(video, shouldPlay) {
  const src = video.dataset.src;
  if (!src) return;
  const fallback = video.nextElementSibling && video.nextElementSibling.classList.contains("preview-fallback")
    ? video.nextElementSibling
    : null;
  if (video.dataset.loaded !== "true") {
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.dataset.loaded = "true";
    video.addEventListener("canplay", () => {
      if (fallback) fallback.hidden = true;
    }, { once: true });
    video.addEventListener("error", () => {
      if (fallback) fallback.hidden = false;
    }, { once: true });
    video.load();
  }
        if (shouldPlay) {
          video.play().catch(() => {});
        }
      }

      document.querySelectorAll("video[data-src]").forEach((video) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "video-load-button";
        button.textContent = slowConnection ? "Loading preview..." : "Play preview video";
        button.addEventListener("click", () => {
          attachVideo(video, true);
          button.remove();
        });
        video.insertAdjacentElement("afterend", button);

        if (video.dataset.autoload === "true") {
          window.setTimeout(() => {
            attachVideo(video, !slowConnection);
            if (slowConnection) {
              button.textContent = "Play preview video";
            } else {
              button.remove();
            }
          }, slowConnection ? 2500 : 0);
        }
      });

      document.querySelectorAll("video.preview-video source[src]").forEach((source) => {
        const video = source.parentElement;
        if (video instanceof HTMLVideoElement) {
          monitorNativeVideo(video);
        }
      });

      if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
      }
    })();
