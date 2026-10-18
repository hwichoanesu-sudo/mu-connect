const form = document.querySelector("#design-form");
const statusEl = document.querySelector("#status");
const button = form.querySelector("button[type='submit']");
const result = document.querySelector("#result");
const preview = document.querySelector("#store-preview");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function validHex(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : fallback;
}
function applyDesign(design) {
  const theme = design.theme || {};
  const bg = validHex(theme.background, "#101426");
  const surface = validHex(theme.surface, "#1b2038");
  const primary = validHex(theme.primary, "#7770b7");
  const accent = validHex(theme.accent, "#70e2dc");
  const text = validHex(theme.text, "#f7f8fc");
  preview.style.background = `radial-gradient(ellipse at 78% 43%, ${primary} 0%, ${surface} 35%, ${bg} 78%)`;
  preview.style.color = text;
  document.querySelector("#preview-name").textContent = (design.storeName || "YOUR BRAND").slice(0, 40).toUpperCase();
  document.querySelector("#preview-title").textContent = design.heroTitle || "A store that feels uniquely yours.";
  document.querySelector("#preview-subtitle").textContent = design.heroSubtitle || design.tagline || "";
  document.querySelector("#preview-kicker").textContent = (design.tagline || "YOUR BRAND, REIMAGINED").toUpperCase();
  document.querySelector(".preview-cta").style.borderColor = accent;
  document.querySelector(".preview-cta").style.color = text;
  const ideas = Array.isArray(design.marketingIdeas) ? design.marketingIdeas : [];
  const sections = Array.isArray(design.suggestedSections) ? design.suggestedSections : [];
  const swatches = [["Background", bg], ["Surface", surface], ["Primary", primary], ["Accent", accent], ["Text", text]]
    .map(([name, color]) => `<span class="swatch"><i style="background:${color}"></i>${name}</span>`).join("");
  result.innerHTML = `<div class="result-content">
    <h3>${escapeHtml(design.storeName || "Your store concept")}</h3><p>${escapeHtml(design.styleDescription || "A custom direction for your business.")}</p>
    <div class="swatches">${swatches}</div>
    <div class="result-section"><h4>RECOMMENDED STORE SECTIONS</h4><ul>${sections.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    <div class="result-section"><h4>MARKETING STARTERS</h4><ul class="idea-list">${ideas.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    <p>Concept only: review suggestions before publishing. No products or prices have been created.</p></div>`;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  statusEl.textContent = "Creating your store concept…";
  statusEl.className = "status";
  button.disabled = true;
  button.textContent = "Creating your concept…";
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/ai/store-design", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not generate the concept.");
    applyDesign(data.design);
    statusEl.textContent = "Your AI design direction is ready. Next we will connect accounts, products, and saved designs.";
  } catch (error) {
    statusEl.textContent = error.message || "Something went wrong. Please try again.";
    statusEl.className = "status error-text";
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Generate my store concept <span class="arrow">↗</span>';
  }
});
