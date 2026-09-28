// Studio Event — mobile menu and the quote form (prepares a WhatsApp or e-mail message; no backend).
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  var form = document.getElementById("quote");
  if (!form) return;

  // Preselect a pack passed as ?pack=… from a pack card.
  var pack = new URLSearchParams(location.search).get("pack");
  if (pack) {
    var sel = form.elements.pack;
    for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === pack) sel.selectedIndex = i;
  }
  var dateInput = form.elements.date;
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  var error = document.getElementById("f-error");

  function buildMessage() {
    var f = form.elements;
    var missing = [];
    if (!f.name.value.trim()) missing.push("nom");
    if (!f.phone.value.trim()) missing.push("téléphone");
    if (!f.date.value) missing.push("date");
    if (!f.city.value) missing.push("ville");
    if (missing.length) {
      error.textContent = "Erreur : merci de renseigner " + missing.join(", ") + ".";
      error.hidden = false;
      var first = { nom: f.name, "téléphone": f.phone, date: f.date, ville: f.city }[missing[0]];
      if (first) first.focus();
      return null;
    }
    error.hidden = true;
    var gear = Array.prototype.filter.call(form.querySelectorAll('input[name="gear"]:checked'), Boolean)
      .map(function (c) { return c.value; });
    var d = new Date(f.date.value + "T12:00:00");
    var lines = [
      "Bonjour Studio Event, je souhaite un devis.",
      "",
      "Nom : " + f.name.value.trim(),
      "Téléphone : " + f.phone.value.trim(),
      "Date : " + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      "Ville : " + f.city.value,
      "Événement : " + f.type.value,
    ];
    if (f.guests.value) lines.push("Invités : " + f.guests.value);
    if (gear.length) lines.push("Matériel : " + gear.join(", "));
    if (f.pack.value) lines.push("Pack : " + f.pack.value);
    if (f.message.value.trim()) lines.push("", f.message.value.trim());
    return lines.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = buildMessage();
    if (msg) window.open("https://wa.me/" + form.dataset.wa + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
  document.getElementById("f-mail").addEventListener("click", function () {
    var msg = buildMessage();
    if (msg) location.href = "mailto:" + form.dataset.mail + "?subject=" + encodeURIComponent("Demande de devis — " + form.elements.type.value) + "&body=" + encodeURIComponent(msg);
  });
})();
