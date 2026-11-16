// Demo request & contact form: embedded on the homepage (#contact-form) and
// /contact/ page, plus available as a modal when any [data-demo-open] button is
// clicked. Pages with [data-sample-offer] also get a short free sample form
// (separate request type, own event). Submissions go to Web3Forms (enquiry@compliar.co.uk). Google Ads
// conversion fires when marketing consent is granted.
(() => {
  const ENDPOINT = "https://api.web3forms.com/submit";
  const ACCESS_KEY = "00a6f18c-3054-40ab-8342-6d7598f91c09";
  // Each demo request is also saved as a contact in our CRM (HubSpot, EU data centre).
  // Fire and forget: a CRM failure must never stop the enquiry reaching us by email.
  const CRM_ENDPOINT =
    "https://api-eu1.hsforms.com/submissions/v3/integration/submit/149777494/0c40e3b2-d662-416a-b557-8b60f871a58c";
  function saveToCrm(payload) {
    try {
      const parts = (payload.name || "").trim().split(/\s+/);
      const firstname = parts.shift() || "";
      const lastname = parts.join(" ");
      const note = [
        payload.site_log_book_only !== "No" ? payload.site_log_book_only : "",
        "Phone: " + payload.phone,
        payload.engineers_from_calculator ? "Field engineers (from the calculator): " + payload.engineers_from_calculator : "",
        "Page: " + payload.page,
      ]
        .filter(Boolean)
        .join("\n");
      const fields = [
        { name: "firstname", value: firstname },
        { name: "lastname", value: lastname },
        { name: "email", value: payload.email },
        { name: "company", value: payload.company },
        { name: "message", value: note },
      ];
      fetch(CRM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, context: { pageUri: payload.page, pageName: document.title } }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      /* ignore */
    }
  }
  const ADS_CONVERSION = "AW-18545152858/mXfZCOGjwq4dENqmgotF";
  // Free sample request: a separate request type from the demo, with its own
  // Google Ads conversion action ("Sample request"). Fires with marketing consent only.
  const SAMPLE_ADS_CONVERSION = "AW-18545152858/3C2GCKaj-7YdENqmgotF";
  const SAMPLES = {
    battery: {
      label: "Sample fire detection and alarm servicing certificate (with standby battery record)",
      file: "/assets/documents/fire-alarm-periodic-inspection-servicing-certificate-sample.pdf",
    },
    certificate: {
      label: "Sample fire detection and alarm servicing certificate",
      file: "/assets/documents/fire-alarm-periodic-inspection-servicing-certificate-sample.pdf",
    },
    logbook: {
      label: "Sample fire detection and alarm servicing certificate (for the log book page)",
      file: "/assets/documents/fire-alarm-periodic-inspection-servicing-certificate-sample.pdf",
    },
  };
  const CONSENT_KEY = "compliar_cookie_consent";
  const PREFS_KEY = "compliar_cookie_prefs";
  let uid = 0;

  function hasMarketingConsent() {
    try {
      const prefsRaw = localStorage.getItem(PREFS_KEY);
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        return Boolean(prefs.marketing);
      }
      return localStorage.getItem(CONSENT_KEY) === "granted";
    } catch (error) {
      return false;
    }
  }

  function trackConversion() {
    if (!hasMarketingConsent() || typeof gtag !== "function") return;
    gtag("event", "conversion", {
      send_to: ADS_CONVERSION,
    });
  }

  function trackSample(key) {
    if (!hasMarketingConsent() || typeof gtag !== "function") return;
    gtag("event", "sample_request", { sample_type: key });
    if (SAMPLE_ADS_CONVERSION) gtag("event", "conversion", { send_to: SAMPLE_ADS_CONVERSION });
  }

  function buildSampleForm(key) {
    const sample = SAMPLES[key] || SAMPLES.certificate;
    const id = ++uid;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <form class="demo-form sample-form" novalidate>
        <div>
          <label for="sf-email-${id}">Your email *</label>
          <input id="sf-email-${id}" name="email" type="email" autocomplete="email" placeholder="you@yourcompany.co.uk" required />
        </div>
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="botcheck" tabindex="-1" autocomplete="off" /></label></div>
        <div class="demo-error" role="alert" hidden></div>
        <button type="submit" class="btn btn-primary">Get the free sample</button>
        <p class="fine">Free, no card needed. This is a sample request, not a demo booking. We use your email only to follow up on this request. See our <a href="/privacy/">Privacy Policy</a>.</p>
      </form>`;
    const form = wrap.firstElementChild;
    const error = form.querySelector(".demo-error");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;
      if (form.elements.botcheck.value) return showSample();
      button.disabled = true;
      button.textContent = "Sending…";
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            subject: "Compliar FREE SAMPLE request (not a demo): " + key,
            from_name: "Compliar website",
            request_type: "free_sample",
            sample_requested: sample.label,
            email: form.elements.email.value.trim(),
            message: "Free sample request from a landing page. Not a demo request.",
            page: location.href,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
        trackSample(key);
        showSample();
      } catch (err) {
        error.textContent =
          "Sorry, that didn’t send. Please try again, or email enquiry@compliar.co.uk and we’ll get back to you as soon as possible.";
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Get the free sample";
      }
    });

    function showSample() {
      const card = document.createElement("div");
      card.className = "demo-thanks sample-thanks";
      card.setAttribute("role", "status");
      card.innerHTML =
        '<div class="demo-thanks-icon" aria-hidden="true">✓</div><h3>Thanks. Your sample is ready.</h3>' +
        '<p><a class="btn btn-primary" href="' + sample.file + '" target="_blank" rel="noopener">Open the sample PDF</a></p>' +
        '<p class="sample-more">Also on our <a href="/sample-documents/">Sample documents</a> page.</p>' +
        '<p class="sample-next">Want to see how it runs a whole company? <a href="/contact/?subject=Demo+request" data-demo-open>Book a demo</a></p>';
      form.replaceWith(card);
    }
    return form;
  }

  function buildForm(options = {}) {
    const id = ++uid;
    const logBookOnly = Boolean(options.logBookOnly);
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <form class="demo-form" novalidate>
        <p class="demo-prefill" ${options.engineers ? "" : "hidden"}>${
          options.engineers
            ? `From the calculator: ${options.engineers} field engineer${options.engineers === 1 ? "" : "s"}`
            : ""
        }</p>
        <p class="fine demo-need-note" ${logBookOnly ? "" : "hidden"}>Log book only, with no engineers: for any business holding several properties, such as estate agents, housing providers and property developers. UK sites only, working to British Standards. £4 + VAT per site per year.</p>
        <div class="grid2">
          <div>
            <label for="df-name-${id}">Name *</label>
            <input id="df-name-${id}" name="name" type="text" autocomplete="name" placeholder="e.g. David Reynolds" required />
          </div>
          <div>
            <label for="df-company-${id}">Company *</label>
            <input id="df-company-${id}" name="company" type="text" autocomplete="organization" placeholder="Harbourview Fire & Security Ltd" required />
          </div>
          <div>
            <label for="df-phone-${id}">Phone *</label>
            <input id="df-phone-${id}" name="phone" type="tel" autocomplete="tel" placeholder="e.g. 07700 900123" required />
          </div>
          <div>
            <label for="df-email-${id}">Work email *</label>
            <input id="df-email-${id}" name="email" type="email" autocomplete="email" placeholder="david@yourcompany.co.uk" required />
          </div>
        </div>
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="botcheck" tabindex="-1" autocomplete="off" /></label></div>
        <div class="demo-error" role="alert" hidden></div>
        <div class="demo-submit-row">
          <button type="submit" class="btn btn-primary">Book a demo</button>
          <p class="fine"><strong>What happens next:</strong> 15 minutes with Keiran, on your own sites. We use these details only to arrange your demo. See our <a href="/privacy/">Privacy Policy</a>.</p>
        </div>
      </form>`;
    const form = wrap.firstElementChild;

    const error = form.querySelector(".demo-error");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;
      if (form.elements.botcheck.value) return showThanks();
      const payload = {
        access_key: ACCESS_KEY,
        subject: "Compliar demo request" + (logBookOnly ? " (log book only, no engineers)" : ""),
        from_name: "Compliar website",
        name: form.elements.name.value.trim(),
        company: form.elements.company.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        site_log_book_only: logBookOnly ? "Yes: log book only, no engineers" : "No",
        engineers_from_calculator: form.dataset.engineers || (options.engineers ? String(options.engineers) : ""),
        page: location.href,
      };
      button.disabled = true;
      button.textContent = "Sending…";
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
        saveToCrm(payload);
        trackConversion();
        showThanks();
      } catch (err) {
        error.textContent =
          "Sorry, that didn’t send. Please try again, or email enquiry@compliar.co.uk and we’ll get back to you as soon as possible.";
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Book a demo";
      }
    });

    function showThanks() {
      const card = document.createElement("div");
      card.className = "demo-thanks";
      card.setAttribute("role", "status");
      card.innerHTML =
        '<div class="demo-thanks-icon" aria-hidden="true">✓</div><h3>Thanks. Your demo request is in.</h3><p>We\'ll get back to you as soon as possible to arrange your demo: 15 minutes with Keiran, on your own sites.</p><p><a href="/sample-documents/">Open the sample certificates</a><br /><a href="/pricing/">See pricing</a><br /><a href="/#one-job-video">Watch one job start to finish (36 seconds)</a></p>';
      form.replaceWith(card);
    }
    return form;
  }

  let dialog;
  function openModal(options) {
    if (typeof HTMLDialogElement === "undefined") {
      location.href = "/#contact-form";
      return;
    }
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "demo-modal";
      dialog.setAttribute("aria-labelledby", "demo-modal-title");
      dialog.innerHTML = `
        <div class="demo-modal-inner">
          <button type="button" class="demo-modal-close" aria-label="Close">✕</button>
          <h2 id="demo-modal-title">Book a demo</h2>
          <p class="modal-sub">15 minutes with Keiran, on your own sites.</p>
          <div class="modal-form"></div>
        </div>`;
      document.body.appendChild(dialog);
      dialog.querySelector(".demo-modal-close").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }
    dialog.querySelector(".modal-form").replaceChildren(buildForm(options));
    dialog.showModal();
    dialog.querySelector("input").focus();
  }

  document.addEventListener("click", (event) => {
    const roiBtn = event.target.closest("#roi-cta");
    if (roiBtn) {
      const eng = parseInt(roiBtn.dataset.engineers, 10);
      const inlineForm = document.querySelector("#contact-form form.demo-form, #demo form.demo-form");
      if (inlineForm && !eng) {
        inlineForm.dataset.engineers = "";
        const stale = inlineForm.querySelector(".demo-prefill");
        if (stale) stale.hidden = true;
      }
      if (inlineForm && eng) {
        inlineForm.dataset.engineers = String(eng);
        const pre = inlineForm.querySelector(".demo-prefill");
        if (pre) {
          pre.textContent = `From the calculator: ${eng} field engineer${eng === 1 ? "" : "s"}`;
          pre.hidden = false;
        }
      }
      return;
    }
    const opener = event.target.closest("[data-demo-open]");
    if (!opener) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const engineers = parseInt(opener.dataset.engineers, 10);
    openModal({ ...(engineers ? { engineers } : {}), logBookOnly: opener.hasAttribute("data-logbook-only") });
  });

  document.querySelectorAll("[data-sample-form]").forEach((mount) => {
    const host = mount.closest("[data-sample-offer]");
    mount.replaceChildren(buildSampleForm(host ? host.dataset.sampleOffer : "certificate"));
  });

  document.querySelectorAll("[data-demo-form]").forEach((mount) => {
    mount.replaceChildren(buildForm({ logBookOnly: new URLSearchParams(location.search).get("need") === "logbook" }));
  });

  const card = document.getElementById("book-a-demo") || document.getElementById("contact-form");
  if (card && new URLSearchParams(location.search).has("subject") && !location.hash) {
    card.scrollIntoView();
  }
})();
